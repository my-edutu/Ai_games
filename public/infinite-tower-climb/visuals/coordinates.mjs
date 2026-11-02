// A presentation-only map. The fixed-step simulation remains authoritative.
export const SCALE = 10000;
export const RADIUS = 24;
export const ARC = 2.2;
export function angleFor(x, width = 480000) {
  return (x / width - 0.5) * ARC;
}
export function pointFor(x, y, baseY = 0, width = 480000, radius = 25) {
  const angle = angleFor(x, width);
  return { x: Math.sin(angle) * radius, y: (y - baseY) / SCALE, z: Math.cos(angle) * radius, angle };
}

// Place the decorative guardian lock beside the APPROACH to the real cap,
// instead of invariably at the cap's distant midpoint. The source's final
// lower platform is where the guardian originally spawns: its fixed deck
// footprint gives an anchor that does not chase a patrolling enemy or move
// between polling, replay, graphics resets and a late spectator join.
// This changes no checkpoint, actor, collider, seed or run authority.
export function guardianGateAnchorX(snapshot, cap) {
  const midpoint = cap.x + cap.width * .5;
  if (!Array.isArray(snapshot?.platforms) || !Number.isFinite(cap.width) || cap.width <= 0)
    return midpoint;
  const guardian = snapshot.enemies?.find(enemy => enemy.kind === 'guardian' &&
    Number.isFinite(enemy.y));
  if (!guardian) return midpoint;
  const feet = guardian.y - (Number.isFinite(guardian.halfHeight) ? guardian.halfHeight : 18000);
  let approach = null, error = Infinity;
  for (const platform of snapshot.platforms) {
    if (platform.id === cap.id || !Number.isFinite(platform.x) ||
      !Number.isFinite(platform.width) || platform.width <= 0 ||
      !Number.isFinite(platform.y) || !Number.isFinite(platform.height) ||
      platform.y + platform.height >= cap.y) continue;
    const difference = Math.abs(platform.y + platform.height - feet);
    if (difference < error) { approach = platform; error = difference; }
  }
  if (!approach || error > 14000) return midpoint;
  // Fit the portal's full 7.35-unit silhouette within the cap's 2.2-rad
  // playable span. Its actual 3D depth stays inside the walkable annulus.
  const margin = Math.min(cap.width * .28, Math.max(40000, cap.width * .2));
  return Math.max(cap.x + margin, Math.min(cap.x + cap.width - margin,
    approach.x + approach.width * .5));
}
