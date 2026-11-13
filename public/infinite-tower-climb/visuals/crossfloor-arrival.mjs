// The first portrait WebGL submission in original 07aa3bda video reached
// floor-nine at tick460; the browser had already accepted the REAL 8->9
// grounded handoff at tick451 but its lastGuardianCrossing publication was
// absent at that first browser receipt. The old GPU gateway was destroyed
// before ever reaching native film, even though the original defeated
// guardian, old grounded cap, new grounded deck and body were all witnessed.
//
// This narrow alternate route is ONLY for an already staged, original
// source-owned F8 cap+gateway. The stage records the old defeated guardian
// and genuine browser-observed grounded transition, independently from the
// immutable crossing publication. It cannot spawn a gate or promote a floor.
// Rejected if a crossing record EXISTS but conflicts; do not use the weaker
// browser witness to override contradictory authority.
export function observedQueuedOriginalCapFromGroundedReceipt(source,queued) {
  const p=source?.player;
  if(!queued?.verifiedObservedFloorAdvance || !p ||
    source?.lastGuardianCrossing != null ||
    source.lifecycle!=='running' || source.floor!==9 || source.theme!=='void' ||
    source.runToken!==queued.runToken || queued.floor!==9 ||
    !Number.isSafeInteger(source.tick) || !Number.isSafeInteger(queued.tick) ||
    source.tick<=queued.tick || source.tick-queued.tick>12 ||
    source.chunkBaseY!==queued.nextBaseY ||
    source.worldWidth!==queued.worldWidth ||
    !Number.isSafeInteger(queued.oldCapX) ||
    !Number.isSafeInteger(queued.oldCapWidth) ||
    queued.oldCapId!=='f8:cap' || queued.oldCapWidth<=0 ||
    ![queued.oldRoofY,queued.thresholdX,queued.observedCrossingX,
      queued.observedCrossingY,queued.observedHalfWidth,
      queued.observedHalfHeight,p.x,p.y,p.halfWidth,p.halfHeight]
      .every(Number.isSafeInteger) ||
    queued.observedHalfWidth<=0 || queued.observedHalfHeight<=0 ||
    p.halfWidth!==queued.observedHalfWidth ||
    p.halfHeight!==queued.observedHalfHeight ||
    queued.thresholdX!==queued.oldCapX+Math.floor(queued.oldCapWidth*.76) ||
    queued.observedCrossingX <
      queued.thresholdX+queued.observedHalfWidth+4000 ||
    queued.observedCrossingY-queued.observedHalfHeight!==queued.oldRoofY ||
    p.x<queued.observedCrossingX ||
    p.x-queued.observedCrossingX>(source.tick-queued.tick)*18000 ||
    p.x>queued.thresholdX+90000 ||
    !(p.health>0) || !Array.isArray(source.platforms)) return false;
  const ground=source.platforms.find(s=>s?.id==='f9:ground');
  if(!ground ||
    ![ground.x,ground.y,ground.width,ground.height].every(Number.isSafeInteger) ||
    ground.width<=0 || ground.height<=0 ||
    ground.y+ground.height!==queued.oldRoofY ||
    p.x-p.halfWidth<ground.x ||
    p.x+p.halfWidth>ground.x+ground.width) return false;
  const foot=p.y-p.halfHeight;
  if(!Number.isSafeInteger(foot) ||
      foot<queued.oldRoofY-2500 || foot>queued.oldRoofY+55000) return false;
  if(p.grounded===false)
    return p.state==='airborne' && p.groundedPlatformId==null &&
      Number.isFinite(p.vy);
  return p.grounded===true && p.groundedPlatformId==='f9:ground' &&
    (p.state==='standing'||p.state==='hurt') && p.vy===0 &&
    p.y===queued.observedCrossingY && foot===queued.oldRoofY;
}

// A first, actually submitted F9 frame can precede the immutable HP-zero
// crossing publication. It may only share the original GPU cap, gateway,
// camera and horizon if the SAME previously authenticated grounded receipt
// still matches the real alive body and old roof. This does not create a
// lastGuardianCrossing record or infer a win from scenery.
export function observedStagedOriginalCapBeforeRecordedCrossing(source,held) {
  return held?.guardianGateRetained === true &&
    held?.verifiedObservedFloorAdvance === true &&
    held?.crossingTick == null &&
    Number.isSafeInteger(held.submittedFrames) &&
    held.submittedFrames >= 0 && held.submittedFrames <= 8 &&
    Number.isFinite(held.visibleSeconds) &&
    held.visibleSeconds >= 0 && held.visibleSeconds < 1.25 &&
    observedQueuedOriginalCapFromGroundedReceipt(source,held);
}

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

/*
 * WebGL can submit the first Floor9 frame AFTER the browser's original
 * source-authenticated HP-zero doorway request. Reattach only the original
 * prior-floor GPU geometry if the next immutable snapshot matches the SAME
 * recorded crossing, unchanged cap/roof, close living body and bounded
 * 12-tick observation gap. No unobserved pose or game event is fabricated.
 */
