// Floor 8 HP-defeated ORIGINAL GPU doorway -> authentic, returned Floor 9 shaft.
// Rendering evidence can only consume a one-way old-room exit. Neither source
// polls nor a reconstructed future room may age the gateway or issue game events.
const safe=Number.isSafeInteger, finite=Number.isFinite;
const unit=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=unit(x);return t*t*(3-2*t)};
function verified(source,held,job,supported){
  return supported===true && source?.floor===9 && source.theme==='void' &&
    source.lifecycle==='running' && source.player?.health>0 &&
    typeof source.runToken==='string' && source.runToken.length>0 &&
    held?.guardianGateRetained===true &&
    held.verifiedObservedFloorAdvance===true &&
    held.floor===9 && held.oldCapId==='f8:cap' &&
    held.runToken===source.runToken &&
    job?.floor===9 && job.runToken===source.runToken &&
    job.proof==='recorded-source-gateway' &&
    job.structureDeferred===true &&
    safe(source.tick) && safe(held.crossingTick) &&
    source.tick>=held.crossingTick &&
    source.tick-held.crossingTick<=150 &&
    safe(held.firstWorldRenderTick) &&
    safe(job.sourceTick) && job.sourceTick===held.firstWorldRenderTick &&
    safe(held.submittedFrames) && held.submittedFrames>=0 &&
    finite(held.visibleSeconds) && held.visibleSeconds>=0 &&
    safe(job.structuralVisibleReturns) && job.structuralVisibleReturns>=0 &&
    finite(job.structuralVisibleSeconds) && job.structuralVisibleSeconds>=0;
}
// On a genuine still-playing route, a new source stance must never RESURRECT
// bronze steel that has already been transparently rendered. True owner
// retirement still waits for the incoming shaft to return, rather than
// deleting a ~80%-opaque doorway on a source-poll boundary.
export function sourceReturnedOriginalGatewayOpacity(source,held,job,proposed,supported){
  if(!finite(proposed) || proposed<0 || proposed>1 ||
     !finite(held?.originalGatewayOpacity) ||
     held.originalGatewayOpacity<0 || held.originalGatewayOpacity>1)return null;
  const previous=unit(held.originalGatewayOpacity);
  // An unsupported source can only shorten the lifetime, never resurrect it.
  if(!verified(source,held,job,supported)) return Math.min(previous,proposed);
  // A newer autonomous source stance may request a sudden zero-alpha old
  // portal while the TRUE successor shaft still has not PAINTED. On a real
  // authenticated Floor9 roof/raised route, preserve ONLY the already
  // returned original material until both sides earn optical overlap.
  // The separate finite owner lease remains a hard upper bound.
  if(job.structuralVisibleReturns<2 || job.structuralVisibleSeconds<=0 ||
     held.submittedFrames<2 || held.visibleSeconds<=.15) return previous;
  // The *same* genuine shaft and original doorway must both have returned
  // enough frames AND actual display time. A 400ms first WebGL return or many
  // old-only submissions alone cannot erase the gateway.
  const earned=smooth(Math.min(
    (held.submittedFrames-2)/15,
    (held.visibleSeconds-.15)/1.1,
    (job.structuralVisibleReturns-1)/9,
    job.structuralVisibleSeconds/.85
  ));
  // A proposed zero may come from a NEW source stance before the old and
  // new GPU owners have jointly painted enough returned frames. Do not let
  // that proposal bypass the genuine two-sided optical budget. The only
  // permitted decrease here is the previously returned opacity or the
  // jointly earned, monotonically increasing fade. Source polls alone cannot
  // spend it; a changed pose cannot erase the original metal in one frame.
  return Math.min(previous,1-earned);
}
// A truly source-grounded, same-run doorway cannot be disposed while its
// original steel is still opaque solely because the autonomous climber
// climbed above the old 55m roof band. This is a short bounded render-only
// lease, NOT restoration of the old collider or source gameplay.
export function sourceReturnedOriginalGatewayRetention(source,held,job,supported){
  return verified(source,held,job,supported) &&
    held.submittedFrames>0 && held.submittedFrames<30 &&
    held.visibleSeconds<2.8 &&
    finite(held.originalGatewayOpacity) &&
    held.originalGatewayOpacity>.01 && held.originalGatewayOpacity<=1 &&
    held.opticalExitSubmitted!==true &&
    safe(held.lastReturnedOldGatewayTick) &&
    held.lastReturnedOldGatewayTick<=source.tick &&
    source.tick-held.lastReturnedOldGatewayTick<=150;
}


// The real first F9 renderer-return episode at d11f47ba showed the original
// gallery fall from opacity 1 to .059 by frame 5 while the *same source*
// defeated-guardian bronze gate remained .969 opaque. This detached the door
// visually from its original load-bearing room. Keep a bounded, progressively
// receding portion of the ALREADY BUILT original non-colliding steel visible
// with that doorway, until genuine incoming shaft returns and the gate itself
// recedes. World applies this as a conservative floor BEFORE its monotonic
// historic-material record; this function never creates or resurrects mesh,
// contact, player movement, victory or any GPU-return evidence.
export function sourceReturnedOriginalThresholdBearing(source,held,job,
  gatewayOpacity,supported) {
  if(!verified(source,held,job,supported) ||
     held.opticalExitSubmitted===true ||
     !finite(gatewayOpacity) || gatewayOpacity<=.01 ||
     gatewayOpacity>1 ||
     !finite(held.originalGallerySourceOpacity) ||
     held.originalGallerySourceOpacity<0 || held.originalGallerySourceOpacity>1 ||
     held.submittedFrames>=30 || held.visibleSeconds>=2.8)return null;
  // Fewer old steel silhouettes during high-detail successor release:
  // never hold opaque old bars over the moving F9 climber and new hazards.
  const gateShare=unit((gatewayOpacity-.03)/.9);
  const successorProgress=unit((job.structuralVisibleReturns-9)/9);
  const minExistingSteel=.33*gateShare*(1-.7*smooth(successorProgress));
  return +minExistingSteel.toFixed(6);
}
