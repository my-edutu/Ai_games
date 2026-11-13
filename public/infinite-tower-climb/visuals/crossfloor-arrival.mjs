// Physically earned, source-bounded old-to-new tower world continuity.
// Renderer submissions are NOT equivalent to pixels reaching the native film.
// Preserve the original bronze gate/roof across several submissions while a
// REAL body is still nearby, and defer the new noninteractive opaque shell.
// Never change authority, platforms, input, collisions, seed or progression.

/*
 * The FIRST real floor-nine renderer samples often arrive >12 authoritative
 * ticks after crossing. The simulation can still report standing on the
 * PREVIOUS f8:cap, which shares exactly the same roof as f9:ground. The
 * recorded crossing has already authorized held's original GPU cap/gate.
 * Preserve that SAME photographed roof while its actual occupied soles,
 * bounded tick/run, and frozen cap footprint still match. This is NEVER
 * permission to spawn a platform or to skip a collision/source event.
 */
export function observedRetainedOriginalCapRoofContact(source,held) {
  const p=source?.player;
  if (!held || !p || source?.lifecycle!=='running' ||
      source.floor!==9 || source.theme!=='void' ||
      typeof source.runToken!=='string' || !source.runToken ||
      source.runToken!==held.runToken || held.floor!==9 ||
      !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.sourceTick) ||
      source.tick<held.sourceTick || source.tick-held.sourceTick>48 ||
      !(p.health>0) || p.grounded!==true ||
      (p.state!=='standing' && p.state!=='hurt') || p.vy!==0 ||
      p.groundedPlatformId!=='f8:cap' || held.oldCapId!=='f8:cap' ||
      ![p.x,p.y,p.halfWidth,p.halfHeight,held.oldCapX,
        held.oldCapWidth,held.oldRoofY,held.thresholdX]
        .every(Number.isSafeInteger) ||
      p.halfWidth<=0 || p.halfHeight<=0 ||
      held.oldCapWidth<=0 || held.oldCapX<0 ||
      Math.abs(p.x-held.thresholdX)>90000 ||
      p.y-p.halfHeight!==held.oldRoofY ||
      p.x-p.halfWidth<held.oldCapX ||
      p.x+p.halfWidth>held.oldCapX+held.oldCapWidth)
    return false;
  return true;
}

export function observedClockworkRoofContinuity(source, passage, held) {
  const p=source?.player;
  if (!held || !p || source?.lifecycle!=='running' ||
      source.floor!==9 || source.theme!=='void' ||
      typeof source.runToken!=='string' || !source.runToken ||
      source.runToken!==held.runToken || held.floor!==source.floor ||
      !(p.health>0) || !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.sourceTick) ||
      source.tick<held.sourceTick || source.tick-held.sourceTick>48 ||
      ![p.x,p.y,p.halfWidth,p.halfHeight,held.oldRoofY,held.thresholdX]
        .every(Number.isSafeInteger) ||
      p.halfWidth<=0 || p.halfHeight<=0 ||
      Math.abs(p.x-held.thresholdX)>90000 ||
      !Number.isSafeInteger(held.submittedFrames) ||
      held.submittedFrames<0 || held.submittedFrames>10 ||
      !Number.isFinite(held.visibleSeconds) || held.visibleSeconds<0 ||
      passage?.sourceBound!==true || passage.active!==true ||
      passage.stage!=='handoff' ||
      passage.continuousGroundedHandoff!==true ||
      passage.innerDoorAssemblyVisible!==true ||
      passage.exteriorMemoryFrameVisible!==false ||
      passage.runToken!==held.runToken || passage.floor!==held.floor ||
      passage.sourceTick!==held.sourceTick ||
      !Array.isArray(source.platforms)) return false;
  const foot=p.y-p.halfHeight;
  if (foot<held.oldRoofY-2500 || foot>held.oldRoofY+160000) return false;
  if (p.grounded===false) return p.state==='airborne' &&
    p.groundedPlatformId==null && Number.isFinite(p.vy);
  if (p.grounded!==true || typeof p.groundedPlatformId!=='string' ||
      p.vy!==0) return false;
  // A genuine first successor-frame may still carry the former cap's ID:
  // it is supported by the same physical old roof, not a made-up F9 deck.
  if (observedRetainedOriginalCapRoofContact(source,held)) return true;
  // Valid elevated support keeps the old bronze cap spatially behind a
  // climbing actor; an invented platform cannot extend its visual life.
  return source.platforms.some(s=>s?.id===p.groundedPlatformId &&
    [s.x,s.y,s.width,s.height].every(Number.isSafeInteger) &&
    s.width>0 && s.height>0 &&
    s.y+s.height===foot && foot>=held.oldRoofY &&
    p.x-p.halfWidth>=s.x && p.x+p.halfWidth<=s.x+s.width);
}

export function holdIncomingStructuralShell(source,passage,held,job) {
  if(!job || job.state!=='awaiting-actual-first-render' ||
      job.structureDeferred!==true ||
      job.proof!=='recorded-source-gateway' ||
      job.runToken!==source?.runToken || job.floor!==source?.floor ||
      !Number.isSafeInteger(job.sourceTick) ||
      job.sourceTick!==held?.sourceTick ||
      !Number.isSafeInteger(job.submittedFrames) ||
      job.submittedFrames<1 || job.submittedFrames>=5 ||
      held.submittedFrames>=5 || held.visibleSeconds>=.55) return false;
  return observedClockworkRoofContinuity(source,passage,held);
}
