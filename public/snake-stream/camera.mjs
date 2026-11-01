const normalize = v => {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;


/*
 * Presentation-only fruit-aware close camera. Keep every gameplay transform
 * where the authoritative public snapshot put it: move the camera sightline,
 * never the food or the head. The approximate angular silhouette bounds
 * are deliberately conservative and do not depend on frame rate.
 */
function foodSilhouetteClearance(outward, distance, head, food) {
  const dx = food.x - head.x, dz = food.z - head.z, dy = 0.2;
  const side = Math.hypot(outward.x, outward.z);
  const depth = distance - (dx * outward.x + dy * outward.y + dz * outward.z);
  if (depth <= 0.5 || side < 0.1) return -Infinity;
  const horizontal = (dx * outward.z - dz * outward.x) / (side * depth);
  const vertical = (-dx * outward.x * outward.y / side + dy * side - dz * outward.z * outward.y / side) / depth;
  // Fruit plus leaves against the head, in angular camera-space units.
  return Math.hypot(horizontal, vertical) - (0.46 / depth + 0.38 / distance);
}

function clearFoodSightline(outward, distance, head, food) {
  if (!food || !Number.isFinite(food.x) || !Number.isFinite(food.z)) return outward;
  const dx = food.x - head.x, dz = food.z - head.z;
  // A fruit behind the face or far across the board must not redirect the shot.
  if (Math.hypot(dx, dz) > 3.5 || dx * outward.x + dz * outward.z + 0.2 * outward.y <= 0.15) return outward;
  const originalClearance = foodSilhouetteClearance(outward, distance, head, food);
  if (originalClearance >= 0.015) return outward;
  let best = outward, bestScore = originalClearance;
  // No camera cuts or extra render passes: the existing renderer eases the
  // chosen offset, and the exact same head remains centered.
  for (const degrees of [-45, -30, 30, 45]) {
    const angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
    const candidate = normalize({
      x: outward.x * cos - outward.z * sin,
      y: outward.y,
      z: outward.x * sin + outward.z * cos,
    });
    const score = foodSilhouetteClearance(candidate, distance, head, food) - 0.018 * Math.abs(degrees) / 45;
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  // Hysteresis-free stable decision with a useful improvement threshold.
  return bestScore >= originalClearance + 0.025 ? best : outward;
}

/*
 * Architectural occlusion guard for the close character shot. The world supplies
 * fixed, bounded volumes for its columns and foreground trees; only the camera
 * moves. This is deliberately not raycasting the full high-poly environment
 * on each tick. It has no authority over gameplay or movement and allocates no
 * GPU resources. A volume behind the head must never affect the shot.
 */
export function cameraOcclusionCost(outward, distance, head, occluders = []) {
  let cost = 0;
  for (const volume of occluders) {
    const { x, y, z, radius } = volume;
    if (![x, y, z, radius].every(Number.isFinite) || radius <= 0) continue;
    const dx = x - head.x, dy = y - 0.4, dz = z - head.z;
    const along = dx * outward.x + dy * outward.y + dz * outward.z;
    if (along <= 0.55 || along > distance + radius) continue;
    const at = Math.min(distance, along);
    const gap = Math.hypot(dx - outward.x * at, dy - outward.y * at, dz - outward.z * at);
    // A small clearance prevents close silhouettes from touching the eyes.
    cost += Math.max(0, radius + 0.12 - gap) / (radius + 0.12);
  }
  return cost;
}

function avoidForegroundOcclusion(outward, distance, head, food, occluders) {
  if (!occluders?.length) return outward;
  const baseline = cameraOcclusionCost(outward, distance, head, occluders);
  if (baseline === 0) return outward;
  const foodCost = candidate => {
    if (!food || !Number.isFinite(food.x) || !Number.isFinite(food.z)) return 0;
    const dx = food.x - head.x, dz = food.z - head.z;
    if (Math.hypot(dx, dz) > 3.5 || dx * candidate.x + dz * candidate.z + 0.2 * candidate.y <= 0.15) return 0;
    return Math.max(0, 0.025 - foodSilhouetteClearance(candidate, distance, head, food));
  };
  let best = outward, bestCost = baseline * 3 + foodCost(outward) * 2;
  // Prefer a modest pivot before a higher angle or a strong swing. Candidates
  // keep the same 3D face target and distance, so no crop/zoom discontinuity.
  for (const lift of [0, 0.13, 0.28, 0.43]) {
    for (const degrees of [0, -25, 25, -40, 40, -55, 55]) {
      if (!lift && !degrees) continue;
      const angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
      const candidate = normalize({
        x: outward.x * cos - outward.z * sin,
        y: outward.y + lift,
        z: outward.x * sin + outward.z * cos,
      });
      const penalty = cameraOcclusionCost(candidate, distance, head, occluders);
      const cost = 3 * penalty + 2 * foodCost(candidate)
        + Math.abs(degrees) * 0.0009 + lift * 0.13;
      if (cost < bestCost) { best = candidate; bestCost = cost; }
    }
  }
  // Deliberately avoid flutter for tiny improvements around a stone edge;
  // the existing renderer smoothly eases meaningful presentation changes.
  return bestCost + 0.055 < baseline * 3 + foodCost(outward) * 2 ? best : outward;
}

// Fit the world in perspective instead of moving a landscape composition far
// away on phones. Portrait looks across the short side of the same real board.
export function cameraComposition({ width, height, aspect, mode = 'overview', head = { x: 0, z: 0 }, direction = { x: 0, z: 1 }, food = null, occluders = [] }) {
  const portrait = aspect < 1;
  // BEGIN R56 PORTRAIT OVERVIEW STAGING
  // Tall broadcasts give the real board extra vertical screen space by
  // approaching a more overhead angle, while retaining a perspective 3D view.
  // Keep follow/detail, public transforms, complete board fit and GPU work intact.
  // Smooth aspect dependence prevents a camera snap during portrait resizing.
  const portraitOverviewX = portrait && mode === 'overview'
    ? 0.20 + 0.32 * Math.max(0, Math.min(1, (aspect - 0.45) / 0.55))
    : 0.52;
  let outward = normalize(portrait ? { x: portraitOverviewX, y: 0.85, z: 0.02 }
    : { x: 0.12, y: 0.77, z: 0.67 });
  // END R56 PORTRAIT OVERVIEW STAGING
  const target = mode === 'overview' ? { x: 0, y: 0.4, z: 0 } : { x: head.x, y: 0.4, z: head.z };
  let distance;
  if (mode === 'detail') {
    // A 12.7-degree pitch lets the upper frame see the garden horizon instead
    // of intersecting only the floor. Keep the exact head target and frontal
    // three-quarter azimuth; 4.55 units retains >200px facial diameter at 900px.
    outward = normalize({ x: direction.x * 0.82 - direction.z * 0.34, y: 0.20, z: direction.z * 0.82 + direction.x * 0.34 });
    distance = portrait ? 5.2 : 4.55;
    outward = clearFoodSightline(outward, distance, head, food);
    outward = avoidForegroundOcclusion(outward, distance, head, food, occluders);
  } else if (mode === 'follow') {
    distance = portrait ? 14 : 16;
  } else {
    const right = normalize({ x: outward.z, y: 0, z: -outward.x });
    const up = { x: outward.y * right.z, y: outward.z * right.x - outward.x * right.z, z: -outward.y * right.x };
    const tan = Math.tan(Math.PI / 10);
    distance = 1;
    const bounds = [];
    for (const x of [-width / 2 - 1.7, width / 2 + 1.7]) {
      for (const z of [-height / 2 - 2.1, height / 2 + 2.1]) {
        for (const y of [-2.2, 0.7]) bounds.push({ x, y: y - target.y, z });
      }
    }
    // The authored trees and arch stand behind the board, not at its front corners.
    for (const x of [-width * 0.46, width * 0.46]) bounds.push({ x, y: 5.5 - target.y, z: -height / 2 - 2.1 });
    for (const point of bounds) distance = Math.max(distance, dot(point, outward) + Math.max(Math.abs(dot(point, right)) / (tan * aspect), Math.abs(dot(point, up)) / tan));
    distance *= 1.04;
  }
  return { target, offset: { x: outward.x * distance, y: outward.y * distance, z: outward.z * distance } };
}
