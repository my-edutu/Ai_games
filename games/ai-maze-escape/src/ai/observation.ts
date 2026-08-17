import type { MazeBeliefState, MazeState, MazeWorld } from '../state/types';
import { doorBetween } from '../generation/content';
import { passageNeighbors } from '../generation/solver';

export interface MazeObservedCell {
  cell: number;
  neighbors: number[];
  visible: boolean;
  lastSeenTick: number;
  trap: boolean;
  blocked: boolean;
  checkpoint: boolean;
  clue: boolean;
  exit: boolean;
}

export interface MazeObservedDoor {
  id: string;
  a: number;
  b: number;
  requiredKeyId: string;
  open: boolean;
}

export interface MazeObservedKey {
  id: string;
  cell: number;
  collected: boolean;
}

export interface MazeObservedThreat {
  id: string;
  cell: number;
  lastSeenTick: number;
}

export interface MazeObservation {
  schemaVersion: 1;
  tick: number;
  currentCell: number;
  visibleCells: number[];
  rememberedCells: number[];
  cells: MazeObservedCell[];
  doors: MazeObservedDoor[];
  keys: MazeObservedKey[];
  threats: MazeObservedThreat[];
  inventory: string[];
  health: number;
  timeRemaining: number;
  exitCell: number | null;
  recentCells: number[];
}

export function computeVisibleCells(world: MazeWorld, origin: number, radius: number): number[] {
  const seen = new Set<number>([origin]);
  const queue: Array<[number, number]> = [[origin, 0]];
  const blocked = new Set(world.blockedCells);

  for (let q = 0; q < queue.length; q += 1) {
    const [cell, distance] = queue[q]!;
    if (distance >= radius || (blocked.has(cell) && cell !== origin)) continue;
    for (const next of passageNeighbors(world, cell)) {
      const door = doorBetween(world, cell, next);
      if (door && !door.open) continue;
      if (!seen.has(next)) {
        seen.add(next);
        if (!blocked.has(next)) queue.push([next, distance + 1]);
      }
    }
  }

  return [...seen].sort((a, b) => a - b);
}

export function refreshMazeKnowledge(state: MazeState): { state: MazeState; gained: number } {
  const next = structuredClone(state);
  const visible = computeVisibleCells(next.world, next.explorer.cell, next.config.visibilityRadius);
  const before = new Set(next.discoveredCells);
  next.visibleCells = visible;
  next.discoveredCells = [...new Set([...next.discoveredCells, ...visible])].sort((a, b) => a - b);
  const gained = next.discoveredCells.filter(cell => !before.has(cell)).length;
  if (gained) {
    next.meaningfulEventTick = next.tick;
    next.stats.newCells += gained;
  }
  return { state: next, gained };
}

function rememberedCell(belief: MazeBeliefState | undefined, cell: number): MazeObservedCell | undefined {
  const known = belief?.cells[String(cell)];
  return known
    ? {
        cell: known.cell,
        neighbors: [...known.neighbors],
        visible: false,
        lastSeenTick: known.lastSeenTick,
        trap: known.trap,
        blocked: known.blocked,
        checkpoint: known.checkpoint,
        clue: known.clue,
        exit: known.exit,
      }
    : undefined;
}

export function createMazeObservation(state: MazeState): MazeObservation {
  const visible = new Set(state.visibleCells);
  const remembered = state.discoveredCells.filter(cell => !visible.has(cell));
  const cells: MazeObservedCell[] = [];

  for (const cell of state.visibleCells) {
    cells.push({
      cell,
      neighbors: passageNeighbors(state.world, cell),
      visible: true,
      lastSeenTick: state.tick,
      trap: state.world.traps.includes(cell),
      blocked: state.world.blockedCells.includes(cell),
      checkpoint: state.world.checkpoints.includes(cell),
      clue: state.world.clues.includes(cell),
      exit: cell === state.world.exit,
    });
  }

  for (const cell of remembered) {
    const known = rememberedCell(state.belief, cell);
    if (known) cells.push(known);
  }
  cells.sort((a, b) => a.cell - b.cell);

  const knownCells = new Set(cells.map(cell => cell.cell));
  return {
    schemaVersion: 1,
    tick: state.tick,
    currentCell: state.explorer.cell,
    visibleCells: [...state.visibleCells],
    rememberedCells: remembered,
    cells,
    doors: state.world.doors
      .filter(door => knownCells.has(door.a) || knownCells.has(door.b))
      .map(door => ({ id: door.id, a: door.a, b: door.b, requiredKeyId: door.requiredKeyId, open: door.open })),
    keys: state.world.keys
      .filter(key => key.collected || knownCells.has(key.cell))
      .map(key => ({ id: key.id, cell: key.cell, collected: key.collected })),
    // A paused threat remains physically present and collidable, so hiding it would
    // create an unfair observation gap. Movement state and danger state are separate.
    threats: state.world.threats
      .filter(threat => threat.active && visible.has(threat.cell))
      .map(threat => ({ id: threat.id, cell: threat.cell, lastSeenTick: state.tick })),
    inventory: [...state.explorer.inventory].sort(),
    health: state.explorer.health,
    timeRemaining: Math.max(0, state.config.maxTicks - state.tick),
    exitCell: visible.has(state.world.exit) ? state.world.exit : null,
    recentCells: [...state.ai.recentCells],
  };
}
