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
