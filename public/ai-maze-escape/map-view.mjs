export const MAX_TRAIL = 240;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Native gameplay camera staging is derived only from an ALREADY DISCLOSED
 * guardian's bounded visual attention. Detail mode must not silently ignore
 * that threat: authentic tick-13 screenshots placed Thornback near the right
 * edge with Pip near the opposite edge even though both share a corridor.
 * No private threat location, hidden map cell, animation, navigation command
 * or unsafe-route assumption is involved. Keep the hero dominant on phones.
 */
export function publicEncounterFrameWeight(attentionStrength, cameraMode, result, aspect) {
  if (result || (cameraMode !== 'follow' && cameraMode !== 'detail')
    || !Number.isFinite(attentionStrength)) return 0;
  const alert = clamp(attentionStrength, 0, 1);
  // The former hero-biased Follow composition left both already-visible
  // actors tiny on real 320/390 full-screen portraits. Recenter only an actual
  // close public encounter, at most 46% of the real hero-to-guardian span.
  // Wider Follow, landscape, hidden, and terminal snapshots stay unchanged.
  const narrowPortrait = Number.isFinite(aspect) && aspect >= .35 && aspect < .60;
  if (cameraMode === 'follow')
    return narrowPortrait ? Math.min(.46, alert * .82) : alert * .22;
  const portrait = Number.isFinite(aspect) && aspect > 0 && aspect < .9;
  // Native 390px production evidence showed one truly disclosed guardian entirely
  // outside the picture despite a visible warning. Detail is an actor-pair view:
  // share its bounded aim almost evenly for a genuine close opponent, retaining
  // slightly more of Pip on phones. Follow, terminal and hidden-state rules stay.
  return portrait ? Math.min(.48, alert * .85) : Math.min(.5, alert * .9);
}

/**
 * Portrait Detail must preserve the previously verified horizontal world span
 * when its game-first HUD makes the 3D canvas taller. Orthographic framing
 * otherwise crops a real disclosed guardian even though the view gained pixels.
 * 4.275 = 5.7 * 0.75: the horizontal half-span of the real 390x520 encounter.
 * This is a presentation calculation only; no private maze/AI state enters.
 */
/**
 * A full-screen phone canvas is taller than the former 390px in-page stage.
 * Preserve the PREVIOUS horizontal diorama world span (~.70 old aspect)
 * rather than cropping a known key/closed gate or the disclosed guardian
 * when the HUD moves into the corners. Does not invent a cell or move actors.
 * Only the camera frustum changes; the live simulation is unchanged.
 */
export function publicFullBleedFollowHalfHeight(aspect, selectedHalfHeight) {
  const base = Number.isFinite(selectedHalfHeight) && selectedHalfHeight > 0 ? selectedHalfHeight : 7.3;
  if (!Number.isFinite(aspect) || aspect >= .60 || aspect <= 0) return base;
  const safeAspect = Math.max(.35, aspect);
  return Math.max(base, Math.min(base * 2.2, base * .70 / safeAspect));
}

/**
 * Tighten ONLY an actual publicly disclosed guardian/hero encounter in a
 * full-screen narrow portrait. Use the existing live pair's 3D world positions
 * and a conservative model-radius reserve, never hidden maze data, a guessed
 * guardian or a screen-space impostor. The physical models stay their true size.
 *
 * Preserve the broader original shot whenever either character would approach
 * the edge. The 15:18 camera heading is the actual unrotated Follow isometric
 * offset in scene.js; sealed-gate views deliberately never call this helper.
 */
/**
 * Center the real, publicly disclosed portrait pair by their approximate
 * physical silhouettes, not their eye/actor centers. Thornback's claws and
 * sails occupy a wider screen envelope than Pip's arms and scarf.
 * The correction only pans the FOLLOW camera; it never moves game objects,
 * reveals private topology, or directs either autonomous character.
 */
export function publicPortraitGuardianBalance(aspect, attention, hero, guardian, focus) {
  const neutral={x:0,z:0};
  if (!(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(attention) && attention>0)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z,focus?.x,focus?.z].every(Number.isFinite))
    return neutral;
  const length=Math.hypot(18,15);
  const screenX=p=>((p.x-focus.x)*18-(p.z-focus.z)*15)/length;
  const heroCenter=screenX(hero), guardianCenter=screenX(guardian);
  // Authored physical envelope reserves: helmet/scarf 1.10, shell/claws/sails 1.80.
  // A pure midpoint left the actual native 390px guardian sail cropped at 1.004 NDC.
  const min=Math.min(heroCenter-1.10,guardianCenter-1.80);
  const max=Math.max(heroCenter+1.10,guardianCenter+1.80);
  const shift=clamp((min+max)*.5,-.55,.55);
  return {x:shift*18/length,z:-shift*15/length};
}

