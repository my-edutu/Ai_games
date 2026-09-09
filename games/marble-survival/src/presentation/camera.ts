import type { createMarblePublicSnapshot } from './snapshot';

export type MarblePublicSnapshot = ReturnType<typeof createMarblePublicSnapshot>;
export type MarbleCameraMode = 'overview' | 'pack' | 'danger' | 'finish' | 'replay' | 'victory';

export interface MarblePresentationEvent {
  tick: number;
  type: string;
  data?: Record<string, unknown>;
}

export interface MarbleCameraDirective {
  mode: MarbleCameraMode;
  targetIds: number[];
  focusX: number;
  focusY: number;
  zoomPermille: number;
  minHoldTicks: number;
}

function numericId(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function directiveFor(snapshot: MarblePublicSnapshot, mode: MarbleCameraMode, targetIds: number[], zoomPermille: number, minHoldTicks: number): MarbleCameraDirective {
  const target = targetIds.length > 0 ? snapshot.marbles.find(marble => marble.id === targetIds[0]) : undefined;
  return {
    mode,
    targetIds: [...targetIds].sort((a, b) => a - b),
    focusX: target?.x ?? Math.round(snapshot.arena.width / 2),
    focusY: target?.y ?? Math.round(snapshot.arena.height / 2),
    zoomPermille,
    minHoldTicks
  };
}

function currentRoundEvents(recentEvents: readonly MarblePresentationEvent[]): MarblePresentationEvent[] {
  let lastRoundStarted = -1;
  for (let index = recentEvents.length - 1; index >= 0; index--) {
    if (recentEvents[index].type === 'round-started') {
      lastRoundStarted = index;
      break;
    }
  }
  return lastRoundStarted >= 0 ? recentEvents.slice(lastRoundStarted) : [...recentEvents];
}

export function selectMarbleCamera(
  snapshot: MarblePublicSnapshot,
  recentEvents: readonly MarblePresentationEvent[],
  previous?: MarbleCameraDirective
): MarbleCameraDirective {
  const scopedEvents = currentRoundEvents(recentEvents);
  const newestFirst = [...scopedEvents].sort((left, right) => right.tick - left.tick);
  const championEvent = newestFirst.find(event => event.type === 'tournament-champion');
  const confirmedChampionId = snapshot.champion?.id ?? numericId(championEvent?.data?.championId);
  if (snapshot.run.lifecycle === 'tournament-result' && confirmedChampionId !== null) {
    return directiveFor(snapshot, 'victory', [confirmedChampionId], 1_250, 120);
  }

  const finishEvent = newestFirst.find(event => event.type === 'marble-qualified' || event.type === 'round-resolved');
  if (finishEvent) {
    const finishId = numericId(finishEvent.data?.marbleId);
    const qualifierIds = Array.isArray(finishEvent.data?.qualifierIds)
      ? finishEvent.data.qualifierIds.filter((value): value is number => Number.isInteger(value)).sort((a, b) => a - b)
      : [];
    const targets = finishId === null ? qualifierIds.slice(0, 2) : [finishId];
    return directiveFor(snapshot, 'finish', targets, 1_100, 75);
  }

  const dangerEvent = newestFirst.find(event => event.type === 'marble-eliminated' || event.type === 'shield-recovery');
  if (dangerEvent) {
    const dangerId = numericId(dangerEvent.data?.marbleId);
    if (dangerId !== null) return directiveFor(snapshot, 'danger', [dangerId], 1_075, 60);
  }

  if (previous && snapshot.tick < previous.minHoldTicks && previous.targetIds.every(id => snapshot.marbles.some(marble => marble.id === id))) {
    return { ...previous, targetIds: [...previous.targetIds] };
  }

  const leaders = snapshot.leaderboard.slice(0, Math.min(3, snapshot.leaderboard.length)).map(entry => entry.id);
  if (leaders.length > 1 && snapshot.marbles.length <= 8) return directiveFor(snapshot, 'pack', leaders, 1_025, 60);
  return directiveFor(snapshot, 'overview', [], 1_000, 90);
}