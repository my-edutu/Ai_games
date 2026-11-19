// P0: One source-proven, genuinely walkable Floor 9 departure must NOT erase
// the old GPU room before the authentic incoming 3D shaft has been rendered.
// The functions below are pure presentation witnesses: no new physics, floor,
// guardian victory, posed player, faked GPU return, or promised native pixels.
const valid=Number.isSafeInteger;
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};

/**
 * P0 — keep the authentic, already-rendered Floor 9 load-bearing core in
 * shared view with the HP-open original Clockwork gateway BEFORE triggering
 * two costly noninteractive detail/shader uploads on software WebGL.
 *
 * Both incoming and original material owners must be this same source run.
 * A returned Three.js submission is not proof of native video pixels, but
 * source polling, CPU construction, HUD floor labels and a stalled frame
 * cannot certify a mixed-world shot or spend this upload gate.
 *
 * Once the original old-room material is gone (or the original owner is
 * legitimately disposed), the expensive scenic uploads may proceed normally.
 * Gameplay platforms, hazards, boss, protagonist and collision are never
 * deferred by this policy.
 */
export function observedSourceReturnedCoreBeforeScenicUpload(source,held,job,stage) {
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !Number.isSafeInteger(source.tick) ||
     !job || job.runToken!==source.runToken || job.floor!==9 ||
     job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true ||
     job.state!=='awaiting-void-biome-build' ||
     !Number.isSafeInteger(job.sourceTick) ||
     job.sourceTick>source.tick ||
     !Number.isSafeInteger(job.submittedFrames) ||
     !Number.isSafeInteger(job.structureBuiltAtSubmitted) ||
     job.submittedFrames<=job.structureBuiltAtSubmitted ||
     !Number.isSafeInteger(job.structuralVisibleReturns) ||
     job.structuralVisibleReturns<0 ||
     !Number.isFinite(job.structuralVisibleSeconds) ||
     job.structuralVisibleSeconds<0 || job.structuralVisibleSeconds>3 ||
     !job.structuralRoot?.isGroup ||
     (stage!=='periphery' && stage!=='biome')) return false;
  if(stage==='biome' &&
      (!Number.isSafeInteger(job.peripheryBuiltAtSubmitted) ||
       job.submittedFrames<=job.peripheryBuiltAtSubmitted))return false;
  // A contradictory immutable guardian event is never permission to
  // build the scenic successor under a still-present original gateway.
  // An absent event can occur in a late browser receipt; the retained
  // prior source-certified GPU owner, when present, remains authoritative.
  const crossing=source.lastGuardianCrossing;
  if(crossing && (
      crossing.runToken!==source.runToken ||
      crossing.fromFloor!==8 || crossing.toFloor!==9 ||
      crossing.cap?.id!=='f8:cap' ||
      crossing.guardian?.kind!=='guardian' ||
      crossing.guardian.active!==false ||
      !Number.isFinite(crossing.guardian.health) ||
      crossing.guardian.health>0 ||
      !Number.isSafeInteger(crossing.sourceTick) ||
      crossing.sourceTick>source.tick ||
      (Number.isSafeInteger(held?.crossingTick) &&
       crossing.sourceTick!==held.crossingTick))) return false;
  const originalStillPainted=held?.guardianGateRetained===true &&
    held.runToken===source.runToken && held.floor===9 &&
    held.oldCapId==='f8:cap' &&
    held.verifiedObservedFloorAdvance===true &&
    Number.isSafeInteger(held.crossingTick) &&
    held.crossingTick<=source.tick &&
    Number.isSafeInteger(held.firstWorldRenderTick) &&
    held.firstWorldRenderTick===job.sourceTick &&
    held.opticalExitSubmitted!==true &&
    Number.isFinite(held.originalGatewayOpacity) &&
    held.originalGatewayOpacity>.15 &&
    Number.isSafeInteger(held.submittedFrames) &&
    held.submittedFrames>0 &&
    Number.isFinite(held.visibleSeconds) &&
    held.visibleSeconds>=0 && held.visibleSeconds<2.8 &&
    source.lastGuardianCrossing?.runToken===source.runToken &&
    source.lastGuardianCrossing.fromFloor===8 &&
    source.lastGuardianCrossing.toFloor===9 &&
    source.lastGuardianCrossing.guardian?.kind==='guardian' &&
    source.lastGuardianCrossing.guardian.active===false &&
    Number.isFinite(source.lastGuardianCrossing.guardian.health) &&
    source.lastGuardianCrossing.guardian.health<=0;
  if(!originalStillPainted)return true;
  // Gate noninteractive upload bursts behind actual successfully returned,
  // source-matched NONZERO core paint. The third return protects its
  // first real successor silhouette when the heavy animated biome compiles.
  const requiredReturns=stage==='periphery'?2:3;
  const requiredSeconds=stage==='periphery'?.12:.20;
  return job.structuralRoot.visible===true &&
    job.structuralFade>.015 &&
    job.structuralVisibleReturns>=requiredReturns &&
    job.structuralVisibleSeconds>=requiredSeconds;
}


