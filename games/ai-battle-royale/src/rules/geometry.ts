import type { BattleArena } from '../state/types';

export function cellX(cell: number, width: number): number {
  return cell % width;
}

export function cellY(cell: number, width: number): number {
  return Math.floor(cell / width);
}

export function toCell(x: number, y: number, width: number): number {
  return y * width + x;
}

export function isCellInBounds(cell: number, width: number, height: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < width * height;
}

export function orderedNeighbours(cell: number, width: number, height: number): number[] {
  const x = cellX(cell, width);
  const y = cellY(cell, width);
  const neighbours: number[] = [];
  if (y > 0) neighbours.push(cell - width);
  if (x > 0) neighbours.push(cell - 1);
  if (x + 1 < width) neighbours.push(cell + 1);
  if (y + 1 < height) neighbours.push(cell + width);
  return neighbours;
}

export function reachableWalkableCells(arena: Pick<BattleArena, 'width' | 'height' | 'obstacles'>, start: number): Set<number> {
  const blocked = new Set(arena.obstacles);
  if (!isCellInBounds(start, arena.width, arena.height) || blocked.has(start)) return new Set<number>();
  const queue = [start];
  const visited = new Set<number>(queue);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    for (const neighbour of orderedNeighbours(queue[cursor], arena.width, arena.height)) {
      if (!blocked.has(neighbour) && !visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push(neighbour);
      }
    }
  }
  return visited;
}

export function manhattanDistance(first: number, second: number, width: number): number {
  return Math.abs(cellX(first, width) - cellX(second, width)) + Math.abs(cellY(first, width) - cellY(second, width));
}
