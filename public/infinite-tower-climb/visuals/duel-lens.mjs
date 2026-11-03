// Pure mobile source-combat camera policy, not a gameplay or render clock.
// Accept a dolly only if the REAL actor and living opponent grow/read clearly
// while their full projected vertical bodies remain safe in the same image.
const valid = v => Array.isArray(v) && v.length === 4 &&
  v.every(Number.isFinite) && v[3] > 0 && v[2] >= -1 && v[2] <= 1;
const safe = (v, x, y) =>
  Math.abs(v[0]) + v[3] * .13 < x && Math.abs(v[1]) + v[3] < y;
export function acceptObservedDuelDolly({
  aspect, actorBefore, actorAfter, guardianBefore, guardianAfter,
  actorCoreClear, guardianCoreClear, radiusBefore, radiusAfter,
}) {
  if (!Number.isFinite(aspect) || aspect <= 0 || aspect >= .85 ||
      ![actorBefore, actorAfter, guardianBefore, guardianAfter].every(valid) ||
      ![radiusBefore, radiusAfter].every(Number.isFinite) ||
      radiusAfter < 30.8 || radiusBefore <= radiusAfter ||
      radiusBefore - radiusAfter > 1.35 ||
      !actorCoreClear || !guardianCoreClear) return false;
  // Never override an already-readable duo, a cropped frame, or other existing
  // safety rescue. Head/feet, not a point-centered hero, define image share.
  if (actorBefore[3] >= .16 || actorAfter[3] > .32 ||
      !safe(actorBefore, .74, .76) || !safe(guardianBefore, .76, .78) ||
      !safe(actorAfter, .74, .76) || !safe(guardianAfter, .76, .78)) return false;
  return actorAfter[3] > actorBefore[3] + .0005 &&
    guardianAfter[3] >= guardianBefore[3] - .001;
}
