import { sculptRuinedGateway } from './world.mjs';

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
    : { x: 0.12, y: 0.65, z: 0.77 });
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
    // T1/T2 close spectator tracking: stay with the real public head and
    // show the complete authored forest in perspective, rather than shrinking
    // a living protagonist into the large board. The full-board overview is
    // unaffected and always available; no extra render pass or game mutation.
    outward = normalize({ x: .16, y: .68, z: .72 });
    // A materially readable normal spectator silhouette, not a false hero
    // rescale. The same real world/collision positions and 36-degree lens
    // remain unchanged. Manual overview still includes the entire board.
    distance = portrait ? 9.0 : 9.5;
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
    // Real full-scene composition: include the now genuinely board-scaled
    // original 3D gateway and its piers in the safe board overview. No camera
    // cut or cropped foliage masquerades as a better world; the entire true
    // playable grid remains visible on both wide and 390px portrait output.
    const gateway = sculptRuinedGateway(width, height);
    bounds.push({ x: gateway.centre, y: gateway.apexY + .50 - target.y, z: gateway.z });
    for (const pier of gateway.columns)
      bounds.push({ x: pier.x, y: pier.height + .75 - target.y, z: gateway.z });
    for (const x of [-width * 0.46, width * 0.46]) bounds.push({ x, y: 5.5 - target.y, z: -height / 2 - 2.1 });
    for (const point of bounds) distance = Math.max(distance, dot(point, outward) + Math.max(Math.abs(dot(point, right)) / (tan * aspect), Math.abs(dot(point, up)) / tan));
    distance *= 1.04;
  }
  return { target, offset: { x: outward.x * distance, y: outward.y * distance, z: outward.z * distance } };
}


/**
 * Actual 36-degree perspective face-safety measurement for the real WebGL
 * follow/detail shot. A world-space square dead zone can include points that
 * are OUTSIDE the screen after foreshortening (particularly diagonal moves or
 * a narrow 390px broadcast). Calculate true camera-right, -up and depth from
 * the original held camera; keep an authored 0.55-unit eye/head silhouette
 * margin. This is CPU-only presentation arithmetic: no authority, new render
 * target, geometry, textures, reduced-resolution trick, or skipped 3D layer.
 * Return world-space screen-edge clearance; negative means face is cropped.
 */
export function cameraHeadFrustumMargin({ head, target, offset, aspect, headRadius = .55 } = {}) {
  if (!head || !target || !offset || !Number.isFinite(aspect) || aspect <= 0 ||
      ![head.x,head.z,target.x,target.y,target.z,offset.x,offset.y,offset.z,headRadius].every(Number.isFinite) ||
      headRadius < 0) return -Infinity;
  const cameraDistance = Math.hypot(offset.x,offset.y,offset.z);
  const groundDistance = Math.hypot(offset.x,offset.z);
  if (cameraDistance <= .01 || groundDistance <= .01) return -Infinity;
  const dx = head.x-target.x, dz = head.z-target.z;
  // The face is approximately at the look-at height. All real serpent motion
  // remains at its original unmodified y; reserve headRadius for variation.
  const depth = cameraDistance-(dx*offset.x+dz*offset.z)/cameraDistance;
  if (depth <= .1) return -Infinity;
  const right = (dx*offset.z-dz*offset.x)/groundDistance;
  const up = -(dx*offset.x+dz*offset.z)*offset.y/(cameraDistance*groundDistance);
  const halfHeight = depth*Math.tan(Math.PI/10);
  return Math.min(halfHeight*aspect-Math.abs(right)-headRadius,
    halfHeight-Math.abs(up)-headRadius);
}

