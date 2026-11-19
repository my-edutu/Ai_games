// P0: a source position beyond the real F8 gateway must never be confused
// with an ORIGINAL successor shaft that has actually returned on WebGL.
// This is a display-only retirement interlock; it cannot modify the
// fixed-step authority, guardian defeat, collision surfaces or live actor.
export function observedReturnedSuccessorRoomReady(source,old,job) {
  const valid=Number.isSafeInteger;
  if(source?.lifecycle!=='running' || source.floor!==9 ||
     source.theme!=='void' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !valid(source.tick) ||
     !old || old.runToken!==source.runToken || old.floor!==9 ||
     old.oldCapId!=='f8:cap' ||
     old.verifiedObservedFloorAdvance!==true ||
     old.guardianGateRetained!==true ||
     !valid(old.crossingTick) || old.crossingTick>source.tick ||
     source.tick-old.crossingTick>150 ||
     !valid(old.firstWorldRenderTick) ||
     !valid(old.submittedFrames) ||
     old.submittedFrames<6 || old.submittedFrames>=30 ||
     !Number.isFinite(old.visibleSeconds) ||
     old.visibleSeconds<.9 || old.visibleSeconds>=2.8 ||
     old.opticalExitSubmitted!==true ||
     !Number.isFinite(old.originalGatewayOpacity) ||
     old.originalGatewayOpacity>.01 || old.originalGatewayOpacity<0 ||
     !Number.isFinite(old.originalGallerySourceOpacity) ||
     old.originalGallerySourceOpacity>.01 || old.originalGallerySourceOpacity<0 ||
     !Number.isFinite(old.originalDeckSurface?.opacity) ||
     old.originalDeckSurface.opacity>.01 ||
     old.originalDeckSurface.opacity<0 ||
     !job || job.runToken!==source.runToken ||
     job.floor!==9 || job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true ||
     !valid(job.sourceTick) || job.sourceTick!==old.firstWorldRenderTick ||
     job.sourceTick>source.tick ||
     !valid(job.submittedFrames) ||
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
       'fading-remote-arrival','complete'].includes(job.state))
    return false;
  return true;
}

/**
 * Returned successor depth cannot be blocked by a still-present genuine
 * bronze gate when the hero has already walked the full actual far-side roof.
 * Source position is NOT enough: exact F8 guardian zero-HP, old roof = real
 * F9 ground, full-body supported contact, same run, old original GPU
 * ownership, an already assembled original successor load-bearing shaft and
 * a successful returned structural-submission frame are all mandatory.
 * This is only an initial 22% background optical overlap behind the original
 * threshold; no floor, geometry, collision, event or render-return is made.
 */
export function observedSupportedReturnedShaftDepth(source,held,job) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const ground=source?.platforms?.find(x=>x?.id==='f9:ground');
  const valid=Number.isSafeInteger;
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     ![source.tick,p.x,p.y,p.halfWidth,p.halfHeight,ground?.x,
       ground?.y,ground?.width,ground?.height,held?.thresholdX,
       held?.oldRoofY,held?.oldCapX,held?.oldCapWidth,
       held?.sourceTick,held?.submittedFrames,
       held?.firstWorldRenderTick,job?.sourceTick,
       job?.submittedFrames,job?.structureBuiltAtSubmitted,
       job?.structuralVisibleReturns].every(valid) ||
     source.tick<held.sourceTick || source.tick-held.sourceTick>110 ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     ground.width<=0 || ground.height<=0 ||
     held.oldCapWidth<=0 ||
     source.runToken!==held.runToken || source.runToken!==job.runToken ||
     held.floor!==9 || job.floor!==9 ||
     held.oldCapId!=='f8:cap' ||
     held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.opticalExitSubmitted===true ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground.y+ground.height!==held.oldRoofY ||
     p.grounded!==true || p.state!=='standing' || p.vy!==0 ||
     p.groundedPlatformId!=='f9:ground' ||
     p.y-p.halfHeight!==held.oldRoofY ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width ||
     p.x-p.halfWidth<=held.thresholdX+100000 ||
     held.submittedFrames<1 || held.submittedFrames>=30 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
     !Number.isFinite(held.originalGatewayOpacity) ||
     held.originalGatewayOpacity<=.01 ||
     held.originalGatewayOpacity>1 ||
     w?.runToken!==source.runToken ||
     w.fromFloor!==8 || w.toFloor!==9 ||
     !valid(w.sourceTick) || w.sourceTick>source.tick ||
     w.cap?.id!=='f8:cap' ||
     w.cap.x!==held.oldCapX ||
     w.cap.width!==held.oldCapWidth ||
     w.cap.y+w.cap.height!==held.oldRoofY ||
     w.exitX!==held.thresholdX ||
     w.guardian?.kind!=='guardian' ||
     w.guardian.active!==false ||
     !Number.isFinite(w.guardian.health) || w.guardian.health>0 ||
     job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true ||
     job.sourceTick!==held.firstWorldRenderTick ||
     job.structureBuiltAtSubmitted<1 ||
     job.submittedFrames<=job.structureBuiltAtSubmitted ||
     job.submittedFrames>30 ||
     job.structuralVisibleReturns!==0 ||
     !Number.isFinite(job.structuralFade) ||
     job.structuralFade<0 || job.structuralFade>1 ||
     job.structuralRoot?.isGroup!==true ||
     !['awaiting-structural-submission','awaiting-vista-submission'].includes(job.state))
    return null;
  return {sourceBound:true,sourceTick:source.tick,alpha:.22,
    requiresReturnedOriginalSuccessor:true,
    limitation:'Bounded actual returned original successor depth, not native pixel visibility'};
}
