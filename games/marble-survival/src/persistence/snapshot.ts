import { checksum, stableSerialize } from '../../../../packages/replay/src/index';
import { NamedRng, type RngSnapshot } from '../../../../packages/seeded-rng/src/index';
import { parseMarbleConfig } from '../config/schema';
import {
  MARBLE_INFLUENCE_HISTORY_CAP,
  MARBLE_INFLUENCE_QUEUE_CAP,
  MARBLE_WIND_DURATION_TICKS,
  MARBLE_WIND_FORCE,
  MARBLE_INFLUENCE_POLICY_VERSION,
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
  influencePolicyVersion: typeof MARBLE_INFLUENCE_POLICY_VERSION;
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

  if (!Number.isSafeInteger(influence.nextEligibleTick) || influence.nextEligibleTick < 0 || influence.pending.length > 1) {
    throw new MarbleSnapshotError('state', 'Influence cooldown or conflict state is invalid.');
  }
  const vector = influence.activeFamily === 'wind-vote'
    ? { north: [0, -MARBLE_WIND_FORCE], south: [0, MARBLE_WIND_FORCE], east: [MARBLE_WIND_FORCE, 0], west: [-MARBLE_WIND_FORCE, 0], calm: [0, 0] }[influence.activeOption!]
    : [0, 0];
  if (!vector || influence.globalWindX !== vector[0] || influence.globalWindY !== vector[1]) {
    throw new MarbleSnapshotError('state', 'Wind strength does not match the declared option.');
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
  if (state.marbles.length !== state.config.rosterSize) throw new MarbleSnapshotError('state', 'Roster size mismatch.');
  const memberships = [...state.activeIds, ...state.qualifiedIds, ...state.eliminatedIds];
  if (new Set(memberships).size !== memberships.length || memberships.length !== state.marbles.length) throw new MarbleSnapshotError('state', 'Competitor sets overlap or omit an entrant.');
  const known = (id: number) => identifiers.has(id);
  for (const id of [...state.activeIds, ...state.qualifiedIds, ...state.eliminatedIds]) if (!known(id)) throw new MarbleSnapshotError('state', `Unknown marble identifier ${id}.`);
  if (state.roundIndex < 0 || state.roundIndex > 4 || state.roundNumber !== state.roundIndex + 1) throw new MarbleSnapshotError('state', 'Invalid round state.');
  if (state.currentQuota !== state.config.roundQuotas[state.roundIndex]) throw new MarbleSnapshotError('state', 'Round quota does not match configuration.');
  for (const value of [state.tick, state.tournamentTick, state.roundTick, state.runIndex]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new MarbleSnapshotError('state', 'Invalid logical counter.');
  }
  for (const marble of state.marbles) {
    const expected = state.activeIds.includes(marble.id) ? 'active' : state.eliminatedIds.includes(marble.id) ? 'eliminated' : null;
    if (expected ? marble.status !== expected : !['qualified', 'champion'].includes(marble.status)) throw new MarbleSnapshotError('state', 'Competitor status does not match its set.');
    if (!Number.isSafeInteger(marble.velocity.x) || !Number.isSafeInteger(marble.velocity.y)) throw new MarbleSnapshotError('state', 'Velocity is not a fixed integer.');
    if (!Number.isSafeInteger(marble.position.x) || !Number.isSafeInteger(marble.position.y) || Math.abs(marble.position.x) > 10_000_000 || Math.abs(marble.position.y) > 10_000_000) {
      throw new MarbleSnapshotError('state', `Marble ${marble.id} position is outside deterministic range.`);
    }
  }
  validateInfluence(state);
}

function validateEvents(events: MarbleEvent[], nextSequence: number): void {
  if (!Number.isSafeInteger(nextSequence) || nextSequence < 0 || !Array.isArray(events)) throw new MarbleSnapshotError('events', 'Invalid event counter.');
  let previous = -1;
  for (const event of events) {
    if (!Number.isInteger(event.seq) || event.seq <= previous || event.seq >= nextSequence) throw new MarbleSnapshotError('events', 'Pending event sequence is invalid.');
    previous = event.seq;
  }
}

export function createMarbleSnapshot(runtime: MarbleRuntime): MarbleSnapshot {
  const payload: MarbleSnapshotPayload = JSON.parse(JSON.stringify({
    config: runtime.config,
    rootSeed: runtime.rootSeed,
    state: runtime.state,
    rng: runtime.rng.snapshot(),
    nextEventSequence: runtime.getNextEventSequence(),
    pendingEvents: runtime.getPendingEvents()
  }));
  const partial = {
    schemaVersion: 1 as const,
    gameId: 'marble-survival' as const,
    deterministicVersion: 'marble-physics-v2' as const,
    influencePolicyVersion: MARBLE_INFLUENCE_POLICY_VERSION,
    createdAtTick: runtime.state.tick,
    stateChecksum: marbleStateChecksum(payload.state),
    payload
  };
  return { ...partial, checksum: checksum(partial) };
}

export function restoreMarbleSnapshot(snapshot: MarbleSnapshot): MarbleRuntime {
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.gameId !== 'marble-survival') throw new MarbleSnapshotError('schema', 'Unsupported snapshot schema.');
  if (snapshot.deterministicVersion !== 'marble-physics-v2' || snapshot.influencePolicyVersion !== MARBLE_INFLUENCE_POLICY_VERSION) throw new MarbleSnapshotError('version', 'Unsupported deterministic version.');
  const { checksum: provided, ...partial } = snapshot;
  if (checksum(partial) !== provided) throw new MarbleSnapshotError('checksum', 'Snapshot checksum mismatch.');
  const config = parseMarbleConfig(snapshot.payload.config);
  if (stableSerialize(config) !== stableSerialize(snapshot.payload.state.config) || snapshot.payload.rootSeed !== snapshot.payload.state.rootSeed || snapshot.createdAtTick !== snapshot.payload.state.tick) throw new MarbleSnapshotError('state', 'Snapshot envelope disagrees with its state.');
  if (snapshot.payload.pendingEvents.length > config.maxEventHistory) throw new MarbleSnapshotError('events', 'Event history exceeds its bound.');
  validateState(snapshot.payload.state);
  validateEvents(snapshot.payload.pendingEvents, snapshot.payload.nextEventSequence);
  if (marbleStateChecksum(snapshot.payload.state) !== snapshot.stateChecksum) throw new MarbleSnapshotError('checksum', 'State checksum mismatch.');
  const payload = structuredClone(snapshot.payload);
  return MarbleRuntime.restore(config, payload.rootSeed, { ...payload.state, config }, NamedRng.restore(payload.rng), payload.nextEventSequence, payload.pendingEvents);
}