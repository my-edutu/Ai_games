export const MAX_TRAIL = 240;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Camera bounds come exclusively from public knowledge. */
export function computePublicView(snapshot, camera, overview = false) {
  const cells = snapshot.cells.length ? snapshot.cells : [{ cell: snapshot.currentCell }];
  const columns = cells.map(({ cell }) => cell % snapshot.width);
  const rows = cells.map(({ cell }) => Math.floor(cell / snapshot.width));
  const knownWidth = Math.max(...columns) - Math.min(...columns) + 1;
  const knownHeight = Math.max(...rows) - Math.min(...rows) + 1;
  const minimumWidth = Math.min(snapshot.width, 7);
  const minimumHeight = Math.min(snapshot.height, 5);
  const widthCells = clamp(overview ? knownWidth + 2 : Math.min(knownWidth + 2, 9), minimumWidth, snapshot.width);
  const heightCells = clamp(overview ? knownHeight + 2 : Math.min(knownHeight + 2, 7), minimumHeight, snapshot.height);
  const requested = Number.isInteger(camera?.centerCell) ? camera.centerCell : snapshot.currentCell;
  const centerCell = cells.some(item => item.cell === requested) ? requested : snapshot.currentCell;
  const startCol = clamp(centerCell % snapshot.width - Math.floor(widthCells / 2), 0, snapshot.width - widthCells);
  const startRow = clamp(Math.floor(centerCell / snapshot.width) - Math.floor(heightCells / 2), 0, snapshot.height - heightCells);
  const currentCol = snapshot.currentCell % snapshot.width;
  const currentRow = Math.floor(snapshot.currentCell / snapshot.width);
  return {
    startCol, startRow, widthCells, heightCells, centerCell,
    mode: overview ? 'overview' : 'local',
    containsCurrentCell: currentCol >= startCol && currentCol < startCol + widthCells && currentRow >= startRow && currentRow < startRow + heightCells,
  };
}

/** Find the observed movement since the previous poll, including turns. */
export function planPublicMotion(previous, next) {
  const snap = () => ({ cells: [next.currentCell], snap: true });
  if (!previous || previous.runToken !== next.runToken) return snap();
  const before = (previous.travelledRoute || []).slice(-MAX_TRAIL);
  const after = (next.travelledRoute || []).slice(-MAX_TRAIL);
  let overlap = 0;
  for (let size = Math.min(before.length, after.length); size > 0; size -= 1) {
    if (before.slice(-size).every((cell, index) => cell === after[index])) { overlap = size; break; }
  }
  if (!overlap) {
    if (previous.currentCell === next.currentCell) return { cells: [next.currentCell], snap: false };
    return snap();
  }
  const path = [previous.currentCell, ...after.slice(overlap)];
  if (path.at(-1) !== next.currentCell) return snap();
  const known = new Map(next.cells.map(cell => [cell.cell, cell]));
  for (let index = 0; index < path.length; index += 1) {
    if (!known.has(path[index])) return snap();
    if (!index || path[index] === path[index - 1]) continue;
    const a = path[index - 1], b = path[index];
    const distance = Math.abs(a % next.width - b % next.width) + Math.abs(Math.floor(a / next.width) - Math.floor(b / next.width));
    if (distance !== 1 || !(known.get(a).neighbors.includes(b) || known.get(b).neighbors.includes(a))) return snap();
  }
  return { cells: path.filter((cell, index) => index === 0 || cell !== path[index - 1]), snap: false };
}

/** Piecewise sampling retains each corridor turn; there is no corner spline. */
export function samplePublicPath(cells, progress, width, height, cellSize = 2.4) {
  const p = clamp(progress, 0, 1) * Math.max(0, cells.length - 1);
  const index = Math.min(Math.floor(p), cells.length - 1);
  const a = cells[Math.max(0, index)] ?? 0;
  const b = cells[Math.min(index + 1, cells.length - 1)] ?? a;
  const t = p - index;
  const ax = (a % width - (width - 1) / 2) * cellSize;
  const az = (Math.floor(a / width) - (height - 1) / 2) * cellSize;
  const bx = (b % width - (width - 1) / 2) * cellSize;
  const bz = (Math.floor(b / width) - (height - 1) / 2) * cellSize;
  return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, heading: Math.atan2(bx - ax, bz - az), cell: a, moving: a !== b };
}

