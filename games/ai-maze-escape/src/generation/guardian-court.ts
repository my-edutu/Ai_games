import type { MazeWorld } from '../state/types';
import { PASSAGE_UP, PASSAGE_RIGHT, PASSAGE_DOWN, PASSAGE_LEFT } from './solver';

/** One opt-in, versioned authored level. These are authoritative passages, not
 * presentation offsets. The existing row-based terrain puts all twenty court
 * cells and the complete treasure gallery on terrace 1. */
export function buildGuardianCourt(): MazeWorld {
  const width = 17, height = 11;
  const passages = new Array<number>(width * height).fill(0);
  const authored = new Set<number>();
  const connect = (a: number, b: number) => {
    const dr = Math.floor(b / width) - Math.floor(a / width);
    const dc = b % width - a % width;
    const direction = dr === -1 && dc === 0 ? [PASSAGE_UP, PASSAGE_DOWN]
      : dr === 1 && dc === 0 ? [PASSAGE_DOWN, PASSAGE_UP]
        : dr === 0 && dc === 1 ? [PASSAGE_RIGHT, PASSAGE_LEFT]
          : dr === 0 && dc === -1 ? [PASSAGE_LEFT, PASSAGE_RIGHT] : null;
    if (!direction) throw new Error('guardian-court-v1: non-adjacent authored edge');
    passages[a] |= direction[0]!;
    passages[b] |= direction[1]!;
  };
  const path = (cells: number[]) => {
    for (const cell of cells) authored.add(cell);
    for (let index = 1; index < cells.length; index++) connect(cells[index - 1]!, cells[index]!);
  };

  // Safe approach, visible pressure side alcove, then the real open court.
  path([86, 87, 88, 89, 90, 91]);
  path([89, 72]);
  for (let row = 4; row <= 7; row++) {
    for (let col = 6; col <= 10; col++) {
      const cell = row * width + col;
      authored.add(cell);
      if (col < 10) connect(cell, cell + 1);
      if (row < 7) connect(cell, cell + width);
    }
  }
  // Counter-released two-link treasure gallery and the later key-locked exit.
  path([129, 130, 131]);
  path([129, 146, 147, 148]);

  // The enclosing ruin grid is real connected ground beyond the terminal exit.
  // Its sole connection is the exit, so it cannot bypass the authored court,
  // guardian seal, key gallery or matching gate. A bounded, fixed-order tree
  // preserves the normal all-cells-connected world invariant without RNG.
  const outside = 165, seen = new Set<number>([outside]), queue = [outside];
  connect(148, outside);
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index]!, row = Math.floor(cell / width), col = cell % width;
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const nr = row + dr!, nc = col + dc!;
      if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
      const next = nr * width + nc;
      if (authored.has(next) || seen.has(next)) continue;
      seen.add(next); queue.push(next); connect(cell, next);
    }
  }
  if (seen.size + authored.size !== width * height)
    throw new Error('guardian-court-v1: disconnected outer ruins');

  return {
    schemaVersion: 1, layoutId: 'guardian-court-v1', width, height, passages,
    start: 86, exit: 148, profile: 'chambers', blockedCells: [],
    doors: [
      {id:'guardian-seal',a:129,b:130,requiredKeyId:null,requiredGuardianId:'threat-1',
        open:false,critical:true,temporaryUntilTick:null},
      {id:'door-1',a:146,b:147,requiredKeyId:'key-1',open:false,critical:true,temporaryUntilTick:null},
    ],
    keys: [{id:'key-1',cell:131,collected:false}],
    traps: [72], clues: [91, 112, 129], checkpoints: [129],
    threats: [{id:'threat-1',cell:93,route:[93,94],routeIndex:0,direction:1,
      lastSeenTick:null,active:true}],
  };
}
