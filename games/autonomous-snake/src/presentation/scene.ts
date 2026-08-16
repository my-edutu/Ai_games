import type { PublicScene, RenderSnapshot } from './snapshot';
import { sanitizePublicText } from './snapshot';

export interface HudOptions {
  bestLength?: number;
  cleanFeed?: boolean;
  audienceStatus?: string;
  caption?: string;
}

export interface HudModel {
  goal: number;
  length: number;
  progress: number;
  occupancyPct: number;
  phase: PublicScene;
  primaryLabel: string;
  secondaryLabel: string;
  recordLabel: string;
  intent: string;
  danger: boolean;
  result?: string;
  resultLabel?: string;
  audienceLabel?: string;
  caption?: string;
  cleanFeed: boolean;
}

const resultLabels: Record<string, string> = {
  victory: 'CONQUEST COMPLETE',
  'wall-collision': 'WALL COLLISION',
  'obstacle-collision': 'OBSTACLE COLLISION',
  'hazard-collision': 'HAZARD COLLISION',
  'self-collision': 'SELF COLLISION',
  stagnation: 'NO-PROGRESS LIMIT',
};

export function deriveScene(snapshot: RenderSnapshot): PublicScene {
  if (snapshot.lifecycle === 'result') return 'result';
  if (snapshot.lifecycle === 'intermission') return 'intermission';
  if (snapshot.dangerLevel === 2 || snapshot.ai.mode === 'escape-hazard' || snapshot.ai.mode === 'fallback-survival') {
    return 'danger';
  }
  if (snapshot.progressionBand === 'major' || snapshot.progressionBand === 'conquest') return 'milestone';
  return 'normal';
}

export function buildHud(snapshot: RenderSnapshot, options: HudOptions = {}): HudModel {
  const phase = deriveScene(snapshot);
  const bestLength = Math.max(snapshot.length, options.bestLength ?? snapshot.length);
  const resultReason = snapshot.result?.reason;
  const cleanFeed = options.cleanFeed ?? false;

  return {
    goal: snapshot.goal,
    length: snapshot.length,
    progress: snapshot.progress,
    occupancyPct: snapshot.occupancy / Math.max(1, snapshot.width * snapshot.height),
    phase,
    primaryLabel: `LENGTH ${snapshot.length} / ${snapshot.goal}`,
    secondaryLabel: `${Math.round(snapshot.progress * 100)}% • ${snapshot.boardProfile.toUpperCase()}`,
    recordLabel: `BEST ${bestLength}`,
    intent: sanitizePublicText(snapshot.ai.intent || snapshot.ai.mode, 96),
    danger: phase === 'danger',
    result: resultReason,
    resultLabel: resultReason ? (resultLabels[resultReason] ?? sanitizePublicText(resultReason.replace(/-/g, ' ').toUpperCase(), 48)) : undefined,
    audienceLabel: cleanFeed ? undefined : sanitizePublicText(options.audienceStatus ?? 'AUDIENCE INTERACTIONS — PHASE 4', 64),
    caption: options.caption ? sanitizePublicText(options.caption, 120) : undefined,
    cleanFeed,
  };
}
