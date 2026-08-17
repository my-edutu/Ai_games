import type{DungeonConfig}from '../../../../packages/game-contracts/src/index';
import{NamedRng,type RngSnapshot}from '../../../../packages/seeded-rng/src/index';
import{checksum}from '../../../../packages/replay/src/index';
import{DungeonRuntime}from '../runtime/run';
import type{DungeonState}from '../state/types';
export interface DungeonSnapshotEnvelope{version:1;config:DungeonConfig;seed:string;state:DungeonState;rng:RngSnapshot;nextEventSequence:number;checksum:string}
export class DungeonSnapshotError extends Error{constructor(public readonly code:'CORRUPT'|'UNSUPPORTED_VERSION',message:string){super(message);this.name='DungeonSnapshotError'}}
export function encodeDungeonSnapshot(runtime:DungeonRuntime):DungeonSnapshotEnvelope{const base={version:1 as const,config:runtime.config,seed:runtime.seed,state:JSON.parse(JSON.stringify(runtime.state))as DungeonState,rng:runtime.rng.snapshot(),nextEventSequence:runtime.getNextEventSequence()};return{...base,checksum:checksum(base)}}
export function restoreDungeonRuntime(envelope:DungeonSnapshotEnvelope){if(envelope.version!==1)throw new DungeonSnapshotError('UNSUPPORTED_VERSION','unsupported dungeon snapshot version');const base={version:envelope.version,config:envelope.config,seed:envelope.seed,state:envelope.state,rng:envelope.rng,nextEventSequence:envelope.nextEventSequence};if(checksum(base)!==envelope.checksum)throw new DungeonSnapshotError('CORRUPT','dungeon snapshot checksum mismatch');return DungeonRuntime.restore(envelope.config,envelope.seed,JSON.parse(JSON.stringify(envelope.state))as DungeonState,NamedRng.restore(envelope.rng),envelope.nextEventSequence)}
