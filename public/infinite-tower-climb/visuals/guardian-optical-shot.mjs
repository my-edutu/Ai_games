// P0 portrait guardian / earned cap scene: optically frame the TWO actual
// source-backed silhouettes without dragging the exterior camera through the
// opaque clockwork core. This module never chooses gameplay, edits collisions,
// creates actors, invokes the renderer or infers an event from a video clock.
// NDC bodies are measured after all real camera/geometry safety corrections:
// [x, y, z, projected full-body half-height]. The caller owns source validity.
const BASE_FOV = 42;
const MIN_FOV = 31;
const RAD = Math.PI / 180;
const finite = Number.isFinite;
const body = b => Array.isArray(b) && b.length === 4 &&
  b.every(finite) && b[3] > 0 && b[2] >= -1 && b[2] <= 1;

export function observedGuardianPortraitOpticalFov({
  aspect, currentFov, actor, partner, landing = null, blocked = false,
}) {
  if (![aspect,currentFov].every(finite) || aspect < .35 || aspect >= .85 ||
      currentFov < MIN_FOV - .5 || currentFov > BASE_FOV + .5 ||
      blocked || !body(actor) || !body(partner)) return BASE_FOV;
  // Existing artist-authored 42-degree reference framing, independent of
  // where the previous optical adjustment left this lens. Prevent a ratchet
  // toward an ever-narrower FOV across duplicate render frames.
  const referenceScale = Math.tan(currentFov * RAD / 2) /
    Math.tan(BASE_FOV * RAD / 2);
  const h = actor.map((v,i) => i < 3 && i !== 2 ? v * referenceScale :
    i === 3 ? v * referenceScale : v);
  const g = partner.map((v,i) => i < 3 && i !== 2 ? v * referenceScale :
    i === 3 ? v * referenceScale : v);
  // A crop, near-camera boss or already-large protagonist must stay under
  // the existing physical camera-rescue policy, NOT trigger optical zoom.
  if (h[3] < .018 || h[3] > .15 || g[3] < .017 || g[3] > .22 ||
      Math.abs(h[0]) + h[3] * .25 >= .79 ||
      Math.abs(h[1]) + h[3] >= .79 ||
      Math.abs(g[0]) + g[3] * .25 >= .83 ||
      Math.abs(g[1]) + g[3] >= .83) return BASE_FOV;
  // When bodies physically coincide on screen, zoom would make one body
  // mask the other. Let the existing two-actor orbit/physical world win.
  if (Math.abs(h[0] - g[0]) < .10 &&
      Math.abs(h[1] - g[1]) < Math.max(.13, h[3] + g[3]) * .75)
    return BASE_FOV;
  const limits = [
    .71 / (Math.abs(h[0]) + h[3] * .27),
    .71 / (Math.abs(h[1]) + h[3]),
    .76 / (Math.abs(g[0]) + g[3] * .25),
    .75 / (Math.abs(g[1]) + g[3]),
  ];
  if (landing !== null) {
    if (!Array.isArray(landing) || landing.length !== 3 ||
        !landing.every(finite) || landing[2] < -1 || landing[2] > 1)
      return BASE_FOV;
    limits.push(.73 / (Math.abs(landing[0]) * referenceScale),
      .73 / (Math.abs(landing[1]) * referenceScale));
  }
  // No change to the actual camera position, spotlight, clipping or path.
  // A bounded 1.38x optional optical enlargement gives phone-sized actors
  // readable weight only when both current bodies and the selected real
  // landing/door can fit in the same central portrait action window.
  const enlargement = Math.min(1.38, ...limits);
  if (!finite(enlargement) || enlargement <= 1.04) return BASE_FOV;
  const targetFov = 2 * Math.atan(Math.tan(BASE_FOV * RAD / 2) /
    enlargement) / RAD;
  return Math.max(MIN_FOV, Math.min(BASE_FOV, targetFov));
}

export function boundedGuardianOpticalFov(current, target, dt) {
  if (![current,target,dt].every(finite) || current < MIN_FOV - .5 ||
      current > BASE_FOV + .5 || target < MIN_FOV || target > BASE_FOV ||
      dt <= 0 || dt > .5) return BASE_FOV;
  // 12 degrees per PRESENTED second, max 0.72 degrees for a delayed rAF;
  // no instantaneous guardian zoom and no synthetic simulation slowdown.
  const step = Math.min(.72, Math.min(.06, dt) * 12);
  return Math.abs(target - current) <= step
    ? target : current + Math.sign(target-current) * step;
}

export const GUARDIAN_OPTICAL_BASE_FOV = BASE_FOV;
