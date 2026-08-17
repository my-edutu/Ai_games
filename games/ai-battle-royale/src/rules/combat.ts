import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { BattleAction, BattleCombatant, BattleState, BattleWeapon } from '../state/types';
import { appendBattleEvent } from './events';
import { cellX, cellY, manhattanDistance } from './geometry';

export interface WeaponSpec {
  damage: number;
  range: number;
  accuracyPermille: number;
  cooldownTicks: number;
}

export const WEAPON_SPECS: Readonly<Record<BattleWeapon, WeaponSpec>> = Object.freeze({
  sidearm: Object.freeze({ damage: 18, range: 5, accuracyPermille: 780, cooldownTicks: 2 }),
  scattergun: Object.freeze({ damage: 34, range: 3, accuracyPermille: 880, cooldownTicks: 3 }),
  carbine: Object.freeze({ damage: 22, range: 6, accuracyPermille: 790, cooldownTicks: 2 }),
  marksman: Object.freeze({ damage: 34, range: 9, accuracyPermille: 720, cooldownTicks: 4 }),
});

export function hasBattleLineOfSight(state: Pick<BattleState, 'arena'>, from: number, to: number): boolean {
  const width = state.arena.width;
  let x0 = cellX(from, width);
  let y0 = cellY(from, width);
  const x1 = cellX(to, width);
  const y1 = cellY(to, width);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  const blocked = new Set(state.arena.obstacles);
  while (!(x0 === x1 && y0 === y1)) {
    const doubled = 2 * error;
    if (doubled >= dy) { error += dy; x0 += sx; }
    if (doubled <= dx) { error += dx; y0 += sy; }
    if (x0 === x1 && y0 === y1) return true;
    if (blocked.has(y0 * width + x0)) return false;
  }
  return true;
}

function accuracyFor(attacker: BattleCombatant, target: BattleCombatant, state: BattleState): number {
  const spec = WEAPON_SPECS[attacker.weapon];
  const distance = manhattanDistance(attacker.cell, target.cell, state.arena.width);
  let accuracy = spec.accuracyPermille - Math.max(0, distance - 1) * 14;
  if (attacker.archetype === 'ranger') accuracy += 125;
  if (attacker.archetype === 'vanguard') accuracy += 100;
  if (attacker.archetype === 'scavenger') accuracy += 20;
  if (attacker.archetype === 'tactician') accuracy += 25;
  if (state.arena.cover.includes(target.cell)) accuracy -= 180;
  return Math.max(120, Math.min(950, accuracy));
}

function damageFor(attacker: BattleCombatant, target: BattleCombatant, state: BattleState): number {
  let damage = WEAPON_SPECS[attacker.weapon].damage;
  const distance = manhattanDistance(attacker.cell, target.cell, state.arena.width);
  if (attacker.archetype === 'vanguard' && distance <= 2) damage += 4;
  if (attacker.archetype === 'ranger' && distance >= 6) damage += 3;
  if (state.arena.cover.includes(target.cell)) damage = Math.max(1, Math.floor(damage * 3 / 4));
  return damage;
}

interface PendingHit { attacker: BattleCombatant; target: BattleCombatant; damage: number; }

export function resolveCombatBatch(state: BattleState, actions: readonly BattleAction[], rng: NamedRng): string[] {
  const pending = new Map<string, PendingHit[]>();
  const acceptedActors: string[] = [];
  const attacks = actions.filter((action): action is Extract<BattleAction, { kind: 'attack' }> => action.kind === 'attack')
    .sort((first, second) => first.actorId.localeCompare(second.actorId));
  for (const action of attacks) {
    const attacker = state.combatants.find((candidate) => candidate.id === action.actorId);
    const target = state.combatants.find((candidate) => candidate.id === action.targetId);
    if (!attacker?.alive || !target?.alive || attacker.id === target.id) continue;
    const spec = WEAPON_SPECS[attacker.weapon];
    const distance = manhattanDistance(attacker.cell, target.cell, state.arena.width);
    if (attacker.cooldown > 0 || attacker.ammo <= 0 || distance > spec.range || !hasBattleLineOfSight(state, attacker.cell, target.cell)) {
      appendBattleEvent(state, { type: 'action-rejected', actorId: attacker.id, targetId: target.id, detail: 'attack-not-legal', importance: 1 });
      continue;
    }
    attacker.ammo -= 1;
    attacker.cooldown = spec.cooldownTicks;
    acceptedActors.push(attacker.id);
    const roll = rng.nextInt(`combat:${attacker.id}`, 1_000);
    const accuracy = accuracyFor(attacker, target, state);
    if (roll >= accuracy) {
      appendBattleEvent(state, { type: 'miss', actorId: attacker.id, targetId: target.id, detail: attacker.weapon, importance: 1 });
      continue;
    }
    const hit: PendingHit = { attacker, target, damage: damageFor(attacker, target, state) };
    const hits = pending.get(target.id) ?? [];
    hits.push(hit);
    pending.set(target.id, hits);
  }

  for (const targetId of [...pending.keys()].sort()) {
    const target = state.combatants.find((candidate) => candidate.id === targetId);
    if (!target) continue;
    const hits = (pending.get(targetId) ?? []).sort((first, second) => first.attacker.id.localeCompare(second.attacker.id));
    const totalDeclaredDamage = hits.reduce((sum, hit) => sum + hit.damage, 0);
    const availableDurability = target.shield + target.health;
    const actualTotalDamage = Math.min(availableDurability, totalDeclaredDamage);
    const credits = hits.map((hit) => {
      const numerator = actualTotalDamage * hit.damage;
      return { hit, actual: Math.floor(numerator / totalDeclaredDamage), remainder: numerator % totalDeclaredDamage };
    });
    let unallocated = actualTotalDamage - credits.reduce((sum, credit) => sum + credit.actual, 0);
    for (const credit of [...credits].sort((first, second) => second.remainder - first.remainder || second.hit.damage - first.hit.damage || first.hit.attacker.id.localeCompare(second.hit.attacker.id))) {
      if (unallocated <= 0) break;
      credit.actual += 1;
      unallocated -= 1;
    }
    const shieldBefore = target.shield;
    const shieldDamage = Math.min(target.shield, actualTotalDamage);
    target.shield -= shieldDamage;
    const healthDamage = Math.min(target.health, actualTotalDamage - shieldDamage);
    target.health -= healthDamage;
    for (const credit of credits) {
      credit.hit.attacker.damageDealt += credit.actual;
      appendBattleEvent(state, { type: 'hit', actorId: credit.hit.attacker.id, targetId: target.id, amount: credit.actual, detail: credit.hit.attacker.weapon, importance: target.health === 0 ? 4 : 2 });
    }
    const leadingAttacker = [...hits].sort((first, second) => second.damage - first.damage || first.attacker.id.localeCompare(second.attacker.id))[0]?.attacker ?? null;
    if (shieldBefore > 0 && target.shield === 0) appendBattleEvent(state, { type: 'shield-broken', actorId: leadingAttacker?.id, targetId: target.id, importance: 3 });
    if (target.health <= 0 && target.alive) {
      target.health = 0;
      target.alive = false;
      target.deathTick = state.tick;
      target.intent = 'eliminated';
      target.eliminatedBy = leadingAttacker?.id ?? null;
      if (leadingAttacker) leadingAttacker.eliminations += 1;
      state.lastEliminationTick = state.tick;
      appendBattleEvent(state, { type: 'elimination', actorId: leadingAttacker?.id, targetId: target.id, cell: target.cell, detail: 'combat', importance: 5 });
    }
  }
  return acceptedActors;
}
