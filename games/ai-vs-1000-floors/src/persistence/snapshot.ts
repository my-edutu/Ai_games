import{checksum}from '../../../../packages/replay/src/index';
import type{RngSnapshot}from '../../../../packages/seeded-rng/src/index';
import{validateFloorsConfig}from '../config/schema';
import{validateRuntimeFloor}from '../generation/validator';
import{FloorsRuntime,type FloorsPolicy}from '../runtime/run';
import type{FloorsEvent,FloorsState}from '../state/types';
import{FLOORS_DETERMINISTIC_VERSION,FLOORS_SUPPORTED_SNAPSHOT_VERSIONS,type FloorsDeterministicVersion}from'../version';

export type FloorsSnapshotErrorCode='UNSUPPORTED_VERSION'|'CORRUPT'|'INVALID_STATE';
export class FloorsSnapshotError extends Error{constructor(public readonly code:FloorsSnapshotErrorCode,message:string){super(message);this.name='FloorsSnapshotError'}}
export interface FloorsSnapshotEnvelope{
  version:1;
  deterministicVersion:FloorsDeterministicVersion;
  state:FloorsState;
  rng:RngSnapshot;
  events:FloorsEvent[];
  runtime:{rootSeed:string;runOrdinal:number;policy:FloorsPolicy};
  checksum:string;
}
function material(envelope:Omit<FloorsSnapshotEnvelope,'checksum'>):Omit<FloorsSnapshotEnvelope,'checksum'>{return structuredClone(envelope)}

export function encodeFloorsSnapshot(runtime:FloorsRuntime):FloorsSnapshotEnvelope{
  const runtimeMeta=runtime.restoreMetadata,body={version:1 as const,deterministicVersion:FLOORS_DETERMINISTIC_VERSION,state:structuredClone(runtime.state),rng:runtime.rng.snapshot(),events:runtime.peekEvents(),runtime:runtimeMeta};
  return{...body,checksum:checksum(material(body))};
}

export function restoreFloorsRuntime(envelope:FloorsSnapshotEnvelope):FloorsRuntime{
  if(envelope.version!==1||!FLOORS_SUPPORTED_SNAPSHOT_VERSIONS.includes(envelope.deterministicVersion))throw new FloorsSnapshotError('UNSUPPORTED_VERSION','unsupported floors snapshot version');
  const body={version:envelope.version,deterministicVersion:envelope.deterministicVersion,state:envelope.state,rng:envelope.rng,events:envelope.events,runtime:envelope.runtime};
  if(checksum(material(body))!==envelope.checksum)throw new FloorsSnapshotError('CORRUPT','floors snapshot checksum mismatch');
  let config;try{config=validateFloorsConfig(envelope.state.config)}catch{throw new FloorsSnapshotError('INVALID_STATE','invalid floors snapshot configuration')}
  const report=validateRuntimeFloor(envelope.state.floor,config);if(!report.valid)throw new FloorsSnapshotError('INVALID_STATE',`invalid live floor state: ${report.errors.join(',')}`);
  if(envelope.state.player.cell<0||envelope.state.player.cell>=config.width*config.height||envelope.state.floor.walls.includes(envelope.state.player.cell)||envelope.state.floor.enemies.some(enemy=>enemy.cell===envelope.state.player.cell)||envelope.state.player.health<0||envelope.state.eventSequence<0)throw new FloorsSnapshotError('INVALID_STATE','invalid floors authoritative state');
  return FloorsRuntime.restore({state:envelope.state,rng:envelope.rng,events:envelope.events,rootSeed:envelope.runtime.rootSeed,runOrdinal:envelope.runtime.runOrdinal,policy:envelope.runtime.policy});
}
