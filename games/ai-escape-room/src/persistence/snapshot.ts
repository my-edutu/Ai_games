import { checksum } from '../../../../packages/replay/src/index';
import { ESCAPE_ROOM_MANIFEST } from '../manifest';
import { EscapeRuntime, type EscapeRuntimeMaterial } from '../runtime/run';

export interface EscapeSnapshotEnvelope{
  schemaVersion:1;
  compatibility:{gameVersion:string;deterministicVersion:string;configHash:string;contentHash:string};
  runId:string;
  roomId:string;
  tick:number;
  payload:EscapeRuntimeMaterial;
  checksum:string;
}
export class EscapeSnapshotError extends Error{
  constructor(public readonly code:'UNSUPPORTED_SCHEMA'|'CHECKSUM_MISMATCH'|'GAME_VERSION_MISMATCH'|'DETERMINISM_MISMATCH'|'CONFIG_MISMATCH'|'CONTENT_MISMATCH'|'STATE_INVARIANT',message:string){super(message);this.name='EscapeSnapshotError';}
}
function envelopeChecksum(value:Omit<EscapeSnapshotEnvelope,'checksum'>|EscapeSnapshotEnvelope){return checksum({...value,checksum:undefined});}
export function encodeEscapeSnapshot(runtime:EscapeRuntime):EscapeSnapshotEnvelope{
  const payload=runtime.snapshotMaterial();
  const base:Omit<EscapeSnapshotEnvelope,'checksum'>={
    schemaVersion:1,
    compatibility:{gameVersion:ESCAPE_ROOM_MANIFEST.gameVersion,deterministicVersion:ESCAPE_ROOM_MANIFEST.deterministicVersion,configHash:checksum(payload.state.config),contentHash:checksum(payload.state.room)},
    runId:payload.state.runId,roomId:payload.state.roomId,tick:payload.state.tick,payload,
  };
  const envelope={...base,checksum:''} as EscapeSnapshotEnvelope;envelope.checksum=envelopeChecksum(envelope);return envelope;
}
function assertState(material:EscapeRuntimeMaterial){
  const state=material.state;
  if(state.schemaVersion!==1||state.tick<0||new Set(state.room.objects.map(object=>object.id)).size!==state.room.objects.length)throw new EscapeSnapshotError('STATE_INVARIANT','snapshot state invariant failed');
  if(state.solvedPuzzleIds.some(id=>!state.room.puzzles.some(puzzle=>puzzle.id===id)))throw new EscapeSnapshotError('STATE_INVARIANT','unknown solved puzzle');
}
export function restoreEscapeRuntime(envelope:EscapeSnapshotEnvelope):EscapeRuntime{
  if(envelope.schemaVersion!==1)throw new EscapeSnapshotError('UNSUPPORTED_SCHEMA','unsupported snapshot schema');
  if(envelopeChecksum(envelope)!==envelope.checksum)throw new EscapeSnapshotError('CHECKSUM_MISMATCH','snapshot checksum mismatch');
  if(envelope.compatibility.gameVersion!==ESCAPE_ROOM_MANIFEST.gameVersion)throw new EscapeSnapshotError('GAME_VERSION_MISMATCH','game version mismatch');
  if(envelope.compatibility.deterministicVersion!==ESCAPE_ROOM_MANIFEST.deterministicVersion)throw new EscapeSnapshotError('DETERMINISM_MISMATCH','deterministic version mismatch');
  if(envelope.compatibility.configHash!==checksum(envelope.payload.state.config))throw new EscapeSnapshotError('CONFIG_MISMATCH','config hash mismatch');
  if(envelope.compatibility.contentHash!==checksum(envelope.payload.state.room))throw new EscapeSnapshotError('CONTENT_MISMATCH','content hash mismatch');
  assertState(envelope.payload);return EscapeRuntime.restore(envelope.payload);
}
