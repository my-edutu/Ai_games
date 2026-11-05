// One public 20 Hz fixed-step observation owns airborne atmosphere, wind,
// the articulated climber's leap arc, the landing dock's physical response
// and the continuous camera's soft vertical lead. Never invent a jump,
// contact, a safe landing, a change to physics or an autonomous decision.
const clamp01 = value => Math.max(0, Math.min(1, value));
const STILL = Object.freeze({
  ascent: 0, descent: 0, airflow: 0, shear: 0,
  launch: 0, apex: 0, landingReadiness: 0,
});

export function observedTraversalKinetics(snapshot) {
  const hero = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      !hero || hero.health <= 0 || hero.state !== 'airborne' ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
      !Number.isSafeInteger(snapshot.floor) || snapshot.floor < 0 ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isFinite(hero.vy) || !Number.isFinite(hero.vx)) {
    return STILL;
  }
  const ascent = clamp01((hero.vy - 850) / 16000);
  const descent = clamp01((-hero.vy - 850) / 16000);
  const airflow = Math.max(ascent, descent);
  const shear = Math.max(-1, Math.min(1, hero.vx / 12000));
  const launch = clamp01((hero.vy - 4500) / 14000);
  // The transition through zero VY is the actual physical arc apex, not a
  // jumping intention or a timed animation event. A true hanging ledge pose
  // is still governed by the separate finger-contact IK in the character rig.
  const apex = clamp01(1 - Math.abs(hero.vy) / 6200);
  let landingReadiness = 0;
  // A readable pre-contact brace is permitted only for a genuinely observed
  // deck occupying the hero's horizontal footprint below its real feet.
  // This is *not* a predicted landing or a safety promise: the next source
  // tick can change the deck or redirect the pilot without changing physics.
  const targetId = snapshot.intent?.targetPlatformId;
  if (descent > 0 && typeof targetId === 'string' && targetId &&
      [hero.x, hero.y, hero.halfWidth, hero.halfHeight].every(Number.isFinite) &&
      hero.halfWidth > 0 && hero.halfHeight > 0 &&
      Array.isArray(snapshot.platforms)) {
    const deck = snapshot.platforms.find(p => p?.id === targetId);
    if (deck && [deck.x, deck.y, deck.width, deck.height].every(Number.isFinite) &&
        deck.width > 0 && deck.height > 0 &&
        hero.x + hero.halfWidth >= deck.x - 4000 &&
        hero.x - hero.halfWidth <= deck.x + deck.width + 4000) {
      const gap = (hero.y - hero.halfHeight) - (deck.y + deck.height);
      if (gap >= 0 && gap <= 80000)
        landingReadiness = clamp01(1 - gap / 80000) *
          clamp01((-hero.vy - 3000) / 11000);
    }
  }
  return { ascent, descent, airflow, shear, launch, apex, landingReadiness };
}
