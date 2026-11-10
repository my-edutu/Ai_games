// A living cap guardian remains an actual two-body camera subject during
// source-owned airborne cap re-entry. No predicted strike or invented boss.
// The cap/guardian lock is the same authoritative observation that presents
// the physical closed gate. This only prevents the camera from abandoning a
// damaged real opponent during an actual selected cap landing.
const finite = (...values) => values.every(Number.isFinite);
export function observedWoundedCapAirDuel(snapshot, enemy, locked) {
  const player = snapshot?.player;
  const cap = locked?.cap;
  const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
  if (snapshot?.stale || snapshot?.lifecycle !== 'running' ||
      !Number.isSafeInteger(snapshot?.tick) ||
      !Number.isSafeInteger(snapshot?.floor) ||
      typeof snapshot?.runToken !== 'string' || !snapshot.runToken ||
      player?.state !== 'airborne' || player.health <= 0 ||
      !['air-control', 'settling-landing'].includes(mode) ||
      snapshot?.intent?.targetPlatformId !== cap?.id ||
      locked.runToken !== snapshot.runToken ||
      locked.floor !== snapshot.floor || locked.tick !== snapshot.tick ||
      locked.guardian?.id !== enemy?.id || enemy?.kind !== 'guardian' ||
      enemy.active !== true ||
      !finite(enemy.health, enemy.maxHealth) ||
      enemy.health <= 0 || enemy.health >= enemy.maxHealth ||
      !finite(player.x, player.y, enemy.x, enemy.y,
        cap?.x, cap?.y, cap?.width, cap?.height) ||
      cap.width <= 0 || cap.height <= 0 ||
      cap.id !== 'f' + snapshot.floor + ':cap') return false;
  // Same actual deck, selected by source AI; ordinary off-cap routes and
  // far-off enemies cannot hijack a traversal camera.
  const capTop = cap.y + cap.height;
  return player.x >= cap.x - 30000 &&
    player.x <= cap.x + cap.width + 30000 &&
    Math.abs(player.y - capTop) <= 110000 &&
    Math.abs(player.x - enemy.x) <= 90000 &&
    Math.abs(player.y - enemy.y) <= 60000;
}
