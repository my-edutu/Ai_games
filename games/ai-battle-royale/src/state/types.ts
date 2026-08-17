import type { RngSnapshot } from '../../../../packages/seeded-rng/src/index';

export type BattleLifecycle = 'running' | 'result' | 'intermission' | 'quarantined';
export type BattleArchetype = 'vanguard' | 'ranger' | 'scavenger' | 'tactician';
export type BattleWeapon = 'sidearm' | 'scattergun' | 'carbine' | 'marksman';
export type BattleLootKind = 'ammo' | 'medkit' | 'shield' | 'weapon';
export type BattleTheme = 'ember' | 'neon' | 'arctic';
export type BattleIntent =
  | 'initializing'
  | 'holding'
  | 'seeking-zone'
  | 'seeking-cover'
  | 'seeking-loot'
  | 'pursuing'
  | 'attacking'
  | 'healing'
  | 'fallback'
  | 'eliminated'
  | 'champion';

export interface BattleConfig {
  schemaVersion: 1;
  width: number;
  height: number;
  combatantCount: number;
  maxTicks: number;
  intermissionTicks: number;
  startingHealth: number;
  startingShield: number;
  obstaclePermille: number;
  coverPermille: number;
  lootCount: number;
  zoneFirstShrinkTick: number;
  zoneShrinkInterval: number;
  zoneShrinkAmount: number;
  zoneDamage: number;
  supplyDropEvery: number;
  noProgressTicks: number;
  maxRecentEvents: number;
  maxAuditEntries: number;
  maxProcessedInfluence: number;
  maxScheduledEffects: number;
  maxPathExpansions: number;
  voteWindowEvery: number;
  voteWindowTicks: number;
}

export interface BattleLoot {
  id: string;
  kind: BattleLootKind;
  cell: number;
  weapon?: BattleWeapon;
  amount: number;
  spawnedAtTick: number;
}

export interface ArenaGenerationReport {
  obstacleTarget: number;
  obstacleCount: number;
  obstacleAttempts: number;
  coverTarget: number;
  coverCount: number;
  fallbackUsed: boolean;
  featureHash: string;
}

export interface BattleArena {
  width: number;
  height: number;
  obstacles: number[];
  cover: number[];
  spawnCells: number[];
  loot: BattleLoot[];
  supplyAnchors: number[];
  generation: ArenaGenerationReport;
}

export interface BattleCombatant {
  id: string;
  index: number;
  name: string;
  archetype: BattleArchetype;
  cell: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  alive: boolean;
  weapon: BattleWeapon;
  ammo: number;
  medkits: number;
  cooldown: number;
  eliminations: number;
  damageDealt: number;
  intent: BattleIntent;
  goal: string;
  confidencePermille: number;
  fallbackCount: number;
  pathExpansions: number;
  recentCells: number[];
  deathTick: number | null;
  eliminatedBy: string | null;
}

export interface BattleZone {
  centerCell: number;
  radius: number;
  phase: number;
  nextShrinkTick: number;
  damage: number;
  holdsApplied: number;
}

export type InfluenceEffectId =
  | 'supply-rain'
  | 'zone-hold'
  | 'medic-mist'
  | 'radar-pulse'
  | 'theme-shift';

export interface BattleVoteWindow {
  id: string;
  startTick: number;
  endTick: number;
  options: InfluenceEffectId[];
  ballots: Record<string, { effectId: InfluenceEffectId; weight: 1 | 2; inputId: string }>;
  status: 'open' | 'closed' | 'applied' | 'expired';
  winner: InfluenceEffectId | null;
}

export interface ScheduledInfluenceEffect {
  id: string;
  effectId: InfluenceEffectId;
  applyAtTick: number;
  sourceWindowId: string;
  applied: boolean;
}

export interface InfluenceAuditEntry {
  inputId: string;
  actorHash: string;
  tick: number;
  status: 'accepted' | 'rejected' | 'queued' | 'applied' | 'expired';
  reason: string;
  effectId?: InfluenceEffectId;
}

export interface BattleInfluenceState {
  enabled: boolean;
  providerStatus: 'online' | 'degraded' | 'disabled';
  processedInputIds: string[];
  currentWindow: BattleVoteWindow | null;
  scheduled: ScheduledInfluenceEffect[];
  audit: InfluenceAuditEntry[];
  radarUntilTick: number;
  theme: BattleTheme;
  windowSequence: number;
}

export type BattleSemanticEventType =
  | 'match-created'
  | 'foundation-tick'
  | 'action-rejected'
  | 'move'
  | 'hit'
  | 'miss'
  | 'shield-broken'
  | 'heal'
  | 'pickup'
  | 'supply-drop'
  | 'zone-warning'
  | 'zone-shrink'
  | 'zone-damage'
  | 'stagnation-escalation'
  | 'elimination'
  | 'match-result'
  | 'vote-opened'
  | 'vote-accepted'
  | 'vote-rejected'
  | 'vote-closed'
  | 'influence-applied'
  | 'system-status';

export interface BattleSemanticEvent {
  sequence: number;
  tick: number;
  type: BattleSemanticEventType;
  actorId?: string;
  targetId?: string;
  cell?: number;
  amount?: number;
  detail?: string;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface BattleResult {
  kind: 'game' | 'technical';
  reason: 'last-standing' | 'time-limit' | 'draw' | 'integrity-quarantine';
  tick: number;
  winnerId: string | null;
  survivorIds: string[];
  finalChecksum?: string;
}

export interface BattleState {
  schemaVersion: 1;
  gameVersion: string;
  deterministicVersion: string;
  runId: string;
  seed: string;
  tick: number;
  lifecycle: BattleLifecycle;
  config: BattleConfig;
  arena: BattleArena;
  combatants: BattleCombatant[];
  zone: BattleZone;
  events: BattleSemanticEvent[];
  eventSequence: number;
  rng: RngSnapshot;
  lastEliminationTick: number;
  lastMeaningfulTick: number;
  result: BattleResult | null;
  intermissionRemaining: number;
  influence: BattleInfluenceState;
  checksum: string;
}

export type BattleAction =
  | { kind: 'move'; actorId: string; targetCell: number; reason: string }
  | { kind: 'attack'; actorId: string; targetId: string; reason: string }
  | { kind: 'heal'; actorId: string; reason: string }
  | { kind: 'wait'; actorId: string; reason: string };

export interface BattleRuntimeSnapshot {
  gameId: 'ai-battle-royale';
  stateSchemaVersion: 1;
  deterministicVersion: string;
  stateChecksum: string;
  state: BattleState;
}
