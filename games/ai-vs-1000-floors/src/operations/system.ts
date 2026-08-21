import{checksum}from '../../../../packages/replay/src/index';
import{encodeFloorsSnapshot,restoreFloorsRuntime,type FloorsSnapshotEnvelope,FloorsSnapshotError}from'../persistence/snapshot';
import type{FloorsRuntime}from'../runtime/run';

export interface FloorsLease{owner:string;generation:number;expiresAtTick:number}
export interface FloorsJournalEntry{sequence:number;kind:'command'|'event'|'snapshot';tick:number;payloadHash:string;leaseGeneration:number}
export interface FloorsStoredSnapshot{sequence:number;tick:number;envelope:FloorsSnapshotEnvelope}
export interface FloorsHealthInput{tick:number;lastProgressTick:number;lastRenderTick:number;lastAudioTick:number;lastPersistTick:number;lastOutputTick:number;paused:boolean;recoveryAttempts:number}
export interface FloorsHealth{status:'healthy'|'degraded'|'breaker';reasons:string[];actions:string[]}

export class FloorsDurableStore{
  private journal:FloorsJournalEntry[]=[];private snapshots:FloorsStoredSnapshot[]=[];private nextSequence=1;private lease:FloorsLease|null=null;
  acquire(owner:string,nowTick:number,ttlTicks=100):FloorsLease{if(!owner||ttlTicks<1)throw new RangeError('lease');const generation=(this.lease?.generation??0)+1;this.lease={owner,generation,expiresAtTick:nowTick+ttlTicks};return structuredClone(this.lease)}
  renew(lease:FloorsLease,nowTick:number,ttlTicks=100):FloorsLease{this.assertLease(lease,nowTick);this.lease={...lease,expiresAtTick:nowTick+ttlTicks};return structuredClone(this.lease)}
  assertLease(lease:FloorsLease,nowTick:number):void{if(!this.lease||lease.owner!==this.lease.owner||lease.generation!==this.lease.generation||this.lease.expiresAtTick<nowTick)throw new Error('STALE_LEASE')}
  append(kind:FloorsJournalEntry['kind'],tick:number,payload:unknown,lease:FloorsLease):FloorsJournalEntry{this.assertLease(lease,tick);const entry={sequence:this.nextSequence++,kind,tick,payloadHash:checksum(payload),leaseGeneration:lease.generation};this.journal.push(entry);if(this.journal.length>4096)this.journal.splice(0,this.journal.length-4096);return structuredClone(entry)}
  saveRuntime(runtime:FloorsRuntime,lease:FloorsLease):FloorsStoredSnapshot{const envelope=encodeFloorsSnapshot(runtime);const entry=this.append('snapshot',runtime.state.tick,envelope,lease);const stored={sequence:entry.sequence,tick:runtime.state.tick,envelope};this.snapshots.push(stored);if(this.snapshots.length>16)this.snapshots.shift();return structuredClone(stored)}
  entries():FloorsJournalEntry[]{return structuredClone(this.journal)}
  recentSnapshots():FloorsStoredSnapshot[]{return structuredClone(this.snapshots)}
}

export function acquireFloorsLease(store:FloorsDurableStore,owner:string,nowTick:number,ttlTicks=100):FloorsLease{return store.acquire(owner,nowTick,ttlTicks)}

export function restoreFloorsAuthority(store:FloorsDurableStore):{status:'restored'|'quarantined'|'empty';runtime?:FloorsRuntime;usedSequence?:number;rejectedSequences:number[]}{
  const snapshots=store.recentSnapshots().sort((a,b)=>b.sequence-a.sequence),rejectedSequences:number[]=[];
  if(snapshots.length===0)return{status:'empty',rejectedSequences};
  for(const candidate of snapshots){try{return{status:'restored',runtime:restoreFloorsRuntime(candidate.envelope),usedSequence:candidate.sequence,rejectedSequences}}catch(error){if(error instanceof FloorsSnapshotError)rejectedSequences.push(candidate.sequence);else throw error}}
  return{status:'quarantined',rejectedSequences};
}

export function assessFloorsHealth(input:FloorsHealthInput):FloorsHealth{
  const reasons:string[]=[];const actions:string[]=[];const age=(last:number)=>Math.max(0,input.tick-last);
  if(!input.paused&&age(input.lastProgressTick)>120){reasons.push('progress-stale');actions.push('verified-restore')}
  if(age(input.lastRenderTick)>60){reasons.push('render-stale');actions.push('restart-renderer')}
  if(age(input.lastAudioTick)>120){reasons.push('audio-stale');actions.push('restart-audio')}
  if(age(input.lastPersistTick)>80){reasons.push('persistence-stale');actions.push('fence-writer')}
  if(age(input.lastOutputTick)>60){reasons.push('output-stale');actions.push('rebuild-output')}
  if(input.recoveryAttempts>=3){reasons.push('recovery-breaker');return{status:'breaker',reasons:[...new Set(reasons)],actions:['safe-intermission','operator-review']}}
  return{status:reasons.length?'degraded':'healthy',reasons:[...new Set(reasons)],actions:[...new Set(actions)]};
}

export function verifyFloorsContinuity(before:FloorsRuntime,after:FloorsRuntime):boolean{return before.state.runId===after.state.runId&&before.state.tick===after.state.tick&&checksum(before.state)===checksum(after.state)}
