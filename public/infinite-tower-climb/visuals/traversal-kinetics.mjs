// A single public fixed-step observation drives visual parallax, character-facing
// ascent lighting and optional wind. Never predicts a jump, creates a force or
// mutates the autonomous simulation. 20 Hz source is the sole motion authority.
const clamp01 = value => Math.max(0, Math.min(1, value));

export function observedTraversalKinetics(snapshot) {
  const hero = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      !hero || hero.health <= 0 || hero.state !== 'airborne' ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
      !Number.isSafeInteger(snapshot.floor) || snapshot.floor < 0 ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isFinite(hero.vy) || !Number.isFinite(hero.vx)) {
    return { ascent: 0, descent: 0, airflow: 0, shear: 0 };
  }
  // Below the drift threshold, air particles and the wind bed stay calm.
  // Distinguish ascent and descent in the *actual* fixed-step velocity, so
  // neither a jump intent nor a camera animation fabricates motion.
  const ascent = clamp01((hero.vy - 850) / 16000);
  const descent = clamp01((-hero.vy - 850) / 16000);
  const airflow = Math.max(ascent, descent);
  const shear = Math.max(-1, Math.min(1, hero.vx / 12000));
  return { ascent, descent, airflow, shear };
}
