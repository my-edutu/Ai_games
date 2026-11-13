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
  // The opt-in fixed-step simulation now publishes its exact clearance-door
  // center. Use this *before* judging the guardian's current feet: a real
  // knock-up, stagger or fallen body can move vertically during the fight,
  // but the physical threshold is bolted to its immutable source cap.
  // Guard against malformed/foreign data; older unflagged snapshots retain
  // the existing deck-proximity/legacy-approach placement below.
  const publishedExit = snapshot.guardianExitX;
  if (Number.isSafeInteger(publishedExit) &&
      publishedExit === cap.x + Math.floor(cap.width * .76) &&
      publishedExit > cap.x && publishedExit < cap.x + cap.width)
    return publishedExit;
  const feet = guardian.y - (Number.isFinite(guardian.halfHeight) ? guardian.halfHeight : 18000);
  // The new real guardian fight occurs ON the cap, rather than p6 below.
  // Its far-side exit is an actual 20Hz player movement objective after
  // defeat, with the same .76 platform fraction as the authoritative rules.
  // A dead guardian retains its source body coordinates for a stable gate.
  // Legacy p6 guardians still use the prior fixed approach-door algorithm.
  if (Math.abs(feet - (cap.y + cap.height)) <= 14000)
    return cap.x + Math.floor(cap.width * .76);
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

// One cap-level architectural corridor from the living guardian seal to the
// earned walk-through door. The original lock stays outside at radius 27.78;
// the source-linked seal must stay outside the solid 23.5 core *and* inside
// the physical 22.4..27.18 deck, where an exterior camera can actually see it.
// Values affect presentation geometry only; no collision or floor progression.
export const GUARDIAN_CAP_CORRIDOR = Object.freeze({
  coreOcclusionRadius: 23.5, deckMin: 22.4, deckMax: 27.18,
  visibleSealRadius: 24.25, climberPathRadius: 25,
  conduitReach: 2.1,
});

// The guardian's authored exit is an X threshold along the annular walking
// route, not a radial doorway through the solid tower wall. The bronze gate
// is a physical presentation of THAT source plane: its normal follows the
// climber's increasing-x tangent, while its opening spans the actual annular
// deck. This uses the original door meshes; it never creates gameplay
// collision, advances the run, or changes the published source threshold.
export function guardianTraversalGatePose(exitX, roofY, chunkBaseY, worldWidth) {
  if (![exitX,roofY,chunkBaseY,worldWidth].every(Number.isSafeInteger) ||
      worldWidth <= 0 || exitX < 0 || exitX > worldWidth) return null;
  const theta = angleFor(exitX,worldWidth);
  const radius = GUARDIAN_CAP_CORRIDOR.visibleSealRadius;
  return {
    x: Math.sin(theta)*radius,
    y: (roofY-chunkBaseY)/SCALE,
    z: Math.cos(theta)*radius,
    yaw: theta + Math.PI/2,
    radius, theta,
  };
}