/**
 * A truthful, bounded cinematic composition dead-zone.
 *
 * In follow/detail shots the public head is allowed to move inside a small,
 * aspect-aware window before the spectator camera repositions. This avoids
 * rebuilding expensive *unchanged* static scenery every animation callback,
 * while the actual serpent, water and danger cues keep moving independently.
 * A portal jump, restart, shot switch, resize or reduced-motion preference
 * changes reset the anchor once. Reduced motion then holds the same actual
 * photographic pose until the real head leaves its safe window. This never
 * reads or mutates authority.
 */
export function createPresentationCameraAnchor() {
  let held = null;
  let previousHead = null;
  const clone = point => ({ x: point.x, y: point.y, z: point.z });
  const reset = () => { held = null; previousHead = null; };
  function resolve({ mode, runToken, head, target, offset, reducedMotion = false, aspect = 1.5,
    discontinuity = false, gpuPressure = false, width, height }) {
    if (!target || !offset || !head || ![target.x,target.y,target.z,offset.x,offset.y,offset.z,head.x,head.z].every(Number.isFinite))
      throw new TypeError('Camera anchor requires finite public composition coordinates');
    const actualMode = mode === 'follow' || mode === 'detail' ? mode : 'overview';
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1.5;
    const landmark = { x: head.x, z: head.z };
    const previousPublicHead = previousHead;
    const headJump = previousPublicHead
      ? Math.hypot(head.x - previousPublicHead.x, head.z - previousPublicHead.z) > 3.25
      : false;
    previousHead = landmark;
    // A completed, genuinely slow GPU fence may justify a slightly wider
    // spectator safe window; avoid repeated expensive intermediate full-world
    // perspectives, but still reframe when the actual public serpent leaves
    // the bounded 3D composition. Normal and unsupported devices are unchanged.
    const nominalLimit = (actualMode === 'detail' ? 0.72 : 2.4)
      * Math.max(0.5, Math.min(1, safeAspect / 1.5))
      * (gpuPressure ? 1.25 : 1);
    // Portrait's actual projected horizontal width can be smaller than the
    // nominal desktop dead-zone. At 390x844 the original 1.5-unit x/z hold
    // exceeded the visible 36-degree camera half-width, intermittently
    // leaving the public head outside frame. Respect the TRUE 3D perspective
    // and reserve room for head/eye silhouette, even on a stalled GPU.
    const projectedHalfWidth = Math.tan(Math.PI/10) *
      Math.hypot(offset.x,offset.y,offset.z) * safeAspect;
    const limit = safeAspect < .75 ? Math.min(nominalLimit,
      Math.max(.15,projectedHalfWidth-(actualMode==='detail'?.55:.5))) : nominalLimit;
    const needsReset = !held || held.mode !== actualMode ||
      held.runToken !== runToken || held.discontinuity !== discontinuity || Math.abs(held.aspect - safeAspect) > 0.03 ||
      headJump || held?.reducedMotion !== reducedMotion || actualMode === 'overview' ||
      (safeAspect < .75
        ? Math.hypot(head.x - held.head.x,head.z - held.head.z) > limit
        : Math.abs(head.x - held.head.x) > limit || Math.abs(head.z - held.head.z) > limit) ||
      // The former axis-only test could HOLD a view with the real head already
      // beyond the perspective vertical face margin during diagonal motion.
      // Reframe before a complete real frame is submitted with a cropped hero.
      (held && actualMode !== 'overview' && cameraHeadFrustumMargin({
        head, target: held.target, offset: held.offset, aspect: safeAspect,
      }) < 0);
    const snap = !held || held.mode !== actualMode || held.runToken !== runToken ||
      Math.abs(held.aspect - safeAspect) > 0.03 || held?.discontinuity !== discontinuity || headJump || reducedMotion || held?.reducedMotion !== reducedMotion ||
      actualMode === 'overview';
    if (needsReset) {
      const framedTarget = clone(target);
      // Authentic GPU-fence starvation makes an already-earned follow camera
      // transition exceptionally costly (~265ms live full scene vs ~23ms
      // cached on the source-matched complete-world diagnostic). When the
      // public serpent leaves its true safe window, compose the next real
      // camera shot slightly AHEAD along the last observed continuous path.
      // This leaves the full 3D garden/serpent/water untouched and lets that
      // exact settled photograph survive longer, without holding a stale image.
      // No anticipation across portal/restart/shot/resize/reduced-motion cuts.
      const continuousFollow = gpuPressure === true && actualMode === 'follow' &&
        previousPublicHead && held && held.mode === actualMode &&
        held.runToken === runToken && !headJump && !discontinuity &&
        !held.discontinuity && !reducedMotion && !held.reducedMotion &&
        Math.abs(held.aspect-safeAspect) <= .03;
      if (continuousFollow) {
        const lead = Math.min(1.2, limit * .42);
        const bound = (position, extent) => Number.isFinite(extent) && extent >= 4
          ? Math.max(-extent/2+1,Math.min(extent/2-1,position)) : position;
        // A last public displacement is evidence of actual motion, not a
        // predicted AI route or private state. Ignore sub-cell interpolation
        // jitter rather than introducing periodic camera tremor.
        const dx=head.x-previousPublicHead.x,dz=head.z-previousPublicHead.z;
        framedTarget.x = bound(target.x + (Math.abs(dx) >= .125 ? Math.sign(dx)*lead : 0), width);
        framedTarget.z = bound(target.z + (Math.abs(dz) >= .125 ? Math.sign(dz)*lead : 0), height);
        // Lookahead is editorial only; if the true perspective would hide the
        // real face (including near a shore or on a phone), use the exact public
        // head target. Never enlarge the lens or move the playable board.
        if (cameraHeadFrustumMargin({head,target:framedTarget,offset,aspect:safeAspect}) < 0) {
          framedTarget.x = target.x;
          framedTarget.z = target.z;
        }
      }
      // A portal/recovery can arrive with an editorial target from the prior
      // scene or a lagging spectator shot. Never repeatedly cut to that stale
      // composition with the actual public head still outside the 3D lens.
      // Recenter the real public actor on the next genuine static-world view;
      // this changes no game position, timing, or discontinuity semantics.
      let forcedPublicHeadCenter = false;
      if (actualMode !== 'overview' && cameraHeadFrustumMargin({
        head, target: framedTarget, offset, aspect: safeAspect,
      }) < 0) {
        framedTarget.x = head.x;
        framedTarget.z = head.z;
        forcedPublicHeadCenter = true;
      }
      held = {
        mode: actualMode, runToken,
        // Anchor the safety window to the photographic viewpoint, not to the
        // actor's old coordinate; the real actor remains within `limit`.
        head: { x: forcedPublicHeadCenter ? landmark.x : landmark.x + framedTarget.x - target.x,
          z: forcedPublicHeadCenter ? landmark.z : landmark.z + framedTarget.z - target.z }, aspect: safeAspect,
        reducedMotion, discontinuity, target: framedTarget, offset: clone(offset),
      };
    }
    return { target: clone(held.target), offset: clone(held.offset), reset: needsReset, snap };
  }
  return { resolve, reset };
}