// An optical overlap is legitimate only when the real full-body actor has
// completely LEFT the old threshold and still has authoritative support.
// A floor label, a route target, an unobserved jump, or an opaque camera
// fallback can never certify this world-space clearance.
export function observedEarnedFarSideShaftOverlap(source,held,job=null) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const ground=source?.platforms?.find(platform=>platform?.id==='f9:ground');
  if(source?.lifecycle!=='running' || source.floor!==9 ||
     source.theme!=='void' || !(p?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !held || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.runToken!==source.runToken || held.floor!==9 ||
     held.oldCapId!=='f8:cap' ||
     ![source.tick,p.x,p.y,p.halfWidth,p.halfHeight,
       held.oldCapX,held.oldCapWidth,held.oldRoofY,held.thresholdX,
       held.crossingTick,held.submittedFrames,
       ground?.x,ground?.y,ground?.width,ground?.height].every(valid) ||
     !Number.isFinite(held.visibleSeconds) ||
     !Number.isFinite(held.originalGatewayOpacity) ||
     held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
     held.submittedFrames<0 || held.submittedFrames>=30 ||
     held.originalGatewayOpacity<=.01 ||
     held.originalGatewayOpacity>1 ||
     held.opticalExitSubmitted===true ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     held.oldCapWidth<=0 || ground.width<=0 || ground.height<=0 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground.y+ground.height!==held.oldRoofY ||
     source.tick<held.crossingTick ||
     source.tick-held.crossingTick>150 ||
     // The source-owned upper route rises onto f9:p2 with less than 2m
     // of extra X travel. The former +10m-only rule rejected that ACTUAL
     // ascent even when both feet stood 12.6m above the old gateway,
     // causing the retained bronze room to expire before the successor
     // shaft could share a real returned frame. A genuinely raised sole
     // (at least 7m, with support or bounded real flight checked below)
     // is an alternative to physically walking 10m past the threshold.
     // Never infer this from a destination, floor label or renderer clock.
     !(p.x-p.halfWidth>held.thresholdX+100000 ||
       p.y-p.halfHeight>=held.oldRoofY+70000)) return null;
  if(w!=null && (
     w.runToken!==source.runToken ||
     w.fromFloor!==8 || w.toFloor!==9 ||
     !valid(w.sourceTick) || w.sourceTick>source.tick ||
     w.sourceTick!==held.crossingTick ||
     w.cap?.id!=='f8:cap' ||
     w.cap.x!==held.oldCapX || w.cap.width!==held.oldCapWidth ||
     w.cap.y+w.cap.height!==held.oldRoofY ||
     w.exitX!==held.thresholdX ||
     w.guardian?.kind!=='guardian' ||
     w.guardian.active!==false ||
     !Number.isFinite(w.guardian.health) ||
     w.guardian.health>0))return null;
  const sole=p.y-p.halfHeight;
  const standing=p.grounded===true &&
    (p.state==='standing'||p.state==='hurt') && p.vy===0 &&
    typeof p.groundedPlatformId==='string';
  const deck=standing
    ?source.platforms.find(platform=>platform?.id===p.groundedPlatformId)
    :null;
  const groundedSupport=deck &&
    [deck.x,deck.y,deck.width,deck.height].every(valid) &&
    deck.width>0 && deck.height>0 &&
    p.x-p.halfWidth>=deck.x &&
    p.x+p.halfWidth<=deck.x+deck.width &&
    sole===deck.y+deck.height &&
    (deck.id==='f9:ground' ||
      (deck.id.startsWith('f9:p') &&
       sole>=held.oldRoofY && sole<=held.oldRoofY+230000));
  const authenticFlight=p.grounded===false &&
    p.state==='airborne' && p.groundedPlatformId==null &&
    Number.isFinite(p.vy) &&
    p.x-p.halfWidth>=ground.x &&
    p.x+p.halfWidth<=ground.x+ground.width &&
    sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+230000;
  if(!groundedSupport && !authenticFlight)return null;
  if(job && (job.runToken!==source.runToken || job.floor!==9 ||
      job.proof!=='recorded-source-gateway' ||
      job.structureDeferred!==true ||
      !valid(job.sourceTick) || job.sourceTick>source.tick ||
      !valid(job.submittedFrames) || job.submittedFrames<0 ||
      job.submittedFrames>60 ||
      !valid(job.structuralVisibleReturns) ||
      job.structuralVisibleReturns<0 ||
      job.structuralVisibleReturns>30 ||
      !['awaiting-actual-first-render','awaiting-void-biome-build',
        'awaiting-structural-release',
        'awaiting-structural-submission','awaiting-vista-submission',
        'fading-remote-arrival','complete'].includes(job.state)))
    return null;
  return {sourceBound:true,sourceTick:source.tick,
    wholeBodyFarSide:true,grounded:!!groundedSupport,
    incomingReturnedFrames:job?.structuralVisibleReturns??0,
    limitation:'Real source-cleared gate and exact successor platform or airborne route; the GPU overlap and native pixels still need proof'};
}

