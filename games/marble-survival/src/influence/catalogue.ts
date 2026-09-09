export type MarbleInfluenceFamily =
  | 'wind-vote'
  | 'gate-tempo'
  | 'shield-orb'
  | 'cheer-pulse'
  | 'theme-vote'
  | 'next-arena';

export type MarbleWindOption = 'north' | 'south' | 'east' | 'west' | 'calm';

export interface MarbleInfluenceCatalogueEntry {
  operational: boolean;
  authority: boolean;
  options: readonly string[];
  description: string;
}

export const MARBLE_INFLUENCE_CATALOGUE: Readonly<Record<MarbleInfluenceFamily, MarbleInfluenceCatalogueEntry>> = Object.freeze({
  'wind-vote': Object.freeze({
    operational: true,
    authority: true,
    options: Object.freeze(['north', 'south', 'east', 'west', 'calm']),
    description: 'Apply one bounded global wind field to every active marble for a fixed logical duration.',
  }),
  'gate-tempo': Object.freeze({
    operational: false,
    authority: true,
    options: Object.freeze(['slow', 'standard', 'fast']),
    description: 'Legacy future-gate rhythm choice; unavailable until its v2 authority mechanic is restored.',
  }),
  'shield-orb': Object.freeze({
    operational: false,
    authority: true,
    options: Object.freeze(['left', 'centre', 'right']),
    description: 'Legacy neutral shield placement; unavailable until a validated v2 collectable mechanic exists.',
  }),
  'cheer-pulse': Object.freeze({
    operational: false,
    authority: true,
    options: Object.freeze(['navigator', 'sprinter', 'bruiser', 'survivor']),
    description: 'Legacy bounded favourite-pool pulse; unavailable until v2 fairness mechanics are implemented.',
  }),
  'theme-vote': Object.freeze({
    operational: false,
    authority: false,
    options: Object.freeze(['ivory', 'graphite', 'heritage']),
    description: 'Legacy presentation theme choice; retained in the catalogue but not yet wired to the premium renderer.',
  }),
  'next-arena': Object.freeze({
    operational: false,
    authority: true,
    options: Object.freeze(['balanced', 'precision', 'chaos']),
    description: 'Legacy next-arena profile choice; unavailable until the v2 generator exposes validated profiles.',
  }),
});

export interface MarbleScheduledInfluence {
  id: string;
  family: 'wind-vote';
  option: MarbleWindOption;
  applyTick: number;
  durationTicks: number;
}

export interface MarbleInfluenceRequest {
  id: string;
  family: MarbleInfluenceFamily | string;
  option: string;
}

export type MarbleInfluenceDecision =
  | { accepted: true; family: 'wind-vote'; option: MarbleWindOption; applyTick: number; durationTicks: number }
  | { accepted: false; reason: 'invalid-id' | 'invalid-family' | 'invalid-option' | 'temporarily-unavailable' | 'duplicate' | 'queue-full' | 'state-ineligible' };

export const MARBLE_WIND_FORCE = 6;
export const MARBLE_WIND_DURATION_TICKS = 180;
export const MARBLE_INFLUENCE_QUEUE_CAP = 64;
export const MARBLE_INFLUENCE_HISTORY_CAP = 4_096;

export function isSafeInfluenceId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 96 && /^[A-Za-z0-9:_-]+$/.test(value);
}

export function isWindOption(value: unknown): value is MarbleWindOption {
  return typeof value === 'string' && MARBLE_INFLUENCE_CATALOGUE['wind-vote'].options.includes(value);
}
