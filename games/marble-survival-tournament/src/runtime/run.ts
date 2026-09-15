import { checksum } from '../../../../packages/replay/src/index';
import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { parseMarbleConfig } from '../config/schema';
import { generateMarbleArena } from '../generation/arena';
import { createMarbleRoster } from '../generation/roster';
import { triangleWave } from '../physics/fixed';
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
    determinismVersion: 'marble-physics-v1',
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
    influence: { recordCategory: 'standard', globalWindX: 0, globalWindY: 0, effectUntilTick: -1 },
    meaningfulEventTick: 0,
    droppedEvents: 0
  };
}

function clampSteer(value: number): number {
  return Math.max(-1_000, Math.min(1_000, Math.round(value)));
}

interface LaneThreat {
  score: number;
  sweeper: boolean;
}

function horizontalOverlap(laneX: number, left: number, right: number, clearance: number): boolean {
  return laneX + clearance >= left && laneX - clearance <= right;
}

function aheadDistance(marbleY: number, top: number, height: number): number {
  return marbleY - (top + height);
}

function scoreRectThreat(
  laneX: number,
  marbleY: number,
  lookahead: number,
  clearance: number,
  rectangle: { x: number; y: number; width: number; height: number },
  weight: number
): number {
  if (!horizontalOverlap(laneX, rectangle.x, rectangle.x + rectangle.width, clearance)) return 0;
  const distance = aheadDistance(marbleY, rectangle.y, rectangle.height);
  if (distance < -clearance || distance > lookahead) return 0;
  const proximity = Math.max(0, lookahead - Math.max(0, distance));
  return weight + Math.round((proximity * weight) / Math.max(1, lookahead));
}

function laneThreat(state: MarbleState, marbleId: number, laneX: number): LaneThreat {
  const marble = state.marbles.find(candidate => candidate.id === marbleId)!;
  const radius = state.config.marbleRadius;
  const lookahead = radius * (12 + Math.max(4, Math.round(marble.traits.awareness / 10)));
  const clearance = radius + 120;
  let score = 0;
  let sweeperThreat = false;

  for (const sweeper of state.arena.sweepers) {
    const offset = triangleWave(state.tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
    const rectangle = {
      x: sweeper.baseX + (sweeper.axis === 'x' ? offset : 0),
      y: sweeper.baseY + (sweeper.axis === 'y' ? offset : 0),
      width: sweeper.width,
      height: sweeper.height
    };
    const threat = scoreRectThreat(laneX, marble.position.y, lookahead, clearance, rectangle, 3_000);
    if (threat > 0) {
      score += threat;
      sweeperThreat = true;
    }
  }

  for (const obstacle of state.arena.obstacles) {
    score += scoreRectThreat(laneX, marble.position.y, lookahead, clearance, obstacle, 1_800);
  }

  for (const hazard of state.arena.hazards) {
    score += scoreRectThreat(laneX, marble.position.y, lookahead, clearance, hazard, 2_500);
  }

  for (const zone of state.arena.windZones) {
    const base = marble.archetype === 'navigator' || marble.archetype === 'survivor' ? 320 : 620;
    score += scoreRectThreat(laneX, marble.position.y, lookahead, clearance, zone, base);
  }

  return { score, sweeper: sweeperThreat };
}

function chooseSafestLane(state: MarbleState, marbleId: number): { lane: number; threat: LaneThreat } {
  const marble = state.marbles.find(candidate => candidate.id === marbleId)!;
  const lanes = state.arena.safeLanes;
  const preferredIndex = marble.id % lanes.length;
  let bestLane = lanes[preferredIndex];
  let bestThreat = laneThreat(state, marbleId, bestLane);

  for (let offset = 1; offset < lanes.length; offset++) {
    const candidate = lanes[(preferredIndex + offset) % lanes.length];
    const threat = laneThreat(state, marbleId, candidate);
    if (threat.score < bestThreat.score) {
      bestLane = candidate;
      bestThreat = threat;
    }
  }
  return { lane: bestLane, threat: bestThreat };
}

export function chooseMarbleAction(state: MarbleState, marbleId: number): MarbleAction {
  const marble = state.marbles.find(candidate => candidate.id === marbleId);
  if (!marble) throw new RangeError('marbleId');
  if (state.arena.safeLanes.length === 0) throw new Error('arena-safe-lanes');

  const preferredLane = state.arena.safeLanes[marble.id % state.arena.safeLanes.length];
  const preferredThreat = laneThreat(state, marbleId, preferredLane);
  const safest = chooseSafestLane(state, marbleId);
  const stalled = state.tick - marble.lastProgressTick >= Math.floor(state.config.noProgressTicks / 2);
  const finalBand = marble.progressPermille >= 800;
  const riskWindow = marble.progressPermille >= 250 && marble.progressPermille < 800;
  const highRiskSprinter = marble.archetype === 'sprinter'
    && marble.traits.riskPermille >= 640
    && riskWindow
    && preferredThreat.score === 0
    && safest.threat.score === 0;

  let targetLane = safest.lane;
  let intent: MarbleAction['intent'];
  let boostPermille = 1_000;
  let confidence: MarbleAction['confidence'] = 'medium';

  if (preferredThreat.sweeper && safest.lane !== preferredLane) {
    intent = 'avoiding-sweeper';
    boostPermille = marble.archetype === 'bruiser' ? 980 : 940;
    confidence = marble.traits.awareness >= 82 ? 'high' : 'medium';
  } else if (safest.threat.score > 0 && safest.lane !== preferredLane) {
    intent = 'seeking-gap';
    boostPermille = 970;
    confidence = 'medium';
  } else if (finalBand) {
    targetLane = safest.lane;
    intent = 'final-sprint';
    boostPermille = 1_080;
    confidence = safest.threat.score === 0 ? 'high' : 'medium';
  } else if (stalled) {
    const alternateIndex = (state.arena.safeLanes.indexOf(safest.lane) + 1) % state.arena.safeLanes.length;
    const alternateLane = state.arena.safeLanes[alternateIndex];
    const alternateThreat = laneThreat(state, marbleId, alternateLane);
    if (alternateThreat.score <= safest.threat.score) targetLane = alternateLane;
    intent = 'recovering-momentum';
    boostPermille = 1_040;
    confidence = 'low';
  } else if (highRiskSprinter) {
    targetLane = Math.round(state.arena.safeLanes.reduce((sum, lane) => sum + lane, 0) / state.arena.safeLanes.length);
    intent = 'taking-risk-route';
    boostPermille = 1_120;
    confidence = 'medium';
  } else {
    targetLane = safest.lane;
    const delta = targetLane - marble.position.x;
    intent = Math.abs(delta) > state.config.marbleRadius * 2 ? 'seeking-gap' : 'holding-line';
    confidence = safest.threat.score === 0 && Math.abs(delta) < state.config.marbleRadius ? 'high' : 'medium';
  }

  const deltaX = targetLane - marble.position.x;
  const steerX = clampSteer(Math.round(deltaX / Math.max(1, state.config.marbleRadius)) * 120);
  return {
    marbleId,
    steerX,
    steerY: -1_000,
    boostPermille,
    intent,
    confidence
  };
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

    const actions = this.state.activeIds.map(id => chooseMarbleAction(this.state, id));
    const physics = stepMarblePhysics(this.state, actions);
    if (physics.integrityIssue) {
      this.state = physics.state;
      return this.quarantine(physics.integrityIssue.code, physics.integrityIssue.detail);
    }
    const ruled = applyTournamentRules(physics.state, physics.contacts);
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
  const action = chooseMarbleAction(state, marbleId);
  return { x: action.steerX, y: action.steerY };
}
