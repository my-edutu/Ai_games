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
  if (!finite(aspect) || !finite(currentFov) || aspect < .35 || aspect >= .85 ||
      currentFov < MIN_FOV - .5 || currentFov > BASE_FOV + .5 ||
      blocked || !body(actor) || !body(partner)) return BASE_FOV;
  // Existing artist-authored 42-degree reference framing, independent of
  // where the previous optical adjustment left this lens. Prevent a ratchet
  // toward an ever-narrower FOV across duplicate render frames.
  const referenceScale = Math.tan(currentFov * RAD / 2) /
    Math.tan(BASE_FOV * RAD / 2);
  const hx = actor[0] * referenceScale, hy = actor[1] * referenceScale;
  const hh = actor[3] * referenceScale, gx = partner[0] * referenceScale;
  const gy = partner[1] * referenceScale, gh = partner[3] * referenceScale;
  // A crop, near-camera boss or already-large protagonist must stay under
  // the existing physical camera-rescue policy, NOT trigger optical zoom.
  if (hh < .018 || hh > .15 || gh < .017 || gh > .22 ||
      Math.abs(hx) + hh * .25 >= .79 ||
      Math.abs(hy) + hh >= .79 ||
      Math.abs(gx) + gh * .25 >= .83 ||
      Math.abs(gy) + gh >= .83) return BASE_FOV;
  // When bodies physically coincide on screen, zoom would make one body
  // mask the other. Let the existing two-actor orbit/physical world win.
  if (Math.abs(hx - gx) < .10 &&
      Math.abs(hy - gy) < Math.max(.13, hh + gh) * .75)
    return BASE_FOV;
  let enlargement = Math.min(1.38,
    .71 / (Math.abs(hx) + hh * .27),
    .71 / (Math.abs(hy) + hh),
    .76 / (Math.abs(gx) + gh * .25),
    .75 / (Math.abs(gy) + gh));
  if (landing !== null) {
    if (!Array.isArray(landing) || landing.length !== 3 ||
        !landing.every(finite) || landing[2] < -1 || landing[2] > 1)
      return BASE_FOV;
    enlargement = Math.min(enlargement,
      .73 / (Math.abs(landing[0]) * referenceScale),
      .73 / (Math.abs(landing[1]) * referenceScale));
  }
  // No change to the actual camera position, spotlight, clipping or path.
  // A bounded 1.38x optional optical enlargement gives phone-sized actors
  // readable weight only when both current bodies and the selected real
  // landing/door can fit in the same central portrait action window.
  if (!finite(enlargement) || enlargement <= 1.04) return BASE_FOV;
  const targetFov = 2 * Math.atan(Math.tan(BASE_FOV * RAD / 2) /
    enlargement) / RAD;
  return Math.max(MIN_FOV, Math.min(BASE_FOV, targetFov));
}


// A DIFFERENT real portrait problem requires an opposite optical response.
// Original e708f087 unedited 390x844 danger WebM at ~16–24s repeatedly
// separated the LIVE guardian and the airborne climber vertically, leaving
// one above the portrait crop. Zooming closer (31°) cannot recover a
// missing full-body actor. Calculate a source-observed 42°-equivalent frame
// from the actual submitted camera, then open the lens only enough to keep
// BOTH complete drawn bodies and the authentic selected landing/exit in one
// safe action window. This is neither an inferred threat nor an auto-camera
// cut. The existing core rays / active guardian / manual mode / reduced
// motion veto stay outside this pure function.
export function observedGuardianPortraitActionFov({
  aspect, currentFov, actor, partner, landing = null, blocked = false,
}) {
  const MAX_FOV = 62;
  if (!finite(aspect) || !finite(currentFov) || aspect < .35 ||
      aspect >= .85 || currentFov < MIN_FOV - .5 ||
      currentFov > MAX_FOV + .5 || blocked ||
      !body(actor) || !body(partner)) return BASE_FOV;
  const referenceScale = Math.tan(currentFov * RAD / 2) /
    Math.tan(BASE_FOV * RAD / 2);
  const references = [actor, partner].map(subject=>({
    x:Math.abs(subject[0]) * referenceScale,
    y:Math.abs(subject[1]) * referenceScale,
    half:subject[3] * referenceScale,
  }));
  const requiredRatios = [];
  for(const subject of references) {
    requiredRatios.push(.72 / (subject.x + subject.half * .28),
      .75 / (subject.y + subject.half));
  }
  if (landing !== null) {
    if (!Array.isArray(landing) || landing.length !== 3 ||
        !landing.every(finite) || landing[2] < -1 || landing[2] > 1)
      return BASE_FOV;
    requiredRatios.push(.73 / (Math.abs(landing[0]) * referenceScale),
      .73 / (Math.abs(landing[1]) * referenceScale));
  }
  const possibleScale=Math.min(...requiredRatios);
  // The 42° artist lens is still the default. Do not widen an ordinary
  // legible fight or alternately close and reopen the same two bodies.
  if (possibleScale >= .99) {
    return observedGuardianPortraitOpticalFov({
      aspect, currentFov, actor, partner, landing, blocked,
    });
  }
  // No credible optical rescue exists if one required real destination or
  // silhouette is outside even the 62° lens. Do NOT claim a safe shot by
  // zooming out when one participant remains cropped or behind tower stone.
  const widestScale = Math.tan(BASE_FOV * RAD / 2) /
    Math.tan(MAX_FOV * RAD / 2);
  if (!finite(possibleScale) || possibleScale < widestScale - .000001)
    return BASE_FOV;
  const requiredFov = 2 * Math.atan(Math.tan(BASE_FOV * RAD / 2) /
    possibleScale) / RAD;
  return Math.min(MAX_FOV, Math.max(BASE_FOV, requiredFov));
}

export function boundedGuardianOpticalFov(current, target, dt) {
  if (![current,target,dt].every(finite) || current < MIN_FOV - .5 ||
      current > 62.5 || target < MIN_FOV || target > 62 ||
      dt <= 0 || dt > .5) return BASE_FOV;
  // 12 degrees per PRESENTED second, max 0.72 degrees for a delayed rAF;
  // no instantaneous guardian zoom and no synthetic simulation slowdown.
  // Widen at most 1.2° per submitted frame; the normal close/restore
  // 31–42° optical cadence is unchanged. Slow browser rAF cannot cause
  // a sudden cut, and returning from a wide encounter uses the same bound.
  const wider = current > BASE_FOV || target > BASE_FOV;
  const step = wider
    ? Math.min(1.2, Math.min(.06, dt) * 22)
    : Math.min(.72, Math.min(.06, dt) * 12);
  return Math.abs(target - current) <= step
    ? target : current + Math.sign(target-current) * step;
}

export const GUARDIAN_OPTICAL_BASE_FOV = BASE_FOV;
