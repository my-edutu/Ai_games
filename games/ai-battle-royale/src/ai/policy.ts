import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { BattleAction, BattleCombatant, BattleIntent, BattleLoot, BattleState } from '../state/types';
import { WEAPON_SPECS, hasBattleLineOfSight } from '../rules/combat';
import { isInsideZone, manhattanDistance, orderedNeighbours } from '../rules/geometry';
import { findBattlePath } from './pathfinding';

export interface BattleDecision {
  action: BattleAction;
  intent: BattleIntent;
  goal: string;
  confidencePermille: number;
  expansions: number;
  fallback: boolean;
}

function waitDecision(actor: BattleCombatant, intent: BattleIntent, goal: string, confidencePermille: number, fallback = false): BattleDecision {
  return { action: { kind: 'wait', actorId: actor.id, reason: goal }, intent, goal, confidencePermille, expansions: 0, fallback };
}

function moveDecision(actor: BattleCombatant, targetCell: number, intent: BattleIntent, goal: string, confidencePermille: number, expansions: number, fallback = false): BattleDecision {
  return { action: { kind: 'move', actorId: actor.id, targetCell, reason: goal }, intent, goal, confidencePermille, expansions, fallback };
}

function attackScore(state: BattleState, actor: BattleCombatant, target: BattleCombatant): number {
  const distance = manhattanDistance(actor.cell, target.cell, state.arena.width);
  const lethalBonus = target.health + target.shield <= WEAPON_SPECS[actor.weapon].damage ? 500 : 0;
  const exposurePenalty = state.arena.cover.includes(target.cell) ? 120 : 0;
  return lethalBonus + (target.maxHealth - target.health) * 3 + target.eliminations * 35 - distance * 18 - exposurePenalty;
}

function attackableTargets(state: BattleState, actor: BattleCombatant): BattleCombatant[] {
  const spec = WEAPON_SPECS[actor.weapon];
  if (actor.cooldown > 0 || actor.ammo <= 0) return [];
  return state.combatants
    .filter((candidate) => candidate.alive && candidate.id !== actor.id)
    .filter((candidate) => manhattanDistance(actor.cell, candidate.cell, state.arena.width) <= spec.range)
    .filter((candidate) => hasBattleLineOfSight(state, actor.cell, candidate.cell))
    .sort((first, second) => attackScore(state, actor, second) - attackScore(state, actor, first) || first.id.localeCompare(second.id));
}

function unoccupiedGoals(state: BattleState, cells: readonly number[], actorId: string): Set<number> {
  const occupied = new Set(state.combatants.filter((candidate) => candidate.alive && candidate.id !== actorId).map((candidate) => candidate.cell));
  return new Set(cells.filter((cell) => !occupied.has(cell)));
}

function pathDecision(state: BattleState, actor: BattleCombatant, goals: ReadonlySet<number>, intent: BattleIntent, goal: string, confidencePermille: number): BattleDecision | null {
  if (goals.size === 0) return null;
  const search = findBattlePath(state, actor.cell, goals, actor.id, state.config.maxPathExpansions);
  if (search.path.length < 2) return null;
  return moveDecision(actor, search.path[1], intent, goal, confidencePermille, search.expansions);
}

function relevantLoot(state: BattleState, actor: BattleCombatant): BattleLoot[] {
  const needed = state.arena.loot.filter((loot) => {
    if (loot.kind === 'ammo') return actor.ammo < 18;
    if (loot.kind === 'medkit') return actor.medkits < 2 && actor.health < actor.maxHealth;
    if (loot.kind === 'shield') return actor.shield < actor.maxShield;
    if (loot.kind === 'weapon') return actor.weapon === 'sidearm' || actor.archetype === 'scavenger';
    return false;
  });
  const pool = needed.length > 0 ? needed : actor.archetype === 'scavenger' ? state.arena.loot : [];
  return [...pool]
    .sort((first, second) => manhattanDistance(actor.cell, first.cell, state.arena.width) - manhattanDistance(actor.cell, second.cell, state.arena.width) || first.id.localeCompare(second.id))
    .slice(0, 10);
}

function retreatDecision(state: BattleState, actor: BattleCombatant, threat: BattleCombatant, rng: NamedRng): BattleDecision | null {
  const occupied = new Set(state.combatants.filter((candidate) => candidate.alive && candidate.id !== actor.id).map((candidate) => candidate.cell));
  const blocked = new Set(state.arena.obstacles);
  const candidates = orderedNeighbours(actor.cell, state.arena.width, state.arena.height)
    .filter((cell) => !blocked.has(cell) && !occupied.has(cell))
    .filter((cell) => isInsideZone(cell, state.zone, state.arena.width))
    .map((cell) => ({ cell, score: manhattanDistance(cell, threat.cell, state.arena.width) * 50 + (state.arena.cover.includes(cell) ? 80 : 0) }))
    .sort((first, second) => second.score - first.score || first.cell - second.cell);
  if (candidates.length === 0) return null;
  const bestScore = candidates[0].score;
  const tied = candidates.filter((candidate) => candidate.score === bestScore);
  const selected = tied[rng.nextInt(`ai:${actor.id}`, tied.length)];
  return moveDecision(actor, selected.cell, 'seeking-cover', 'Create distance from an immediate threat.', 760, tied.length);
}

