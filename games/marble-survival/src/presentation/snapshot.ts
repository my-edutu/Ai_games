import { sweeperTransform } from '../physics/moving-collider';
import type { MarbleCompetitor, MarbleState } from '../state/types';

const ROUND_NAMES = ['Seeding Sprint', 'Gate Gauntlet', 'Hazard Circuit', 'Final Four', 'Championship'] as const;
const MATERIALS = ['ceramic', 'enamel', 'opaque-glass', 'satin-metal', 'polished-metal'] as const;

function materialKey(marble: MarbleCompetitor): typeof MATERIALS[number] {
  const archetypeOffset = marble.archetype === 'navigator' ? 0 : marble.archetype === 'sprinter' ? 1 : marble.archetype === 'bruiser' ? 2 : 3;
  return MATERIALS[(marble.id + archetypeOffset) % MATERIALS.length];
}

function publicMarble(marble: MarbleCompetitor) {
  return {
    id: marble.id,
    displayName: marble.name,
    number: marble.number,
    palette: marble.palette,
    pattern: marble.pattern,
    icon: marble.icon,
    archetype: marble.archetype,
    materialKey: materialKey(marble),
    x: marble.position.x,
    y: marble.position.y,
    vx: marble.velocity.x,
    vy: marble.velocity.y,
    status: marble.status,
    progressPermille: marble.progressPermille,
    intent: marble.intent,
    confidence: marble.confidence,
    qualified: marble.status === 'qualified' || marble.status === 'champion'
  };
}

export function createMarblePublicSnapshot(state: MarbleState) {
  const visible = state.marbles
    .filter(marble => marble.status === 'active' || marble.status === 'qualified' || marble.status === 'champion')
    .sort((left, right) => right.progressPermille - left.progressPermille || (left.finishRank ?? Number.MAX_SAFE_INTEGER) - (right.finishRank ?? Number.MAX_SAFE_INTEGER) || left.id - right.id);
  const championId = state.result?.kind === 'champion' ? state.result.championId : null;
  const champion = championId === null ? null : state.marbles.find(marble => marble.id === championId) ?? null;
  const cutoffIndex = Math.max(0, Math.min(visible.length - 1, state.currentQuota - 1));
  const cutoff = visible.length > 0 ? visible[cutoffIndex] : null;
  return Object.freeze({
    schemaVersion: 2 as const,
    run: Object.freeze({ id: state.runId, index: state.runIndex, lifecycle: state.lifecycle }),
    round: Object.freeze({
      id: state.arena.id,
      name: ROUND_NAMES[state.roundIndex] ?? `Round ${state.roundNumber}`,
      index: state.roundNumber,
      total: 5,
      quota: state.currentQuota,
      remaining: state.activeIds.length + state.qualifiedIds.length
    }),
    tick: state.tick,
    tournamentTick: state.tournamentTick,
    arena: Object.freeze({
      id: state.arena.id,
      archetype: state.arena.archetype,
      width: state.arena.width,
      height: state.arena.height,
      finishY: state.arena.finishY,
      marbleRadius: state.config.marbleRadius,
      obstacles: state.arena.obstacles.map(value => ({ ...value })),
      bumpers: state.arena.bumpers.map(value => ({ ...value })),
      hazards: state.arena.hazards.map(value => ({ ...value })),
      windZones: state.arena.windZones.map(value => ({ ...value })),
      sweepers: state.arena.sweepers.map(value => sweeperTransform(value, state.tick))
    }),
    marbles: visible.map(publicMarble),
    leaderboard: visible.slice(0, 8).map((marble, index) => Object.freeze({
      rank: index + 1,
      id: marble.id,
      progressPermille: marble.progressPermille,
      status: marble.status
    })),
    qualificationCutoff: cutoff ? Object.freeze({
      rank: cutoffIndex + 1,
      id: cutoff.id,
      progressPermille: cutoff.progressPermille,
      status: cutoff.status
    }) : null,
    champion: champion ? Object.freeze({ id: champion.id, displayName: champion.name, number: champion.number, palette: champion.palette, pattern: champion.pattern }) : null,
    recordCategory: state.records.category
  });
}
