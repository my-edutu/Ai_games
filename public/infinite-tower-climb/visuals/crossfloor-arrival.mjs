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
  const w=source?.lastGuardianCrossing,p=source?.player;
  const cap=w?.cap,guardian=w?.guardian;
  if (!queued||!w||!p||!cap||!guardian||
      source.lifecycle!=='running'||source.floor!==9||source.theme!=='void'||
      source.runToken!==queued.runToken||w.runToken!==queued.runToken||
      queued.floor!==9||w.fromFloor!==8||w.toFloor!==9||
      ![source.tick,queued.tick,queued.crossingTick,w.sourceTick,
        source.chunkBaseY,source.worldWidth,
        cap.x,cap.y,cap.width,cap.height,w.exitX,w.crossingX,
        w.halfWidth,w.halfHeight,queued.oldCapX,queued.oldCapWidth,
        queued.oldRoofY,queued.thresholdX,p.x,p.y,p.halfWidth,p.halfHeight]
        .every(Number.isSafeInteger)||
      w.sourceTick!==queued.crossingTick||
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
      held.submittedFrames<0 || held.submittedFrames>3 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=.85 ||
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
      // The deferral was scheduled by the ACTUAL first rebuilt 3D frame,
      // not by the earlier browser observation or the HP-zero source tick.
      job.sourceTick!==held?.firstWorldRenderTick ||
      !Number.isSafeInteger(job.submittedFrames) ||
      job.submittedFrames<1 || job.submittedFrames>=5 ||
      held.submittedFrames>=5 || held.visibleSeconds>=.55) return false;
  return observedClockworkRoofContinuity(source,passage,held) ||
    observedSourceEarnedColdFrameContinuation(source,held);
}
