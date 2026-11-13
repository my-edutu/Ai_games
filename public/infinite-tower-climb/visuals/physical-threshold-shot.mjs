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