/**
 * Only marks legal, already-disclosed corridors adjacent to the explorer.
 * 'planned' reflects public AI intent, NOT a guarantee of safety or refuge.
 * The renderer performs no pathfinding or undisclosed-map inference.
 */
export function publicWayfinding(snapshot) {
  const {currentCell: current, width, height} = snapshot ?? {};
  if (!Number.isInteger(current) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || current < 0 || current >= width * height || snapshot.result) return [];
  const known = new Map((Array.isArray(snapshot.cells) ? snapshot.cells : []).map(item => [item.cell, item]));
  const origin = known.get(current);
  if (!origin || origin.blocked || !Array.isArray(origin.neighbors)) return [];
  const planned = Array.isArray(snapshot.plannedRoute) && snapshot.plannedRoute[0] === current
    ? snapshot.plannedRoute[1] : null;
  return [...new Set(origin.neighbors)].filter(next => {
    const cell = known.get(next);
    const distance = Math.abs((next % width) - (current % width))
      + Math.abs(Math.floor(next / width) - Math.floor(current / width));
    return Number.isInteger(next) && next >= 0 && next < width * height && distance === 1
      && cell && !cell.blocked && Array.isArray(cell.neighbors) && cell.neighbors.includes(current);
  }).slice(0, 4).map(next => ({from: current, to: next, kind: next === planned ? 'planned' : 'known'}));
}

export function drawMinimap(canvas, snapshot, highContrast = false) {
  if (!canvas || !snapshot) return;
  const context = canvas.getContext('2d');
  const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  context.clearRect(0, 0, width, height);
  const unit = Math.min((width - 14) / snapshot.width, (height - 14) / snapshot.height);
  const ox = (width - snapshot.width * unit) / 2, oy = (height - snapshot.height * unit) / 2;
  const point = cell => ({ x: ox + (cell % snapshot.width + 0.5) * unit, y: oy + (Math.floor(cell / snapshot.width) + 0.5) * unit });
  const known = new Set(snapshot.cells.map(item => item.cell));
  context.lineWidth = Math.max(1.4 * ratio, unit * 0.55);
  context.lineCap = 'square';
  for (const cell of snapshot.cells) {
    const p = point(cell.cell);
    context.fillStyle = highContrast ? '#ededdf' : cell.visible ? '#b4cabb' : '#577468';
    context.fillRect(p.x - unit * .32, p.y - unit * .32, unit * .64, unit * .64);
    context.strokeStyle = context.fillStyle;
    for (const neighbor of cell.neighbors) {
      if (!known.has(neighbor) || neighbor < cell.cell) continue;
      const q = point(neighbor);
      context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y); context.stroke();
    }
  }
  for (const key of snapshot.keys.filter(key => !key.collected && known.has(key.cell))) {
    const p = point(key.cell); context.fillStyle = '#ffd480';
    context.beginPath(); context.arc(p.x, p.y, Math.max(2 * ratio, unit * .35), 0, Math.PI * 2); context.fill();
  }
  for (const threat of snapshot.threats) {
    const p = point(threat.cell); context.fillStyle = '#ff8780';
    context.fillRect(p.x - unit * .4, p.y - unit * .4, unit * .8, unit * .8);
  }
  if (snapshot.exitCell !== null) {
    const p = point(snapshot.exitCell); context.strokeStyle = '#ffe5b3'; context.lineWidth = 2 * ratio;
    context.strokeRect(p.x - unit * .4, p.y - unit * .4, unit * .8, unit * .8);
  }
  const current = point(snapshot.currentCell);
  context.fillStyle = '#f5ba61'; context.strokeStyle = '#173a36'; context.lineWidth = 1.8 * ratio;
  context.beginPath(); context.arc(current.x, current.y, Math.max(3 * ratio, unit * .55), 0, Math.PI * 2); context.fill(); context.stroke();
}
