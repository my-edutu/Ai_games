import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { validateBattleConfig } from '../config/index';
import { generateArena } from '../generation/arena';
import { battleChecksum } from '../rules/checksum';
import type { BattleArchetype, BattleCombatant, BattleConfig, BattleState, BattleWeapon } from './types';

const CALLSIGNS = [
  'Aegis', 'Blaze', 'Cipher', 'Drift', 'Echo', 'Fable', 'Glint', 'Havoc',
  'Ion', 'Jinx', 'Kestrel', 'Lumen', 'Mako', 'Nova', 'Onyx', 'Pulse',
  'Quill', 'Rift', 'Sable', 'Talon', 'Umbra', 'Vex', 'Warden', 'Zephyr',
  'Atlas', 'Bishop', 'Comet', 'Dagger', 'Ember', 'Frost', 'Glyph', 'Halo',
  'Iris', 'Javelin', 'Knight', 'Lyric', 'Mirage', 'Nexus', 'Oracle', 'Pyre',
  'Rook', 'Shard', 'Tempest', 'Unit', 'Valor', 'Wisp', 'Xeno', 'Yarrow',
];
const ARCHETYPES: BattleArchetype[] = ['vanguard', 'ranger', 'scavenger', 'tactician'];

function archetypeStats(archetype: BattleArchetype, config: BattleConfig): { health: number; shield: number; weapon: BattleWeapon; ammo: number; medkits: number } {
  switch (archetype) {
    case 'vanguard': return { health: config.startingHealth + 40, shield: config.startingShield + 20, weapon: 'scattergun', ammo: 22, medkits: 1 };
    case 'ranger': return { health: config.startingHealth - 5, shield: config.startingShield + 5, weapon: 'marksman', ammo: 18, medkits: 1 };
    case 'scavenger': return { health: config.startingHealth, shield: config.startingShield, weapon: 'sidearm', ammo: 28, medkits: 2 };
    case 'tactician': return { health: config.startingHealth + 5, shield: config.startingShield + 10, weapon: 'carbine', ammo: 20, medkits: 1 };
  }
}

function createCombatant(index: number, cell: number, config: BattleConfig): BattleCombatant {
  const archetype = ARCHETYPES[index % ARCHETYPES.length];
  const stats = archetypeStats(archetype, config);
  return {
    id: `agent-${(index + 1).toString().padStart(2, '0')}`,
    index,
    name: CALLSIGNS[index],
    archetype,
    cell,
    health: stats.health,
    maxHealth: stats.health,
    shield: stats.shield,
    maxShield: stats.shield,
    alive: true,
    weapon: stats.weapon,
    ammo: stats.ammo,
    medkits: stats.medkits,
    cooldown: 0,
    eliminations: 0,
    damageDealt: 0,
    intent: 'initializing',
    goal: 'Establish a safe opening position.',
    confidencePermille: 500,
    fallbackCount: 0,
    pathExpansions: 0,
    recentCells: [cell],
    deathTick: null,
    eliminatedBy: null,
  };
}

export function createInitialBattleState(config: BattleConfig, seed: string, runId: string, rng: NamedRng = NamedRng.fromSeed(seed)): BattleState {
  if (!seed.trim()) throw new Error('seed must not be empty');
  if (!runId.trim()) throw new Error('runId must not be empty');
  validateBattleConfig(config);
  const ownedConfig = { ...config };
  const arena = generateArena(ownedConfig, rng);
  const combatants = arena.spawnCells.map((cell, index) => createCombatant(index, cell, ownedConfig));
  const centerCell = Math.floor(ownedConfig.height / 2) * ownedConfig.width + Math.floor(ownedConfig.width / 2);
  const state: BattleState = {
    schemaVersion: 1,
    gameVersion: '0.2.0-r2-gameplay',
    deterministicVersion: 'battle-r2-v1',
    runId,
    seed,
    tick: 0,
    lifecycle: 'running',
    config: ownedConfig,
    arena,
    combatants,
    zone: { centerCell, radius: Math.max(4, Math.floor(Math.min(ownedConfig.width, ownedConfig.height) / 2) - 2), phase: 0, nextShrinkTick: ownedConfig.zoneFirstShrinkTick, damage: ownedConfig.zoneDamage, holdsApplied: 0 },
    events: [{ sequence: 1, tick: 0, type: 'match-created', detail: `${ownedConfig.combatantCount} contenders deployed`, importance: 3 }],
    eventSequence: 1,
    rng: rng.snapshot(),
    lastEliminationTick: 0,
    lastMeaningfulTick: 0,
    result: null,
    intermissionRemaining: 0,
    influence: { enabled: true, providerStatus: 'online', processedInputIds: [], currentWindow: null, scheduled: [], audit: [], radarUntilTick: 0, theme: 'ember', windowSequence: 0 },
    checksum: '',
  };
  state.checksum = battleChecksum(state);
  return state;
}
