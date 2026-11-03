// Presentation-only evidence of a real player-owned shot fired while climbing.
// Never synthesize a hit, source event, projectile or movement. The witness
// expires at the next run/floor and cannot be reconstructed from one frame.
export function witnessedAirbornePulse(previous, next) {
  if (!previous || !next || previous.lifecycle !== 'running' ||
    next.lifecycle !== 'running' || previous.runToken !== next.runToken ||
    !next.runToken || previous.floor !== next.floor ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.tick - previous.tick > 8 ||
    previous.player?.state !== 'airborne' || next.player?.state !== 'airborne' ||
    next.player.health <= 0 ||
    ![next.player.x, next.player.y, next.player.facing].every(Number.isFinite) ||
    !Array.isArray(previous.projectiles) || !Array.isArray(next.projectiles)) return null;
  const before = new Set(previous.projectiles.map(shot => shot.id));
  for (const shot of next.projectiles) {
    if (shot?.owner !== 'player' || typeof shot.id !== 'string' ||
      !shot.id || before.has(shot.id) ||
      ![shot.x, shot.y, shot.vx].every(Number.isFinite) ||
      Math.abs(shot.x - next.player.x) > 65000 ||
      Math.abs(shot.y - next.player.y) > 7000 ||
      Math.sign(shot.vx) !== next.player.facing) continue;
    return {
      runToken: next.runToken, floor: next.floor, tick: next.tick,
      projectileId: shot.id, facing: next.player.facing,
    };
  }
  return null;
}

// An earned, genuinely fired counter-shot during a live guardian charge.
// The guardian's own source telegraph is necessary but never sufficient:
// no visual recoil occurs without a NEW player projectile in an adjacent
// immutable source snapshot. No predicted hit, animation-owned damage or
// artificial shield is introduced; this is presentation-only evidence.
export function witnessedGuardianCounterPulse(previous, next) {
  if (!previous || !next || previous.lifecycle !== 'running' ||
    next.lifecycle !== 'running' || !next.runToken ||
    previous.runToken !== next.runToken || previous.floor !== next.floor ||
    !Number.isSafeInteger(previous.floor) ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.tick - previous.tick > 8 ||
    previous.player?.state !== 'standing' || next.player?.state !== 'standing' ||
    next.intent?.mode !== 'bracing-telegraph' || next.player.health <= 0 ||
    ![next.player.x, next.player.y, next.player.facing].every(Number.isFinite) ||
    ![-1, 1].includes(next.player.facing) ||
    !Array.isArray(previous.projectiles) || !Array.isArray(next.projectiles) ||
    !Array.isArray(next.enemies)) return null;
  const foe = next.enemies.find(enemy => enemy?.kind === 'guardian' &&
    enemy.active === true && enemy.telegraph === true &&
    Number.isFinite(enemy.telegraphTicksRemaining) &&
    enemy.telegraphTicksRemaining >= 4 && enemy.telegraphTicksRemaining <= 8 &&
    Number.isFinite(enemy.health) && enemy.health > 0 &&
    Number.isFinite(enemy.x) && Number.isFinite(enemy.y) &&
    Number.isFinite(enemy.halfHeight) && enemy.halfHeight > 0 &&
    typeof enemy.id === 'string' && enemy.id &&
    (enemy.x - next.player.x) * next.player.facing > 0 &&
    Math.abs(enemy.x - next.player.x) <= 210000 &&
    Math.abs(enemy.y - next.player.y) < enemy.halfHeight + 3500);
  if (!foe) return null;
  const before = new Set(previous.projectiles.map(shot => shot.id));
  for (const shot of next.projectiles) {
    if (shot?.owner !== 'player' || typeof shot.id !== 'string' ||
      !shot.id || before.has(shot.id) ||
      ![shot.x, shot.y, shot.vx].every(Number.isFinite) ||
      Math.abs(shot.x - next.player.x) > 65000 ||
      Math.abs(shot.y - next.player.y) > 7000 ||
      Math.sign(shot.vx) !== next.player.facing) continue;
    return {
      runToken: next.runToken, floor: next.floor, tick: next.tick,
      projectileId: shot.id, guardianId: foe.id, facing: next.player.facing,
    };
  }
  return null;
}
