import type { MarbleCompetitor, MarbleEvent, MarbleState } from '../state/types';
import type {
  MarblePresentationCompetitor,
  MarblePresentationEvent,
  MarblePresentationSnapshot,
  MarblePresentationStatus
} from './types';

const PRESENTATION_EVENT_FIELDS: Record<string, readonly string[]> = {
  'round-started': ['roundIndex', 'quota', 'arena'],
  'round-live': ['roundIndex'],
  'checkpoint-reached': ['marbleId', 'checkpointIndex'],
  'physics-contact': ['kind', 'marbleId', 'otherMarbleId', 'colliderId', 'impulse'],
  'shield-recovery': ['marbleId', 'hazardId', 'impulseY', 'recoveryUntilTick'],
  'marble-eliminated': ['marbleId', 'cause', 'hazardId'],
  'marble-qualified': ['marbleId', 'finishRank', 'crossingFraction'],
  'round-resolved': ['roundIndex', 'resolution'],
  'tournament-champion': ['championId', 'tournamentTicks', 'recordCategory'],
  'intermission-started': ['championId']
};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function insideHazard(state: MarbleState, marble: MarbleCompetitor): boolean {
  return state.arena.hazards.some(hazard =>
    marble.position.x >= hazard.x
    && marble.position.x <= hazard.x + hazard.width
    && marble.position.y >= hazard.y
    && marble.position.y <= hazard.y + hazard.height
  );
}

function presentationStatus(state: MarbleState, marble: MarbleCompetitor): MarblePresentationStatus {
  if (marble.status === 'champion') return 'champion';
  if (marble.status === 'eliminated' || marble.roundStatus === 'out') return 'eliminated';
  if (marble.status === 'qualified' || marble.roundStatus === 'finished') return 'qualified';
  if ((marble.recoveryUntilTick ?? -1) >= state.tick) return 'recovering';
  if (insideHazard(state, marble)) return 'threatened';
  if (marble.progressPermille >= 850) return 'near-finish';
  return 'racing';
}

function sanitizeEvent(event: MarbleEvent): MarblePresentationEvent | null {
  const allowedFields = PRESENTATION_EVENT_FIELDS[event.type];
  if (!allowedFields) return null;
  const data: Record<string, string | number | boolean | null> = {};
  if (event.data) {
    for (const key of allowedFields) {
      const value = event.data[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) data[key] = value;
    }
  }
  return { seq: event.seq, tick: event.tick, type: event.type, data };
}

function toPresentationMarble(state: MarbleState, marble: MarbleCompetitor): MarblePresentationCompetitor {
  return {
    id: marble.id,
    number: marble.number,
    name: marble.name,
    palette: marble.palette,
    pattern: marble.pattern,
    archetype: marble.archetype,
    status: presentationStatus(state, marble),
    x: marble.position.x,
    y: marble.position.y,
    velocityX: marble.velocity.x,
    velocityY: marble.velocity.y,
    progressPermille: marble.progressPermille,
    finishRank: marble.finishRank,
    shieldCharges: marble.shieldCharges,
    recoveryUntilTick: marble.recoveryUntilTick ?? -1
  };
}

export function createMarblePresentationSnapshot(state: MarbleState, recentEvents: MarbleEvent[] = []): MarblePresentationSnapshot {
  const marbles = state.marbles.map(marble => toPresentationMarble(state, marble));
  const byId = new Map(marbles.map(marble => [marble.id, marble]));
  const active = state.activeIds
    .map(id => byId.get(id))
    .filter((marble): marble is MarblePresentationCompetitor => marble !== undefined)
    .sort((left, right) => right.progressPermille - left.progressPermille || left.y - right.y || left.id - right.id);
  const leaderboard = marbles
    .slice()
    .sort((left, right) => {
      const leftFinished = left.finishRank ?? Number.MAX_SAFE_INTEGER;
      const rightFinished = right.finishRank ?? Number.MAX_SAFE_INTEGER;
      if (leftFinished !== rightFinished) return leftFinished - rightFinished;
      return right.progressPermille - left.progressPermille || left.id - right.id;
    })
    .slice(0, 8)
    .map(marble => ({
      id: marble.id,
      number: marble.number,
      name: marble.name,
      status: marble.status,
      progressPermille: marble.progressPermille,
      finishRank: marble.finishRank
    }));
  const dangerIds = marbles
    .filter(marble => marble.status === 'threatened' || marble.status === 'recovering')
    .map(marble => marble.id)
    .sort((left, right) => left - right);
  const championId = state.result?.kind === 'champion'
    ? state.result.championId
    : marbles.find(marble => marble.status === 'champion')?.id ?? null;
  const events = recentEvents
    .slice(-24)
    .map(sanitizeEvent)
    .filter((event): event is MarblePresentationEvent => event !== null);

  const snapshot: MarblePresentationSnapshot = {
    version: 1,
    tick: state.tick,
    lifecycle: state.lifecycle,
    round: {
      index: state.roundIndex,
      number: state.roundNumber,
      quota: state.currentQuota,
      remaining: state.activeIds.length,
      qualified: state.qualifiedIds.length
    },
    arena: {
      id: state.arena.id,
      archetype: state.arena.archetype,
      width: state.arena.width,
      height: state.arena.height,
      finishY: state.arena.finishY,
      hazards: state.arena.hazards.map(hazard => ({ ...hazard })),
      obstacles: state.arena.obstacles.map(obstacle => ({ id: obstacle.id, x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height })),
      bumpers: state.arena.bumpers.map(bumper => ({ id: bumper.id, x: bumper.x, y: bumper.y, radius: bumper.radius })),
      sweepers: state.arena.sweepers.map(sweeper => ({
        id: sweeper.id,
        baseX: sweeper.baseX,
        baseY: sweeper.baseY,
        width: sweeper.width,
        height: sweeper.height,
        axis: sweeper.axis,
        amplitude: sweeper.amplitude,
        periodTicks: sweeper.periodTicks,
        phaseTicks: sweeper.phaseTicks
      }))
    },
    marbles,
    leaderboard,
    camera: {
      leaderId: active[0]?.id ?? null,
      dangerIds,
      contestedQualificationIds: active.slice(0, Math.min(3, active.length)).map(marble => marble.id),
      championId
    },
    events
  };
  return deepFreeze(snapshot);
}

export function isFreshMarblePresentationSnapshot(
  snapshot: MarblePresentationSnapshot | null | undefined,
  currentTick: number,
  maxAgeTicks = 15
): boolean {
  if (!snapshot || !Number.isInteger(currentTick) || !Number.isInteger(maxAgeTicks) || maxAgeTicks < 0) return false;
  return snapshot.tick <= currentTick && currentTick - snapshot.tick <= maxAgeTicks;
}
