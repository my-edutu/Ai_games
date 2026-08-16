import { checksum } from '../../replay/src/index';
import { restoreRuntime, encodeSnapshot, type SnakeSnapshotEnvelope } from '../../../games/autonomous-snake/src/persistence/snapshot';
import { enqueueInfluence } from '../../../games/autonomous-snake/src/influence/apply';
import type { InfluenceCommand } from '../../../games/autonomous-snake/src/influence/types';
import type { SnakeRuntime } from '../../../games/autonomous-snake/src/runtime/run';
import { type CompatibilityKey, type SnapshotRecord, sameCompatibility } from '../../ops-contracts/src/index';
import { RunLeaseStore, type RunLease } from '../../operations-core/src/lease';

export interface RecoveryCheckpoint extends Omit<SnapshotRecord,'envelope'> { envelope: SnakeSnapshotEnvelope; }
export interface CheckpointOptions { streamId:string; id:string; commandSeq:number; createdAtMs:number; compatibility:CompatibilityKey; }
export type RuntimeCommand =
  | { schemaVersion:1; id:string; seq:number; kind:'step' }
  | { schemaVersion:1; id:string; seq:number; kind:'restart'; seed:string }
  | { schemaVersion:1; id:string; seq:number; kind:'enqueue-influence'; command:InfluenceCommand };
export interface RecoveryLeaseRequest { store:RunLeaseStore; channelId:string; newOwnerId:string; ttlMs:number; nowMs:number; }
export interface RecoveryInput { snapshots:ReadonlyArray<RecoveryCheckpoint>; commands:ReadonlyArray<RuntimeCommand>; compatibility:CompatibilityKey; expectedChecksum?:string; lease?:RecoveryLeaseRequest; }
export type EvidenceRecoveryResult =
  | { status:'restored'; runtime:SnakeRuntime; snapshotId:string; appliedCommands:number; rejected:string[]; lease?:RunLease }
  | { status:'quarantined'; reason:'no-compatible-snapshot'|'command-sequence-gap'|'command-rejected'|'replay-divergence'|'lease-conflict'; rejected:string[] };

function recordBase(record:RecoveryCheckpoint){const{checksum:_,...base}=record;return base}
function validRecord(record:RecoveryCheckpoint):boolean{return checksum(recordBase(record))===record.checksum}

export function createRecoveryCheckpoint(runtime:SnakeRuntime,options:CheckpointOptions):RecoveryCheckpoint{
  const envelope=encodeSnapshot(runtime);
  const base={schemaVersion:1 as const,id:options.id,streamId:options.streamId,runId:runtime.state.runId,eventSeq:runtime.getNextEventSequence()-1,commandSeq:options.commandSeq,createdAtMs:options.createdAtMs,compatibility:structuredClone(options.compatibility),envelope};
  return{...base,checksum:checksum(base)};
}

export function recoverFromEvidence(input:RecoveryInput):EvidenceRecoveryResult{
  const rejected:string[]=[];
  let lease:RunLease|undefined;
  if(input.lease){
    input.lease.store.fence(input.lease.channelId,'verified-recovery');
    const acquired=input.lease.store.acquire(input.lease.channelId,input.lease.newOwnerId,input.lease.ttlMs,input.lease.nowMs);
    if(acquired.status!=='acquired')return{status:'quarantined',reason:'lease-conflict',rejected};
    lease=acquired.lease;
  }
  const candidates=[...input.snapshots].filter(s=>sameCompatibility(s.compatibility,input.compatibility)).sort((a,b)=>b.createdAtMs-a.createdAtMs||b.commandSeq-a.commandSeq||a.id.localeCompare(b.id));
  for(const snapshot of candidates){
    if(!validRecord(snapshot)){rejected.push(`${snapshot.id}:record-checksum`);continue}
    let runtime:SnakeRuntime;
    try{runtime=restoreRuntime(structuredClone(snapshot.envelope));}catch(error){rejected.push(`${snapshot.id}:${error instanceof Error?error.name:'restore-error'}`);continue}
    const commands=[...input.commands].filter(c=>c.seq>snapshot.commandSeq).sort((a,b)=>a.seq-b.seq||a.id.localeCompare(b.id));
    let expected=snapshot.commandSeq+1;
    let applied=0;
    for(const command of commands){
      if(command.seq!==expected)return{status:'quarantined',reason:'command-sequence-gap',rejected:[...rejected,`${command.id}:expected-${expected}`]};
      if(command.kind==='step')runtime.step();
      else if(command.kind==='restart')runtime.restart(command.seed);
      else{
        const queued=enqueueInfluence(runtime.state,command.command);
        if(queued.status!=='queued'&&queued.status!=='duplicate')return{status:'quarantined',reason:'command-rejected',rejected:[...rejected,`${command.id}:${queued.reason}`]};
        runtime.state=queued.state;
      }
      expected++;applied++;
    }
    if(input.expectedChecksum&&checksum(runtime.state)!==input.expectedChecksum)return{status:'quarantined',reason:'replay-divergence',rejected:[...rejected,`${snapshot.id}:final-checksum`]};
    return{status:'restored',runtime,snapshotId:snapshot.id,appliedCommands:applied,rejected,...(lease?{lease}:{})};
  }
  return{status:'quarantined',reason:'no-compatible-snapshot',rejected};
}
