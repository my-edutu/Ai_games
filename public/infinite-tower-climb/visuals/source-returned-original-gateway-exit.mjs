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
// Source-earned departure, not compositor time, determines when the old
// gateway stops being a readable part of the live route. Original 1x SHA
// 1fca189 portrait/desktop first-F9 returns consumed almost all the bronze
// gateway while the authentic climber was still stationary on f9:ground
// (ticks 489-506, x333296, sole at oldRoofY). Two GPU owners returning does
// not mean the PERSON has departed the original passage. This certificate
// can only reduce optical extinction; it never grants a win, roof or tick.
export function sourceReturnedOriginalDepartureProgress(source,held) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const ground=source?.platforms?.find?.(deck=>deck?.id==='f9:ground');
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     held?.runToken!==source.runToken || held.floor!==9 ||
     held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' ||
     ![source.tick,p.x,p.y,p.halfWidth,p.halfHeight,
       held.crossingTick,held.sourceTick,held.thresholdX,held.oldRoofY,
       held.oldCapX,held.oldCapWidth,
       ground?.x,ground?.y,ground?.width,ground?.height].every(safe) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     held.oldCapWidth<=0 || ground.width<=0 || ground.height<=0 ||
     source.tick<held.crossingTick ||
     source.tick-held.crossingTick>150 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground.y+ground.height!==held.oldRoofY) return null;
  let crossingX;
  if(w!=null){
    if(w.runToken!==source.runToken || w.fromFloor!==8 ||
       w.toFloor!==9 || w.cap?.id!=='f8:cap' ||
       w.guardian?.kind!=='guardian' ||
       w.guardian.active!==false ||
       !finite(w.guardian.health) || w.guardian.health>0 ||
       ![w.sourceTick,w.crossingX,w.exitX,
         w.cap.x,w.cap.y,w.cap.width,w.cap.height].every(safe) ||
       w.sourceTick!==held.crossingTick ||
       w.cap.x!==held.oldCapX ||
       w.cap.width!==held.oldCapWidth ||
       w.cap.y+w.cap.height!==held.oldRoofY ||
       w.exitX!==held.thresholdX ||
       w.crossingX<w.exitX || w.crossingX>w.exitX+60000)
      return null;
    // The already returned first Floor 9 body can be farther along the
    // real roof than the earlier HP-zero crossing receipt. Publication of
    // that receipt must not move the optical origin BACKWARDS, causing a
    // near-instant disappearance on the first real raised-deck flight.
    // Prefer only the conservative same-run, physically grounded first
    // visible source stance, if its old roof and body dimensions agree.
    crossingX=w.crossingX;
    const observed=held.observedCrossingX;
    if(safe(observed) && safe(held.observedCrossingY) &&
       safe(held.observedHalfWidth) && safe(held.observedHalfHeight) &&
       observed>=w.crossingX && observed<=w.crossingX+60000 &&
       held.observedCrossingY===held.oldRoofY+held.observedHalfHeight &&
       held.observedHalfWidth===p.halfWidth &&
       held.observedHalfHeight===p.halfHeight)
      crossingX=observed;
  } else {
    // Original early Floor9 renderer returns can predate publication of
    // lastGuardianCrossing. Use only the already verified same-run former
    // cap receipt and actual recorded body envelope, never a guessed door.
    if(![held.observedCrossingX,held.observedCrossingY,
      held.observedHalfWidth,held.observedHalfHeight].every(safe) ||
       held.observedCrossingX<held.thresholdX ||
       held.observedCrossingX>held.thresholdX+60000 ||
       held.observedCrossingY!==held.oldRoofY+held.observedHalfHeight ||
       held.observedHalfWidth!==p.halfWidth ||
       held.observedHalfHeight!==p.halfHeight ||
       source.tick<held.sourceTick ||
       source.tick-held.sourceTick>70) return null;
    crossingX=held.observedCrossingX;
  }
  // Only the FIRST actually submitted WebGL Floor9 frame can establish
  // what the viewer first SAW of the grounded hero on the original roof.
  // The immutable HP-zero crossing is a physics location, not the point
  // from which the first *visible* camera/door departure starts. In the
  // captured authentic run the former was x321096 while the first painted
  // F9 body already stood at x333296. Without this receipt, ~12m of
  // unshown source travel drains the bronze doorway on its first jump.
  // Do not credit an unsubmitted, ungrounded or foreign-run pose.
  if(held.firstSubmittedBodyGroundedRoof===true &&
     safe(held.firstSubmittedBodyTick) &&
     safe(held.firstSubmittedBodyX) &&
     safe(held.firstSubmittedBodyY) &&
     safe(held.firstSubmittedBodyHalfWidth) &&
     safe(held.firstSubmittedBodyHalfHeight) &&
     held.submittedFrames>=1 &&
     held.firstSubmittedBodyTick>=held.firstWorldRenderTick &&
     held.firstSubmittedBodyTick<=source.tick &&
     source.tick-held.firstSubmittedBodyTick<=150 &&
     held.firstSubmittedBodyHalfWidth===p.halfWidth &&
     held.firstSubmittedBodyHalfHeight===p.halfHeight &&
     held.firstSubmittedBodyY===held.oldRoofY+p.halfHeight &&
     held.firstSubmittedBodyX>=crossingX &&
     held.firstSubmittedBodyX<=crossingX+60000)
    crossingX=held.firstSubmittedBodyX;
  const sole=p.y-p.halfHeight;
  if(!safe(sole) || p.x<crossingX-12000 ||
     p.x>crossingX+110000 ||
     sole<held.oldRoofY-2500 ||
     sole>held.oldRoofY+230000) return null;
  // The original roof runway is short. A climber can reach its raised
  // route mostly by VERTICAL movement; x-only fades waited too long and
  // then visually snapped. Current physical travel and sole height jointly
  // earn a smooth one-way old-gateway departure, not a future landing.
  return unit(Math.max(0,p.x-crossingX)/60000 +
    Math.max(0,sole-held.oldRoofY)/100000);
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
  // On this authenticated real F9 route, returned frames may spend only
  // the portion of the fade actually earned by the present climber leaving
  // the original physical gate. An idle hero cannot lose the doorway simply
  // because the browser returned many frames at the same source tick.
  // The previous submitted alpha remains a strict one-way ceiling: a fall,
  // reversal, restart or new source stance cannot re-create old metal.
  const departure=sourceReturnedOriginalDepartureProgress(source,held);
  // An unproven current-body departure is not a maximum-departure
  // certificate. Retain only previously returned same-run original steel
  // during the finite World lease. Do not let missing/inconsistent crossing
  // fields erase the old 3D doorway or invent a player relocation.
  if(departure===null)return previous;
  return Math.min(previous,1-earned*departure);
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
