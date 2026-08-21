import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { chooseBattleDecision } from '../ai/policy';
import { advanceBattleInfluence } from '../influence/reducer';
import type { BattleAction, BattleCombatant, BattleLoot, BattleLootKind, BattleResult, BattleState, BattleWeapon } from '../state/types';
import { battleChecksum } from './checksum';
import { resolveCombatBatch } from './combat';
import { appendBattleEvent } from './events';
import { isInsideZone } from './geometry';
import { assertBattleInvariants } from './invariants';
import { resolveMovementBatch } from './movement';

const WEAPON_RANK: Readonly<Record<BattleWeapon, number>> = Object.freeze({ sidearm: 0, scattergun: 1, carbine: 2, marksman: 3 });
const SUPPLY_KINDS: readonly BattleLootKind[] = ['ammo', 'shield', 'medkit', 'weapon'];
const SUPPLY_WEAPONS: readonly BattleWeapon[] = ['scattergun', 'carbine', 'marksman'];

function advanceFinishedLifecycle(state: BattleState): BattleState {
  if (state.lifecycle === 'result') {
    state.tick += 1;
    state.lifecycle = 'intermission';
    state.intermissionRemaining = state.config.intermissionTicks;
  } else if (state.lifecycle === 'intermission') {
    state.tick += 1;
    state.intermissionRemaining = Math.max(0, state.intermissionRemaining - 1);
  }
  state.checksum = battleChecksum(state);
  return state;
}

function updateZoneSchedule(state: BattleState): void {
  const warningTick = state.zone.nextShrinkTick - 12;
  if (state.tick === warningTick) appendBattleEvent(state, { type: 'zone-warning', detail: `Zone phase ${state.zone.phase + 1} closes in 12 ticks.`, importance: 3 });
  if (state.tick < state.zone.nextShrinkTick) return;
  state.zone.radius = Math.max(1, state.zone.radius - state.config.zoneShrinkAmount);
  state.zone.phase += 1;
  state.zone.damage = state.config.zoneDamage + state.zone.phase * 2;
  state.zone.nextShrinkTick += state.config.zoneShrinkInterval;
  appendBattleEvent(state, { type: 'zone-shrink', cell: state.zone.centerCell, amount: state.zone.radius, detail: `phase-${state.zone.phase}`, importance: 4 });
}

function resolveHealing(state: BattleState, actions: readonly BattleAction[]): void {
  const heals = actions.filter((action): action is Extract<BattleAction, { kind: 'heal' }> => action.kind === 'heal').sort((first, second) => first.actorId.localeCompare(second.actorId));
  for (const action of heals) {
    const actor = state.combatants.find((candidate) => candidate.id === action.actorId);
    if (!actor?.alive || actor.medkits <= 0 || actor.health >= actor.maxHealth) {
      if (actor?.alive) appendBattleEvent(state, { type: 'action-rejected', actorId: actor.id, detail: 'heal-not-legal', importance: 1 });
      continue;
    }
    const restored = Math.min(38, actor.maxHealth - actor.health);
    actor.medkits -= 1;
    actor.health += restored;
    appendBattleEvent(state, { type: 'heal', actorId: actor.id, amount: restored, importance: 3 });
  }
}

function collectLoot(state: BattleState): void {
  const livingByCell = new Map<number, BattleCombatant>();
  for (const combatant of state.combatants.filter((candidate) => candidate.alive).sort((first, second) => first.id.localeCompare(second.id))) {
    if (!livingByCell.has(combatant.cell)) livingByCell.set(combatant.cell, combatant);
  }
  const remaining: BattleLoot[] = [];
  for (const loot of state.arena.loot.sort((first, second) => first.id.localeCompare(second.id))) {
    const actor = livingByCell.get(loot.cell);
    if (!actor) { remaining.push(loot); continue; }
    if (loot.kind === 'ammo') actor.ammo = Math.min(60, actor.ammo + loot.amount);
    else if (loot.kind === 'medkit') actor.medkits = Math.min(3, actor.medkits + loot.amount);
    else if (loot.kind === 'shield') actor.shield = Math.min(actor.maxShield, actor.shield + loot.amount);
    else if (loot.kind === 'weapon' && loot.weapon && WEAPON_RANK[loot.weapon] > WEAPON_RANK[actor.weapon]) actor.weapon = loot.weapon;
    appendBattleEvent(state, { type: 'pickup', actorId: actor.id, cell: loot.cell, amount: loot.amount, detail: loot.kind === 'weapon' ? loot.weapon : loot.kind, importance: loot.kind === 'weapon' ? 3 : 2 });
  }
  state.arena.loot = remaining;
}

