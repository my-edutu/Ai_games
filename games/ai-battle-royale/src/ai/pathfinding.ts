import type { BattleState } from '../state/types';
import { orderedNeighbours } from '../rules/geometry';

export interface PathSearchResult {
  path: number[];
  expansions: number;
  reached: number | null;
}

export function findBattlePath(
  state: BattleState,
  start: number,
  goals: ReadonlySet<number>,
  actorId: string,
  maxExpansions: number = state.config.maxPathExpansions,
): PathSearchResult {
  if (goals.has(start)) return { path: [start], expansions: 0, reached: start };
  const blocked = new Set(state.arena.obstacles);
  for (const combatant of state.combatants) {
    if (combatant.alive && combatant.id !== actorId && !goals.has(combatant.cell)) blocked.add(combatant.cell);
  }
  const queue = [start];
  const visited = new Set<number>(queue);
  const parent = new Map<number, number>();
  let reached: number | null = null;
  let expansions = 0;

  for (let cursor = 0; cursor < queue.length && expansions < maxExpansions; cursor += 1) {
    const cell = queue[cursor];
    expansions += 1;
    for (const next of orderedNeighbours(cell, state.arena.width, state.arena.height)) {
      if (blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      parent.set(next, cell);
      if (goals.has(next)) {
        reached = next;
        cursor = queue.length;
        break;
      }
      queue.push(next);
    }
    if (reached !== null) break;
  }

  if (reached === null) return { path: [], expansions, reached: null };
  const reversed = [reached];
  let current = reached;
  while (current !== start) {
    const previous = parent.get(current);
    if (previous === undefined) return { path: [], expansions, reached: null };
    reversed.push(previous);
    current = previous;
  }
  reversed.reverse();
  return { path: reversed, expansions, reached };
}