export function observedQueuedOriginalCapAtFirstRender(source, queued) {
  if(source?.lastGuardianCrossing == null)
    return observedQueuedOriginalCapFromGroundedReceipt(source,queued);
  const w=source?.lastGuardianCrossing,p=source?.player;
  const cap=w?.cap,guardian=w?.guardian;
  if (!queued||!w||!p||!cap||!guardian||
      source.lifecycle!=='running'||source.floor!==9||source.theme!=='void'||
      source.runToken!==queued.runToken||w.runToken!==queued.runToken||
      queued.floor!==9||w.fromFloor!==8||w.toFloor!==9||
      !((queued.crossingTick==null && queued.verifiedObservedFloorAdvance===true) ||
        Number.isSafeInteger(queued.crossingTick)) ||
      ![source.tick,queued.tick,w.sourceTick,
        source.chunkBaseY,source.worldWidth,
        cap.x,cap.y,cap.width,cap.height,w.exitX,w.crossingX,
        w.halfWidth,w.halfHeight,queued.oldCapX,queued.oldCapWidth,
        queued.oldRoofY,queued.thresholdX,p.x,p.y,p.halfWidth,p.halfHeight]
        .every(Number.isSafeInteger)||
      !(queued.crossingTick===w.sourceTick ||
        (queued.crossingTick==null &&
         queued.verifiedObservedFloorAdvance===true &&
         queued.tick>=w.sourceTick && queued.tick-w.sourceTick<=12))||
      queued.tick<w.sourceTick||queued.tick-w.sourceTick>12||
      source.tick<=queued.tick||source.tick-queued.tick>12||
      source.tick-w.sourceTick>48||
      source.chunkBaseY!==queued.nextBaseY||
      source.worldWidth!==queued.worldWidth||
      cap.id!=='f8:cap'||queued.oldCapId!==cap.id||
      cap.width<=0||cap.height<=0||
      cap.x!==queued.oldCapX||cap.width!==queued.oldCapWidth||
      cap.y+cap.height!==queued.oldRoofY||
      w.exitX!==queued.thresholdX||
      w.exitX!==cap.x+Math.floor(cap.width*.76)||
      w.crossingX<w.exitX+w.halfWidth+4000||
      w.halfWidth<=0||w.halfHeight<=0||
      guardian.kind!=='guardian'||guardian.floor!==8||
      guardian.active!==false||!Number.isSafeInteger(guardian.health)||
      guardian.health>0||
      p.halfWidth!==w.halfWidth||p.halfHeight!==w.halfHeight||
      !(p.health>0)||!Array.isArray(source.platforms)||
      p.x<w.crossingX||p.x>w.exitX+90000||
      p.x-w.crossingX>(source.tick-w.sourceTick)*18000) return false;
  const ground=source.platforms.find(s=>s?.id==='f9:ground');
  if(!ground||![ground.x,ground.y,ground.width,ground.height]
      .every(Number.isSafeInteger)||ground.width<=0||ground.height<=0||
      ground.y+ground.height!==queued.oldRoofY||
      p.x-p.halfWidth<ground.x||
      p.x+p.halfWidth>ground.x+ground.width) return false;
  const foot=p.y-p.halfHeight;
  if(!Number.isSafeInteger(foot)||
      foot<queued.oldRoofY-2500||foot>queued.oldRoofY+160000) return false;
  if(p.grounded===false)
    return p.state==='airborne'&&p.groundedPlatformId==null&&Number.isFinite(p.vy);
  return p.grounded===true&&(p.state==='standing'||p.state==='hurt')&&
    p.vy===0&&foot===queued.oldRoofY&&
    (p.groundedPlatformId==='f9:ground'||
      (p.groundedPlatformId==='f8:cap'&&
       p.x-p.halfWidth>=cap.x&&p.x+p.halfWidth<=cap.x+cap.width));
}

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

