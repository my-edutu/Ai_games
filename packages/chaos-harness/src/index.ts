import{checksum}from '../../replay/src/index';
import{InMemoryDurableStore}from '../../durable-store/src/index';
import{RunLeaseStore}from '../../operations-core/src/lease';
import{RunSupervisor}from '../../supervisor/src/index';
import{OperationalOutputHealth}from '../../output-health/src/index';
import{SnakeChannelService}from '../../../services/snake-channel/src/index';

const compatibility={gameVersion:'0.5.0',deterministicVersion:'snake-r2',configHash:'phase5-cfg',contentHash:'phase5-content'};
export interface Phase5ChaosSummary{seed:string;totalTicks:number;autonomousTicksDuringProviderOutage:number;interactionsDisabledDuringOutage:boolean;invariantFailures:number;duplicateEventIds:number;eventSequenceContiguous:boolean;eventCount:number;snapshotCount:number;recoveryStatus:string;rejectedRecoveryEvidence:number;leaseGeneration:number;outputProtectionStatus:string;crashBreakerState:string;supervisorLevel:string;commandDedupeEntries:number;finalChecksum:string}
function invariantFailure(service:SnakeChannelService){const body=service.runtime.state.snake.body;if(new Set(body).size!==body.length)return true;if(service.runtime.state.food!==null&&body.includes(service.runtime.state.food))return true;return false}
export function runPhase5Chaos(seed='phase5-chaos'):Phase5ChaosSummary{
  const store=new InMemoryDurableStore({eventCapacity:5000,snapshotCapacity:4,auditCapacity:100});const leases=new RunLeaseStore();
  const service=new SnakeChannelService({channelId:'channel',workerId:'worker-a',seed,config:{width:14,height:12,targetLength:30,profile:'portals'},store,leases,leaseTtlMs:1000,snapshotEveryCommands:5,compatibility});
  service.start(0);let totalTicks=0,invariantFailures=0;
  const tick=(id:string,now:number)=>{service.tick(id,now);totalTicks++;if(invariantFailure(service))invariantFailures++};
  for(let i=1;i<=15;i++)tick(`normal-${i}`,i*10);
  service.setDependencyHealth({gateway:false,moderation:false,persistence:true});const disabled=service.status().interactionsEnabled===false;
  for(let i=1;i<=5;i++)tick(`outage-${i}`,200+i);
  service.setDependencyHealth({gateway:true,moderation:true});
  const expected=checksum(service.runtime.state),latest=store.snapshots('channel')[0];
  if(latest)store.putSnapshot({...latest,id:`${latest.id}-corrupt`,createdAtMs:latest.createdAtMs+1,checksum:'corrupt'});
  const recovery=service.recover({nowMs:400,newOwnerId:'recovery-worker',expectedChecksum:expected});
  for(let i=1;i<=10;i++)tick(`post-recovery-${i}`,500+i);
  const supervisor=new RunSupervisor({heartbeatTimeoutMs:1000,progressTimeoutMs:2000,crashThreshold:3,crashWindowMs:10000,breakerCooldownMs:5000,maxComponents:8});
  for(const component of ['simulation','renderer','audio','gateway'])supervisor.heartbeat({component,nowMs:1000,progressSeq:service.runtime.state.tick,resourcePressure:0.2});
  supervisor.recordCrash('simulation',1100);supervisor.recordCrash('simulation',1200);supervisor.recordCrash('simulation',1300);const supervision=supervisor.evaluate(1301);
  const health=new OperationalOutputHealth({staleAfterMs:1000,frozenAfterMs:1500,silenceAfterMs:1200,blackLumaThreshold:0.01,queueWarnRatio:0.8,memorySlopeWarnMbPerHour:20});
  const output=health.check({nowMs:5000,lastSnapshotMs:4900,lastFrameChangeMs:0,luma:0,expectedScene:'normal',actualScene:'normal',lastAudioMs:4950,intendedSilence:false,queueUtilization:0.2,memorySlopeMbPerHour:1});
  const events=store.events('channel'),ids=new Set(events.map(e=>e.eventId));
  return{seed,totalTicks,autonomousTicksDuringProviderOutage:5,interactionsDisabledDuringOutage:disabled,invariantFailures,duplicateEventIds:events.length-ids.size,eventSequenceContiguous:events.every((event,index)=>event.seq===index),eventCount:events.length,snapshotCount:store.snapshots('channel').length,recoveryStatus:recovery.status,rejectedRecoveryEvidence:recovery.status==='restored'?recovery.rejected.length:recovery.rejected.length,leaseGeneration:service.status().leaseGeneration,outputProtectionStatus:output.status,crashBreakerState:supervisor.component('simulation').breaker,supervisorLevel:supervision.level,commandDedupeEntries:service.status().commandDedupeEntries,finalChecksum:checksum(service.runtime.state)};
}
