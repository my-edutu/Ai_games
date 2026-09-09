import { checksum } from '../../../../packages/replay/src/index';
import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { parseMarbleConfig } from '../config/schema';
import { generateMarbleArena } from '../generation/arena';
import { createMarbleRoster } from '../generation/roster';
import {
  MARBLE_INFLUENCE_CATALOGUE,
  MARBLE_INFLUENCE_HISTORY_CAP,
  MARBLE_INFLUENCE_QUEUE_CAP,
  MARBLE_WIND_DURATION_TICKS,
  MARBLE_WIND_FORCE,
  isSafeInfluenceId,
  isWindOption,
  type MarbleInfluenceDecision,
  type MarbleInfluenceRequest,
  type MarbleScheduledInfluence,
  type MarbleWindOption,
} from '../influence/catalogue';
import { stepMarblePhysics } from '../physics/solver';
import { advanceMarbleRound, applyTournamentRules } from '../rules/tournament';
import type {
  MarbleAction,
  MarbleConfig,
  MarbleEvent,
  MarbleState,
  Vec2
} from '../state/types';

function initialState(config: MarbleConfig, rootSeed: string, tournamentSeed: string, runIndex: number, rng: NamedRng): MarbleState {
  const arena = generateMarbleArena(config, 0, rng);
  const marbles = createMarbleRoster(config, rng);
  for (let index = 0; index < marbles.length; index++) {
    marbles[index].position = { ...arena.spawnPoints[index] };
    marbles[index].roundStatus = 'racing';
    marbles[index].lastProgressTick = 0;
  }
  return {
    schemaVersion: 1,
    determinismVersion: 'marble-physics-v2',
    runId: `marble-${runIndex}-${checksum({ rootSeed, tournamentSeed })}`,
    rootSeed,
    tournamentSeed,
    runIndex,
    tick: 0,
    tournamentTick: 0,
    roundTick: 0,
    lifecycle: 'active',
    roundIndex: 0,
    roundNumber: 1,
    currentQuota: config.roundQuotas[0],
    roundIntroRemaining: config.roundIntroTicks,
    intermissionRemaining: 0,
    config,
    arena,
    marbles,
    activeIds: marbles.map(marble => marble.id),
    qualifiedIds: [],
    eliminatedIds: [],
    roundResults: [],
    records: {
      eligible: true,
      category: 'standard',
      fastestTournamentTicks: null,
      closestFinishGap: null,
      championStreak: 0,
      lastChampionId: null
    },
    influence: {
      recordCategory: 'standard',
      globalWindX: 0,
      globalWindY: 0,
      effectUntilTick: -1,
      activeFamily: null,
      activeOption: null,
      pending: [],
      appliedIds: [],
    },
    meaningfulEventTick: 0,
    droppedEvents: 0
  };
}

function clampSteer(value: number): number {
  return Math.max(-1_000, Math.min(1_000, Math.round(value)));
}

function basicAction(state: MarbleState, marbleId: number): MarbleAction {
  const marble = state.marbles.find(candidate => candidate.id === marbleId)!;
  const laneIndex = marble.id % state.arena.safeLanes.length;
  const alternate = (laneIndex + 1) % state.arena.safeLanes.length;
  const stalled = state.tick - marble.lastProgressTick >= Math.floor(state.config.noProgressTicks / 2);
  const targetLane = state.arena.safeLanes[stalled ? alternate : laneIndex];
  const deltaX = targetLane - marble.position.x;
  const steerX = clampSteer(Math.round(deltaX / Math.max(1, state.config.marbleRadius)) * 120);
  const finalBand = marble.progressPermille >= 800;
  return {
    marbleId,
    steerX,
    steerY: -1_000,
    boostPermille: finalBand ? 1_080 : stalled ? 1_040 : 1_000,
    intent: finalBand ? 'final-sprint' : stalled ? 'recovering-momentum' : Math.abs(deltaX) > state.config.marbleRadius * 2 ? 'seeking-gap' : 'holding-line',
    confidence: stalled ? 'low' : Math.abs(deltaX) < state.config.marbleRadius ? 'high' : 'medium'
  };
}

