import type { BattleConfig } from '../state/types';

export const DEFAULT_BATTLE_CONFIG: BattleConfig = Object.freeze({
  schemaVersion: 1,
  width: 36,
  height: 24,
  combatantCount: 24,
  maxTicks: 2_400,
  intermissionTicks: 24,
  startingHealth: 100,
  startingShield: 25,
  obstaclePermille: 105,
  coverPermille: 85,
  lootCount: 48,
  zoneFirstShrinkTick: 180,
  zoneShrinkInterval: 180,
  zoneShrinkAmount: 2,
  zoneDamage: 8,
  supplyDropEvery: 140,
  noProgressTicks: 320,
  maxRecentEvents: 96,
  maxAuditEntries: 128,
  maxProcessedInfluence: 256,
  maxScheduledEffects: 16,
  maxPathExpansions: 144,
  voteWindowEvery: 240,
  voteWindowTicks: 48,
});

function integerInRange(value: number, minimum: number, maximum: number, label: string): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
  }
}

export function validateBattleConfig(config: BattleConfig): BattleConfig {
  if (config.schemaVersion !== 1) throw new RangeError('schemaVersion must be 1');
  integerInRange(config.width, 24, 80, 'width');
  integerInRange(config.height, 18, 60, 'height');
  if (!Number.isInteger(config.combatantCount) || config.combatantCount < 4) {
    throw new RangeError('combatantCount must be between 4 and 48');
  }
  const reservedCapacity = Math.min(48, Math.floor(config.width * config.height * 0.055));
  if (config.combatantCount > reservedCapacity) {
    throw new RangeError('combatantCount must not exceed walkable spawn capacity');
  }
  integerInRange(config.maxTicks, 60, 50_000, 'maxTicks');
  integerInRange(config.intermissionTicks, 1, 600, 'intermissionTicks');
  integerInRange(config.startingHealth, 25, 500, 'startingHealth');
  integerInRange(config.startingShield, 0, 250, 'startingShield');
  integerInRange(config.obstaclePermille, 0, 280, 'obstaclePermille');
  integerInRange(config.coverPermille, 0, 300, 'coverPermille');
  integerInRange(config.lootCount, config.combatantCount, Math.floor(config.width * config.height / 3), 'lootCount');
  integerInRange(config.zoneFirstShrinkTick, 10, config.maxTicks, 'zoneFirstShrinkTick');
  integerInRange(config.zoneShrinkInterval, 10, config.maxTicks, 'zoneShrinkInterval');
  integerInRange(config.zoneShrinkAmount, 1, 8, 'zoneShrinkAmount');
  integerInRange(config.zoneDamage, 1, 100, 'zoneDamage');
  integerInRange(config.supplyDropEvery, 10, config.maxTicks, 'supplyDropEvery');
  integerInRange(config.noProgressTicks, 20, config.maxTicks, 'noProgressTicks');
  integerInRange(config.maxRecentEvents, 16, 512, 'maxRecentEvents');
  integerInRange(config.maxAuditEntries, 16, 1_024, 'maxAuditEntries');
  integerInRange(config.maxProcessedInfluence, 32, 2_048, 'maxProcessedInfluence');
  integerInRange(config.maxScheduledEffects, 1, 64, 'maxScheduledEffects');
  integerInRange(config.maxPathExpansions, 16, 1_024, 'maxPathExpansions');
  integerInRange(config.voteWindowEvery, 40, config.maxTicks, 'voteWindowEvery');
  integerInRange(config.voteWindowTicks, 10, config.voteWindowEvery - 1, 'voteWindowTicks');
  return config;
}

export function createBattleConfig(overrides: Partial<BattleConfig> = {}): BattleConfig {
  const config = { ...DEFAULT_BATTLE_CONFIG, ...overrides } as BattleConfig;
  return validateBattleConfig(config);
}
