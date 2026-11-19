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
