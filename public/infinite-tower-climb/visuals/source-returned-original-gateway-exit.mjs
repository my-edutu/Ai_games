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
  const base=Math.min(previous,proposed);
  if(!verified(source,held,job,supported) ||
     job.structuralVisibleReturns<2 || job.structuralVisibleSeconds<=0 ||
     held.submittedFrames<2 || held.visibleSeconds<=.15) return base;
  // The *same* genuine shaft and original doorway must both have returned
  // enough frames AND actual display time. A 400ms first WebGL return or many
  // old-only submissions alone cannot erase the gateway.
  const earned=smooth(Math.min(
    (held.submittedFrames-2)/15,
    (held.visibleSeconds-.15)/1.1,
    (job.structuralVisibleReturns-1)/9,
    job.structuralVisibleSeconds/.85
  ));
  return Math.min(base,1-earned);
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