// The ORIGINAL GPU owner can recede only after a nonzero incoming shell was
// actually included in a successfully returned renderer submission. Both
// elapsed returned frames and bounded successful-render duration are required;
// a CPU construction, source poll or stalled RAF is never a painted frame.
export function observedReturnedFarSideFade(held,job) {
  if(!held || !job ||
     ![held.submittedFrames,held.farSideFadeStartSubmitted,
       job.structuralVisibleReturns].every(valid) ||
     ![held.visibleSeconds,held.farSideFadeStartSeconds].every(Number.isFinite) ||
     held.submittedFrames<held.farSideFadeStartSubmitted ||
     held.visibleSeconds<held.farSideFadeStartSeconds ||
     job.structuralVisibleReturns<0)return null;
  if(job.structuralVisibleReturns===0)return 0;
  const frameProgress=(held.submittedFrames-held.farSideFadeStartSubmitted)/7;
  const returnedTime=(held.visibleSeconds-held.farSideFadeStartSeconds)/.95;
  return smooth(Math.min(frameProgress,returnedTime));
}

// P0: Begin revealing the REAL, already-constructed next-floor shaft while
// the climber still crosses the genuine Floor9 roof/low ascending approach.
// Previous staging hid all successor depth until the hero had risen 7m;
// software WebGL then painted an abrupt replacement instead of an earned
// shared-room view. This authorizes only <=28% scenic, noninteractive depth
// after an actual old-door GPU return; it never opens the physical guardian
// gate, changes a platform, or certifies a pixel or event synchronization.
export function observedEarnedSillDepthExposure(source, held, job=null) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const cap=w?.cap, g=w?.guardian;
  const ground=source?.platforms?.find(s=>s?.id==='f9:ground');
  if(source?.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || !(p?.health>0) ||
      typeof source.runToken!=='string' || !source.runToken ||
      !held || held.guardianGateRetained!==true ||
      held.verifiedObservedFloorAdvance!==true ||
      held.runToken!==source.runToken || held.floor!==9 ||
      held.oldCapId!=='f8:cap' || held.opticalExitSubmitted===true ||
      !w || w.runToken!==source.runToken ||
      w.fromFloor!==8 || w.toFloor!==9 ||
      g?.kind!=='guardian' || g.active!==false ||
      !Number.isFinite(g.health) || g.health>0 ||
      cap?.id!=='f8:cap' ||
      ![source.tick,w.sourceTick,cap.x,cap.y,cap.width,cap.height,
        w.exitX,held.oldCapX,held.oldCapWidth,held.oldRoofY,
        held.thresholdX,held.crossingTick,held.submittedFrames,
        p.x,p.y,p.halfWidth,p.halfHeight,
        ground?.x,ground?.y,ground?.width,ground?.height].every(valid) ||
      cap.width<=0 || cap.height<=0 || ground.width<=0 ||
      ground.height<=0 || p.halfWidth<=0 || p.halfHeight<=0 ||
      cap.x!==held.oldCapX || cap.width!==held.oldCapWidth ||
      cap.y+cap.height!==held.oldRoofY ||
      w.exitX!==held.thresholdX ||
      w.exitX!==cap.x+Math.floor(cap.width*.76) ||
      w.sourceTick!==held.crossingTick ||
      source.tick<w.sourceTick || source.tick-w.sourceTick>65 ||
      held.submittedFrames<1 || held.submittedFrames>=15 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=1.8 ||
      held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
      !Number.isFinite(held.originalGatewayOpacity) ||
      held.originalGatewayOpacity<.68 ||
      held.originalGatewayOpacity>1 ||
      ground.y+ground.height!==held.oldRoofY ||
      p.x-p.halfWidth<held.thresholdX+4000 ||
      p.x-p.halfWidth>held.thresholdX+50000 ||
      p.x-p.halfWidth<ground.x ||
      p.x+p.halfWidth>ground.x+ground.width) return null;
  const sole=p.y-p.halfHeight;
  const actualRoofContact=p.grounded===true &&
    p.groundedPlatformId==='f9:ground' &&
    (p.state==='standing'||p.state==='hurt') &&
    p.vy===0 && sole===held.oldRoofY;
  // The original recorded route launches before software WebGL can return
  // a second F9 frame; protect that REAL airborne segment as well.
  const actualLowFlight=p.grounded===false &&
    p.state==='airborne' && p.groundedPlatformId==null &&
    Number.isFinite(p.vy) &&
    sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+80000;
  if(!actualRoofContact&&!actualLowFlight)return null;
  if(job && (job.state!=='awaiting-structural-release' ||
      job.proof!=='recorded-source-gateway' ||
      job.structureDeferred!==true ||
      job.runToken!==source.runToken || job.floor!==9 ||
      !valid(job.sourceTick) || job.sourceTick>source.tick ||
      !valid(job.submittedFrames) ||
      !valid(job.structureBuiltAtSubmitted) ||
      job.structureBuiltAtSubmitted<1 ||
      job.submittedFrames<=job.structureBuiltAtSubmitted))
    return null;
  return {sourceBound:true,sourceTick:source.tick,
    originalRoofContact:!!actualRoofContact,
    originalLowFlight:!!actualLowFlight,
    maxDepthReveal:.28,
    limitation:'Real grounded original roof or low airborne departure and already-returned original gate only; next shaft cannot certify native pixels'};
}


