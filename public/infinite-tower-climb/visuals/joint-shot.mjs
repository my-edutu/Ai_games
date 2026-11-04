// Presentation-only, source-observed two-body camera continuity.
// The ordinary exterior follow lens remains authoritative for visual staging;
// this guard permits a SMALL continuation toward that already approved lens
// only when the actual submitted portrait frame is losing BOTH action subjects.
// No prediction, camera cuts, WebGL allocations, gameplay mutations, or RNG.
const validBody = body => Array.isArray(body) && body.length === 4 &&
  body.every(Number.isFinite) && body[3] > 0 && body[3] < 2 &&
  body[2] >= -1 && body[2] <= 1;
const validPoint = point => Array.isArray(point) && point.length === 3 &&
  point.every(Number.isFinite) && point[2] >= -1 && point[2] <= 1;

export function observedJointBodyPressure(body, aspect, role = 'actor') {
  if (!validBody(body) || !Number.isFinite(aspect) ||
    aspect <= 0 || aspect >= .85) return Infinity;
  const horizontal = role === 'guardian' ? .80 : .76;
  const vertical = role === 'guardian' ? .78 : .76;
  return Math.max(0, Math.abs(body[0]) / horizontal - 1,
    (Math.abs(body[1]) + body[3]) / vertical - 1);
}

// Return a measured improvement in the WORST real-body crop, not a quality
// grade. Both silhouettes must not deteriorate, and an already-safe actual
// airborne destination must stay visible. A failed proposal returns zero,
// allowing the scene to restore exactly its previous camera and focus.
export function guardedJointShotGain({
  aspect, actorBefore, actorAfter, guardianBefore, guardianAfter,
  landingBefore = null, landingAfter = null,
  actorCoreClear, guardianCoreClear, landingCoreClear = true,
}) {
  if (!actorCoreClear || !guardianCoreClear || !landingCoreClear ||
    !Number.isFinite(aspect) || aspect <= 0 || aspect >= .85) return 0;
  const ab = observedJointBodyPressure(actorBefore, aspect, 'actor');
  const aa = observedJointBodyPressure(actorAfter, aspect, 'actor');
  const gb = observedJointBodyPressure(guardianBefore, aspect, 'guardian');
  const ga = observedJointBodyPressure(guardianAfter, aspect, 'guardian');
  if (![ab, aa, gb, ga].every(Number.isFinite)) return 0;
  const worstBefore = Math.max(ab, gb);
  const worstAfter = Math.max(aa, ga);
  if (worstBefore < .065 || worstAfter >= worstBefore - .035 ||
    (ab + gb) - (aa + ga) < .05) return 0;
  // The paired rescue cannot crop a previously-safe climber to save a boss,
  // or allow a formerly readable boss to slide off the phone.
  if (aa > ab + .025 || ga > gb + .025 ||
      (ab <= .012 && aa > .015) ||
      (gb <= .012 && ga > .015)) return 0;
  if (landingBefore !== null || landingAfter !== null) {
    if (!validPoint(landingBefore) || !validPoint(landingAfter)) return 0;
    const landingPressure = p => Math.max(0,
      Math.abs(p[0]) / .86 - 1, Math.abs(p[1]) / .82 - 1);
    const start = landingPressure(landingBefore);
    const end = landingPressure(landingAfter);
    if (end > start + .015) return 0;
  }
  return Math.min(worstBefore - worstAfter, (ab + gb) - (aa + ga));
}
