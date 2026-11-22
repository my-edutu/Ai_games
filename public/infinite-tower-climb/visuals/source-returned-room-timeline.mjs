// Exact-scene P0 source/Three-return witness. This is a bounded READ-ONLY
// forensic contract for the physical F8 guardian room -> F9 successor scene.
// It never grants a crossing, edits geometry, changes materials/camera, or
// claims that a WebGL return necessarily appeared in native video pixels.
const int=Number.isSafeInteger;
const opacity=x=>Number.isFinite(x)&&x>=0&&x<=1;
const round=x=>Number.isFinite(x)?Number(x.toFixed(4)):null;
export function observedSourceReturnedRoomState(source,oldOwner,nextOwner,roofColor=null,oldSky=null) {
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken || !int(source.tick))
    return null;
  const w=source.lastGuardianCrossing;
  // A published INVALID crossing always blocks a returned-room claim.
  // Older first-F9 browser packets may legitimately lack the publication.
  if(w!=null && !(w.runToken===source.runToken && w.fromFloor===8 &&
      w.toFloor===9 && w.cap?.id==='f8:cap' &&
      w.guardian?.kind==='guardian' && w.guardian.active===false &&
      Number.isFinite(w.guardian.health) && w.guardian.health<=0 &&
      int(w.sourceTick) && source.tick>=w.sourceTick)) return null;
  const old=oldOwner?.runToken===source.runToken && oldOwner.floor===9 &&
    oldOwner.guardianGateRetained===true &&
    oldOwner.verifiedObservedFloorAdvance===true &&
    int(oldOwner.firstWorldRenderTick) &&
    source.tick>=oldOwner.firstWorldRenderTick &&
    int(oldOwner.submittedFrames) && oldOwner.submittedFrames>=1 &&
    opacity(oldOwner.originalGatewayOpacity);
  const next=nextOwner?.runToken===source.runToken && nextOwner.floor===9 &&
    nextOwner.proof==='recorded-source-gateway' &&
    int(nextOwner.sourceTick) && source.tick>=nextOwner.sourceTick &&
    int(nextOwner.submittedFrames) && nextOwner.submittedFrames>=1;
  // Both genuine owners may no longer exist by the last return; never log
  // arbitrary Floor9 gameplay, a wrong run or fabricated original hardware.
  if(!old && !next)return null;
  return {
    sourceBound:true, runToken:source.runToken, sourceTick:source.tick,
    originalOwnerPresent:!!old,
    originalGatewayOpacity:old?round(oldOwner.originalGatewayOpacity):null,
    originalDeckOpacity:old?round(oldOwner.originalDeckSurface?.opacity):null,
    originalGalleryOpacity:old?round(oldOwner.originalGallerySourceOpacity):null,
    originalCoreOpacity:old?round(oldOwner.originalCoreOpacity):null,
    originalOwnerReturns:old?oldOwner.submittedFrames:null,
    originalOwnerSeconds:old?round(oldOwner.visibleSeconds):null,
    successorOwnerPresent:!!next,
    successorStage:next?nextOwner.state:null,
    successorTotalReturns:next?nextOwner.submittedFrames:null,
    successorStructuralRootVisible:next?
      nextOwner.structuralRoot?.visible===true:null,
    successorStructuralOpacity:next?round(nextOwner.structuralFade):null,
    successorStructuralVisibleReturns:next?
      nextOwner.structuralVisibleReturns:null,
    successorStructuralVisibleSeconds:next?
      round(nextOwner.structuralVisibleSeconds):null,
    successorDetailOpacity:next?round(nextOwner.detailFade):null,
    successorBiomeOpacity:next?round(nextOwner.biomeFade):null,
    successorVistaOpacity:next?round(nextOwner.vistaFade):null,
    actualReceivingRoofColor:typeof roofColor==='string'?roofColor:null,
    sourceCertifiedOldSky:oldSky?.sourceBound===true &&
      oldSky.sourceTick===source.tick?round(oldSky.oldWeight):null,
    limitation:'Measured only AFTER a genuine renderer.render return: Three object/material state, NOT composited native WebM pixels, a capture PTS, hardware FPS or acceptance'
  };
}