// P0 GPU-owner interlock. In the source-pinned 1x duel film, the real 20Hz
// climber can clear the old sill while the next shaft is still being uploaded:
// the last actually painted bronze arch vanishes under a source-only opacity
// update and the first painted violet shaft replaces it in one hard cut.
// Do not use a clock, pose, guessed platform, UI overlay, or a new 3D room:
// retain ONLY material opacity sampled after the original WebGL return, and
// only while the separately proven living body is truly supported far-side.
// The existing far-side fade owns retirement as soon as a NEW real shaft
// submission returns; this is not native visual acceptance.
export function observedReturnedOriginalArchitectureHold(source,held,job,farSide) {
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     !source.runToken || source.runToken!==held?.runToken ||
     held.floor!==9 || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.opticalExitSubmitted===true ||
     farSide?.sourceBound!==true || farSide.sourceTick!==source.tick ||
     farSide.wholeBodyFarSide!==true || farSide.incomingReturnedFrames!==0 ||
     !job || job.runToken!==source.runToken || job.floor!==9 ||
     job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true ||
     !['awaiting-actual-first-render','awaiting-void-biome-build',
        'awaiting-structural-release',
       'awaiting-structural-submission','awaiting-vista-submission']
       .includes(job.state) ||
     ![source.tick,held.crossingTick,held.firstWorldRenderTick,
       held.submittedFrames,held.lastReturnedOldGatewayTick,
       job.sourceTick,job.submittedFrames,job.structuralVisibleReturns]
       .every(valid) ||
     ![held.visibleSeconds,held.lastReturnedOldGatewayOpacity,
       held.lastReturnedOriginalGalleryOpacity].every(Number.isFinite) ||
     held.crossingTick>source.tick || source.tick-held.crossingTick>150 ||
     job.sourceTick!==held.firstWorldRenderTick ||
     held.lastReturnedOldGatewayTick>source.tick ||
     source.tick-held.lastReturnedOldGatewayTick>150 ||
     held.submittedFrames<1 || held.submittedFrames>=30 ||
     job.submittedFrames<1 || job.submittedFrames>60 ||
     job.structuralVisibleReturns!==0 ||
     held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
     held.lastReturnedOldGatewayOpacity<=.01 ||
     held.lastReturnedOldGatewayOpacity>1 ||
     held.lastReturnedOriginalGalleryOpacity<=.01 ||
     held.lastReturnedOriginalGalleryOpacity>1) return null;
  return {sourceBound:true,sourceTick:source.tick,
    gateOpacity:held.lastReturnedOldGatewayOpacity,
    galleryOpacity:held.lastReturnedOriginalGalleryOpacity,
    incomingReturnedFrames:0,
    limitation:'Last truly returned original 3D materials, current source-supported far-side route; no native pixel or accepted experience claim'};
}


