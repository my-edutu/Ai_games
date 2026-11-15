// One final physically measured camera arbitration for the SAME source-earned
// old bronze gateway and the actually drawn living climber. This scores real
// projected body/door positions, not game ticks, a cosmetic fade or CI success.
// The scene owns Three.js projection, opaque-core rays and camera rollback.
const finite = Number.isFinite;
function valid(bounds) {
  return Array.isArray(bounds) && bounds.length === 4 &&
    bounds.every(finite) && bounds[3] >= 0 &&
    bounds[2] >= -1 && bounds[2] <= 1;
}
function overflow(bounds, x, y) {
  return Math.max(0, Math.abs(bounds[0]) + bounds[3] * .12 - x) +
    Math.max(0, Math.abs(bounds[1]) + bounds[3] - y);
}
export function sourceDoorwayFrameGain(beforeHero, beforeDoor, afterHero, afterDoor,
    heroClear, doorClear) {
  if (![beforeHero, beforeDoor, afterHero, afterDoor].every(valid) ||
      heroClear !== true || doorClear !== true ||
      afterHero[3] < .055 ||
      Math.abs(afterHero[0]) + afterHero[3] * .12 >= .82 ||
      Math.abs(afterHero[1]) + afterHero[3] >= .82 ||
      Math.abs(afterDoor[0]) + afterDoor[3] * .12 >= 1.35 ||
      Math.abs(afterDoor[1]) + afterDoor[3] >= 1.18) return 0;
  const heroBefore = overflow(beforeHero, .61, .65);
  const heroAfter = overflow(afterHero, .61, .65);
  const doorBefore = overflow(beforeDoor, .60, .67);
  const doorAfter = overflow(afterDoor, .60, .67);
  // The bronze door must genuinely improve; making only the actor prettier
  // is NOT justification for an earned-gateway camera change.
  if (doorBefore < .04 || doorAfter >= doorBefore - .009 ||
      heroAfter > heroBefore + .035) return 0;
  const gain = doorBefore - doorAfter + (heroBefore - heroAfter) * 1.7;
  return gain > .016 ? Math.min(2, gain) : 0;
}
export function sourceDoorwayFrameSteps(dt, aspect) {
  if (!finite(dt) || dt <= 0 || dt > .5 ||
      !finite(aspect) || aspect <= .35 || aspect >= 2.5) return null;
  const frame = Math.min(.06, dt);
  // A stable exterior 3D camera, no sudden cut or independent animation.
  return {
    gazeMetres: Math.min(.64, frame * (aspect < .85 ? 9 : 7)),
    orbitRadians: Math.min(.035, frame * (aspect < .85 ? .72 : .55)),
  };
}


// Source-authenticated FIRST Floor9 doorway: the existing four tiny camera
// probes could not see around actual moving-platform skirts or the reopened
// bronze guardian gateway in the normal-speed portrait film. Search a bounded
// exterior volume, starting with the least disruptive physical shoulder and
// escalating only when current source-owned triangles really block the body
// or original gate. The camera owner still requires safe projection, solid-
// core clearance and a strictly improved genuine ray result for every move.
// Returned offsets are meters/radians applied to the PRESENT camera, not
// a predicted player trajectory, synthetic scene or replayed frame.
const DESKTOP_SOURCE_CLEARANCE = Object.freeze([
  Object.freeze([-.045,1.6,1.8]),Object.freeze([.045,1.6,1.8]),
  Object.freeze([-.105,2.8,2.8]),Object.freeze([.105,2.8,2.8]),
  Object.freeze([0,3.6,3.8]),
  Object.freeze([-.17,3.5,4.2]),Object.freeze([.17,3.5,4.2]),
  Object.freeze([0,-1.9,3.8])
]);
const PORTRAIT_SOURCE_CLEARANCE = Object.freeze([
  Object.freeze([-.06,1.8,2.2]),Object.freeze([.06,1.8,2.2]),
  Object.freeze([-.115,3.2,3.2]),Object.freeze([.115,3.2,3.2]),
  Object.freeze([0,4.0,4.0]),
  Object.freeze([-.19,3.7,4.3]),Object.freeze([.19,3.7,4.3]),
  Object.freeze([0,-1.7,4.0])
]);
export function sourceDeckGatewayClearanceCandidates(aspect, actualDeckRays) {
  if (!finite(aspect) || aspect<.38 || aspect>2.1 ||
      actualDeckRays?.active!==true ||
      !Number.isSafeInteger(actualDeckRays.bodyBlockedRays) ||
      !Number.isSafeInteger(actualDeckRays.gatewayBlockedRays) ||
      actualDeckRays.bodyBlockedRays<0 ||
      actualDeckRays.gatewayBlockedRays<0 ||
      actualDeckRays.bodyBlockedRays+actualDeckRays.gatewayBlockedRays===0)
    return null;
  return aspect<.85 ? PORTRAIT_SOURCE_CLEARANCE : DESKTOP_SOURCE_CLEARANCE;
}
