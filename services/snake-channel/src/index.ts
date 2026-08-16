import type{SnakeConfig}from '../../../packages/game-contracts/src/index';
import{checksum}from '../../../packages/replay/src/index';
import{createStoredEvent,type DurableStore}from '../../../packages/durable-store/src/index';
import type{CompatibilityKey,StoredEvent}from '../../../packages/ops-contracts/src/index';
import{RunLeaseStore,type RunLease}from '../../../packages/operations-core/src/lease';
import{createRecoveryCheckpoint,recoverFromEvidence,type RecoveryCheckpoint,type RuntimeCommand}from '../../../packages/recovery/src/index';
import{SnakeRuntime}from '../../../games/autonomous-snake/src/runtime/run';

export interface SnakeChannelOptions{
  channelId:string;workerId:string;seed:string;config:Partial<SnakeConfig>&Pick<SnakeConfig,'width'|'height'|'targetLength'>;
  store:DurableStore;leases:RunLeaseStore;leaseTtlMs:number;snapshotEveryCommands:number;compatibility:CompatibilityKey;commandDedupeCapacity?:number;
}
export interface DependencyHealth{gateway:boolean;moderation:boolean;persistence:boolean}
export interface ChannelStatus{started:boolean;leaseGeneration:number;interactionsEnabled:boolean;simulationEnabled:boolean;commandSeq:number;commandDedupeEntries:number;dependencies:DependencyHealth;lastChecksum:string}
function operationalError(code:string,message:string){const error=new Error(message);Object.assign(error,{code});return error}
export class SnakeChannelService{
  public runtime:SnakeRuntime;public readonly store:DurableStore;public readonly leases:RunLeaseStore;
  private lease:RunLease|undefined;private started=false;private nextStoreSeq=0;private commandSeq=0;
  private readonly decisions=new Map<string,{status:'applied';checksum:string}>();
  private dependencies:DependencyHealth={gateway:true,moderation:true,persistence:true};
  private readonly dedupeCapacity:number;private readonly hadDurableHistory:boolean;
  constructor(private readonly options:SnakeChannelOptions){
    if(!options.channelId||!options.workerId||!Number.isInteger(options.leaseTtlMs)||options.leaseTtlMs<1||!Number.isInteger(options.snapshotEveryCommands)||options.snapshotEveryCommands<1)throw new RangeError('channel options');
    this.store=options.store;this.leases=options.leases;this.runtime=SnakeRuntime.create(options.config,options.seed);this.dedupeCapacity=options.commandDedupeCapacity??1000;
    const existing=this.store.events(options.channelId);this.hadDurableHistory=existing.length>0;this.nextStoreSeq=existing.length?existing[existing.length-1].seq+1:0;
    const reservations=existing.filter(e=>e.type==='runtime-command');
    this.commandSeq=reservations.reduce((max,e)=>Math.max(max,Number(e.payload.commandSeq)||0),0);
    for(const event of reservations){const commandId=String(event.payload.commandId??'');if(commandId)this.decisions.set(commandId,{status:'applied',checksum:''})}
    this.boundDecisions();
  }
  start(nowMs:number){
    if(this.started)return this.status();
    const acquired=this.leases.acquire(this.options.channelId,this.options.workerId,this.options.leaseTtlMs,nowMs);
    if(acquired.status!=='acquired')throw operationalError('LEASE_CONFLICT','channel already has an active writer');
    this.lease=acquired.lease;this.started=true;
    if(this.hadDurableHistory){
      const persisted=this.store.compatibleSnapshots(this.options.channelId,this.options.compatibility)as RecoveryCheckpoint[];
      const synthetic=createRecoveryCheckpoint(this.runtime,{streamId:this.options.channelId,id:'synthetic-initial',commandSeq:0,createdAtMs:0,compatibility:this.options.compatibility});
      const commands=this.commandsFromStore();
      const result=recoverFromEvidence({snapshots:persisted.length?persisted:[synthetic],commands,compatibility:this.options.compatibility});
      if(result.status!=='restored'){
        this.appendAudit('startup-quarantine',this.options.workerId,nowMs,result.reason);this.leases.fence(this.options.channelId,'startup-recovery-failed');this.started=false;
        throw operationalError('RECOVERY_QUARANTINED',`startup recovery failed: ${result.reason}`);
      }
      this.runtime=result.runtime;this.commandSeq=commands.reduce((max,c)=>Math.max(max,c.seq),0);this.runtime.drainEvents();
      this.appendAudit('startup-recovery',this.options.workerId,nowMs,checksum(this.runtime.state));
      return this.status();
    }
    this.persistSemanticEvents(this.runtime.drainEvents(),nowMs);return this.status();
  }
  tick(commandId:string,nowMs:number):{status:'applied'|'duplicate';checksum:string}{
    this.requireStarted();this.assertLease(nowMs);
    const existing=this.decisions.get(commandId);if(existing)return{status:'duplicate',checksum:existing.checksum||checksum(this.runtime.state)};
    if(!this.dependencies.persistence)throw operationalError('PERSISTENCE_UNAVAILABLE','authoritative command cannot be durably reserved');
    const nextCommandSeq=this.commandSeq+1;
    this.append('runtime-command',{commandSeq:nextCommandSeq,kind:'step',commandId},this.runtime.state.tick,nowMs);
    this.commandSeq=nextCommandSeq;this.runtime.step();this.persistSemanticEvents(this.runtime.drainEvents(),nowMs);
    const stateChecksum=checksum(this.runtime.state);this.decisions.set(commandId,{status:'applied',checksum:stateChecksum});this.boundDecisions();
    if(this.commandSeq%this.options.snapshotEveryCommands===0)this.captureSnapshot(nowMs);
    if(!this.lease)throw operationalError('LEASE_FENCED','missing writer lease');
    const renewed=this.leases.renew(this.options.channelId,this.lease.token,this.options.leaseTtlMs,nowMs);
    if(renewed.status!=='renewed'||!renewed.lease)throw operationalError('LEASE_FENCED','writer lease could not be renewed');
    this.lease=renewed.lease;
    return{status:'applied',checksum:stateChecksum};
  }
  captureSnapshot(nowMs:number):RecoveryCheckpoint{
    this.requireStarted();
    const record=createRecoveryCheckpoint(this.runtime,{streamId:this.options.channelId,id:`snapshot-${this.commandSeq}-${nowMs}`,commandSeq:this.commandSeq,createdAtMs:nowMs,compatibility:this.options.compatibility});
    this.store.putSnapshot(record);return record;
  }
  recover(input:{nowMs:number;newOwnerId:string;expectedChecksum?:string}){
    this.requireStarted();
    const snapshots=this.store.compatibleSnapshots(this.options.channelId,this.options.compatibility)as RecoveryCheckpoint[];
    const commands=this.commandsFromStore();
    const result=recoverFromEvidence({snapshots,commands,compatibility:this.options.compatibility,expectedChecksum:input.expectedChecksum,lease:{store:this.leases,channelId:this.options.channelId,newOwnerId:input.newOwnerId,ttlMs:this.options.leaseTtlMs,nowMs:input.nowMs}});
    if(result.status==='restored'){
      this.runtime=result.runtime;this.lease=result.lease;this.commandSeq=commands.reduce((max,c)=>Math.max(max,c.seq),0);this.runtime.drainEvents();
      this.appendAudit('verified-recovery',input.newOwnerId,input.nowMs,checksum(this.runtime.state));
    }else this.appendAudit('quarantine','system',input.nowMs,result.reason);
    return result;
  }
  setDependencyHealth(next:Partial<DependencyHealth>){this.dependencies={...this.dependencies,...next}}
  status():ChannelStatus{return{started:this.started,leaseGeneration:this.lease?.generation??0,interactionsEnabled:this.dependencies.gateway&&this.dependencies.moderation&&this.dependencies.persistence,simulationEnabled:this.started,commandSeq:this.commandSeq,commandDedupeEntries:this.decisions.size,dependencies:{...this.dependencies},lastChecksum:checksum(this.runtime.state)}}
  private commandsFromStore():RuntimeCommand[]{return this.store.events(this.options.channelId).filter(e=>e.type==='runtime-command').map(e=>({schemaVersion:1 as const,id:String(e.payload.commandId),seq:Number(e.payload.commandSeq),kind:'step' as const}))}
  private persistSemanticEvents(events:ReturnType<SnakeRuntime['drainEvents']>,nowMs:number){for(const event of events){const payload={...(event.data??{}),semanticSeq:event.seq};if(event.type==='result')Object.assign(payload,{score:this.runtime.state.score,length:this.runtime.state.snake.body.length,finalChecksum:this.runtime.state.result?.finalChecksum??checksum(this.runtime.state)});this.append(event.type,payload,event.tick,nowMs)}}
  private append(type:string,payload:Record<string,unknown>,tick:number,createdAtMs:number):StoredEvent{const seq=this.nextStoreSeq,event=createStoredEvent({streamId:this.options.channelId,runId:this.runtime.state.runId,eventId:`${this.options.channelId}:event:${seq}`,seq,tick,type,payload,createdAtMs});this.store.appendEvent(event);this.nextStoreSeq++;return event}
  private appendAudit(action:string,actorRef:string,occurredAtMs:number,payloadDigest:string){this.store.appendAudit({schemaVersion:1,id:`audit-${action}-${occurredAtMs}-${this.lease?.generation??0}`,kind:'recovery',actorRef,action,targetRef:this.options.channelId,occurredAtMs,payloadDigest})}
  private assertLease(nowMs:number){if(!this.lease)throw operationalError('LEASE_FENCED','missing writer lease');this.leases.assertWriter(this.options.channelId,this.lease.token,nowMs)}
  private requireStarted(){if(!this.started)throw operationalError('NOT_STARTED','channel service is not started')}
  private boundDecisions(){while(this.decisions.size>this.dedupeCapacity){const first=this.decisions.keys().next().value as string|undefined;if(first===undefined)break;this.decisions.delete(first)}}
}