// P0: the first true F9 renderer return may already have built the ORIGINAL
// noninteractive Void shaft, but waiting for a *second* cold WebGL return
// concealed that real next room until the bronze gate vanished. Admit only
// a restrained rear-world material aperture on the NEXT submission, while
// the actually returned bronze threshold remains opaque and physically
// cleared by its whole-body climber. No extra meshes, floor, collider, camera,
// source tick, fake renderer receipt, UI phase or future-position guess.
export function observedSourceEarnedEarlyVoidShaftAperture(source, held, job) {
  const p=source?.player,ground=source?.platforms?.find(s=>s?.id==='f9:ground');
  const w=source?.lastGuardianCrossing;
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !held || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.runToken!==source.runToken || held.floor!==9 ||
     held.oldCapId!=='f8:cap' || held.opticalExitSubmitted===true ||
     !job || job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true || job.floor!==9 ||
     job.runToken!==source.runToken ||
     !['awaiting-void-biome-build','awaiting-structural-release',
       'awaiting-structural-submission','awaiting-vista-submission'].includes(job.state) ||
     ![source.tick,held.firstWorldRenderTick,held.submittedFrames,
       held.oldRoofY,held.thresholdX,held.oldCapX,held.oldCapWidth,
       job.sourceTick,job.submittedFrames,job.structureBuiltAtSubmitted,
       job.structuralVisibleReturns,p.x,p.y,p.halfWidth,p.halfHeight,
       ground?.x,ground?.y,ground?.width,ground?.height].every(valid) ||
     !Number.isFinite(held.visibleSeconds) ||
     !Number.isFinite(held.originalGatewayOpacity) ||
     source.tick<held.firstWorldRenderTick ||
     source.tick-held.firstWorldRenderTick>48 ||
     held.visibleSeconds<0 || held.visibleSeconds>=2 ||
     held.originalGatewayOpacity<.72 || held.originalGatewayOpacity>1 ||
     held.submittedFrames<1 || held.submittedFrames>8 ||
     job.sourceTick!==held.firstWorldRenderTick ||
     job.structureBuiltAtSubmitted<1 ||
     job.submittedFrames<job.structureBuiltAtSubmitted ||
     job.submittedFrames>8 || job.structuralVisibleReturns>3 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground.width<=0 || ground.height<=0 ||
     ground.y+ground.height!==held.oldRoofY ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     // A fully exited source player must also leave the old bronze
     // sightline. Real recorded first F9 contact clears by 7.2m; the
     // 4m legal crossing alone does not prove a readable optical opening.
     p.x-p.halfWidth<held.thresholdX+6000 ||
     p.x-p.halfWidth>held.thresholdX+60000 ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width) return null;
  if(w!=null && (w.runToken!==source.runToken ||
     w.fromFloor!==8 || w.toFloor!==9 ||
     w.cap?.id!=='f8:cap' || w.cap.x!==held.oldCapX ||
     w.cap.width!==held.oldCapWidth ||
     w.cap.y+w.cap.height!==held.oldRoofY ||
     w.exitX!==held.thresholdX ||
     w.guardian?.kind!=='guardian' ||
     w.guardian.active!==false ||
     !Number.isFinite(w.guardian.health) || w.guardian.health>0 ||
     !valid(w.sourceTick) || w.sourceTick>source.tick)) return null;
  const sole=p.y-p.halfHeight;
  // A first 20Hz F9 packet legitimately retains its just-traversed F8 cap
  // contact ID. That same roof is *also* the genuine f9:ground bottom plane.
  const roofContact=p.grounded===true && p.vy===0 &&
    (p.state==='standing'||p.state==='hurt') &&
    (p.groundedPlatformId==='f9:ground' ||
     p.groundedPlatformId==='f8:cap') &&
    sole===held.oldRoofY;
  const lowFlight=p.grounded===false && p.state==='airborne' &&
    p.groundedPlatformId==null && Number.isFinite(p.vy) &&
    sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+80000;
  if(!roofContact&&!lowFlight)return null;
  return {sourceBound:true,sourceTick:source.tick,
    alpha:roofContact?.24:.18,roofContact,
    originalGatewayRetained:true,
    limitation:'Partial authentic Void structural materials only after first original 3D WebGL return; no fabricated new scene or native-frame acceptance'};
}


// P0 continuous, source-authenticated ground corridor from the real bronze
// guardian sill to the far-side climb. The original short-range aperture
// stops at +60m and the raised/far-side witness starts only at +100m or a
// genuine +7m sole rise. Under cold WebGL a REAL grounded climber can occupy
// the 60–100m receiving roof when its FIRST original successor core finally
// finishes building; both former witnesses then return null. The renderer
// submits a bronze-only room and later a disconnected violet room.
//
// Grant <=22% of the ALREADY-BUILT noninteractive real shaft's materials
// ONLY if the original HP-zero crossing, exact walkable successor roof, full
// body, live original GPU gateway and at least one actual returned WebGL
// frame all agree. Never grant gameplay progress, a fictional bridge,
// a recorded screenshot, an extra draw pass or source/native synchronization.
export function observedGroundedReceivingRoofColdPaint(source,held,job) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const cap=w?.cap,g=w?.guardian;
  const roof=source?.platforms?.find(s=>s?.id==='f9:ground');
  if(source?.lifecycle!=='running' || source.floor!==9 ||
    source.theme!=='void' || typeof source.runToken!=='string' ||
    !source.runToken || !valid(source.tick) ||
    !p || !(p.health>0) || p.grounded!==true ||
    (p.state!=='standing' && p.state!=='hurt') ||
    p.groundedPlatformId!=='f9:ground' || p.vy!==0 ||
    ![p.x,p.y,p.halfWidth,p.halfHeight,
      roof?.x,roof?.y,roof?.width,roof?.height].every(valid) ||
    p.halfWidth<=0 || p.halfHeight<=0 ||
    !roof || roof.width<=0 || roof.height<=0 ||
    !held || held.runToken!==source.runToken || held.floor!==9 ||
    held.guardianGateRetained!==true ||
    held.verifiedObservedFloorAdvance!==true ||
    held.oldCapId!=='f8:cap' || held.opticalExitSubmitted===true ||
    ![held.oldCapX,held.oldCapWidth,held.oldRoofY,
      held.thresholdX,held.crossingTick,held.firstWorldRenderTick,
      held.submittedFrames].every(valid) ||
    held.oldCapWidth<=0 || held.submittedFrames<1 ||
    held.submittedFrames>12 ||
    !Number.isFinite(held.visibleSeconds) ||
    held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
    held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
    !Number.isFinite(held.originalGatewayOpacity) ||
    held.originalGatewayOpacity<=.035 ||
    held.originalGatewayOpacity>1 ||
    held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
    roof.y+roof.height!==held.oldRoofY ||
    p.y-p.halfHeight!==held.oldRoofY ||
    p.x-p.halfWidth<roof.x || p.x+p.halfWidth>roof.x+roof.width ||
    // Preserve exactly one contiguous region: the near 6–60m aperture and
    // the far >100m / elevated-step path retain their existing stricter
    // separate contracts.
    p.x-p.halfWidth<held.thresholdX+6000 ||
    p.x-p.halfWidth>held.thresholdX+100000 ||
    source.tick<held.crossingTick ||
    source.tick-held.crossingTick>150 ||
    !w || w.runToken!==source.runToken || w.fromFloor!==8 ||
    w.toFloor!==9 || !valid(w.sourceTick) ||
    w.sourceTick!==held.crossingTick || w.sourceTick>source.tick ||
    cap?.id!=='f8:cap' || ![cap.x,cap.y,cap.width,cap.height].every(valid) ||
    cap.width<=0 || cap.height<=0 ||
    cap.x!==held.oldCapX || cap.width!==held.oldCapWidth ||
    cap.y+cap.height!==held.oldRoofY || w.exitX!==held.thresholdX ||
    g?.kind!=='guardian' || g.active!==false ||
    !Number.isFinite(g.health) || g.health>0 ||
    !job || job.runToken!==source.runToken || job.floor!==9 ||
    job.proof!=='recorded-source-gateway' ||
    job.structureDeferred!==true ||
    !['awaiting-void-biome-build','awaiting-structural-release',
      'awaiting-structural-submission','awaiting-vista-submission']
      .includes(job.state) ||
    !valid(job.sourceTick) ||
    job.sourceTick!==held.firstWorldRenderTick ||
    job.sourceTick>source.tick ||
    !valid(job.structureBuiltAtSubmitted) ||
    job.structureBuiltAtSubmitted<1 ||
    !valid(job.submittedFrames) ||
    job.submittedFrames<job.structureBuiltAtSubmitted ||
    job.submittedFrames>12 ||
    job.structuralVisibleReturns!==0 ||
    job.structuralRoot?.isGroup!==true ||
    !(job.structuralRoot.children?.length>0)) return null;
  return {sourceBound:true,sourceTick:source.tick,grounded:true,
    alpha:.22,basis:'authentic-grounded-receiving-roof-corridor',
    originalGatewayRetained:true,
    limitation:'Live HP-zero old gateway, exact full-body F9 roof support, built original successor core and actual previous renderer return; not native pixels'};
}

