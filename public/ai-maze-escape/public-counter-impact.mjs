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
  const retreat=Math.max(0,Math.min(1,(phase-.035)/.245));
  const handoff=1-retreat*retreat*(3-2*retreat);
  return {
    phase, scale:.94+.62*ease,
    opacity:.76*(1-.40*ease),
    coreOpacity:.70*handoff,
    beamActive:handoff>.02,
  };
}


/**
 * A visible, source-earned physical counterwake, not a second damage effect.
 * The scene ONLY invokes this after publicEarnedCounterImpactStage and the
 * existing real, reciprocal OPEN 1/2-link lantern sightline both succeed.
 * The trailing pulses travel at equal arc-length speed through the ACTUAL
 * public bend, never cut diagonally through a wall or reveal a hidden cell.
 * This is a pure presentation pose: no scene resources, AI or world mutation.
 */
export function publicEarnedCounterGroundWake(
  phase,index,from,middle,to,reducedMotion=false){
  if(reducedMotion||!Number.isFinite(phase)||phase<0||phase>=1
    ||!Number.isSafeInteger(index)||index<0||index>2
    ||![from?.x,from?.z,to?.x,to?.z].every(Number.isFinite)
    ||(middle&&![middle.x,middle.z].every(Number.isFinite)))return null;
  const start=.045+index*.105;
  const progress=(phase-start)/.69;
  if(progress<=0||progress>=1)return null;
  const first=Math.hypot((middle?.x??to.x)-from.x,(middle?.z??to.z)-from.z);
  const second=middle?Math.hypot(to.x-middle.x,to.z-middle.z):0;
  const total=first+second;
  // Hard bounds on a photographed 1/2-edge world motion; never paint a line
  // between a teleport, an absent actor or a wholly unrelated map landmark.
  if(first<.2||(middle&&second<.2)||total>15)return null;
  const travel=progress*total;
  const pastCorner=!!middle&&travel>first;
  const fraction=pastCorner?(travel-first)/second:travel/first;
  const a=pastCorner?middle:from;
  const b=pastCorner?to:(middle??to);
  return {
    x:a.x+(b.x-a.x)*fraction,
    z:a.z+(b.z-a.z)*fraction,
    opacity:.82*Math.min(1,progress*5)*Math.min(1,(1-progress)*3),
    scale:.85+.5*(1-progress),
  };
}
