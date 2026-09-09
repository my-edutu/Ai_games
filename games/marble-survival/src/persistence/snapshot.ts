import { checksum } from '../../../../packages/replay/src/index';
import { NamedRng, type RngSnapshot } from '../../../../packages/seeded-rng/src/index';
import { parseMarbleConfig } from '../config/schema';
import {
  MARBLE_INFLUENCE_HISTORY_CAP,
  MARBLE_INFLUENCE_QUEUE_CAP,
  MARBLE_WIND_DURATION_TICKS,
  isSafeInfluenceId,
  isWindOption,
} from '../influence/catalogue';
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
  deterministicVersion: 'marble-physics-v2';
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

function validateInfluence(state: MarbleState): void {
  const influence = state.influence;
  if (!influence || !Array.isArray(influence.pending) || !Array.isArray(influence.appliedIds)) {
    throw new MarbleSnapshotError('state', 'Influence state is malformed.');
  }
  if (influence.pending.length > MARBLE_INFLUENCE_QUEUE_CAP) {
    throw new MarbleSnapshotError('state', 'Pending influence queue exceeds its declared bound.');
  }
  if (influence.appliedIds.length > MARBLE_INFLUENCE_HISTORY_CAP) {
    throw new MarbleSnapshotError('state', 'Influence idempotency history exceeds its declared bound.');
  }
  if (!Number.isSafeInteger(influence.effectUntilTick) || influence.effectUntilTick < -1) {
    throw new MarbleSnapshotError('state', 'Influence expiry tick is invalid.');
  }
  if (influence.activeFamily !== null && influence.activeFamily !== 'wind-vote') {
    throw new MarbleSnapshotError('state', 'Unsupported active influence family.');
  }
  if (influence.activeFamily === 'wind-vote' && !isWindOption(influence.activeOption)) {
    throw new MarbleSnapshotError('state', 'Active wind influence option is invalid.');
  }
  if (influence.activeFamily === null && influence.activeOption !== null) {
    throw new MarbleSnapshotError('state', 'Inactive influence cannot retain an active option.');
  }
  if (!Number.isSafeInteger(influence.globalWindX) || !Number.isSafeInteger(influence.globalWindY)) {
    throw new MarbleSnapshotError('state', 'Global influence vector is invalid.');
  }

  const seen = new Set<string>();
  for (const id of influence.appliedIds) {
    if (!isSafeInfluenceId(id) || seen.has(id)) throw new MarbleSnapshotError('state', 'Influence idempotency history contains an invalid or duplicate identifier.');
    seen.add(id);
  }
  for (const command of influence.pending) {
    if (!command || !isSafeInfluenceId(command.id) || seen.has(command.id)) throw new MarbleSnapshotError('state', 'Pending influence contains an invalid or duplicate identifier.');
    if (command.family !== 'wind-vote' || !isWindOption(command.option)) throw new MarbleSnapshotError('state', 'Pending influence contains an unsupported command.');
    if (!Number.isSafeInteger(command.applyTick) || command.applyTick < 0) throw new MarbleSnapshotError('state', 'Pending influence apply tick is invalid.');
    if (command.durationTicks !== MARBLE_WIND_DURATION_TICKS) throw new MarbleSnapshotError('state', 'Pending influence duration is incompatible with this deterministic version.');
    seen.add(command.id);
  }
}

function validateState(state: MarbleState): void {
  if (state.schemaVersion !== 1 || state.determinismVersion !== 'marble-physics-v2') throw new MarbleSnapshotError('version', 'Unsupported state version.');
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
  validateInfluence(state);
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
    deterministicVersion: 'marble-physics-v2' as const,
    createdAtTick: runtime.state.tick,
    stateChecksum: marbleStateChecksum(runtime.state),
    payload
  };
  return { ...partial, checksum: checksum(partial) };
}

export function restoreMarbleSnapshot(snapshot: MarbleSnapshot): MarbleRuntime {
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.gameId !== 'marble-survival') throw new MarbleSnapshotError('schema', 'Unsupported snapshot schema.');
  if (snapshot.deterministicVersion !== 'marble-physics-v2') throw new MarbleSnapshotError('version', 'Unsupported deterministic version.');
  const { checksum: provided, ...partial } = snapshot;
  if (checksum(partial) !== provided) throw new MarbleSnapshotError('checksum', 'Snapshot checksum mismatch.');
  const config = parseMarbleConfig(snapshot.payload.config);
  validateState(snapshot.payload.state);
  validateEvents(snapshot.payload.pendingEvents, snapshot.payload.nextEventSequence);
  if (marbleStateChecksum(snapshot.payload.state) !== snapshot.stateChecksum) throw new MarbleSnapshotError('checksum', 'State checksum mismatch.');
  return MarbleRuntime.restore(config, snapshot.payload.rootSeed, snapshot.payload.state, NamedRng.restore(snapshot.payload.rng), snapshot.payload.nextEventSequence, snapshot.payload.pendingEvents);
}