// The initial F9 WebGL frame may return 30+ fixed-step ticks AFTER the
// legitimate crossing. Renderer delay is not authority delay: the live player
// can already be airborne high over the real roof by the time its pixels
// appear. Validate the unmodified crossing record, unchanged cap footprint,
// next-floor roof, current source body and short GPU-submission window before
// retaining the ACTUAL prior-world mesh. No interpolated/held player pose,
// extra platform, virtual doorway or event is introduced here.
export function observedSourceEarnedColdFrameContinuation(source, held) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const cap=w?.cap,guardian=w?.guardian;
  if (!held || !p || !w || !cap || !guardian ||
      source.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || source.runToken!==held.runToken ||
      w.runToken!==held.runToken || held.floor!==9 ||
      w.fromFloor!==8 || w.toFloor!==9 ||
      w.sourceTick!==held.crossingTick ||
      !Number.isSafeInteger(held.sourceTick) ||
      held.sourceTick<w.sourceTick || held.sourceTick-w.sourceTick>12 ||
      !Number.isSafeInteger(source.tick) || source.tick<held.sourceTick ||
      !Number.isSafeInteger(w.sourceTick) ||
      source.tick<w.sourceTick || source.tick-w.sourceTick>48 ||
      !Number.isSafeInteger(held.submittedFrames) ||
      held.submittedFrames<0 || held.submittedFrames>8 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=1.25 ||
      cap.id!=='f8:cap' || held.oldCapId!==cap.id ||
      guardian.kind!=='guardian' || guardian.floor!==8 ||
      guardian.active!==false || !(guardian.health<=0) ||
      ![guardian.health,cap.x,cap.y,cap.width,cap.height,
        held.oldCapX,held.oldCapWidth,held.oldRoofY,
        held.thresholdX,w.exitX,w.crossingX,w.crossingY,
        w.halfWidth,w.halfHeight,p.x,p.y,p.halfWidth,p.halfHeight]
        .every(Number.isSafeInteger) ||
      !(cap.width>0) || !(cap.height>0) ||
      held.oldCapX!==cap.x || held.oldCapWidth!==cap.width ||
      held.oldRoofY!==cap.y+cap.height ||
      w.exitX!==cap.x+Math.floor(cap.width*.76) ||
      held.thresholdX!==w.exitX ||
      w.crossingX<w.exitX+w.halfWidth+4000 ||
      w.halfWidth<=0 || w.halfHeight<=0 ||
      p.halfWidth!==w.halfWidth || p.halfHeight!==w.halfHeight ||
      !(p.health>0) || !Array.isArray(source.platforms) ||
      p.x<w.crossingX || p.x>w.exitX+90000 ||
      p.x-w.crossingX>(source.tick-w.sourceTick)*18000) return false;
  const ground=source.platforms.find(s=>s?.id==='f9:ground');
  if (!ground || ![ground.x,ground.y,ground.width,ground.height]
      .every(Number.isSafeInteger) || ground.width<=0 ||
      ground.height<=0 || ground.y+ground.height!==held.oldRoofY ||
      p.x-p.halfWidth<ground.x ||
      p.x+p.halfWidth>ground.x+ground.width) return false;
  const foot=p.y-p.halfHeight;
  if (!Number.isSafeInteger(foot) ||
      foot<held.oldRoofY-2500 || foot>held.oldRoofY+160000) return false;
  if (p.grounded===false)
    return p.state==='airborne' && p.groundedPlatformId==null &&
      Number.isFinite(p.vy);
  if (p.grounded!==true || (p.state!=='standing' && p.state!=='hurt') ||
      p.vy!==0 || foot!==held.oldRoofY) return false;
  return p.groundedPlatformId==='f9:ground' ||
    (p.groundedPlatformId==='f8:cap' &&
     p.x-p.halfWidth>=cap.x && p.x+p.halfWidth<=cap.x+cap.width);
}

// A live WebGL/browser handoff may first retain the TRUE old gate from an
// adjacent browser guardian packet, before the immutable HP-zero crossing
// record appears in later Floor9 source snapshots. Re-bind only that already
// GPU-resident original gate to the subsequently OBSERVED matching record.
// Never manufacture a crossing, restart history, geometry, actor or tick.
export function reconcileRecordedOriginalCapCrossing(source, held) {
  const tick=source?.lastGuardianCrossing?.sourceTick;
  if (!held || held.crossingTick != null ||
      !Number.isSafeInteger(tick) ||
      !Number.isSafeInteger(held.sourceTick) ||
      tick>held.sourceTick || held.sourceTick-tick>12 ||
      !observedSourceEarnedColdFrameContinuation(
        source,{...held,crossingTick:tick})) return null;
  return tick;
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
  const firstGpuReceipt=job?.proof==='adjacent-browser-guardian' &&
    observedStagedOriginalCapBeforeRecordedCrossing(source,held);
  if(!job || job.state!=='awaiting-actual-first-render' ||
      job.structureDeferred!==true ||
      !(job.proof==='recorded-source-gateway' || firstGpuReceipt) ||
      job.runToken!==source?.runToken || job.floor!==source?.floor ||
      !Number.isSafeInteger(job.sourceTick) ||
      // The deferral was scheduled by the ACTUAL first rebuilt 3D frame,
      // not by the earlier browser observation or the HP-zero source tick.
      job.sourceTick!==held?.firstWorldRenderTick ||
      !Number.isSafeInteger(job.submittedFrames) ||
      job.submittedFrames<1 || job.submittedFrames>=10 ||
      held.submittedFrames>=10 || held.visibleSeconds>=1.25) return false;
  // Actual 1x films still lost the entire bronze doorway behind an opaque
  // purple shaft even while original GPU cap/gate were retained. Share the
  // same bounded real-passage display clock as the roof instead of uploading
  // the massive noninteractive new architecture after just one submission.
  // Both branches remain fully source-validated and terminate on wrong run,
  // death, changed floor, stale crossing, distant climber or elapsed window.
  return observedClockworkRoofContinuity(source,passage,held) ||
    observedSourceEarnedColdFrameContinuation(source,held) ||
    firstGpuReceipt;
}