export function publicPortraitGuardianHalfHeight(aspect, fullBleedHeight, attention, hero, guardian, focus, previousFocus=focus) {
  const base=Number.isFinite(fullBleedHeight)&&fullBleedHeight>0?fullBleedHeight:7.3;
  if (!(Number.isFinite(aspect)&&aspect>=.35&&aspect<.60)
    || !(Number.isFinite(attention)&&attention>0)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z,focus?.x,focus?.z,previousFocus?.x,previousFocus?.z].every(Number.isFinite))
    return base;
  const viewRightLength=Math.hypot(18,15);
  const screenX=(p,target)=>((p.x-target.x)*18-(p.z-target.z)*15)/viewRightLength;
  // The actual camera focus eases toward the new public target. The entire
  // transition lies between these two targets: protecting BOTH endpoints
  // prevents an otherwise valid pair shot from cropping a real guardian
  // during the easing itself, not just when the camera finally settles.
  // Preserve genuine 3D extents, not merely the two projected eye centers.
  // The guardian's articulated silhouette is wider than Pip's; .94 NDC
  // leaves actual visible clearance rather than touching the viewport edge.
  // Check BOTH ends of camera easing so a formerly centered shot stays safe.
  const pairExtent=target=>Math.max(
    Math.abs(screenX(hero,target))+1.10,
    Math.abs(screenX(guardian,target))+1.80);
  const physicallySafeHeight=Math.max(
    pairExtent(focus),pairExtent(previousFocus))/(aspect*.94);
  const maximumZoom=base*(1-.16*clamp(attention,0,1));
  return Math.min(base,Math.max(maximumZoom,physicallySafeHeight));
}

export function publicDetailEncounterHalfHeight(aspect, disclosedAttention) {
  if (!(Number.isFinite(aspect) && aspect > 0 && aspect < .9)
    || !(Number.isFinite(disclosedAttention) && disclosedAttention > 0)) return 4.6;
  return Math.max(5.7, 4.275 / aspect);
}

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
 * Temporary camera-only punctuation for a physically opened known passage.
 * Both endpoints and the actual before/after door records are from PUBLIC
 * authoritative snapshots, never the generator, solver or enemy plans.
 * The gate must have been visibly closed in this SAME run, then opened, with
 * a genuinely known nearby floor cell. This does NOT unlock the gate.
 */
