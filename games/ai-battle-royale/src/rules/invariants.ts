import { validateBattleConfig } from '../config/index';
import type { BattleState } from '../state/types';
import { isCellInBounds, reachableWalkableCells } from './geometry';

function duplicates(values: readonly (string | number)[]): boolean {
  return new Set(values).size !== values.length;
}

export function assertBattleInvariants(state: BattleState): string[] {
  const issues: string[] = [];
  try {
    validateBattleConfig(state.config);
  } catch (error) {
    issues.push(`config:${error instanceof Error ? error.message : String(error)}`);
  }
  const { arena, config } = state;
  if (arena.width !== config.width || arena.height !== config.height) issues.push('arena dimensions must match config');
  if (arena.spawnCells.length !== config.combatantCount) issues.push('spawn count must match combatant count');
  if (state.combatants.length !== config.combatantCount) issues.push('combatant count must match config');
  if (duplicates(arena.obstacles)) issues.push('obstacles must be unique');
  if (duplicates(arena.cover)) issues.push('cover cells must be unique');
  if (duplicates(arena.spawnCells)) issues.push('spawn cells must be unique');
  if (duplicates(state.combatants.map((combatant) => combatant.id))) issues.push('combatant ids must be unique');

  const blocked = new Set(arena.obstacles);
  for (const obstacle of arena.obstacles) {
    if (!isCellInBounds(obstacle, arena.width, arena.height)) issues.push(`obstacle out of bounds:${obstacle}`);
  }
  for (const cover of arena.cover) {
    if (!isCellInBounds(cover, arena.width, arena.height) || blocked.has(cover)) issues.push(`invalid cover:${cover}`);
  }
  for (const spawn of arena.spawnCells) {
    if (!isCellInBounds(spawn, arena.width, arena.height) || blocked.has(spawn)) issues.push(`invalid spawn:${spawn}`);
  }
  if (arena.spawnCells.length > 0) {
    const reachable = reachableWalkableCells(arena, arena.spawnCells[0]);
    for (const spawn of arena.spawnCells) if (!reachable.has(spawn)) issues.push(`disconnected spawn:${spawn}`);
    for (const loot of arena.loot) if (!reachable.has(loot.cell)) issues.push(`unreachable loot:${loot.id}`);
  }
  const occupied = state.combatants.filter((combatant) => combatant.alive).map((combatant) => combatant.cell);
  if (duplicates(occupied)) issues.push('living combatants must not occupy the same cell');
  for (const combatant of state.combatants) {
    if (!isCellInBounds(combatant.cell, arena.width, arena.height) || blocked.has(combatant.cell)) issues.push(`invalid combatant cell:${combatant.id}`);
    if (combatant.health < 0 || combatant.health > combatant.maxHealth) issues.push(`invalid health:${combatant.id}`);
    if (combatant.shield < 0 || combatant.shield > combatant.maxShield) issues.push(`invalid shield:${combatant.id}`);
    if (combatant.ammo < 0 || combatant.medkits < 0 || combatant.cooldown < 0) issues.push(`negative resource:${combatant.id}`);
    if (combatant.recentCells.length > 12) issues.push(`recent cell history overflow:${combatant.id}`);
    if (!combatant.alive && combatant.health !== 0) issues.push(`eliminated combatant must have zero health:${combatant.id}`);
  }
  if (!isCellInBounds(state.zone.centerCell, arena.width, arena.height)) issues.push('zone center out of bounds');
  if (!Number.isInteger(state.zone.radius) || state.zone.radius < 1) issues.push('zone radius must be a positive integer');
  if (state.events.length > config.maxRecentEvents) issues.push('recent event history overflow');
  if (state.influence.audit.length > config.maxAuditEntries) issues.push('influence audit overflow');
  if (state.influence.processedInputIds.length > config.maxProcessedInfluence) issues.push('processed influence history overflow');
  if (state.influence.scheduled.length > config.maxScheduledEffects) issues.push('scheduled influence overflow');
  for (let index = 1; index < state.events.length; index += 1) {
    if (state.events[index].sequence <= state.events[index - 1].sequence) issues.push('event sequences must be strictly increasing');
  }
  if (state.lifecycle === 'running' && state.result) issues.push('running state cannot contain a result');
  if ((state.lifecycle === 'result' || state.lifecycle === 'intermission') && !state.result) issues.push('result lifecycle requires a result');
  return issues;
}
