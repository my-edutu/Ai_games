import type { BattleAction, BattleState } from '../state/types';
import { appendBattleEvent } from './events';
import { orderedNeighbours } from './geometry';

function rotatingPriority(state: BattleState, actorId: string): number {
  const actor = state.combatants.find((candidate) => candidate.id === actorId);
  if (!actor) return Number.MAX_SAFE_INTEGER;
  const rotation = state.tick % state.combatants.length;
  return (actor.index - rotation + state.combatants.length) % state.combatants.length;
}

export function resolveMovementBatch(state: BattleState, actions: readonly BattleAction[]): string[] {
  const blocked = new Set(state.arena.obstacles);
  const occupiedAtStart = new Map<number, string>();
  for (const combatant of state.combatants) if (combatant.alive) occupiedAtStart.set(combatant.cell, combatant.id);

  const legal = actions
    .filter((action): action is Extract<BattleAction, { kind: 'move' }> => action.kind === 'move')
    .filter((action) => {
      const actor = state.combatants.find((candidate) => candidate.id === action.actorId);
      return Boolean(actor?.alive)
        && orderedNeighbours(actor!.cell, state.arena.width, state.arena.height).includes(action.targetCell)
        && !blocked.has(action.targetCell);
    });

  const byDestination = new Map<number, typeof legal>();
  for (const action of legal) {
    const group = byDestination.get(action.targetCell) ?? [];
    group.push(action);
    byDestination.set(action.targetCell, group);
  }

  const winners = new Map<string, Extract<BattleAction, { kind: 'move' }>>();
  for (const group of byDestination.values()) {
    const winner = [...group].sort((first, second) => rotatingPriority(state, first.actorId) - rotatingPriority(state, second.actorId) || first.actorId.localeCompare(second.actorId))[0];
    winners.set(winner.actorId, winner);
  }

  const accepted = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [actorId, action] of winners) {
      if (accepted.has(actorId)) continue;
      const occupant = occupiedAtStart.get(action.targetCell);
      if (!occupant || accepted.has(occupant)) {
        accepted.add(actorId);
        changed = true;
      }
    }
  }

  const nextCells = new Map<string, number>();
  for (const actorId of accepted) nextCells.set(actorId, winners.get(actorId)!.targetCell);
  for (const [actorId, targetCell] of [...nextCells.entries()].sort(([first], [second]) => first.localeCompare(second))) {
    const actor = state.combatants.find((candidate) => candidate.id === actorId)!;
    actor.cell = targetCell;
    actor.recentCells.push(targetCell);
    if (actor.recentCells.length > 12) actor.recentCells.splice(0, actor.recentCells.length - 12);
    appendBattleEvent(state, { type: 'move', actorId, cell: targetCell, importance: 1 });
  }
  return [...accepted].sort();
}
