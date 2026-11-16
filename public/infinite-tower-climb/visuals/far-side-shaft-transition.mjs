// P0: One source-proven, genuinely walkable Floor 9 departure must NOT erase
// the old GPU room before the authentic incoming 3D shaft has been rendered.
// The functions below are pure presentation witnesses: no new physics, floor,
// guardian victory, posed player, faked GPU return, or promised native pixels.
const valid=Number.isSafeInteger;
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};

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
      !['awaiting-actual-first-render','awaiting-structural-release',
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