function fallbackDecision(state: BattleState, actor: BattleCombatant, rng: NamedRng): BattleDecision {
  const occupied = new Set(state.combatants.filter((candidate) => candidate.alive && candidate.id !== actor.id).map((candidate) => candidate.cell));
  const blocked = new Set(state.arena.obstacles);
  const legal = orderedNeighbours(actor.cell, state.arena.width, state.arena.height)
    .filter((cell) => !blocked.has(cell) && !occupied.has(cell))
    .sort((first, second) => {
      const firstSafe = isInsideZone(first, state.zone, state.arena.width) ? 1 : 0;
      const secondSafe = isInsideZone(second, state.zone, state.arena.width) ? 1 : 0;
      return secondSafe - firstSafe || manhattanDistance(first, state.zone.centerCell, state.arena.width) - manhattanDistance(second, state.zone.centerCell, state.arena.width) || first - second;
    });
  if (legal.length === 0) return waitDecision(actor, 'fallback', 'No legal movement; hold and reassess.', 180, true);
  const bestDistance = manhattanDistance(legal[0], state.zone.centerCell, state.arena.width);
  const tied = legal.filter((cell) => manhattanDistance(cell, state.zone.centerCell, state.arena.width) === bestDistance);
  const target = tied[rng.nextInt(`ai:${actor.id}`, tied.length)];
  return moveDecision(actor, target, 'fallback', 'Use the safest legal fallback route.', 320, tied.length, true);
}

export function chooseBattleDecision(state: BattleState, actor: BattleCombatant, rng: NamedRng): BattleDecision {
  if (!actor.alive) return waitDecision(actor, 'eliminated', 'Contender is eliminated.', 1_000);
  if (!isInsideZone(actor.cell, state.zone, state.arena.width)) {
    const zonePath = pathDecision(state, actor, new Set([state.zone.centerCell]), 'seeking-zone', 'Return to the safe zone.', 930);
    if (zonePath) return zonePath;
  }
  if (actor.medkits > 0 && actor.health * 100 <= actor.maxHealth * 42) {
    return { action: { kind: 'heal', actorId: actor.id, reason: 'Critical health recovery.' }, intent: 'healing', goal: 'Recover before re-engaging.', confidencePermille: 900, expansions: 0, fallback: false };
  }
  const targets = attackableTargets(state, actor);
  if (targets.length > 0) {
    const target = targets[0];
    return {
      action: { kind: 'attack', actorId: actor.id, targetId: target.id, reason: `Engage ${target.name}.` },
      intent: 'attacking',
      goal: `Pressure ${target.name} while the shot is legal.`,
      confidencePermille: Math.max(420, 900 - manhattanDistance(actor.cell, target.cell, state.arena.width) * 45),
      expansions: 0,
      fallback: false,
    };
  }
  const nearestThreat = state.combatants
    .filter((candidate) => candidate.alive && candidate.id !== actor.id)
    .sort((first, second) => manhattanDistance(actor.cell, first.cell, state.arena.width) - manhattanDistance(actor.cell, second.cell, state.arena.width) || first.id.localeCompare(second.id))[0];
  if (nearestThreat && actor.archetype === 'ranger' && manhattanDistance(actor.cell, nearestThreat.cell, state.arena.width) <= 2) {
    const retreat = retreatDecision(state, actor, nearestThreat, rng);
    if (retreat) return retreat;
  }
  if (nearestThreat && actor.archetype === 'vanguard') {
    const adjacent = orderedNeighbours(nearestThreat.cell, state.arena.width, state.arena.height);
    const pressure = pathDecision(state, actor, unoccupiedGoals(state, adjacent, actor.id), 'pursuing', `Force a close engagement with ${nearestThreat.name}.`, 880);
    if (pressure) return pressure;
  }
  const loot = relevantLoot(state, actor);
  if (loot.length > 0) {
    const lootPath = pathDecision(state, actor, unoccupiedGoals(state, loot.map((item) => item.cell), actor.id), 'seeking-loot', 'Secure a useful resource.', actor.archetype === 'scavenger' ? 850 : 680);
    if (lootPath) return lootPath;
  }
  if (actor.archetype === 'tactician' && !state.arena.cover.includes(actor.cell) && nearestThreat && (manhattanDistance(actor.cell, nearestThreat.cell, state.arena.width) <= 8 || actor.shield * 2 < actor.maxShield)) {
    const nearbyCover = [...state.arena.cover]
      .sort((first, second) => manhattanDistance(actor.cell, first, state.arena.width) - manhattanDistance(actor.cell, second, state.arena.width) || first - second)
      .slice(0, 12);
    const coverPath = pathDecision(state, actor, unoccupiedGoals(state, nearbyCover, actor.id), 'seeking-cover', 'Take a defensible firing position.', 760);
    if (coverPath) return coverPath;
  }
  if (nearestThreat) {
    const adjacent = orderedNeighbours(nearestThreat.cell, state.arena.width, state.arena.height);
    const pursuit = pathDecision(state, actor, unoccupiedGoals(state, adjacent, actor.id), 'pursuing', `Close distance on ${nearestThreat.name}.`, actor.archetype === 'vanguard' ? 820 : 610);
    if (pursuit) return pursuit;
  }
  if (isInsideZone(actor.cell, state.zone, state.arena.width)) {
    const holding = orderedNeighbours(actor.cell, state.arena.width, state.arena.height).filter((cell) => state.arena.cover.includes(cell));
    const holdPath = pathDecision(state, actor, unoccupiedGoals(state, holding, actor.id), 'holding', 'Hold a safe central lane.', 520);
    if (holdPath) return holdPath;
  }
  return fallbackDecision(state, actor, rng);
}
