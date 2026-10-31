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
  // The objective first step is derived only from disclosed reciprocal legal edges.
  // It describes a known connection, never an agent command or safe escape.
  const goal = publicObjective(snapshot);
  return [...new Set(origin.neighbors)].filter(next => {
    const cell = known.get(next);
    const distance = Math.abs((next % width) - (current % width))
      + Math.abs(Math.floor(next / width) - Math.floor(current / width));
    const locked = (Array.isArray(snapshot.doors) ? snapshot.doors : []).some(door => !door.open
      && ((door.a === current && door.b === next) || (door.b === current && door.a === next)));
    return Number.isInteger(next) && next >= 0 && next < width * height && distance === 1
      && cell && !cell.blocked && Array.isArray(cell.neighbors) && cell.neighbors.includes(current) && !locked;
  }).slice(0, 4).map(next => ({
    from: current, to: next, kind: next === planned ? 'planned' : 'known',
    ...(next === goal?.firstStep ? {goal: goal.kind} : {}),
  }));
}


/**
 * Pick one *disclosed*, connected landmark to make the scene legible.
 * A known route is NOT a safe route, a guarantee that a key opens an exit,
 * or the autonomous agent's intended next move. Never consult private state.
 */
export function publicObjective(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height || snapshot.result) return null;
  const known = new Map((Array.isArray(snapshot.cells) ? snapshot.cells : [])
    .filter(cell => Number.isInteger(cell.cell) && Array.isArray(cell.neighbors))
    .map(cell => [cell.cell, cell]));
  if (!known.has(currentCell) || known.get(currentCell).blocked) return null;
  const doors = Array.isArray(snapshot.doors) ? snapshot.doors : [];
  const distance = new Map([[currentCell, 0]]);
  const firstStep = new Map();
  const queue = [currentCell];
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i], origin = known.get(from);
    for (const to of origin.neighbors) {
      if (!Number.isInteger(to) || to < 0 || to >= width * height || distance.has(to)) continue;
      const target = known.get(to);
      const adjacent = Math.abs(from % width - to % width)
        + Math.abs(Math.floor(from / width) - Math.floor(to / width)) === 1;
      if (!adjacent || !target || target.blocked || !target.neighbors.includes(from)) continue;
      if (doors.some(door => !door.open
        && ((door.a === from && door.b === to) || (door.a === to && door.b === from)))) continue;
      distance.set(to, distance.get(from) + 1);
      firstStep.set(to, from === currentCell ? to : firstStep.get(from));
      queue.push(to);
    }
  }
  const keys = (Array.isArray(snapshot.keys) ? snapshot.keys : [])
    .filter(key => !key.collected && distance.has(key.cell))
    .sort((a, b) => distance.get(a.cell) - distance.get(b.cell) || a.cell - b.cell);
  if (keys.length) return {kind: 'key', cell: keys[0].cell, steps: distance.get(keys[0].cell), firstStep: firstStep.get(keys[0].cell) ?? null};
  if (Number.isInteger(snapshot.exitCell) && distance.has(snapshot.exitCell))
    return {kind: 'exit', cell: snapshot.exitCell, steps: distance.get(snapshot.exitCell), firstStep: firstStep.get(snapshot.exitCell) ?? null};
  return null;
}


/**
 * Keep a known coastal garden in the composition when Pip stands on its edge.
 * The bias is screen-lateral only and based on nearby DISCLOSED public cells;
 * it reveals no hidden corridors and affects no authoritative AI decision.
 * Values are world-space offsets for the fixed isometric camera.
 */
export function publicStageBias(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height || snapshot.result)
    return {x: 0, z: 0};
  const col = currentCell % width, row = Math.floor(currentCell / width);
  const nearby = (Array.isArray(snapshot.cells) ? snapshot.cells : []).filter(c =>
    Number.isInteger(c.cell) && c.cell >= 0 && c.cell < width * height && !c.blocked
    && Math.abs(c.cell % width - col) + Math.abs(Math.floor(c.cell / width) - row) <= 4);
  if (nearby.length < 2) return {x: 0, z: 0};
  const avgCol = nearby.reduce((sum, c) => sum + c.cell % width, 0) / nearby.length;
  const avgRow = nearby.reduce((sum, c) => sum + Math.floor(c.cell / width), 0) / nearby.length;
  // Camera offset is (15,21,18); its screen-right vector is (18,0,-15).
  const rightX = 18 / Math.hypot(18, 15), rightZ = -15 / Math.hypot(18, 15);
  const lateral = ((avgCol - col) * rightX + (avgRow - row) * rightZ) * 2.4;
  const shift = clamp(lateral * .9, -2.75, 2.75);
  return {x: rightX * shift, z: rightZ * shift};
}