// P0 coherent far-side first paint. In original 1x gameplay, slow WebGL may
// consume the near-sill 6–60m interval while uploading the REAL Floor9 shell.
// The climber then stands on a source-authoritative farther F9 deck, the
// opened original F8 gateway is still actually GPU-retained, but the whole
// new-world load path remains culled until a later, unrelated-looking frame.
// Admit the ALREADY BUILT original noninteractive load path beside that gate
// on the next returned submission. Never manufacture a platform, render
// receipt, crossing, victory, camera pose or violet full-screen replacement.
export function observedSourceSupportedVoidFirstPaint(source, held, job) {
  const near=observedSourceEarnedEarlyVoidShaftAperture(source,held,job);
  if(near?.sourceBound===true)return near;
  const roof=observedGroundedReceivingRoofColdPaint(source,held,job);
  if(roof?.sourceBound===true)return roof;
  const far=observedEarnedFarSideShaftOverlap(source,held,job);
  if(far?.sourceBound!==true ||
     far.sourceTick!==source?.tick ||
     far.incomingReturnedFrames!==0 ||
     held?.opticalExitSubmitted===true ||
     !job || job.structureDeferred!==true ||
     !['awaiting-void-biome-build','awaiting-structural-release',
       'awaiting-structural-submission','awaiting-vista-submission'].includes(job.state) ||
     !valid(held.firstWorldRenderTick) ||
     !valid(held.submittedFrames) || held.submittedFrames<1 ||
     !valid(job.sourceTick) ||
     job.sourceTick!==held.firstWorldRenderTick ||
     !valid(job.structureBuiltAtSubmitted) ||
     job.structureBuiltAtSubmitted<1 ||
     !valid(job.submittedFrames) ||
     job.submittedFrames<job.structureBuiltAtSubmitted ||
     job.submittedFrames>12 ||
     !valid(job.structuralVisibleReturns) ||
     job.structuralVisibleReturns!==0) return null;
  return {sourceBound:true,sourceTick:source.tick,
    alpha:far.grounded?.26:.20,
    basis:'genuine-far-side-supported-route',
    originalGatewayRetained:true,
    limitation:'Already-built original Floor9 structural geometry and genuine supported far-side body; native pixels, WebGL return and visual acceptance remain unverified'};
}

