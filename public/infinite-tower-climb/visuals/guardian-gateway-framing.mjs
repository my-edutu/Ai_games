// Only a real unlocked cap threshold may request this optional camera escort.
// Pure, source-independent framing veto: never touches authority or input.
export function gatewayScreenError(ndc) {
  if (!Array.isArray(ndc) || ndc.length !== 3 ||
      !ndc.every(Number.isFinite) || ndc[2] < -1 || ndc[2] > 1)
    return Infinity;
  return Math.max(0, Math.abs(ndc[0]) / .78 - 1,
    Math.abs(ndc[1]) / .76 - 1);
}
function readableBody(body) {
  return Array.isArray(body) && body.length === 4 &&
    body.every(Number.isFinite) && body[2] >= -1 && body[2] <= 1 &&
    body[3] >= .035 && Math.abs(body[0]) <= .77 &&
    Math.abs(body[1]) + body[3] <= .76;
}
export function acceptEarnedGatewayEscort({
  gateBefore, gateAfter, actorBefore, actorAfter,
  actorCoreClear, gatewayCoreClear,
}) {
  const before = gatewayScreenError(gateBefore);
  const after = gatewayScreenError(gateAfter);
  if (!actorCoreClear || !gatewayCoreClear ||
      !readableBody(actorBefore) || !readableBody(actorAfter) ||
      !Number.isFinite(before) || !Number.isFinite(after) ||
      before <= .035 || after > before - .018) return 0;
  return before - after;
}

// Deterministic per-frame budget for the SAME unlocked physical doorway.
// Source-earned state and actor/core projections, not this helper, determine
// whether any correction may be applied. Wider desktop uses a gentler lens;
// portrait stays body-safe with the existing post-correction veto.
export function earnedGatewayEscortResponse(aspect, dt) {
  if (!Number.isFinite(aspect) || aspect <= 0 || aspect >= 2.5 ||
      !Number.isFinite(dt) || dt <= 0) return 0;
  const portrait = aspect < .85;
  return Math.min(portrait ? .20 : .11,
    1 - Math.exp(-Math.min(dt, .06) * (portrait ? 8 : 5)));
}

 
// Source-earned grounded cap procession. Presentation-only: this cannot
// unlock doors, move the hero, award a victory or change fixed-step authority.
// The panoramic arrival yields to a closer continuous exterior-orbit shot
// only for a REAL nearby body walking toward the defeated guardian's doorway.
export function observedGroundedGatewayShot(snapshot, earned, aspect, zoom = 1) {
  const p = snapshot?.player, cap = earned?.cap;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      earned?.runToken !== snapshot?.runToken ||
      earned?.floor !== snapshot?.floor ||
      cap?.id !== ('f' + snapshot.floor + ':cap') ||
      p?.state !== 'standing' || !(p?.health > 0) ||
      ![aspect, zoom, snapshot.tick, snapshot.worldWidth,
        p?.x, p?.y, p?.halfHeight,
        cap?.x, cap?.y, cap?.width, cap?.height].every(Number.isFinite) ||
      aspect <= 0 || aspect >= 2.5 || zoom <= 0 || zoom > 1.1 ||
      cap.width <= 0 || cap.height <= 0 || p.halfHeight <= 0 ||
      snapshot.worldWidth <= 0) return null;
  const feet = p.y - p.halfHeight;
  if (Math.abs(feet - (cap.y + cap.height)) > 4500 ||
      p.x < cap.x || p.x > cap.x + cap.width) return null;
  const exitX = cap.x + Math.floor(cap.width * .76);
  const distance = Math.abs(exitX - p.x);
  const approachWindow = Math.min(85000, cap.width * .32);
  if (approachWindow <= 10000 || distance >= approachWindow) return null;
  const approach = 1 - distance / approachWindow;
  const portrait = aspect < .85;
  // The old full-cap panorama could shrink the mobile climber below a
  // readable silhouette. Resolve only the last real physical walk, without
  // cutting, crossing the solid core or demanding any additional draw pass.
  const farRadius = portrait ? 67 : 56;
  const nearRadius = portrait ? 44 : 37;
  const radius = Math.max(30, (farRadius - (farRadius - nearRadius) * approach) *
    Math.min(1.25, Math.max(.85, zoom)));
  return { sourceTick: snapshot.tick, radius,
    focusWeight: Math.min(.42, approach * (portrait ? .42 : .34)),
    approach, exitX };
}
