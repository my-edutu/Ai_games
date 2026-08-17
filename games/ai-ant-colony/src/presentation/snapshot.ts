import { checksum } from '../../../../packages/replay/src/index';
import type { AntColonyState, AntEvent, AntLifecycle, AntRole, AntTask, ProgressBand, Season, TileCode, Weather } from '../state/types';

export type AntPublicScene = 'colony' | 'crisis' | 'result' | 'intermission' | 'recovery';

export interface AntRenderEntity {
  id: number;
  role: AntRole;
  x: number;
  y: number;
  health: number;
  energy: number;
  carryingFood: number;
  task: AntTask;
  intent: string;
  confidence: number;
}

export interface AntRenderPredator {
  id: number;
  kind: 'beetle' | 'spider';
  x: number;
  y: number;
  health: number;
  intent: string;
}

export interface AntPublicEvent {
  seq: number;
  tick: number;
  type: string;
  data: Record<string, string | number | boolean | null>;
}

export interface AntRenderSnapshot {
  schemaVersion: 1;
  presentationVersion: 'ant-presentation-v1';
  revision: number;
  runToken: string;
  runIndex: number;
  tick: number;
  lifecycle: AntLifecycle;
  intermissionRemaining: number;
  scene: AntPublicScene;
  headline: string;
  goal: {
    label: string;
    population: number;
    targetPopulation: number;
    progress: number;
    band: ProgressBand;
  };
  environment: { day: number; season: Season; weather: Weather };
  queen: { health: number; maxHealth: number };
  colony: {
    population: number;
    brood: number;
    broodByStage: { egg: number; larva: number; pupa: number };
    foodStore: number;
    waterStore: number;
    tunnelsDug: number;
    foodDelivered: number;
    predatorsDefeated: number;
    strategy: AntColonyState['colony']['strategy'];
    strategyReason: string;
    progressBand: ProgressBand;
    threat: number;
  };
  world: {
    width: number;
    height: number;
    surfaceRow: number;
    entrance: number;
    nestCenter: number;
    tiles: TileCode[];
    food: number[];
    moisture: number[];
    discovered: number[];
    pheromones: { home: number[]; food: number[]; alarm: number[]; excavation: number[] };
  };
  ants: AntRenderEntity[];
  predators: AntRenderPredator[];
  audience: { enabled: boolean; emergencyDisabled: boolean; pendingEffects: number; activeEffectCount: number };
  recentEvents: AntPublicEvent[];
  captions: string[];
  result?: { reason: string; score: number; population: number; foodStore: number; tunnelsDug: number };
}

const SAFE_EVENT_KEYS = new Set([
  'reason', 'score', 'population', 'band', 'strategy', 'weather', 'season', 'role', 'amount', 'store', 'kind',
  'count', 'health', 'total', 'brood', 'id', 'antId', 'predatorId', 'day', 'pressure', 'remaining', 'runIndex',
]);

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function boundedText(value: unknown, max = 96): string {
  const text = typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  return text.slice(0, max);
}

function lifecycleRevision(state: AntColonyState): number {
  if (state.lifecycle === 'active') return 1;
  if (state.lifecycle === 'result') return 2;
  if (state.lifecycle === 'intermission') return 100 + Math.max(0, state.config.intermissionTicks - state.intermissionRemaining);
  return 9000;
}

function sceneFor(state: AntColonyState): AntPublicScene {
  if (state.lifecycle === 'quarantined') return 'recovery';
  if (state.lifecycle === 'result') return 'result';
  if (state.lifecycle === 'intermission') return 'intermission';
  if (state.colony.threat >= 60 || state.predators.length >= 2 || state.queen.health <= Math.ceil(state.config.queenHealth * 0.35)) return 'crisis';
  return 'colony';
}

function headlineFor(state: AntColonyState, scene: AntPublicScene): string {
  if (scene === 'recovery') return 'Restoring a Verified Colony State';
  if (scene === 'intermission') return 'A New Colony Begins Soon';
  if (scene === 'result') {
    if (state.result?.reason === 'ascension') return 'Colony Ascension Achieved';
    if (state.result?.reason === 'extinction') return 'The Colony Has Fallen';
    return 'Colony Cycle Complete';
  }
  if (scene === 'crisis') return 'The Queen Chamber Is Under Pressure';
  return 'Build a Thriving Ant Civilization';
}

function sanitizeEvent(event: AntEvent): AntPublicEvent {
  const data: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(event.data ?? {})) {
    if (!SAFE_EVENT_KEYS.has(key)) continue;
    if (typeof value === 'string') data[key] = boundedText(value, 64);
    else if (typeof value === 'number' && Number.isFinite(value)) data[key] = value;
    else if (typeof value === 'boolean' || value === null) data[key] = value;
  }
  return { seq: event.seq, tick: event.tick, type: boundedText(event.type, 48), data };
}