function spawnSupplyDrops(state: BattleState, rng: NamedRng): void {
  if (state.tick % state.config.supplyDropEvery !== 0) return;
  const blocked = new Set(state.arena.obstacles);
  const occupied = new Set(state.combatants.filter((candidate) => candidate.alive).map((candidate) => candidate.cell));
  const existing = new Set(state.arena.loot.map((loot) => loot.cell));
  const candidates = state.arena.supplyAnchors.filter((cell) => !blocked.has(cell) && !occupied.has(cell) && !existing.has(cell));
  for (let index = 0; index < 2 && candidates.length > 0; index += 1) {
    const candidateIndex = rng.nextInt('loot:supply-cell', candidates.length);
    const cell = candidates.splice(candidateIndex, 1)[0];
    const kind = SUPPLY_KINDS[rng.nextInt('loot:supply-kind', SUPPLY_KINDS.length)];
    const weapon = kind === 'weapon' ? SUPPLY_WEAPONS[rng.nextInt('loot:supply-weapon', SUPPLY_WEAPONS.length)] : undefined;
    const amount = kind === 'ammo' ? 14 : kind === 'shield' ? 20 : 1;
    state.arena.loot.push({ id: `supply-${state.tick}-${index}`, kind, cell, amount, weapon, spawnedAtTick: state.tick });
    appendBattleEvent(state, { type: 'supply-drop', cell, amount, detail: kind === 'weapon' ? weapon : kind, importance: 3 });
  }
  const maximumLoot = state.config.lootCount * 2;
  if (state.arena.loot.length > maximumLoot) {
    state.arena.loot.sort((first, second) => first.spawnedAtTick - second.spawnedAtTick || first.id.localeCompare(second.id));
    state.arena.loot.splice(0, state.arena.loot.length - maximumLoot);
  }
}

function applyDamage(state: BattleState, target: BattleCombatant, amount: number, detail: string): void {
  let remaining = amount;
  const shieldDamage = Math.min(target.shield, remaining);
  target.shield -= shieldDamage;
  remaining -= shieldDamage;
  const healthDamage = Math.min(target.health, remaining);
  target.health -= healthDamage;
  appendBattleEvent(state, { type: 'zone-damage', targetId: target.id, amount: shieldDamage + healthDamage, cell: target.cell, detail, importance: target.health === 0 ? 4 : 2 });
  if (target.health <= 0 && target.alive) {
    target.health = 0;
    target.alive = false;
    target.deathTick = state.tick;
    target.eliminatedBy = null;
    target.intent = 'eliminated';
    state.lastEliminationTick = state.tick;
    appendBattleEvent(state, { type: 'elimination', targetId: target.id, cell: target.cell, detail, importance: 5 });
  }
}

function resolveZoneDamage(state: BattleState): void {
  if (state.tick % 4 !== 0) return;
  for (const combatant of state.combatants.filter((candidate) => candidate.alive).sort((first, second) => first.id.localeCompare(second.id))) {
    if (!isInsideZone(combatant.cell, state.zone, state.arena.width)) applyDamage(state, combatant, state.zone.damage, `zone-phase-${state.zone.phase}`);
  }
}

