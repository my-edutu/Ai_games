import { checksum } from '../../../../packages/replay/src/index';
import { NamedRng, type RngSnapshot } from '../../../../packages/seeded-rng/src/index';
import { parseMarbleConfig } from '../config/schema';
import { MarbleRuntime, marbleStateChecksum } from '../runtime/run';
import type { MarbleConfig, MarbleEvent, MarbleState } from '../state/types';

export interface MarbleSnapshotPayload {
  config: MarbleConfig;
  rootSeed: string;
  state: MarbleState;
  rng: RngSnapshot;
  nextEventSequence: number;
  pendingEvents: MarbleEvent[];
}

export interface MarbleSnapshot {
  schemaVersion: 1;
  gameId: 'marble-survival';
  deterministicVersion: 'marble-physics-v1';
  createdAtTick: number;
  stateChecksum: string;
  payload: MarbleSnapshotPayload;
  checksum: string;
}

export class MarbleSnapshotError extends Error {
  constructor(public readonly code: 'schema' | 'version' | 'checksum' | 'state' | 'events', message: string) {
    super(message);
    this.name = 'MarbleSnapshotError';
  }
}

function validateState(state: MarbleState): void {
  if (state.schemaVersion !== 1 || state.determinismVersion !== 'marble-physics-v1') throw new MarbleSnapshotError('version', 'Unsupported state version.');
  const identifiers = new Set(state.marbles.map(marble => marble.id));
  if (identifiers.size !== state.marbles.length) throw new MarbleSnapshotError('state', 'Duplicate marble identifiers.');
  const known = (id: number) => identifiers.has(id);
  for (const id of [...state.activeIds, ...state.qualifiedIds, ...state.eliminatedIds]) if (!known(id)) throw new MarbleSnapshotError('state', `Unknown marble identifier ${id}.`);
  if (state.roundIndex < 0 || state.roundIndex > 4 || state.roundNumber !== state.roundIndex + 1) throw new MarbleSnapshotError('state', 'Invalid round state.');
  if (state.currentQuota !== state.config.roundQuotas[state.roundIndex]) throw new MarbleSnapshotError('state', 'Round quota does not match configuration.');
  for (const marble of state.marbles) {
    if (!Number.isSafeInteger(marble.position.x) || !Number.isSafeInteger(marble.position.y) || Math.abs(marble.position.x) > 10_000_000 || Math.abs(marble.position.y) > 10_000_000) {
      throw new MarbleSnapshotError('state', `Marble ${marble.id} position is outside deterministic range.`);
    }
  }
}

function validateEvents(events: MarbleEvent[], nextSequence: number): void {
  let previous = -1;
  for (const event of events) {
    if (!Number.isInteger(event.seq) || event.seq <= previous || event.seq >= nextSequence) throw new MarbleSnapshotError('events', 'Pending event sequence is invalid.');
    previous = event.seq;
  }
}

export function createMarbleSnapshot(runtime: MarbleRuntime): MarbleSnapshot {
  const payload: MarbleSnapshotPayload = {
    config: runtime.config,
    rootSeed: runtime.rootSeed,
    state: runtime.state,
    rng: runtime.rng.snapshot(),
    nextEventSequence: runtime.getNextEventSequence(),
    pendingEvents: runtime.getPendingEvents()
  };
  const partial = {
    schemaVersion: 1 as const,
    gameId: 'marble-survival' as const,
    deterministicVersion: 'marble-physics-v1' as const,
    createdAtTick: runtime.state.tick,
    stateChecksum: marbleStateChecksum(runtime.state),
    payload
  };
  return { ...partial, checksum: checksum(partial) };
}

export function restoreMarbleSnapshot(snapshot: MarbleSnapshot): MarbleRuntime {
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.gameId !== 'marble-survival') throw new MarbleSnapshotError('schema', 'Unsupported snapshot schema.');
  if (snapshot.deterministicVersion !== 'marble-physics-v1') throw new MarbleSnapshotError('version', 'Unsupported deterministic version.');
  const { checksum: provided, ...partial } = snapshot;
  if (checksum(partial) !== provided) throw new MarbleSnapshotError('checksum', 'Snapshot checksum mismatch.');
  const config = parseMarbleConfig(snapshot.payload.config);
  validateState(snapshot.payload.state);
  validateEvents(snapshot.payload.pendingEvents, snapshot.payload.nextEventSequence);
  if (marbleStateChecksum(snapshot.payload.state) !== snapshot.stateChecksum) throw new MarbleSnapshotError('checksum', 'State checksum mismatch.');
  return MarbleRuntime.restore(config, snapshot.payload.rootSeed, snapshot.payload.state, NamedRng.restore(snapshot.payload.rng), snapshot.payload.nextEventSequence, snapshot.payload.pendingEvents);
}
