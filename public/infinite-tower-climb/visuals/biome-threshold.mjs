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
  observedSourceGatewayDeparturePresence } from './source-physical-arrival-palette.mjs';

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
  const oldGate=!options?.stale && !options?.reducedMotion &&
    retainedCap?.guardianGateRetained===true
    ?observedSourceGatewayDeparturePresence(frame,retainedCap):null;
  const originalArchOldWeight=oldGate?.sourceBound===true &&
    retainedCap?.opticalExitSubmitted!==true &&
    Number.isSafeInteger(retainedCap?.submittedFrames) &&
    retainedCap.submittedFrames<30 &&
    Number.isFinite(retainedCap?.visibleSeconds) &&
    retainedCap.visibleSeconds<2.8
    ?Math.min(1,Math.max(0,oldGate.opacity)):0;
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
        originalArchOldWeight),progress,sourceBound:true,
      limitation:'Actual same-run old-cap geometry and submitted frame clock; native pixels NOT EVALUATED'};
  }
  if(spatial && (!passage || passage.stage!=='handoff')){
    return {from:'clockwork',to:'void',sourceTick:frame.tick,
      oldWeight:Math.max(spatial.oldWeight,originalArchOldWeight),progress:spatial.progress,
      sourceBound:true,
      limitation:'The real crossed sill and source distance color the drawn horizon, not native-film acceptance'};
  }
  // A named handoff state can outlive its two GPU-submission source-proof
  // window. The physical sill's independent immutable HP-zero record still
  // owns the living body's material/lighting environment in that case.
  const spatialFallback=()=>spatial?{
    from:'clockwork',to:'void',sourceTick:frame.tick,
    oldWeight:Math.max(spatial.oldWeight,originalArchOldWeight),progress:spatial.progress,sourceBound:true,
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
      originalArchOldWeight),progress,
    sourceBound:true,
    limitation:'Submitted-frame clock and source-backed arch only; NOT proof of native pixels, physical passage or preference',
  };
}