export function publicGateOpeningCameraCue(before, after) {
  if (!before || !after || typeof before.runToken !== 'string'
    || before.runToken !== after.runToken || before.result || after.result
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick <= before.tick || !Number.isSafeInteger(after.width)
    || !Number.isSafeInteger(after.height) || after.width < 1 || after.height < 1
    || !Number.isSafeInteger(after.currentCell) || after.currentCell < 0
    || after.currentCell >= after.width * after.height
    || !Array.isArray(before.doors) || !Array.isArray(after.doors)
    || !Array.isArray(after.cells)) return null;
  const known = new Set(after.cells.filter(cell => Number.isSafeInteger(cell?.cell)
    && !cell.blocked).map(cell => cell.cell));
  if (!known.has(after.currentCell)) return null;
  const edge = (a,b) => (a < b ? a + ':' + b : b + ':' + a);
  const valid = door => Number.isSafeInteger(door?.a) && Number.isSafeInteger(door?.b)
    && door.a >= 0 && door.b >= 0 && door.a !== door.b
    && door.a < after.width * after.height && door.b < after.width * after.height
    && Math.abs(door.a % after.width - door.b % after.width)
      + Math.abs(Math.floor(door.a / after.width) - Math.floor(door.b / after.width)) === 1;
  const previousClosed = new Map(before.doors.filter(door => valid(door) && door.open === false)
    .map(door => [edge(door.a,door.b),door]));
  const distance = cell => Math.abs(cell % after.width - after.currentCell % after.width)
    + Math.abs(Math.floor(cell / after.width) - Math.floor(after.currentCell / after.width));
  const candidates = after.doors.filter(door => valid(door) && door.open === true
    && previousClosed.has(edge(door.a,door.b)))
    .map(door => {
      const ends=[door.a,door.b].filter(cell => known.has(cell));
      const steps=ends.length ? Math.min(...ends.map(distance)) : Infinity;
      if (steps > 1) return null;
      const closed=previousClosed.get(edge(door.a,door.b));
      return {a:door.a,b:door.b,steps,
        keyed:typeof closed.requiredKeyId==='string' && closed.requiredKeyId.length>0
          && Array.isArray(before.inventory) && before.inventory.includes(closed.requiredKeyId)};
    }).filter(Boolean)
    .sort((a,b)=>a.steps-b.steps||a.a-b.a||a.b-b.b);
  return candidates[0] ?? null;
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


/**
 * Camera-only punctuation for Pip presenting the exact carried key to an
 * already-disclosed closed gate. The ordinary sealed-gate camera continues to
 * favour surrounding architecture; this variant puts the small physical
 * glove/lock pairing closer to the middle of the frame on a narrow screen.
 *
 * Callers must first establish publicCarriedGateCue. Neither a door's secret
 * requirements nor a route or game action is inferred by this pure helper.
 */
export function composePublicKeyLockFocus(stageBias, gateDelta, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const portrait = aspect < .9;
  // Pass39's extra stage pull drove the closed gate off the left edge while
  // leaving the public right arch cropped. Preserve the pass37 hero/gate
  // balance and improve the empty-water rendering independently.
  const stageWeight = portrait ? .35 : .52;
  const gateWeight = portrait ? .49 : .46;
  const x = finite(stageBias?.x) * stageWeight + finite(gateDelta?.x) * gateWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(gateDelta?.z) * gateWeight;
  const limit = portrait ? 1.5 : 2.45;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
}


/**
 * A *cosmetic* key-in-hand response to the gate immediately beside Pip.
 * This requires three independent, public facts: a disclosed nearby closed
 * door, its exact public requiredKeyId in inventory, and actual visual
 * proximity. It never opens the door, invents a route, or consults hidden map
 * cells. The octagonal key/crest uses the same disclosed authority snapshot.
 */
export function publicCarriedGateCue(snapshot, pose) {
  const gate = publicNearbySealedGate(snapshot);
  if (!gate || !Number.isFinite(pose?.x) || !Number.isFinite(pose?.z)) return null;
  const door = (Array.isArray(snapshot.doors) ? snapshot.doors : []).find(item =>
    !item.open && ((item.a === gate.a && item.b === gate.b)
      || (item.a === gate.b && item.b === gate.a)));
  const keyId = door?.requiredKeyId;
  if (typeof keyId !== 'string' || !keyId || !Array.isArray(snapshot.inventory)
    || !snapshot.inventory.includes(keyId)) return null;
  const cellPosition = cell => ({
    x: (cell % snapshot.width - (snapshot.width - 1) / 2) * 2.4,
    z: (Math.floor(cell / snapshot.width) - (snapshot.height - 1) / 2) * 2.4,
  });
  const a = cellPosition(gate.a), b = cellPosition(gate.b);
  const dx = (a.x + b.x) / 2 - pose.x;
  const dz = (a.z + b.z) / 2 - pose.z;
  const distance = Math.hypot(dx, dz);
  // The key must be visible only at a real nearby lock, never as a remote
  // navigation instruction. Keep reduced motion free to show a static pose.
  if (!Number.isFinite(distance) || distance >= 3.6) return null;
  const strength = clamp((3.6 - distance) / 2.4, 0, 1);
  if (strength < .2) return null;
  return {heading: Math.atan2(dx, dz), strength, a: gate.a, b: gate.b};
}

/**
 * Public-only, non-authoritative HUD context: same already visible matching
 * key and truly CLOSED nearby gate that can provoke Pip's cosmetic gesture.
 * The current disclosed cell is the stable snapshot position; continuous
 * camera interpolation never gives the text access to hidden authority.
 */
export function publicHeldGateStatus(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
      || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height)
    return false;
  const pose = {
    x: (currentCell % width - (width - 1) / 2) * 2.4,
    z: (Math.floor(currentCell / width) - (height - 1) / 2) * 2.4,
  };
  return !!publicCarriedGateCue(snapshot, pose);
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
