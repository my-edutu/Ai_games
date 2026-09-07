import{checksum}from '../../../../packages/replay/src/index';
import type{RngSnapshot}from '../../../../packages/seeded-rng/src/index';
import{validateFloorsConfig}from '../config/schema';
import{validateFloor}from '../generation/validator';
import{FloorsRuntime,type FloorsPolicy}from '../runtime/run';
import type{FloorEnemy,FloorsEvent,FloorsState,GeneratedFloor}from '../state/types';

export type FloorsSnapshotErrorCode='UNSUPPORTED_VERSION'|'CORRUPT'|'INVALID_STATE';
export class FloorsSnapshotError extends Error{constructor(public readonly code:FloorsSnapshotErrorCode,message:string){super(message);this.name='FloorsSnapshotError'}}
export interface FloorsSnapshotEnvelope{
  version:1;
  deterministicVersion:'floors-r1-v1';
  state:FloorsState;
  rng:RngSnapshot;
  events:FloorsEvent[];
  runtime:{rootSeed:string;runOrdinal:number;policy:FloorsPolicy};
  checksum:string;
}
function material(envelope:Omit<FloorsSnapshotEnvelope,'checksum'>):Omit<FloorsSnapshotEnvelope,'checksum'>{return structuredClone(envelope)}
function validateRestoredFloor(floor:GeneratedFloor,config:FloorsState['config']):string[]{
  const topology={...structuredClone(floor),enemies:[]} as GeneratedFloor,report=validateFloor(topology,config),errors=[...report.errors];
  const walls=new Set(floor.walls),occupied=new Set<number>();
  if(floor.enemies.length>config.maxEnemyBudget)errors.push('ENTITY_BUDGET');
  for(const enemy of floor.enemies as FloorEnemy[]){
    if(!Number.isInteger(enemy.cell)||enemy.cell<0||enemy.cell>=floor.width*floor.height)errors.push('OUT_OF_BOUNDS');
    else if(walls.has(enemy.cell)||occupied.has(enemy.cell))errors.push('CELL_OVERLAP');
    occupied.add(enemy.cell);
  }
  return[...new Set(errors)].sort();
}

export function encodeFloorsSnapshot(runtime:FloorsRuntime):FloorsSnapshotEnvelope{
  const runtimeMeta=runtime.restoreMetadata,body={version:1 as const,deterministicVersion:'floors-r1-v1' as const,state:structuredClone(runtime.state),rng:runtime.rng.snapshot(),events:runtime.peekEvents(),runtime:runtimeMeta};
  return{...body,checksum:checksum(material(body))};
}

export function restoreFloorsRuntime(envelope:FloorsSnapshotEnvelope):FloorsRuntime{
  if(envelope.version!==1||envelope.deterministicVersion!=='floors-r1-v1')throw new FloorsSnapshotError('UNSUPPORTED_VERSION','unsupported floors snapshot version');
  const body={version:envelope.version,deterministicVersion:envelope.deterministicVersion,state:envelope.state,rng:envelope.rng,events:envelope.events,runtime:envelope.runtime};
  if(checksum(material(body))!==envelope.checksum)throw new FloorsSnapshotError('CORRUPT','floors snapshot checksum mismatch');
  let config;try{config=validateFloorsConfig(envelope.state.config)}catch{throw new FloorsSnapshotError('INVALID_STATE','invalid floors snapshot configuration')}
  const floorErrors=validateRestoredFloor(envelope.state.floor,config);if(floorErrors.length)throw new FloorsSnapshotError('INVALID_STATE',`invalid floor state: ${floorErrors.join(',')}`);
  if(envelope.state.player.cell<0||envelope.state.player.cell>=config.width*config.height||envelope.state.player.health<0||envelope.state.eventSequence<0)throw new FloorsSnapshotError('INVALID_STATE','invalid floors authoritative state');
  return FloorsRuntime.restore({state:envelope.state,rng:envelope.rng,events:envelope.events,rootSeed:envelope.runtime.rootSeed,runOrdinal:envelope.runtime.runOrdinal,policy:envelope.runtime.policy});
}