function applyNoProgressEscalation(state: BattleState): void {
  if (state.tick - state.lastEliminationTick < state.config.noProgressTicks) return;
  state.zone.radius = Math.max(1, state.zone.radius - 1);
  state.zone.damage = Math.min(100, state.zone.damage + 3);
  state.lastEliminationTick = state.tick;
  appendBattleEvent(state, { type: 'stagnation-escalation', amount: state.zone.damage, detail: 'Future zone pressure increased after a no-elimination interval.', importance: 4 });
}

function battleScore(combatant: BattleCombatant): number {
  return combatant.eliminations * 10_000 + combatant.damageDealt * 20 + combatant.health * 5 + combatant.shield * 3 + combatant.ammo;
}

function determineTerminalResult(state: BattleState): BattleResult | null {
  const survivors = state.combatants.filter((candidate) => candidate.alive).sort((first, second) => first.id.localeCompare(second.id));
  if (survivors.length === 1) return { kind: 'game', reason: 'last-standing', tick: state.tick, winnerId: survivors[0].id, survivorIds: [survivors[0].id] };
  if (survivors.length === 0) return { kind: 'game', reason: 'draw', tick: state.tick, winnerId: null, survivorIds: [] };
  if (state.tick < state.config.maxTicks) return null;
  const ranked = [...survivors].sort((first, second) => battleScore(second) - battleScore(first) || first.id.localeCompare(second.id));
  const firstScore = battleScore(ranked[0]);
  const tied = ranked.filter((combatant) => battleScore(combatant) === firstScore);
  return { kind: 'game', reason: tied.length === 1 ? 'time-limit' : 'draw', tick: state.tick, winnerId: tied.length === 1 ? ranked[0].id : null, survivorIds: survivors.map((combatant) => combatant.id) };
}

function finishMatch(state: BattleState, result: BattleResult): void {
  state.result = result;
  state.lifecycle = 'result';
  if (result.winnerId) {
    const winner = state.combatants.find((candidate) => candidate.id === result.winnerId);
    if (winner) { winner.intent = 'champion'; winner.goal = 'Match complete.'; winner.confidencePermille = 1_000; }
  }
  appendBattleEvent(state, { type: 'match-result', actorId: result.winnerId ?? undefined, detail: result.reason, importance: 5 });
  state.checksum = battleChecksum(state);
  result.finalChecksum = state.checksum;
}

export function stepBattleState(state: BattleState, rng: NamedRng): BattleState {
  if (state.lifecycle === 'quarantined') return state;
  if (state.lifecycle !== 'running') return advanceFinishedLifecycle(state);
  state.tick += 1;
  advanceBattleInfluence(state, rng);
  for (const combatant of state.combatants) if (combatant.cooldown > 0) combatant.cooldown -= 1;
  updateZoneSchedule(state);
  const decisions = state.combatants.filter((combatant) => combatant.alive).sort((first, second) => first.id.localeCompare(second.id)).map((combatant) => {
    const decision = chooseBattleDecision(state, combatant, rng);
    combatant.intent = decision.intent;
    combatant.goal = decision.goal;
    combatant.confidencePermille = decision.confidencePermille;
    combatant.pathExpansions = decision.expansions;
    if (decision.fallback) combatant.fallbackCount += 1;
    return decision.action;
  });
  resolveHealing(state, decisions);
  resolveCombatBatch(state, decisions, rng);
  resolveMovementBatch(state, decisions.filter((action) => state.combatants.find((candidate) => candidate.id === action.actorId)?.alive));
  collectLoot(state);
  spawnSupplyDrops(state, rng);
  resolveZoneDamage(state);
  applyNoProgressEscalation(state);
  const result = determineTerminalResult(state);
  if (result) finishMatch(state, result);
  state.rng = rng.snapshot();
  const issues = assertBattleInvariants(state);
  if (issues.length > 0) throw new Error(`battle invariant failure:${issues.join('|')}`);
  state.checksum = battleChecksum(state);
  if (state.result) state.result.finalChecksum = state.checksum;
  return state;
}
