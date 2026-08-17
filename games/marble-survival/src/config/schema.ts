import type { MarbleConfig } from '../state/types';

const DEFAULTS: MarbleConfig = Object.freeze({
  rosterSize: 32,
  tickRate: 60,
  roundQuotas: [16, 8, 4, 2, 1],
  roundIntroTicks: 60,
  roundTimeoutTicks: 4_800,
  intermissionTicks: 240,
  worldWidth: 24_000,
  worldHeight: 16_000,
  marbleRadius: 280,
  maxSpeed: 360,
  baseAcceleration: 24,
  frictionPermille: 992,
  worldRestitutionPermille: 820,
  marbleRestitutionPermille: 860,
  penetrationTolerance: 4,
  maxSubsteps: 4,
  collisionIterations: 2,
  maxContactsPerTick: 512,
  maxColliders: 96,
  maxEventHistory: 2_048,
  noProgressTicks: 600,
  decisionInterval: 4,
  profile: 'standard'
});

function integer(name: string, value: number, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(name);
  return value;
}

function derivedQuotas(rosterSize: number): number[] {
  const result: number[] = [];
  let remaining = rosterSize;
  for (let index = 0; index < 5; index++) {
    remaining = index === 4 ? 1 : Math.max(1, Math.ceil(remaining / 2));
    result.push(remaining);
  }
  result[4] = 1;
  return result;
}

function validateQuotas(rosterSize: number, quotas: number[]): number[] {
  if (!Array.isArray(quotas) || quotas.length !== 5) throw new RangeError('roundQuotas');
  const output = quotas.map((value, index) => integer(`roundQuotas[${index}]`, value, 1, rosterSize));
  if (output[0] >= rosterSize || output[4] !== 1) throw new RangeError('roundQuotas');
  for (let index = 1; index < output.length; index++) {
    if (output[index] > output[index - 1]) throw new RangeError('roundQuotas');
  }
  if (rosterSize === 32 && output.some((value, index) => value !== DEFAULTS.roundQuotas[index])) {
    throw new RangeError('roundQuotas');
  }
  return output;
}

export function parseMarbleConfig(input: Partial<MarbleConfig> = {}): MarbleConfig {
  const rosterSize = integer('rosterSize', input.rosterSize ?? DEFAULTS.rosterSize, 2, 64);
  const quotas = validateQuotas(rosterSize, input.roundQuotas ?? (rosterSize === 32 ? [...DEFAULTS.roundQuotas] : derivedQuotas(rosterSize)));
  const profile = input.profile ?? DEFAULTS.profile;
  if (!['standard', 'safe', 'chaos'].includes(profile)) throw new RangeError('profile');
  const config: MarbleConfig = {
    rosterSize,
    tickRate: integer('tickRate', input.tickRate ?? DEFAULTS.tickRate, 20, 120),
    roundQuotas: quotas,
    roundIntroTicks: integer('roundIntroTicks', input.roundIntroTicks ?? DEFAULTS.roundIntroTicks, 0, 1_200),
    roundTimeoutTicks: integer('roundTimeoutTicks', input.roundTimeoutTicks ?? DEFAULTS.roundTimeoutTicks, 60, 100_000),
    intermissionTicks: integer('intermissionTicks', input.intermissionTicks ?? DEFAULTS.intermissionTicks, 1, 10_000),
    worldWidth: integer('worldWidth', input.worldWidth ?? DEFAULTS.worldWidth, 8_000, 100_000),
    worldHeight: integer('worldHeight', input.worldHeight ?? DEFAULTS.worldHeight, 8_000, 100_000),
    marbleRadius: integer('marbleRadius', input.marbleRadius ?? DEFAULTS.marbleRadius, 80, 1_200),
    maxSpeed: integer('maxSpeed', input.maxSpeed ?? DEFAULTS.maxSpeed, 80, 2_000),
    baseAcceleration: integer('baseAcceleration', input.baseAcceleration ?? DEFAULTS.baseAcceleration, 1, 200),
    frictionPermille: integer('frictionPermille', input.frictionPermille ?? DEFAULTS.frictionPermille, 850, 1_000),
    worldRestitutionPermille: integer('worldRestitutionPermille', input.worldRestitutionPermille ?? DEFAULTS.worldRestitutionPermille, 0, 1_200),
    marbleRestitutionPermille: integer('marbleRestitutionPermille', input.marbleRestitutionPermille ?? DEFAULTS.marbleRestitutionPermille, 0, 1_200),
    penetrationTolerance: integer('penetrationTolerance', input.penetrationTolerance ?? DEFAULTS.penetrationTolerance, 0, 32),
    maxSubsteps: integer('maxSubsteps', input.maxSubsteps ?? DEFAULTS.maxSubsteps, 1, 8),
    collisionIterations: integer('collisionIterations', input.collisionIterations ?? DEFAULTS.collisionIterations, 1, 6),
    maxContactsPerTick: integer('maxContactsPerTick', input.maxContactsPerTick ?? DEFAULTS.maxContactsPerTick, 32, 4_096),
    maxColliders: integer('maxColliders', input.maxColliders ?? DEFAULTS.maxColliders, 8, 512),
    maxEventHistory: integer('maxEventHistory', input.maxEventHistory ?? DEFAULTS.maxEventHistory, 64, 16_384),
    noProgressTicks: integer('noProgressTicks', input.noProgressTicks ?? DEFAULTS.noProgressTicks, 60, 100_000),
    decisionInterval: integer('decisionInterval', input.decisionInterval ?? DEFAULTS.decisionInterval, 1, 30),
    profile
  };
  const minimumWidth = (config.marbleRadius * 2 + 60) * Math.min(config.rosterSize, 32);
  if (config.worldWidth < minimumWidth) throw new RangeError('worldWidth');
  if (config.marbleRadius * 8 >= config.worldHeight) throw new RangeError('marbleRadius');
  return Object.freeze({ ...config, roundQuotas: Object.freeze([...config.roundQuotas]) as unknown as number[] });
}

export const MARBLE_DEFAULT_CONFIG = DEFAULTS;
