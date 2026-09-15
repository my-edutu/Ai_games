import type { MarbleLifecycle } from '../state/types';

export type MarbleCameraMode = 'overview' | 'cut-line' | 'danger' | 'finish' | 'victory';

export interface MarbleCameraEvent {
  seq: number;
  tick: number;
  type: string;
  data?: Record<string, unknown>;
}

export interface MarbleCameraInput {
  tick: number;
  lifecycle: MarbleLifecycle;
  round: {
    qualified: number;
    quota: number;
    remaining: number;
  };
  leaderId: number | null;
  dangerIds: number[];
  contestedQualificationIds: number[];
  championId: number | null;
  events: MarbleCameraEvent[];
}

export interface MarbleCameraDirective {
  mode: MarbleCameraMode;
  focusIds: number[];
  reason: string;
  issuedAtTick: number;
  holdUntilTick: number;
  zoomPermille: number;
  priority: number;
}

interface Candidate {
  mode: MarbleCameraMode;
  focusIds: number[];
  reason: string;
  holdTicks: number;
  zoomPermille: number;
  priority: number;
}

const EVENT_REACTION_WINDOW_TICKS = 48;

function eventIsFresh(currentTick: number, eventTick: number): boolean {
  return Number.isInteger(eventTick)
    && eventTick <= currentTick
    && currentTick - eventTick <= EVENT_REACTION_WINDOW_TICKS;
}

function eventMarbleId(events: MarbleCameraEvent[], type: string, currentTick: number): number | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type !== type || !eventIsFresh(currentTick, event.tick)) continue;
    const candidate = event.data?.marbleId;
    if (typeof candidate === 'number' && Number.isInteger(candidate)) return candidate;
  }
  return null;
}

function chooseCandidate(input: MarbleCameraInput): Candidate {
  if (input.championId !== null || input.lifecycle === 'tournament-result') {
    return {
      mode: 'victory',
      focusIds: input.championId === null ? [] : [input.championId],
      reason: 'official-champion',
      holdTicks: 120,
      zoomPermille: 1760,
      priority: 100
    };
  }

  const finisherId = eventMarbleId(input.events, 'marble-qualified', input.tick);
  if (finisherId !== null) {
    return {
      mode: 'finish',
      focusIds: [finisherId],
      reason: 'official-finish',
      holdTicks: 48,
      zoomPermille: 1540,
      priority: 80
    };
  }

  const openSpots = Math.max(0, input.round.quota - input.round.qualified);
  const cutLineDecisive = input.contestedQualificationIds.length > 1
    && (openSpots <= 1 || input.round.remaining <= Math.max(3, openSpots + 2));
  if (cutLineDecisive) {
    return {
      mode: 'cut-line',
      focusIds: input.contestedQualificationIds.slice(0, 3),
      reason: 'final-qualification-battle',
      holdTicks: 60,
      zoomPermille: 1380,
      priority: 60
    };
  }

  if (input.dangerIds.length > 0) {
    return {
      mode: 'danger',
      focusIds: input.dangerIds.slice(0, 2),
      reason: 'authoritative-danger',
      holdTicks: 36,
      zoomPermille: 1450,
      priority: 45
    };
  }

  return {
    mode: 'overview',
    // Overview is intentionally arena-centred. Leader identity is already visible in
    // the standings/identity layer; using it as a camera target drags the full arena
    // toward one edge and creates large dead-space in the broadcast frame.
    focusIds: [],
    reason: input.leaderId === null ? 'race-context' : 'race-context-with-leader',
    holdTicks: 42,
    zoomPermille: 1000,
    priority: 10
  };
}

export function chooseMarbleCameraDirective(
  input: MarbleCameraInput,
  previous?: MarbleCameraDirective | null
): MarbleCameraDirective {
  const candidate = chooseCandidate(input);
  if (previous && input.tick >= previous.issuedAtTick && input.tick < previous.holdUntilTick && candidate.priority <= previous.priority) {
    return {
      ...previous,
      focusIds: [...previous.focusIds]
    };
  }
  return {
    mode: candidate.mode,
    focusIds: [...candidate.focusIds],
    reason: candidate.reason,
    issuedAtTick: input.tick,
    holdUntilTick: input.tick + candidate.holdTicks,
    zoomPermille: candidate.zoomPermille,
    priority: candidate.priority
  };
}