/**
 * Camera editorial response to *observed* GPU backpressure, not to nominal
 * requestAnimationFrame cadence. A normal device retains eased cinematic
 * tracking. On a genuinely starved GPU a follow/detail dead-zone reframe becomes a
 * single truthful, full-3D camera edit instead of ~20 uncached full-world
 * renders at successive intermediate viewpoints. Original gameplay positions,
 * head silhouette, lighting, water, full overview, and accessible controls
 * stay untouched. The latest *completed* fence latency is essential here:
 * a historical max would permanently impose cuts after one isolated stall.
 */
export function observedCameraGpuPressure(queue) {
  return queue?.supported === true && queue.failed === false &&
    // The last genuinely completed slow fence stops authorizing involuntary
    // camera hard cuts after an idle, empty GPU queue. An actively queued
    // renderer may remain legitimately pressured until its next completion.
    !(queue.pending === 0 && Number.isFinite(queue.lastObservedAgeMs) &&
      queue.lastObservedAgeMs > 1500) &&
    Number.isFinite(queue.lastObservedLatencyMs) && queue.lastObservedLatencyMs >= 120 &&
    Number.isFinite(queue.skipped) && queue.skipped >= 16;
}

/**
 * When a settled world view needs to rebuild its HDR/depth/display cache,
 * three complete GPU passes can prolong a queue already proven to be starved
 * by completed WebGL fences. Keep the entire original Three.js scene instead:
 * one direct fully lit draw (with water, serpent, contact and cues) is cheaper
 * than rebuilding static color/depth plus display and then drawing live layers.
 * A valid cache hit always retains the faster cached path. Unsupported, lost,
 * or merely slow-RAF renderers cannot trigger a speculative downgrade.
 */