function captionForEvent(event: AntPublicEvent): string | null {
  switch (event.type) {
    case 'result': return event.data.reason === 'ascension' ? 'The colony reached ecological ascension.' : 'The colony cycle has ended.';
    case 'predator-spawned': return `${String(event.data.kind ?? 'Predator')} approaching the colony.`;
    case 'queen-attacked': return `The queen chamber is under attack. Queen health ${String(event.data.health ?? '')}.`;
    case 'predator-defeated': return 'Colony soldiers defeated a predator.';
    case 'milestone': return `Population milestone reached: ${String(event.data.band ?? '')}.`;
    case 'strategy-changed': return `Colony strategy changed to ${String(event.data.strategy ?? '')}.`;
    case 'weather-changed': return `Weather shifted to ${String(event.data.weather ?? '')}.`;
    case 'food-delivered': return `Workers delivered ${String(event.data.amount ?? '')} food to the nest.`;
    case 'tunnel-dug': return 'Diggers opened a new tunnel segment.';
    case 'ant-born': return `A new ${String(event.data.role ?? 'ant')} joined the colony.`;
    case 'intermission': return 'The next seeded colony is being prepared.';
    case 'quarantined': return 'Gameplay is paused while a verified state is restored.';
    default: return null;
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export function createAntRenderSnapshot(state: AntColonyState, events: ReadonlyArray<AntEvent> = []): Readonly<AntRenderSnapshot> {
  const scene = sceneFor(state);
  const recentEvents = events.slice(-12).map(sanitizeEvent);
  const captions = recentEvents.map(captionForEvent).filter((caption): caption is string => Boolean(caption)).slice(-4);
  if (!captions.length) captions.push(`Strategy: ${boundedText(state.colony.strategyReason, 112) || state.colony.strategy}.`);
  const broodByStage = { egg: 0, larva: 0, pupa: 0 };
  for (const brood of state.brood) broodByStage[brood.stage]++;
  const snapshot: AntRenderSnapshot = {
    schemaVersion: 1,
    presentationVersion: 'ant-presentation-v1',
    revision: state.runIndex * 1_000_000_000_000 + state.tick * 10_000 + lifecycleRevision(state),
    runToken: checksum({ game: 'ai-ant-colony', runId: state.runId, runIndex: state.runIndex }),
    runIndex: state.runIndex,
    tick: state.tick,
    lifecycle: state.lifecycle,
    intermissionRemaining: state.intermissionRemaining,
    scene,
    headline: headlineFor(state, scene),
    goal: {
      label: 'Reach ecological ascension',
      population: state.ants.length,
      targetPopulation: state.config.targetPopulation,
      progress: clamp(state.ants.length / state.config.targetPopulation, 0, 1),
      band: state.colony.progressBand,
    },
    environment: { day: state.day, season: state.season, weather: state.weather },
    queen: { health: state.queen.health, maxHealth: state.config.queenHealth },
    colony: {
      population: state.ants.length,
      brood: state.brood.length,
      broodByStage,
      foodStore: state.colony.foodStore,
      waterStore: state.colony.waterStore,
      tunnelsDug: state.colony.tunnelsDug,
      foodDelivered: state.colony.foodDelivered,
      predatorsDefeated: state.colony.predatorsDefeated,
      strategy: state.colony.strategy,
      strategyReason: boundedText(state.colony.strategyReason, 120),
      progressBand: state.colony.progressBand,
      threat: clamp(state.colony.threat, 0, 100),
    },
    world: {
      width: state.config.width,
      height: state.config.height,
      surfaceRow: state.config.surfaceRow,
      entrance: state.world.entrance,
      nestCenter: state.world.nestCenter,
      tiles: [...state.world.tiles],
      food: [...state.world.food],
      moisture: [...state.world.moisture],
      discovered: [...state.world.discovered],
      pheromones: {
        home: [...state.world.pheromones.home],
        food: [...state.world.pheromones.food],
        alarm: [...state.world.pheromones.alarm],
        excavation: [...state.world.pheromones.excavation],
      },
    },
    ants: state.ants.map(ant => ({
      id: ant.id,
      role: ant.role,
      x: ant.x,
      y: ant.y,
      health: clamp(ant.health, 0, 100),
      energy: clamp(ant.energy, 0, 100),
      carryingFood: clamp(ant.carryingFood, 0, 4),
      task: ant.task,
      intent: boundedText(ant.intent, 96),
      confidence: clamp(ant.confidence, 0, 100),
    })),
    predators: state.predators.map(predator => ({
      id: predator.id,
      kind: predator.kind,
      x: predator.x,
      y: predator.y,
      health: clamp(predator.health, 0, 100),
      intent: boundedText(predator.intent, 96),
    })),
    audience: {
      enabled: false,
      emergencyDisabled: state.influence.emergencyDisabled,
      pendingEffects: state.influence.scheduled.length,
      activeEffectCount: Object.keys(state.influence.activeModifiers).length,
    },
    recentEvents,
    captions,
    result: state.result ? {
      reason: state.result.reason,
      score: state.result.score,
      population: state.result.population,
      foodStore: state.result.foodStore,
      tunnelsDug: state.result.tunnelsDug,
    } : undefined,
  };
  return deepFreeze(snapshot);
}