/**
 * Camera-only offset. Callers pass the sanitized/public stage bias and a
 * world-space delta to an already-disclosed reachable landmark. It says
 * nothing about safety, AI intent or hidden geometry. Keep the near-goal
 * hero/landmark framing, but give the known stage room beside open water.
 */
export function composePublicCameraFocus(stageBias, goalDelta, nearGoal = false, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const stageWeight = nearGoal ? .58 : aspect < .9 ? .23 : 1;
  const goalWeight = nearGoal ? .24 : 0;
  const x = finite(stageBias?.x) * stageWeight + finite(goalDelta?.x) * goalWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(goalDelta?.z) * goalWeight;
  // In close framing the explorer must remain in view: bound both combined
  // pulls rather than separately clipping components into a diagonal drift.
  const limit = nearGoal ? 2.5 : 2.75;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
}

/**
 * Select a nearby sealed gate that the public snapshot ALREADY exposes.
 * This is a visual obstacle, not a reachable waypoint or safe route. A gate
 * with one known endpoint is rendered by the world, so its camera framing may
 * use the same already-public door record. No undisclosed cell is traversed.
 */
export function publicNearbySealedGate(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height
    || snapshot.result) return null;
  const known = new Set((Array.isArray(snapshot.cells) ? snapshot.cells : [])
    .filter(cell => Number.isInteger(cell.cell) && !cell.blocked)
    .map(cell => cell.cell));
  if (!known.has(currentCell)) return null;
  const gridDistance = (a, b) => Math.abs(a % width - b % width)
    + Math.abs(Math.floor(a / width) - Math.floor(b / width));
  const eligible = (Array.isArray(snapshot.doors) ? snapshot.doors : [])
    .filter(door => !door.open && Number.isInteger(door.a) && Number.isInteger(door.b)
      && door.a >= 0 && door.b >= 0 && door.a < width * height && door.b < width * height
      && gridDistance(door.a, door.b) === 1)
    .map(door => {
      const sides = [door.a, door.b].filter(cell => known.has(cell));
      return sides.length ? {a: door.a, b: door.b,
        steps: Math.min(...sides.map(cell => gridDistance(currentCell, cell)))} : null;
    })
    .filter(gate => gate && gate.steps <= 1)
    .sort((a, b) => a.steps - b.steps || a.a - b.a || a.b - b.b);
  return eligible[0] ?? null;
}

/**
 * Let Pip and an actually modeled closed gate share the shot. Since a sealed
 * gate is NOT a legal route, it takes no role in publicObjective/AI guidance.
 * The nearby, already-disclosed terrain must occupy more of the frame than
 * empty lagoon. Keep the modeled gate in view, but do not let a fringe gate
 * drag the whole camera away from known walkable stage. Portrait still limits
 * the lateral shift so the hero and obstruction stay legible together.
 */
export function composePublicSealedGateFocus(stageBias, gateDelta, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const portrait = aspect < .9;
  // Both vectors are derived from disclosed public cells/doors. Preserve
  // coastal floor context, but let the *actually visible* closed obstruction
  // counter the stage pull: stage-heavy framing pushed both Pip and the gate
  // into the left edge of the real pass-18 desktop/portrait captures.
  // This is a camera target only, never an AI route or a traversal hint.
  const stageWeight = portrait ? .44 : .85;
  const gateWeight = portrait ? .30 : .34;
  const x = finite(stageBias?.x) * stageWeight + finite(gateDelta?.x) * gateWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(gateDelta?.z) * gateWeight;
  const limit = portrait ? 1.1 : 2.6;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
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
