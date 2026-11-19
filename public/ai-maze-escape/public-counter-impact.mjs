/**
 * Action-only presentation of the REAL, already witnessed public lantern counter.
 * The scene owns the previous->current public transition and current model;
 * this helper may not inspect the private map, invent a strike or alter movement.
 * A stale first-seen parry has no counterPhase from the scene's event clock.
 */
export function publicEarnedCounterImpactStage(snapshot, actor, reducedMotion=false) {
  if (reducedMotion || snapshot?.lifecycle!=='running' || snapshot.result
    || !Number.isSafeInteger(actor?.cell) || actor.cell<0
    || !Number.isFinite(actor.x) || !Number.isFinite(actor.z)
    || !Number.isFinite(actor.counterPhase) || actor.counterPhase<0
    || actor.counterPhase>=1
    || !Array.isArray(snapshot.visibleCells)
    || !snapshot.visibleCells.includes(actor.cell)
    || !Array.isArray(snapshot.threats)
    || !snapshot.threats.some(threat=>threat?.cell===actor.cell
      && threat.lanternParried===true))return null;
  const phase=actor.counterPhase;
  // A visibly grounded shell hit, not an oversized always-on HUD target.
  // A restrained, retained 3D ring expands while two disclosed light links
  // remain anchored to Pip's ACTUAL lantern and the current guardian body.
  const ease=phase*phase*(3-2*phase);
  return {
    phase, scale:.94+.62*ease,
    opacity:.76*(1-.40*ease),
    coreOpacity:.70*(1-.32*ease),
  };
}
