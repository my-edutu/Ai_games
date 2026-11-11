// A deliberately bounded, source-observed camera response to REAL opaque
// 3D clockwork intervening between a living hero and guardian. These are
// geometry ray witnesses, not painted-pixel proof. The authoritative run,
// collision, enemy HP, camera mode and user's manual orbit remain untouched.
export function weightedGuardianWorldOcclusion(cast, hero, guardian, heroHalfHeight, guardianHalfHeight) {
  if (typeof cast !== 'function' || !hero || !guardian ||
      ![hero.x,hero.y,hero.z,guardian.x,guardian.y,guardian.z,heroHalfHeight,guardianHalfHeight]
        .every(Number.isFinite) || heroHalfHeight <= 0 || guardianHalfHeight <= 0)
    return null;
  const hit = (point, offset) => cast(point.x, point.y + offset, point.z) === true ? 1 : 0;
  // Avoid platform/deck false positives by targeting the torso and the head,
  // not feet or a projected bounding box beyond the actual body.
  const heroBlocked = hit(hero,0) + hit(hero,heroHalfHeight*.72);
  const guardianBlocked = hit(guardian,0) + hit(guardian,guardianHalfHeight*.72);
  return { heroBlocked, guardianBlocked, weighted:heroBlocked*3 + guardianBlocked*2 };
}
export function selectGuardianWorldShoulder(base, left, right) {
  if (!base || ![base.weighted,base.heroBlocked,base.guardianBlocked].every(Number.isFinite) ||
      base.weighted < 3) return null;
  let selected = null;
  for (const [direction, trial] of [[-1,left],[1,right]]) {
    if (!trial || ![trial.weighted,trial.heroBlocked,trial.guardianBlocked]
      .every(Number.isFinite) || trial.weighted < 0) continue;
    // Do not trade a clearer boss for a newly hidden protagonist.
    if (trial.heroBlocked > base.heroBlocked) continue;
    if (base.weighted-trial.weighted < 3) continue;
    if (!selected || trial.weighted < selected.weighted ||
        (trial.weighted === selected.weighted && trial.heroBlocked < selected.heroBlocked))
      selected = {direction,weighted:trial.weighted,heroBlocked:trial.heroBlocked,
        gain:base.weighted-trial.weighted};
  }
  return selected;
}
export function boundedGuardianWorldAngle(current,target,dt) {
  if (![current,target,dt].every(Number.isFinite) || dt<=0 || dt>.10) return null;
  const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  const step=Math.min(Math.abs(difference),Math.min(.060,dt*.95));
  return current + Math.sign(difference)*step;
}
