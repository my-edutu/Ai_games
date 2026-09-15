import type { MarbleArchetype, MarbleLifecycle, MarblePattern, RoundArchetype } from '../state/types';

export type MarblePresentationStatus =
  | 'racing'
  | 'near-finish'
  | 'threatened'
  | 'recovering'
  | 'qualified'
  | 'eliminated'
  | 'champion';

export interface MarblePresentationCompetitor {
  readonly id: number;
  readonly number: number;
  readonly name: string;
  readonly palette: string;
  readonly pattern: MarblePattern;
  readonly archetype: MarbleArchetype;
  readonly status: MarblePresentationStatus;
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly progressPermille: number;
  readonly finishRank: number | null;
  readonly shieldCharges: number;
  readonly recoveryUntilTick: number;
}

export interface MarblePresentationEvent {
  readonly seq: number;
  readonly tick: number;
  readonly type: string;
  readonly data: Readonly<Record<string, string | number | boolean | null>>;
}

export interface MarblePresentationArena {
  readonly id: string;
  readonly archetype: RoundArchetype;
  readonly width: number;
  readonly height: number;
  readonly finishY: number;
  readonly hazards: ReadonlyArray<Readonly<{ id: string; kind: string; x: number; y: number; width: number; height: number }>>;
  readonly obstacles: ReadonlyArray<Readonly<{ id: string; x: number; y: number; width: number; height: number }>>;
  readonly bumpers: ReadonlyArray<Readonly<{ id: string; x: number; y: number; radius: number }>>;
  readonly sweepers: ReadonlyArray<Readonly<{ id: string; baseX: number; baseY: number; width: number; height: number; axis: 'x' | 'y'; amplitude: number; periodTicks: number; phaseTicks: number }>>;
}

export interface MarblePresentationSnapshot {
  readonly version: 1;
  readonly tick: number;
  readonly lifecycle: MarbleLifecycle;
  readonly round: Readonly<{
    index: number;
    number: number;
    quota: number;
    remaining: number;
    qualified: number;
  }>;
  readonly arena: MarblePresentationArena;
  readonly marbles: ReadonlyArray<MarblePresentationCompetitor>;
  readonly leaderboard: ReadonlyArray<Readonly<{ id: number; number: number; name: string; status: MarblePresentationStatus; progressPermille: number; finishRank: number | null }>>;
  readonly camera: Readonly<{
    leaderId: number | null;
    dangerIds: ReadonlyArray<number>;
    contestedQualificationIds: ReadonlyArray<number>;
    championId: number | null;
  }>;
  readonly events: ReadonlyArray<MarblePresentationEvent>;
}
