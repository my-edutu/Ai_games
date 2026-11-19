// Source-grounded, presentation-only Clockwork → Astral Vault horizon.
// The real Floor8 guardian, cap, threshold and Floor9 platform are proved by
// guardian-passage.mjs BEFORE it exposes continuousGroundedHandoff. This
// helper cannot create a win, a floor, a platform or a rendered video frame.
//
// The previous implementation switched sky/fog/sun/ambient to violet inside
// accept(), even before Three returned its first post-floor render. Under
// software WebGL that erased the old warm gateway context during a >1s stall.
// Sample the *existing* authentic opened arch's submitted-frame lifetime;
// never start a second timer, duplicate a gate, or claim native-video proof.
import { observedSourceEarnedColdFrameContinuation,
  observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
import { observedSourcePhysicalArrivalPalette,
  observedSourceGatewayDeparturePresence, sourceOwnedOriginalArchitectureCoverage } from './source-physical-arrival-palette.mjs';


// Actual 3D World owns the original retained guardian gateway, physical cap,
// gallery meshes and their source/renderer-return material state. The small
// public witness used by the sky/fog director is intentionally NOT the full
// writable World owner. Recomputing its old-room coverage from this reduced
// copy loses original raised-support and historical optical fields, so the
// atmospheric horizon can disagree with the real rendered bronze room.
// Consume only a finite, exact-source scalar exported after World.update;
// no gameplay time, future frame, mock portal or synthetic visual is granted.
export function observedSourceOwnedOriginalWorldLightReceipt(frame,retainedCap) {
  const w=frame?.lastGuardianCrossing,c=w?.cap,g=w?.guardian;
  if(frame?.floor!==9 || frame.theme!=='void' ||
    frame.lifecycle!=='running' || !(frame.player?.health>0) ||
    typeof frame.runToken!=='string' || !frame.runToken ||
    !Number.isSafeInteger(frame.tick) ||
    !retainedCap || retainedCap.originalArchitectureWorldCertified!==true ||
    retainedCap.guardianGateRetained!==true || retainedCap.floor!==9 ||
    retainedCap.runToken!==frame.runToken ||
    retainedCap.oldCapId!=='f8:cap' ||
    retainedCap.originalArchitectureCoverageSourceTick!==frame.tick ||
    w?.runToken!==frame.runToken || w.fromFloor!==8 || w.toFloor!==9 ||
    c?.id!=='f8:cap' || g?.kind!=='guardian' ||
    g.active!==false || !Number.isFinite(g.health) || g.health>0 ||
    ![w.sourceTick,w.exitX,c.x,c.y,c.width,c.height,
      retainedCap.crossingTick,retainedCap.sourceTick,
      retainedCap.firstWorldRenderTick,retainedCap.oldCapX,
      retainedCap.oldCapWidth,retainedCap.oldRoofY,retainedCap.thresholdX,
      retainedCap.submittedFrames].every(Number.isSafeInteger) ||
    c.width<=0 || c.height<=0 ||
    c.x!==retainedCap.oldCapX || c.width!==retainedCap.oldCapWidth ||
    c.y+c.height!==retainedCap.oldRoofY ||
    w.exitX!==retainedCap.thresholdX ||
    w.exitX!==c.x+Math.floor(c.width*.76) ||
    w.sourceTick!==retainedCap.crossingTick ||
    retainedCap.sourceTick<w.sourceTick ||
    retainedCap.sourceTick-w.sourceTick>12 ||
    frame.tick<retainedCap.firstWorldRenderTick ||
    frame.tick<retainedCap.sourceTick ||
    frame.tick-w.sourceTick>110 ||
    retainedCap.submittedFrames<1 || retainedCap.submittedFrames>=30 ||
    !Number.isFinite(retainedCap.visibleSeconds) ||
    retainedCap.visibleSeconds<0 || retainedCap.visibleSeconds>=2.8 ||
    retainedCap.visibleSeconds>retainedCap.submittedFrames*.1+1e-8 ||
    !Number.isFinite(retainedCap.originalGatewayOpacity) ||
    retainedCap.originalGatewayOpacity<0 ||
    retainedCap.originalGatewayOpacity>1 ||
    !Number.isFinite(retainedCap.originalArchitectureCoverage) ||
    retainedCap.originalArchitectureCoverage<0 ||
    retainedCap.originalArchitectureCoverage>1)
    return null;
  return {originalGatewayOldWeight:retainedCap.originalGatewayOpacity,
    originalArchitectureOldWeight:retainedCap.originalArchitectureCoverage,
    sourceBound:true,sourceTick:frame.tick};
}

export function observedGroundedBiomeThreshold(frame, passage, options = {}, retainedCap = null) {
  // Anchor the horizon to the SAME real distance-from-bronze-sill as the
  // actual F9 platform top, beams and edge. Slow WebGL may have retired its
  // original gateway presentation before pixels reached the viewer; this
  // source-backed corridor still keeps both environmental palettes coherent.
  const spatial=(!options?.stale && !options?.reducedMotion)
    ?observedSourcePhysicalArrivalPalette(frame,retainedCap):null;
  // The first native Floor9 frames showed violet sky while the ORIGINAL
  // bronze arch was still materially visible. Coordinate three layers:
  // old gateway material, noninteractive new structural shell, and horizon.
  // This is an existing same-run source + actual GPU witness, not a timer.
  const worldMaterialReceipt=!options?.stale && !options?.reducedMotion
    ?observedSourceOwnedOriginalWorldLightReceipt(frame,retainedCap):null;
  const oldGate=!options?.stale && !options?.reducedMotion &&
    retainedCap?.guardianGateRetained===true
    ?observedSourceGatewayDeparturePresence(frame,retainedCap):null;
  const originalArchOldWeight=worldMaterialReceipt?.originalGatewayOldWeight ??
    (oldGate?.sourceBound===true &&
    retainedCap?.opticalExitSubmitted!==true &&
    Number.isSafeInteger(retainedCap?.submittedFrames) &&
    retainedCap.submittedFrames<30 &&
    Number.isFinite(retainedCap?.visibleSeconds) &&
    retainedCap.visibleSeconds<2.8
    ?Math.min(1,Math.max(0,oldGate.opacity)):0);
  // The actual retained original gallery and shared bronze roof sometimes
  // outlive the opened gate leaf. The horizon must not jump to fully violet
  // while those ORIGINAL meshes still have materially visible coverage.
  // Read exactly the same bounded, source-owned optical envelope that caps
  // the real incoming structural shaft; no independent fade clock.
  const originalArchitectureOldWeight=
    worldMaterialReceipt?.originalArchitectureOldWeight ??
    sourceOwnedOriginalArchitectureCoverage(frame,retainedCap);
  const coherentOriginalOldWeight=Math.max(
    originalArchOldWeight,originalArchitectureOldWeight);
  // The visually first F9 frame may arrive after the nonauthoritative passage
  // animation cue expired. The ACTUAL old cap still has source-and-GPU proof:
  // ease sky/fog/lights from warm bronze instead of instant full-void purple.
  // The old doorway remains spatially anchored; only environment colors move.
  if (!options?.stale && !options?.reducedMotion &&
      (observedSourceEarnedColdFrameContinuation(frame,retainedCap) ||
        observedStagedOriginalCapBeforeRecordedCrossing(frame,retainedCap))) {
    const progress=Math.min(1,Math.max(0,
      retainedCap.visibleSeconds/1.25));
    const smooth=progress*progress*(3-2*progress);
    return {from:'clockwork',to:'void',sourceTick:frame.tick,
      oldWeight:Math.max(1-smooth,spatial?.oldWeight??0,
        coherentOriginalOldWeight),progress,sourceBound:true,
      limitation:'Actual same-run old-cap geometry and submitted frame clock; native pixels NOT EVALUATED'};
  }
  if(spatial && (!passage || passage.stage!=='handoff')){
    return {from:'clockwork',to:'void',sourceTick:frame.tick,
      oldWeight:Math.max(spatial.oldWeight,coherentOriginalOldWeight),progress:spatial.progress,
      sourceBound:true,
      limitation:'The real crossed sill and source distance color the drawn horizon, not native-film acceptance'};
  }
  // A named handoff state can outlive its two GPU-submission source-proof
  // window. The physical sill's independent immutable HP-zero record still
  // owns the living body's material/lighting environment in that case.
  const spatialFallback=()=>spatial?{
    from:'clockwork',to:'void',sourceTick:frame.tick,
    oldWeight:Math.max(spatial.oldWeight,coherentOriginalOldWeight),progress:spatial.progress,sourceBound:true,
    limitation:'Actual source body distance to original earned doorway, NOT native film acceptance'
  }:null;
  const p=frame?.player;
  if (options?.stale || options?.reducedMotion ||
      frame?.lifecycle !== 'running' || frame.floor !== 9 ||
      frame.theme !== 'void' || !(p?.health>0) ||
      typeof frame.runToken !== 'string' || !frame.runToken ||
      !Number.isSafeInteger(frame.tick) ||
      passage?.sourceBound !== true || passage.active !== true ||
      passage.stage !== 'handoff' ||
      passage.continuousGroundedHandoff !== true ||
      passage.innerDoorAssemblyVisible !== true ||
      passage.exteriorMemoryFrameVisible !== false ||
      passage.runToken !== frame.runToken || passage.floor !== frame.floor ||
      !Number.isSafeInteger(passage.sourceTick) ||
      passage.sourceTick > frame.tick || frame.tick-passage.sourceTick > 60 ||
      !Number.isSafeInteger(passage.handoffSubmittedFrames) ||
      passage.handoffSubmittedFrames < 0 || passage.handoffSubmittedFrames > 2 ||
      !Number.isFinite(passage.handoffDisplaySeconds) ||
      !Number.isFinite(passage.handoffVisibleWindowSeconds) ||
      passage.handoffVisibleWindowSeconds <= 0 ||
      passage.handoffVisibleWindowSeconds > 3 ||
      passage.handoffDisplaySeconds < 0 ||
      passage.handoffDisplaySeconds >= passage.handoffVisibleWindowSeconds ||
      (passage.handoffSubmittedFrames===0 &&
        passage.handoffDisplaySeconds!==0)) return spatialFallback();
  const progress=Math.min(1,Math.max(0,
    passage.handoffDisplaySeconds/passage.handoffVisibleWindowSeconds));
  const smooth=progress*progress*(3-2*progress);
  return {
    from:'clockwork',to:'void',sourceTick:frame.tick,
    oldWeight:Math.max(1-smooth,spatial?.oldWeight??0,
      coherentOriginalOldWeight),progress,
    sourceBound:true,
    limitation:'Submitted-frame clock and source-backed arch only; NOT proof of native pixels, physical passage or preference',
  };
}