export function shouldRenderFullSceneOnCacheMiss({ queue, cacheHit = false, shadowDirty = false } = {}) {
  return (!cacheHit || shadowDirty) && observedCameraGpuPressure(queue);
}

export function shouldCutUnderGpuPressure({ mode, anchor, queue, inTransit = false } = {}) {
  // GPU fences may finish after a follow/detail reframe has already started.
  // That first slow frame is not enough evidence to decide on a cut; however,
  // continuing its easing AFTER real queue pressure becomes measurable keeps
  // rebuilding the entire static garden at successive transient viewpoints.
  // Complete the exact requested 3D shot once instead. The genuine serpent,
  // water, cues and gameplay continue, and healthy GPUs retain smooth motion.
  const pendingShot = anchor?.reset === true || inTransit === true;
  return (mode === 'follow' || mode === 'detail') && pendingShot &&
    anchor?.snap === false && observedCameraGpuPressure(queue);
}

/**
 * Single, authoritative viewer-camera pose transition. The immutable public
 * snapshot determines the desired shot; this function only moves real Three.js
 * camera vectors and cannot affect the snake's path, movement, portals or AI.
 * Hard discontinuities are true photographic cuts: both position-offset and
 * look-at target must snap together. Interpolating the offset after a portal or
 * shot change creates a false journey across the board, risks hiding danger,
 * and forces a full static-world GPU redraw on every intermediate frame.
 * Normal continuous head recentering still eases, then settles exactly so the
 * existing high-quality HDR/depth world cache can be reused losslessly.
 */
export function advancePresentationCameraPose(currentTarget, currentOffset, desiredTarget, desiredOffset,
  { hardCut = false, overview = false, delta = 1 / 60 } = {}) {
  for (const point of [currentTarget, currentOffset, desiredTarget, desiredOffset]) {
    if (!point || ![point.x,point.y,point.z].every(Number.isFinite) ||
        typeof point.distanceToSquared !== 'function')
      throw new TypeError('Viewer camera requires finite Three.js vectors');
  }
  const safeDelta = Number.isFinite(delta) ? Math.min(Math.max(delta,0),.5) : 1/60;
  const mix = hardCut ? 1 : 1 - Math.exp(-safeDelta * 12);
  if (hardCut || overview) currentTarget.copy(desiredTarget);
  else currentTarget.lerp(desiredTarget, mix);
  if (hardCut) currentOffset.copy(desiredOffset);
  else currentOffset.lerp(desiredOffset, mix);
  // Exact source-owned pose reuse: never round the viewpoint across a visible
  // parallax gap, and never add a further camera movement to a true hard cut.
  if (currentTarget.distanceToSquared(desiredTarget) < 1e-4) currentTarget.copy(desiredTarget);
  if (currentOffset.distanceToSquared(desiredOffset) < 1e-4) currentOffset.copy(desiredOffset);
  return { cut: !!hardCut, settled: currentTarget.equals(desiredTarget) && currentOffset.equals(desiredOffset) };
}
