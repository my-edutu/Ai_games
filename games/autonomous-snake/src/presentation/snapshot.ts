import { checksum } from '../../../../packages/replay/src/index';
import { isHazardActiveAt } from '../rules/step';
import type { SnakeState } from '../state/types';

export type PublicScene =
  | 'countdown'
  | 'normal'
  | 'danger'
  | 'milestone'
  | 'result'
  | 'replay'
  | 'intermission'
  | 'provider-degraded'
  | 'recovery'
  | 'maintenance'
  | 'clean-feed'
  | 'emergency';

export interface RenderSegment {
  id: string;
  cell: number;
  role: 'head' | 'body' | 'tail';
}

export interface RenderHazard {
  id: string;
  cell: number;
  active: boolean;
  phase: number;
}

export interface RenderPortal {
  id: string;
  entry: number;
  exit: number;
}

export interface RenderSnapshot {
  version: 1;
  tick: number;
  movementStep: number;
  width: number;
  height: number;
  boardProfile: string;
  snake: RenderSegment[];
  food: { id: 'objective-main'; cell: number; kind: string; expiresAt: number | null } | null;
  obstacles: number[];
  hazards: RenderHazard[];
  portals: RenderPortal[];
  score: number;
  foodsCollected: number;
  length: number;
  goal: number;
  occupancy: number;
  progress: number;
  progressionBand: string;
  ai: { mode: string; confidence: number; intent: string };
  lifecycle: string;
  dangerLevel: 0 | 1 | 2;
  result?: { reason: string; score: number; length: number; integrity: 'verified' };
  authorityChecksum: string;
  checksum: string;
}

export function sanitizePublicText(value: string, maxLength = 96): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function uniquePortals(state: SnakeState): RenderPortal[] {
  const seen = new Set<string>();
  const portals: RenderPortal[] = [];
  for (const [rawEntry, exit] of Object.entries(state.portalPairs)) {
    const entry = Number(rawEntry);
    const low = Math.min(entry, exit);
    const high = Math.max(entry, exit);
    const key = `${low}:${high}`;
    if (seen.has(key)) continue;
    seen.add(key);
    portals.push({ id: `portal-${low}-${high}`, entry: low, exit: high });
  }
  return portals.sort((a, b) => a.entry - b.entry || a.exit - b.exit);
}

export function buildRenderSnapshot(state: SnakeState): Readonly<RenderSnapshot> {
  const snake = state.snake.body.map((cell, index, body) => ({
    id: `snake-${index}`,
    cell,
    role: (index === 0 ? 'head' : index === body.length - 1 ? 'tail' : 'body') as RenderSegment['role'],
  }));
  const hazards = [...state.hazards]
    .sort((a, b) => a - b)
    .map(cell => ({
      id: `hazard-${cell}`,
      cell,
      active: isHazardActiveAt(state, cell, state.tick),
      phase: state.tick % state.config.hazardPeriod,
    }));
  const capacity = Math.max(1, state.boardFeatures.playableCells);
  const dangerLevel: 0 | 1 | 2 =
    state.ai.mode === 'escape-hazard' || state.ai.mode === 'fallback-survival'
      ? 2
      : state.ai.mode === 'preserve-space' || state.ai.mode === 'replan'
        ? 1
        : 0;

  const publicState: Omit<RenderSnapshot, 'checksum'> = {
    version: 1,
    tick: state.tick,
    movementStep: state.movementStep,
    width: state.config.width,
    height: state.config.height,
    boardProfile: state.config.profile,
    snake,
    food: state.food === null
      ? null
      : {
          id: 'objective-main',
          cell: state.food,
          kind: state.foodKind,
          expiresAt: state.foodExpiresAt,
        },
    obstacles: [...state.obstacles].sort((a, b) => a - b),
    hazards,
    portals: uniquePortals(state),
    score: state.score,
    foodsCollected: state.foodsCollected,
    length: state.snake.body.length,
    goal: state.config.targetLength,
    occupancy: state.occupancy,
    progress: Math.max(0, Math.min(1, state.snake.body.length / state.config.targetLength)),
    progressionBand: state.progressionBand,
    ai: {
      mode: sanitizePublicText(state.ai.mode, 32),
      confidence: Math.max(0, Math.min(100, Math.round(state.ai.confidence))),
      intent: sanitizePublicText(state.ai.explanation, 96),
    },
    lifecycle: state.lifecycle,
    dangerLevel,
    result: state.result
      ? {
          reason: state.result.reason,
          score: state.result.score,
          length: state.result.length,
          integrity: 'verified',
        }
      : undefined,
    authorityChecksum: checksum(state),
  };
  const snapshot: RenderSnapshot = { ...publicState, checksum: checksum(publicState) };
  return deepFreeze(snapshot);
}