function windVector(option: MarbleWindOption): Vec2 {
  if (option === 'north') return { x: 0, y: -MARBLE_WIND_FORCE };
  if (option === 'south') return { x: 0, y: MARBLE_WIND_FORCE };
  if (option === 'east') return { x: MARBLE_WIND_FORCE, y: 0 };
  if (option === 'west') return { x: -MARBLE_WIND_FORCE, y: 0 };
  return { x: 0, y: 0 };
}

export function marbleStateChecksum(state: MarbleState): string {
  return checksum(state);
}

export interface MarbleSignals {
  roundIndex: number;
  survivors: number;
  quota: number;
  leaderId: number | null;
  progressPermille: number;
  dangerPermille: number;
  meaningfulEventAge: number;
  lifecycle: MarbleState['lifecycle'];
}

export class MarbleRuntime {
  public state: MarbleState;
  public rng: NamedRng;
  private events: MarbleEvent[];
  private nextEventSequence: number;

  private constructor(
    public readonly config: MarbleConfig,
    public readonly rootSeed: string,
    state: MarbleState,
    rng: NamedRng,
    nextEventSequence = 0,
    pendingEvents: MarbleEvent[] = []
  ) {
    this.state = state;
    this.rng = rng;
    this.nextEventSequence = nextEventSequence;
    this.events = pendingEvents.map(event => ({ ...event, data: event.data ? { ...event.data } : undefined }));
  }

  static create(input: Partial<MarbleConfig> = {}, seed = 'marble-survival'): MarbleRuntime {
    const config = parseMarbleConfig(input);
    const rng = NamedRng.fromSeed(seed);
    const state = initialState(config, seed, seed, 0, rng);
    const runtime = new MarbleRuntime(config, seed, state, rng);
    runtime.emit('initialized', { runId: state.runId, rosterSize: config.rosterSize, arena: state.arena.archetype });
    runtime.emit('round-started', { roundIndex: 0, activeIds: [...state.activeIds], quota: state.currentQuota, arena: state.arena.archetype });
    return runtime;
  }

  static restore(config: MarbleConfig, rootSeed: string, state: MarbleState, rng: NamedRng, nextEventSequence: number, pendingEvents: MarbleEvent[]): MarbleRuntime {
    return new MarbleRuntime(config, rootSeed, state, rng, nextEventSequence, pendingEvents);
  }

  private emit(type: string, data?: Record<string, unknown>, tick = this.state.tick): void {
    const event: MarbleEvent = { seq: this.nextEventSequence++, tick, type, data };
    if (this.events.length >= this.config.maxEventHistory) {
      this.events.shift();
      this.state.droppedEvents++;
    }
    this.events.push(event);
  }

  private emitMany(events: Omit<MarbleEvent, 'seq'>[]): void {
    for (const event of events) this.emit(event.type, event.data, event.tick);
  }

  private quarantine(code: string, detail: string): MarbleState {
    this.state = {
      ...this.state,
      lifecycle: 'quarantined',
      integrityIssue: { code: code === 'numeric-range' ? 'numeric-range' : 'state-invariant', detail },
      records: { ...this.state.records, eligible: false },
      result: { kind: 'technical', reason: code, tournamentTicks: this.state.tournamentTick, recordCategory: this.state.records.category }
    };
    this.emit('integrity-quarantined', { code, detail });
    return this.state;
  }