// P0 source-earned CROSSING CLEARANCE, distinct from a cosmetic old-room fade.
// The genuine post-guardian first Floor 9 view currently retains all massive
// non-colliding F8 gallery braces at near-full opacity while the returned
// bronze doorway, living climber and authentic successor decks occupy ONE
// narrow phone shot. Physically clearing the sill should retire those
// historical foreground braces faster, NOT retire the walked cap, opened
// guardian portal or any F9 collision/support/guardian geometry.
//
// The source identity, actual old roof and existing HP0 witness are hard
// prerequisites. The only clock is a SUCCESSFULLY RETURNED Three frame,
// never a browser packet, unobserved physics step or invented video PTS.
// A caller may latch the minimum opacity for this SAME retained F8 owner to
// avoid historical load posts popping back if the climber takes off.
export function observedEarnedGalleryExitClearance(source,held,{reducedMotion=false}={}) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const ground=source?.platforms?.find(deck=>deck?.id==='f9:ground');
  if(source?.lifecycle!=='running' || source.floor!==9 ||
     source.theme!=='void' || typeof source.runToken!=='string' ||
     !source.runToken || !(p?.health>0) ||
     !held || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.runToken!==source.runToken || held.floor!==9 ||
     held.oldCapId!=='f8:cap' || held.opticalExitSubmitted===true ||
     ![source.tick,p.x,p.y,p.halfWidth,p.halfHeight,p.vy,
       held.thresholdX,held.oldCapX,held.oldCapWidth,
       held.oldRoofY,held.crossingTick,held.submittedFrames,
       ground?.x,ground?.y,ground?.width,ground?.height]
       .every(valid) ||
     !Number.isFinite(held.visibleSeconds) ||
     held.submittedFrames<1 || held.submittedFrames>30 ||
     held.visibleSeconds<.03 || held.visibleSeconds>=2.8 ||
     held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
     !(held.originalGatewayOpacity>.035) ||
     !(held.originalGallerySourceOpacity>0) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     held.oldCapWidth<=0 || ground.width<=0 || ground.height<=0 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground.y+ground.height!==held.oldRoofY ||
     source.tick<held.crossingTick ||
     source.tick-held.crossingTick>150 ||
     p.x-p.halfWidth<held.thresholdX+4000) return null;
  if(w!=null){
    if(w.runToken!==source.runToken ||
       w.fromFloor!==8 || w.toFloor!==9 ||
       !valid(w.sourceTick) || w.sourceTick!==held.crossingTick ||
       w.sourceTick>source.tick ||
       w.cap?.id!=='f8:cap' ||
       w.cap.x!==held.oldCapX || w.cap.width!==held.oldCapWidth ||
       w.cap.y+w.cap.height!==held.oldRoofY ||
       w.exitX!==held.thresholdX ||
       w.guardian?.kind!=='guardian' ||
       w.guardian.active!==false ||
       !Number.isFinite(w.guardian.health) ||
       w.guardian.health>0) return null;
  }else if(!valid(held.observedCrossingX) ||
           !valid(held.observedCrossingY) ||
           held.observedCrossingX<held.thresholdX ||
           held.observedCrossingY-held.oldRoofY>30000) {
    // A late immutable record can only be substituted by the already
    // independently verified original grounded source receipt stored on
    // this SAME actual GPU cap owner; a bare Floor9 HUD cannot clear steel.
    return null;
  }
  const sole=p.y-p.halfHeight;
  const supported=p.grounded===true &&
    (p.state==='standing' || p.state==='hurt') && p.vy===0 &&
    typeof p.groundedPlatformId==='string';
  const deck=supported
    ?source.platforms.find(s=>s.id===p.groundedPlatformId)
    :null;
  const roofContact=supported && p.groundedPlatformId==='f8:cap' &&
    sole===held.oldRoofY &&
    p.x-p.halfWidth>=ground.x &&
    p.x+p.halfWidth<=ground.x+ground.width;
  const deckContact=deck &&
    [deck.x,deck.y,deck.width,deck.height].every(valid) &&
    deck.width>0 && deck.height>0 &&
    p.x-p.halfWidth>=deck.x &&
    p.x+p.halfWidth<=deck.x+deck.width &&
    sole===deck.y+deck.height &&
    (deck.id==='f9:ground' ||
      (deck.id.startsWith('f9:p') && sole>=held.oldRoofY &&
        sole<=held.oldRoofY+230000));
  const lowFlight=p.grounded===false &&
    p.state==='airborne' && p.groundedPlatformId==null &&
    p.x-p.halfWidth>=ground.x &&
    p.x+p.halfWidth<=ground.x+ground.width &&
    sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+80000;
  if(!roofContact && !deckContact && !lowFlight)return null;
  const returnedProgress=reducedMotion?1:
    smooth(Math.min(held.submittedFrames/3,held.visibleSeconds/.3));
  return {sourceBound:true,sourceTick:source.tick,
    physicallyBeyondOldSill:true,sourceSupport:roofContact?'original-shared-roof':
      deckContact?'actual-successor-deck':'bounded-actual-low-flight',
    maxOpacity:reducedMotion?.08:
      Math.max(.08,1-.92*returnedProgress),
    affectedMeshes:'historical-noncolliding-gallery-only',
    limitation:'Actual source crossing and previous successful WebGL returns; neither old portal nor any walkable platform changes, no native-film acceptance'};
}


