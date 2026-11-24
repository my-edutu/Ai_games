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
  // One earned physical event has TWO visible acts, not a perpetual white
  // laser through Thornback's entire recoil: a short connected lantern strike
  // is followed by the EXISTING grounded ring, floor resonance, shell release
  // and six-leg recovery. On authentic 390px WebGL the unbroken, high-contrast
  // core bisected both characters after the contact had already landed.
  // Fade the real core BEFORE the physical recovery. The stage and its
  // original public-path geometry still decide whether light can connect;
  // no new strike, route clue, hidden actor or independent animation clock.
  // Authored court contact overlaps the existing physical arm drive peak
  // rather than disappearing before the lantern is aimed. Keep the legacy
  // procedural envelope exactly unchanged.
  if(snapshot.layoutId==='guardian-court-v1'){
    const rise=Math.max(0,Math.min(1,phase/.16));
    const release=Math.max(0,Math.min(1,(phase-.43)/.28));
    const smooth=t=>t*t*(3-2*t);
    const strength=smooth(rise)*(1-smooth(release));
    return {phase,scale:.65+.37*ease,opacity:.48*(1-.6*ease),
      coreOpacity:.66*strength,beamActive:strength>.08};
  }
  const retreat=Math.max(0,Math.min(1,(phase-.035)/.245));
  const handoff=1-retreat*retreat*(3-2*retreat);
  return {
    phase, scale:.94+.62*ease,
    opacity:.76*(1-.40*ease),
    coreOpacity:.70*handoff,
    beamActive:handoff>.02,
  };
}