  scheduleInfluence(input: MarbleInfluenceRequest): MarbleInfluenceDecision {
    if (!isSafeInfluenceId(input?.id)) return { accepted: false, reason: 'invalid-id' };
    if (!Object.hasOwn(MARBLE_INFLUENCE_CATALOGUE, input?.family)) return { accepted: false, reason: 'invalid-family' };
    const family = input.family as keyof typeof MARBLE_INFLUENCE_CATALOGUE;
    const definition = MARBLE_INFLUENCE_CATALOGUE[family];
    if (!definition.operational) return { accepted: false, reason: 'temporarily-unavailable' };
    if (family !== 'wind-vote') return { accepted: false, reason: 'temporarily-unavailable' };
    if (!isWindOption(input.option)) return { accepted: false, reason: 'invalid-option' };
    if (this.state.lifecycle !== 'active') return { accepted: false, reason: 'state-ineligible' };
    if (this.state.influence.pending.some(command => command.id === input.id) || this.state.influence.appliedIds.includes(input.id)) {
      return { accepted: false, reason: 'duplicate' };
    }
    if (this.state.influence.pending.length >= MARBLE_INFLUENCE_QUEUE_CAP) return { accepted: false, reason: 'queue-full' };

    const scheduled: MarbleScheduledInfluence = {
      id: input.id,
      family: 'wind-vote',
      option: input.option,
      applyTick: this.state.tick,
      durationTicks: MARBLE_WIND_DURATION_TICKS,
    };
    const pending = [...this.state.influence.pending, scheduled]
      .sort((left, right) => left.applyTick - right.applyTick || left.id.localeCompare(right.id));
    this.state = {
      ...this.state,
      influence: { ...this.state.influence, pending },
    };
    this.emit('influence-scheduled', { family: scheduled.family, option: scheduled.option, applyTick: scheduled.applyTick });
    return {
      accepted: true,
      family: scheduled.family,
      option: scheduled.option,
      applyTick: scheduled.applyTick,
      durationTicks: scheduled.durationTicks,
    };
  }

  private applyScheduledInfluences(): void {
    const due = this.state.influence.pending
      .filter(command => command.applyTick <= this.state.tick)
      .sort((left, right) => left.applyTick - right.applyTick || left.id.localeCompare(right.id));
    if (due.length === 0) return;

    const dueIds = new Set(due.map(command => command.id));
    let influence = {
      ...this.state.influence,
      pending: this.state.influence.pending.filter(command => !dueIds.has(command.id)).map(command => ({ ...command })),
      appliedIds: [...this.state.influence.appliedIds],
    };
    let records = { ...this.state.records };
    const applied: Array<{ command: MarbleScheduledInfluence; effectUntilTick: number }> = [];

    for (const command of due) {
      const vector = windVector(command.option);
      const effectUntilTick = this.state.tick + command.durationTicks;
      influence = {
        ...influence,
        globalWindX: vector.x,
        globalWindY: vector.y,
        effectUntilTick,
        activeFamily: 'wind-vote',
        activeOption: command.option,
        recordCategory: 'assisted',
        appliedIds: [...influence.appliedIds, command.id].slice(-MARBLE_INFLUENCE_HISTORY_CAP),
      };
      records = { ...records, category: 'assisted' };
      applied.push({ command, effectUntilTick });
    }

    this.state = { ...this.state, influence, records };
    for (const { command, effectUntilTick } of applied) {
      this.emit('influence-applied', {
        family: command.family,
        option: command.option,
        effectUntilTick,
      });
    }
  }