// P0 architectural handoff: the formerly useful Floor8 gallery consists of
// SOURCE-CLIPPED, noninteractive historical triangles, not the original HP
// gate or collision-aligned cap. Its eight translucent batches otherwise stack
// into a persistent bronze curtain even after the real F9 shaft has painted.
// Retire that OLD detached gallery only after (1) the identical genuinely
// defeated guardian and real supported F9 body clear the old sill, AND (2)
// at least TWO successfully returned frames include nonzero original Void
// structural geometry. This is stronger than a source clock, a render
// submission without visible successor architecture, or a floor HUD change.
// The true F8 gate/cap and all F9 gameplay stay independently owned/visible.
export function observedReturnedGalleryHandoffClearance(source,held,job) {
  const realExit=observedEarnedGalleryExitClearance(source,held);
  if(realExit?.sourceBound!==true ||
      !job || job.proof!=='recorded-source-gateway' ||
      job.structureDeferred!==true || job.floor!==9 ||
      job.runToken!==source.runToken ||
      !valid(job.sourceTick) || job.sourceTick>source.tick ||
      !valid(job.submittedFrames) || job.submittedFrames<2 ||
      !valid(job.structureBuiltAtSubmitted) ||
      job.structureBuiltAtSubmitted<1 ||
      job.submittedFrames<=job.structureBuiltAtSubmitted ||
      !valid(job.structuralVisibleReturns) ||
      job.structuralVisibleReturns<2 ||
      job.structuralVisibleReturns>job.submittedFrames ||
      !Number.isFinite(job.structuralFade) ||
      job.structuralFade<=.015 || job.structuralFade>1 ||
      job.structuralRoot?.visible!==true ||
      !['awaiting-void-biome-build','awaiting-structural-release',
        'awaiting-structural-submission','awaiting-vista-submission',
        'fading-remote-arrival','complete'].includes(job.state)) return null;
  return {sourceBound:true,sourceTick:source.tick,galleryOnly:true,
    successorReturnedFrames:job.structuralVisibleReturns,
    maxOpacity:0,
    limitation:'Actual supported crossing plus two returned original F9-shaft frames; a renderer return is NOT independently checked pixel visibility'};
}


// P0: release the obsolete non-colliding Clockwork gallery based on the
// ORIGINAL Void bearing that was actually attached and returned in the FIRST
// source-earned F9 scene, rather than waiting for two further costly
// post-crossing structural-shaft WebGL uploads. The HP-open bronze door, cap,
// walkable F9 platforms, crushers and source authority are never affected.
// Three returned WebGL frames and a substantially faded old gallery make
// retirement gradual; a source packet, fake first-frame flag or a bare F9 HUD
// cannot claim a rendered replacement. Not native-pixel/visibility proof.
export function observedFirstReturnedVoidBearingGalleryRetirement(source, held, job, originalBearing) {
  const clearance=observedEarnedGalleryExitClearance(source, held);
  const root=originalBearing?.root;
  if(clearance?.sourceBound!==true || clearance.maxOpacity>.16 ||
      !held?.originalGalleryRoot?.isGroup ||
      held.originalGalleryRoot.visible!==true ||
      !Array.isArray(held.originalGalleryRoot.children) ||
      held.originalGalleryRoot.children.length===0 ||
      !job || job.runToken!==source.runToken || job.floor!==9 ||
      job.proof!=='recorded-source-gateway' ||
      job.structureDeferred!==true ||
      job.actualFirstFrameVoidBearings!==true ||
      job.entireIncomingVoidCoreDeferred!==false ||
      !Number.isSafeInteger(job.sourceTick) ||
      job.sourceTick>source.tick ||
      !Number.isSafeInteger(job.submittedFrames) ||
      !Number.isSafeInteger(job.firstBearingReturnedFrames) ||
      job.firstBearingReturnedFrames<3 ||
      job.firstBearingReturnedFrames>job.submittedFrames ||
      job.submittedFrames>30 ||
      !Number.isSafeInteger(held.submittedFrames) ||
      job.firstBearingReturnedFrames>held.submittedFrames ||
      !originalBearing ||
      originalBearing.runToken!==source.runToken ||
      originalBearing.coreDrawn!==true ||
      originalBearing.coreDeferred!==false ||
      root?.isGroup!==true ||
      root.name!=='SourceEarnedVoidLandingBearingFrame' ||
      root.visible!==true ||
      root.parent?.name!=='floor:9:void' ||
      !Array.isArray(root.children) || root.children.length===0 ||
      !root.children.some(child=>child.isMesh || child.children?.length>0))
    return null;
  return {
    sourceBound:true, sourceTick:source.tick, galleryOnly:true,
    originalBearingReturnedFrames:job.firstBearingReturnedFrames,
    maxOpacity:0,
    limitation:'Three successful source-matched real Three.js first-bearing returns and a separately grounded/flight-proven corridor; not native pixels or an independent visual verdict'
  };
}