  step(): MarbleState {
    if (this.state.lifecycle === 'quarantined') return this.state;
    if (this.state.lifecycle === 'tournament-result') {
      this.state = { ...this.state, lifecycle: 'intermission', intermissionRemaining: this.config.intermissionTicks };
      this.emit('intermission-started', { championId: this.state.result?.kind === 'champion' ? this.state.result.championId : null });
      return this.state;
    }
    if (this.state.lifecycle === 'intermission') {
      const remaining = this.state.intermissionRemaining - 1;
      if (remaining <= 0) return this.restart();
      this.state = { ...this.state, intermissionRemaining: remaining };
      return this.state;
    }
    if (this.state.lifecycle === 'round-result') {
      const advanced = advanceMarbleRound(this.state, this.rng);
      this.state = advanced.state;
      this.emitMany(advanced.events);
      return this.state;
    }

    this.applyScheduledInfluences();

    if (this.state.roundIntroRemaining > 0) {
      this.state = {
        ...this.state,
        tick: this.state.tick + 1,
        tournamentTick: this.state.tournamentTick + 1,
        roundTick: this.state.roundTick + 1,
        roundIntroRemaining: this.state.roundIntroRemaining - 1
      };
      if (this.state.roundIntroRemaining === 0) this.emit('round-live', { roundIndex: this.state.roundIndex });
      return this.state;
    }

    const previousPositions = new Map<number, Vec2>();
    for (const id of this.state.activeIds) {
      const marble = this.state.marbles.find(candidate => candidate.id === id);
      if (marble) previousPositions.set(id, { ...marble.position });
    }
    const actions = this.state.activeIds.map(id => basicAction(this.state, id));
    const physics = stepMarblePhysics(this.state, actions);
    if (physics.integrityIssue) {
      this.state = physics.state;
      return this.quarantine(physics.integrityIssue.code, physics.integrityIssue.detail);
    }
    const ruled = applyTournamentRules(physics.state, physics.contacts, previousPositions);
    this.state = {
      ...ruled.state,
      tick: ruled.state.tick + 1,
      tournamentTick: ruled.state.tournamentTick + 1,
      roundTick: ruled.state.roundTick + 1
    };
    this.emitMany(ruled.events);
    return this.state;
  }

  restart(): MarbleState {
    const runIndex = this.state.runIndex + 1;
    const tournamentSeed = `${this.rootSeed}:tournament:${runIndex}`;
    this.rng = NamedRng.fromSeed(tournamentSeed);
    this.state = initialState(this.config, this.rootSeed, tournamentSeed, runIndex, this.rng);
    this.emit('tournament-restarted', { runIndex, runId: this.state.runId, rosterSize: this.config.rosterSize });
    this.emit('round-started', { roundIndex: 0, activeIds: [...this.state.activeIds], quota: this.state.currentQuota, arena: this.state.arena.archetype });
    return this.state;
  }

  drainEvents(limit = this.config.maxEventHistory): MarbleEvent[] {
    if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit');
    return this.events.splice(0, Math.min(limit, this.events.length));
  }

  getPendingEvents(): MarbleEvent[] {
    return this.events.map(event => ({ ...event, data: event.data ? { ...event.data } : undefined }));
  }

  getNextEventSequence(): number {
    return this.nextEventSequence;
  }

  signals(): MarbleSignals {
    const active = this.state.marbles.filter(marble => marble.status === 'active' || marble.status === 'qualified');
    const sorted = active.slice().sort((left, right) => right.progressPermille - left.progressPermille || left.id - right.id);
    const contactRisk = active.length <= 1 ? 0 : Math.min(1_000, Math.round((active.length / Math.max(1, this.config.rosterSize)) * 700 + this.state.arena.features.difficultyScore * 3));
    return {
      roundIndex: this.state.roundIndex,
      survivors: active.length,
      quota: this.state.currentQuota,
      leaderId: sorted[0]?.id ?? null,
      progressPermille: sorted[0]?.progressPermille ?? 0,
      dangerPermille: contactRisk,
      meaningfulEventAge: this.state.tick - this.state.meaningfulEventTick,
      lifecycle: this.state.lifecycle
    };
  }
}

export function createInitialMarbleState(config: MarbleConfig, seed: string, runIndex = 0): { state: MarbleState; rng: NamedRng } {
  const tournamentSeed = runIndex === 0 ? seed : `${seed}:tournament:${runIndex}`;
  const rng = NamedRng.fromSeed(tournamentSeed);
  return { state: initialState(config, seed, tournamentSeed, runIndex, rng), rng };
}

export function targetVectorForMarble(state: MarbleState, marbleId: number): Vec2 {
  const action = basicAction(state, marbleId);
  return { x: action.steerX, y: action.steerY };
}
