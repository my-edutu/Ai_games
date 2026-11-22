// Physically owned Clockwork -> Void entrance palette. This is not a floor
// transition or a new route: every shade follows an already-observed genuine
// zero-HP guardian, the original cap/roof and the living player on F9.
// Source distance, not the browser clock or slow WebGL submissions, controls
// how the original bronze engineering becomes the next biome's violet metal.
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
import { observedEarnedSillDepthExposure } from './far-side-shaft-transition.mjs';
const valid=Number.isSafeInteger;
// The recorded fixed-step Floor 9 route doubles back roughly 0.63m to
// line up with its first raised deck. A previous forward-only predicate
// destroyed the REAL retained bronze gateway and final camera while the
// defeated guardian, same run, original roof and successor route were valid.
// This is a bound on a source-observed return, NOT permission to re-cross or
// manufacture a floor change. Both palette and camera use the same bound.
export const SOURCE_GATEWAY_RETURN_TOLERANCE = 18000;
// A genuine Floor9 raised-platform sole contact can outlive the original
// 70 source-tick cap lease while a slow WebGL browser has submitted only one
// old/new doorway frame. Both world and camera use this SAME source proof.
export const SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS = 110;
export const SOURCE_GATEWAY_RAISED_FLIGHT_TAIL_TICKS = 32;
const clamp01=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};
// The original bronze gateway, F9 walkable roof, distant shaft and camera
// must not use competing wall-clock / return-count optical deadlines.
// Both source-owned materials share this bounded acknowledgement budget.
// A successful *first* GPU return earns only a 1.2% material hint even when
// the host supplied no presentation delta (as on the first cold WebGL frame).
// Zero returned frames always yield zero progress. The remaining transition
// takes real returned frames AND displayed duration; failed draws/RAF ticks
// cannot spend either. The eased opening holds the physical bronze grille
// through the climber's first strides instead of showing a hard-swap at F9.
function observedOriginalGatewayOpticalBudget(held) {
  const frames=held?.submittedFrames, seconds=held?.visibleSeconds;
  if(!valid(frames) || frames<=0 || frames>60 ||
     !Number.isFinite(seconds) || seconds<0 || seconds>=3)return 0;
  const frameProgress=frames===1?smooth(.5/7):
    smooth((frames-1)/7);
  const elapsedProgress=Math.pow(smooth(seconds/1.22),1.08);
  const firstReturnEvidence=Math.min(frameProgress,.012);
  return Math.min(frameProgress,Math.max(elapsedProgress,firstReturnEvidence));
}

// Source-authenticated successor-platform contact after the first F9 jump.
// The earlier 16m-old-roof ceiling cut off the original GPU doorway as soon
// as the REAL climber mounted f9:p2 in the 1x source trace (ticks ~525-535).
// Only an existing F9 platform's exact authoritative sole+horizontal support
// permits the short additional raised-deck range. Never fabricate support.
export function observedSourceSuccessorRaisedDeck(source, roofY) {
  const p=source?.player;
  if(source?.floor!==9 || !p || !Number.isSafeInteger(roofY) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     p.grounded!==true || p.vy!==0 ||
     !(p.state==='standing' || p.state==='hurt') ||
     typeof p.groundedPlatformId!=='string' ||
     !/^f9:[a-z0-9-]+$/.test(p.groundedPlatformId) ||
     p.groundedPlatformId==='f9:ground' ||
     !Array.isArray(source.platforms))return false;
  const sole=p.y-p.halfHeight;
  // The real first F9 raised deck is often BELOW the old 16m airborne ceiling.
  // A grounded raised support must be accepted from the first positive step,
  // while the same immutable 23m maximum and strict current-platform contact
  // still veto distant or fabricated geometry.
  if(sole<=roofY || sole>roofY+230000)return false;
  return source.platforms.some(platform =>
    platform?.id===p.groundedPlatformId &&
    [platform.x,platform.y,platform.width,platform.height].every(valid) &&
    platform.width>0 && platform.height>0 &&
    platform.y+platform.height===sole &&
    p.x-p.halfWidth>=platform.x &&
    p.x+p.halfWidth<=platform.x+platform.width);
}


/**
 * The real F9 route may ascend onto a source-supported moving/raised deck
 * beyond the width of its previous ground. That deck's exact contact, not
 * an obsolete floor-ground footprint, keeps the earned doorway, inherited
 * bronze material and camera together. Grounded F9 ground/f8 cap, airborne
 * over the actual ground and raised support are mutually exclusive checks.
 * Never infer a landing, platform, HP-zero win or new floor.
 */
export function observedSourceFloorNineRouteSupport(source,ground,roofY) {
  const p=source?.player;
  if(source?.floor!==9 || !p || !Array.isArray(source.platforms) ||
     !source.platforms.includes(ground) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight,
       ground?.x,ground?.y,ground?.width,ground?.height,roofY]
       .every(Number.isSafeInteger) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     ground.width<=0 || ground.height<=0 ||
     ground.y+ground.height!==roofY)return false;
  const insideGround=p.x-p.halfWidth>=ground.x &&
    p.x+p.halfWidth<=ground.x+ground.width;
  const sole=p.y-p.halfHeight;
  if(p.grounded===true) {
    if(!(p.state==='standing'||p.state==='hurt')||p.vy!==0)
      return false;
    if(insideGround && sole===roofY &&
       (p.groundedPlatformId==='f9:ground' ||
        p.groundedPlatformId==='f8:cap'))return true;
    // A real F9:p2 (including a moving platform) may extend beyond the
    // ground. Reuse the authoritative exact-sole and full-width support
    // validator; the ground alone cannot claim this contact.
    return observedSourceSuccessorRaisedDeck(source,roofY);
  }
  // The fixed-step source can remain 'dashing' for three ticks after the
  // true takeoff; dropping its already painted gateway during that interval
  // is a physical scene discontinuity. Require real unsupported velocity.
  // A body still in flight retains an original-ground corridor only.
  // Do not manufacture a future raised-platform landing from AI intention.
  return insideGround && p.grounded===false &&
    (p.state==='airborne'||p.state==='dashing') &&
    p.groundedPlatformId==null && Number.isFinite(p.vy);
}

/**
 * An authentic raised Floor9 route is eligible for the old/new *optical*
 * bridge only after the real world saw its exact grounded source support.
 * The world records raisedDeckSourceTick on actual contact; this merely
 * verifies its same-run age and a bounded legitimate flight thereafter.
 * No synthetic support, floor, combat event or gameplay state is created.
 */
// When the short-lived crossing event disappears before an actual raised
// contact is submitted, the ORIGINAL already-verified GPU cap still carries
// the source-approved crossing identity. This is historical evidence only:
// the current route needs its own exact platform/sole or valid flight tail.
// Conflicting live crossing records always veto the historical fallback.
function previouslyVerifiedOriginalRaisedReceipt(source,held,roofY) {
  const p=source?.player;
  return source?.lastGuardianCrossing==null &&
    held?.verifiedObservedFloorAdvance===true &&
    held.guardianGateRetained===true &&
    held.oldCapId==='f8:cap' &&
    [held.oldCapX,held.oldCapWidth,held.oldRoofY,held.thresholdX,
      held.observedCrossingX,held.observedCrossingY,
      held.observedHalfWidth,held.observedHalfHeight,
      held.crossingTick,held.sourceTick,source?.tick,
      p?.halfWidth,p?.halfHeight].every(valid) &&
    held.oldCapWidth>0 && held.observedHalfWidth>0 &&
    held.observedHalfHeight>0 &&
    held.thresholdX===held.oldCapX+Math.floor(held.oldCapWidth*.76) &&
    held.observedCrossingX>=held.thresholdX &&
    held.observedCrossingX<=held.thresholdX+60000 &&
    held.observedCrossingY===roofY+held.observedHalfHeight &&
    held.observedHalfWidth===p.halfWidth &&
    held.observedHalfHeight===p.halfHeight &&
    held.oldRoofY===roofY &&
    held.crossingTick<=held.sourceTick &&
    held.sourceTick-held.crossingTick<=20 &&
    source.tick>=held.sourceTick &&
    source.tick-held.crossingTick<=SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS;
}

/**
 * The true fixed-step Floor9 trace (ticks 495-530) jumps from the old roof
 * toward the source-authored gateway-step / f9:p2 BEFORE the first raised
 * sole contact at tick535. A floor-ground footprint-only visual lease ended
 * during that flight, deleting the original bronze arch at nonzero opacity.
 *
 * This is a conservative PRESENTATION bridge, not platform support: it
 * requires already-defeated original guardian provenance, a real currently
 * airborne body and an existing next-floor elevated platform physically
 * near that body. It cannot grant a landing, collision, floor or victory.
 */
export function observedSourceAirborneSuccessorApproach(source,held,roofY) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  if(!source || !held || source.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     !source.runToken || source.runToken!==held.runToken ||
     held.floor!==9 || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' || held.oldRoofY!==roofY ||
     ![source.tick,roofY,held.crossingTick,held.sourceTick,
       held.thresholdX,held.oldCapX,held.oldCapWidth,
       p.x,p.y,p.halfWidth,p.halfHeight,p.vy].every(valid) ||
     held.oldCapWidth<=0 || p.halfWidth<=0 || p.halfHeight<=0 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     source.tick<held.sourceTick ||
     source.tick-held.crossingTick>SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS ||
     source.tick<held.crossingTick ||
     p.grounded!==false ||
      (p.state!=='airborne'&&p.state!=='dashing') ||
     p.groundedPlatformId!=null || !Array.isArray(source.platforms))
    return false;
  // A live F9 in-air dash belongs to the SAME source-certified flight, but
  // only when the present 3D body can reach an actual F9 raised deck and
  // prior original guardian defeat has been independently verified.
  const recorded=w!=null &&
    w.runToken===source.runToken && w.fromFloor===8 &&
    w.toFloor===9 && w.cap?.id==='f8:cap' &&
    w.guardian?.kind==='guardian' && w.guardian.active===false &&
    Number.isFinite(w.guardian.health) && w.guardian.health<=0 &&
    [w.sourceTick,w.exitX,w.crossingX,w.halfWidth,w.halfHeight,
      w.cap.x,w.cap.width,w.cap.y,w.cap.height].every(valid) &&
    w.cap.width>0 && w.cap.height>0 &&
    w.cap.x===held.oldCapX && w.cap.width===held.oldCapWidth &&
    w.cap.y+w.cap.height===roofY &&
    w.exitX===held.thresholdX &&
    w.crossingX>=w.exitX && w.crossingX<=w.exitX+60000 &&
    w.halfWidth===p.halfWidth && w.halfHeight===p.halfHeight &&
    w.sourceTick===held.crossingTick;
  const historic=w==null &&
    previouslyVerifiedOriginalRaisedReceipt(source,held,roofY);
  if(!(recorded||historic))return false;
  const sole=p.y-p.halfHeight;
  if(sole<roofY-2500 || sole>roofY+230000 ||
     Math.abs(p.x-held.thresholdX)>100000)return false;
  const ground=source.platforms.find(platform=>
    platform?.id==='f9:ground' &&
    [platform.x,platform.y,platform.width,platform.height].every(valid) &&
    platform.width>0 && platform.height>0 &&
    platform.y+platform.height===roofY);
  if(!ground)return false;
  // Accept the current physically reachable segment, NOT a routeTarget or
  // supposed future footfall. Never invent f9:p2 or accept a distant ledge.
  return source.platforms.some(platform=>{
    if(!platform || typeof platform.id!=='string' ||
       !/^f9:[a-z0-9-]+$/.test(platform.id) ||
       platform.id==='f9:ground' || platform.id==='f9:cap' ||
       ![platform.x,platform.y,platform.width,platform.height].every(valid) ||
       platform.width<=0 || platform.height<=0)return false;
    const top=platform.y+platform.height;
    return top>roofY && top<=roofY+230000 &&
      p.x+p.halfWidth>=platform.x-30000 &&
      p.x-p.halfWidth<=platform.x+platform.width+30000 &&
      top-sole>=-90000 && top-sole<=120000;
  });
}

export function observedSourceRetainedRaisedExit(source,held,roofY) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const historic=previouslyVerifiedOriginalRaisedReceipt(source,held,roofY);
  const recorded=w?.runToken===source?.runToken && w.fromFloor===8 &&
    w.toFloor===9 && w.guardian?.kind==='guardian' &&
    w.guardian.active===false && Number.isFinite(w.guardian.health) &&
    w.guardian.health<=0 && w.cap?.id==='f8:cap' &&
    valid(w.sourceTick) && valid(w.exitX) &&
    w.exitX===held?.thresholdX &&
    valid(w.cap?.y) && valid(w.cap?.height) &&
    w.cap.y+w.cap.height===roofY;

  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     !held || held.guardianGateRetained!==true ||
     held.runToken!==source.runToken || held.floor!==9 ||
     held.oldRoofY!==roofY || !valid(roofY) ||
     !valid(source.tick) || !valid(held.raisedDeckSourceTick) ||
     !valid(held.thresholdX) ||
     !(recorded||historic) ||
     held.raisedDeckSourceTick<(recorded?w.sourceTick:held.crossingTick) ||
     held.raisedDeckSourceTick>source.tick ||
     source.tick-(recorded?w.sourceTick:held.crossingTick)>SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS ||
     source.tick-held.raisedDeckSourceTick>SOURCE_GATEWAY_RAISED_FLIGHT_TAIL_TICKS)
    return false;
  if(observedSourceSuccessorRaisedDeck(source,roofY))return true;
  const sole=p.y-p.halfHeight;
  return p.grounded===false &&
    (p.state==='airborne'||p.state==='dashing') &&
    p.groundedPlatformId==null && Number.isFinite(p.vy) &&
    [p.x,p.y,p.halfHeight].every(valid) &&
    p.halfHeight>0 && Math.abs(p.x-held.thresholdX)<=100000 &&
    valid(sole) && sole>=roofY-2500 && sole<=roofY+230000;
}

/**
 * Same-run source lease for ACTUAL old-gate camera, original gallery and
 * F9 raised-deck occlusion. Previous visual owners expired at tick 70 even
 * while the World/palette retained the genuine f9:p2 raised contact through
 * tick 110, so bronze rails/deck skirts could re-mask a still-current hero.
 * Only immutable HP-zero original-guardian + exact raised sole/width support
 * (or its 32-tick authenticated flight tail) extends the old limit.
 */

/**
 * The first source-pinned 1x Floor9 films retained the *actual* opened
 * bronze GPU gate, but the public camera/horizon witness vanished when
 * the narrow departure-palette predicate expired during a real upward
 * jump. This certificate is strictly for an ALREADY-RETAINED original
 * world owner. It cannot introduce a gate, recover a retired GPU group,
 * replace recorded guardian defeat or create movement/renderer returns.
 * The caller separately verifies the gate mesh is still scene-owned.
 */
export function observedRetainedSourceOriginalOpticalRoom(source,held) {
  const valid=Number.isSafeInteger;
  const p=source?.player,w=source?.lastGuardianCrossing,cap=w?.cap;
  const ground=source?.platforms?.find(platform=>platform?.id==='f9:ground');
  const lease=observedSourceOriginalVisibilityWindow(source,held);
  if(!lease?.sourceBound ||
      held?.guardianGateRetained!==true ||
      held.verifiedObservedFloorAdvance!==true ||
      held.opticalExitSubmitted===true ||
      held.oldCapId!=='f8:cap' ||
      ![held.oldCapX,held.oldCapWidth,held.oldRoofY,held.thresholdX,
        held.crossingTick,held.firstWorldRenderTick,held.submittedFrames,
        source.tick,p?.x,p?.y,p?.halfWidth,p?.halfHeight,
        ground?.x,ground?.y,ground?.width,ground?.height,
        w?.sourceTick,w?.exitX,w?.crossingX,w?.halfWidth,w?.halfHeight,
        cap?.x,cap?.y,cap?.width,cap?.height].every(valid) ||
      held.oldCapWidth<=0 || p.halfWidth<=0 || p.halfHeight<=0 ||
      ground.width<=0 || ground.height<=0 ||
      held.firstWorldRenderTick>source.tick ||
      held.crossingTick>source.tick ||
      source.tick-held.crossingTick>lease.maxTicks ||
      held.submittedFrames<1 || held.submittedFrames>=30 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
      !Number.isFinite(held.originalGatewayOpacity) ||
      held.originalGatewayOpacity<=.035 ||
      held.originalGatewayOpacity>1 ||
      w?.runToken!==source.runToken ||
      w.fromFloor!==8 || w.toFloor!==9 ||
      w.sourceTick!==held.crossingTick ||
      w.guardian?.kind!=='guardian' ||
      w.guardian.active!==false ||
      !Number.isFinite(w.guardian.health) ||
      w.guardian.health>0 ||
      cap.id!=='f8:cap' ||
      cap.x!==held.oldCapX || cap.width!==held.oldCapWidth ||
      cap.y+cap.height!==held.oldRoofY ||
      w.exitX!==held.thresholdX ||
      w.exitX!==cap.x+Math.floor(cap.width*.76) ||
      w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
      w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
      ground.y+ground.height!==held.oldRoofY ||
      p.x-p.halfWidth<held.thresholdX-SOURCE_GATEWAY_RETURN_TOLERANCE ||
      p.x-p.halfWidth>held.thresholdX+100000 ||
      p.y-p.halfHeight<held.oldRoofY-2500 ||
      p.y-p.halfHeight>held.oldRoofY+230000 ||
      !observedSourceFloorNineRouteSupport(source,ground,held.oldRoofY))
    return null;
  return {sourceBound:true,sourceTick:source.tick,
    crossingTick:w.sourceTick,retainedOldGatewayOpacity:held.originalGatewayOpacity,
    limitation:'Genuine same-run zero-HP original gate, physically present moving body and existing source-supported F9 route; not native pixel visibility'};
}

export function observedSourceOriginalVisibilityWindow(source,held) {
  if(!source || !held || source.lifecycle!=='running' ||
     source.floor!==9 || source.theme!=='void' ||
     !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     source.runToken!==held.runToken ||
     held.floor!==9 || held.guardianGateRetained!==true ||
     !valid(source.tick) || !valid(held.sourceTick) ||
     source.tick<held.sourceTick) return null;
  const raisedSourceSupport=observedSourceRetainedRaisedExit(
    source,held,held.oldRoofY);
  const realAirborneApproach=observedSourceAirborneSuccessorApproach(
    source,held,held.oldRoofY);
  const maxTicks=raisedSourceSupport || realAirborneApproach
    ?SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS:70;
  if(source.tick-held.sourceTick>maxTicks)return null;
  return {sourceBound:true,sourceTick:source.tick,maxTicks,
    raisedSourceSupport,realAirborneApproach,
    limitation:'Real source sightlines, never native-film or gameplay evidence'};
}

export function observedSourcePhysicalArrivalPalette(source,held=null) {
  const p=source?.player, w=source?.lastGuardianCrossing;
  if(!source || !p || source.lifecycle!=='running' ||
     source.floor!==9 || source.theme!=='void' ||
     typeof source.runToken!=='string' || !source.runToken ||
     !(p.health>0) || !valid(source.tick) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     !Array.isArray(source.platforms))return null;
  const ground=source.platforms.find(item=>item?.id==='f9:ground');
  if(!ground || ![ground.x,ground.y,ground.width,ground.height].every(valid) ||
     ground.width<=0 || ground.height<=0)return null;
  let crossingX,roofY,sourceTick,kind;
  if(w!=null){
    const cap=w.cap,guardian=w.guardian;
    if(w.runToken!==source.runToken || w.fromFloor!==8 ||
       w.toFloor!==9 || cap?.id!=='f8:cap' ||
       guardian?.kind!=='guardian' || guardian.active!==false ||
       !valid(guardian.health) || guardian.health>0 ||
       ![w.sourceTick,w.crossingX,w.exitX,w.halfWidth,w.halfHeight,
          cap.x,cap.y,cap.width,cap.height].every(valid) ||
       cap.width<=0 || cap.height<=0 ||
       w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
       w.exitX!==cap.x+Math.floor(cap.width*.76) ||
       w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
       ground.y+ground.height!==cap.y+cap.height)return null;
    crossingX=w.crossingX;roofY=cap.y+cap.height;
    sourceTick=w.sourceTick;kind='recorded-source-zero-hp';
    // If the old GPU original is still held, it must be the SAME real roof,
    // not an unrelated decorative gate from a prior expedition.
    if(held && (held.runToken!==source.runToken ||
       held.floor!==9 || held.oldRoofY!==roofY ||
       held.thresholdX!==w.exitX))return null;
  } else {
    // The first portrait browser receipt may arrive BEFORE the immutable
    // HP-zero crossing record. Accept ONLY the already validated same-run
    // former cap and grounded source corridor; never infer a victory.
    const liveFirstRoof=observedStagedOriginalCapBeforeRecordedCrossing(source,held);
    const certifiedRaised=previouslyVerifiedOriginalRaisedReceipt(
      source,held,held?.oldRoofY) &&
      observedSourceRetainedRaisedExit(source,held,held.oldRoofY);
    const certifiedFlight=observedSourceAirborneSuccessorApproach(
      source,held,held?.oldRoofY);
    if(!(liveFirstRoof||certifiedRaised||certifiedFlight) ||
       ![held?.observedCrossingX,held?.oldRoofY,held?.sourceTick].every(valid) ||
       ground.y+ground.height!==held.oldRoofY)return null;
    crossingX=held.observedCrossingX;roofY=held.oldRoofY;
    sourceTick=(certifiedRaised||certifiedFlight)
      ?held.crossingTick:held.sourceTick;
    kind='verified-original-roof-receipt';
  }
  const sole=p.y-p.halfHeight,travel=p.x-crossingX,age=source.tick-sourceTick;
  const realRaisedOpticalExit=observedSourceRetainedRaisedExit(source,held,roofY);
  const realAirborneApproach=observedSourceAirborneSuccessorApproach(
    source,held,roofY);
  const sourceWindow=realRaisedOpticalExit || realAirborneApproach
    ?SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS:70;
  if(!valid(sole) || !valid(travel) || !valid(age) || age<0 ||
     age>sourceWindow ||
     travel < -SOURCE_GATEWAY_RETURN_TOLERANCE || travel>100000 ||
     sole<roofY-2500 || sole>roofY+230000 ||
     (!observedSourceFloorNineRouteSupport(source,ground,roofY) &&
       !realRaisedOpticalExit && !realAirborneApproach))return null;
  // The full-body climber remains warm at the actual old sill, and walks
  // through a 90m material transition into the existing next-floor palette.
  // This changes NO geometry, physics, inputs, tick, enemy or gameplay state.
  // The actual F9 grounded runway may end only ~1.5m beyond the boss
  // crossing. An old horizontal-only 9m tint corridor could therefore NEVER
  // complete during honest onward gameplay, then disappear abruptly when the
  // avatar jumped up the next platform. Use the current authoritative feet
  // in BOTH walk and ascent dimensions, in the same fixed source units.
  // This is a conservative straight-line displacement from the REAL old
  // sill (not fictitious distance walked or a simulated extra frame).
  const rise=Math.max(0,sole-roofY);
  const pathDisplacement=Math.hypot(travel,rise);
  // The actual first supported F9 landing is 12.6m ABOVE the old cap,
  // but only ~2m horizontally beyond it. A 90m Euclidean palette runway
  // can therefore never finish before the source-authenticated 70-tick
  // doorway owner expires: the ORIGINAL opaque bronze world disappears
  // while its materials are still more than 80% bronze in normal-speed film.
  // Use TWO genuine source travel axes. The already-validated airborne feet
  // or exact grounded raised-platform support can earn the same completion
  // by rising 7m CLEAR of the source doorway, without any synthetic stride,
  // landing, collision, elapsed-display clock or invented scene frame.
  // Horizontal travel keeps its original full 90m envelope for ground runs.
  // A genuine next-floor retreat never counts as positive forward distance.
  // Earn the transition through actual vertical clearance or later travel.
  const horizontalProgress=smooth((Math.max(0,travel)-6000)/84000);
  const verticalProgress=smooth((rise-10000)/60000);
  const physicalProgress=Math.max(horizontalProgress,verticalProgress);
  // Original 1x desktop/portrait films: physical F9 source advanced through
  // the bronze sill while software WebGL had only returned ONE successor
  // frame. Floor9 platforms, authored architectural material, old gate and
  // sky independently sampled the latest source distance, replacing the
  // bronze world with violet before a human-visible optical handoff.
  //
  // Bind all existing material owners to the SAME actual retained original
  // GPU doorway and successful frame count. No pose/physics is held, no
  // fake crossing/geometry is made, and no source tick is replayed. A first
  // drawn F9 frame shows original bronze contact; successive REAL WebGL
  // submissions expose the authentic successor materials. When the source
  // leaves the 70-tick original corridor, the GPU owner retires or 12 frames
  // have submitted, ordinary world palettes apply without this display gate.
  const originalGpuVisible=held?.guardianGateRetained===true &&
    held.runToken===source.runToken && held.floor===9 &&
    valid(held.firstWorldRenderTick) &&
    held.firstWorldRenderTick<=source.tick &&
    source.tick-held.firstWorldRenderTick<=sourceWindow &&
    valid(held.submittedFrames) &&
    held.submittedFrames>=0 && held.submittedFrames<30 &&
    Number.isFinite(held.visibleSeconds) &&
    held.visibleSeconds>=0 && held.visibleSeconds<3 &&
    Number.isFinite(held.originalGatewayOpacity) &&
    held.originalGatewayOpacity>0 &&
    held.opticalExitSubmitted!==true;
  // A genuine 10,000-unit grounded stride after the first GPU return
  // must start tinting the REAL roof toward Void. Holding progress at zero
  // until multiple frames returned made the floor appear frozen under a
  // moving body, and failed the actual Three.js world contact regression.
  // Still permit at most ~5% material transition after the first return;
  // an unsubmitted first F9 frame remains bronze, and the full source
  // progress cannot overtake the old physical gateway until its own bounded
  // sequence has been drawn.
  // Actual native 1x recordings show only a few WebGL returns while the
  // authentic climber leaves the 70-tick original corridor. Spreading the
  // handoff across 12-15 returned frames made the scene remain nearly
  // opaque bronze and then jump to fully violet when the source witness
  // expired. Keep the first real F9 draw genuinely bronze, preserve the
  // small observed source stride after the first return, then let the
  // next THREE returned frames finish a source-earned physical departure.
  // Dropped RAFs and polls advance nothing. The same true source progress
  // is still the upper bound, and it never changes actor/physics state.
  // Original 25fps WebMs at 04aaad27 prove one real F9 doorway GPU return
  // followed by a violet hard cut. Keep the authentic old/new materials
  // coupled across EIGHT returned frames, not an unobserved four-frame swap.
  // This is exactly the same successful-3D-return budget used by the
  // *existing* bronze gateway's alpha. It is not a separate sky clock:
  // the first returned F9 shot can respond to real source strides while
  // zero-return and blocked-render scenes remain completely original.
  const opticalProgress=originalGpuVisible
    ?observedOriginalGatewayOpticalBudget(held):1;
  const progress=Math.min(physicalProgress,opticalProgress);
  const oldWeight=1-progress;
  return {sourceBound:true,sourceTick:source.tick,crossingTick:sourceTick,
    kind,travel,rise,pathDisplacement,roofY,oldWeight,progress,
    horizontalProgress,verticalProgress,physicalProgress,
    ...(originalGpuVisible?{
      opticalBridgeSourceBound:true,
      originalGatewayGpuReturns:held.submittedFrames
    }:{}),
    limitation:'Original real 3D sill and source distance constrained by authentic old-gateway WebGL returns; NOT native pixel, fabricated floor, collider or review evidence'};
}

// One physically occupied ORIGINAL bronze arch, never a fabricated successor
// portal. Keep it solid until the recorded body has CLEARED its opening; after
// that, optical retirement is limited by BOTH genuine 3D departure and
// successful renderer submissions. In 1x footage the source climber can be
// halfway up the successor tower when the old GPU's 1.65s disposal timer
// fires: that deleted the original door at nonzero opacity. Permit a bounded
// 3s / 60-return retirement tail so its existing materials may actually fade
// to zero with genuine source ascent; never count a browser poll as a frame.
export function observedSourceGatewayDeparturePresence(source,held) {
  if(held?.guardianGateRetained!==true ||
     !valid(held?.submittedFrames) || held.submittedFrames<0 ||
     held.submittedFrames>60 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=3 ||
     !valid(held.thresholdX)) return null;
  const physical=observedSourcePhysicalArrivalPalette(source,held);
  if(!physical?.sourceBound)return null;
  const p=source.player;
  const wholeBodyCleared=
    p.x-p.halfWidth>=held.thresholdX+4000 ||
    physical.rise>=70000;
  // One original GPU return MUST show the complete bronze gate and
  // survivor. After that, real source clearance and actual successful
  // submissions allow its original material to recede within a finite
  // four-return sequence. The earlier .9s/6-return minimum could not finish
  // before the observed cold video advanced 60-70 authoritative ticks,
  // producing a one-frame discontinuity at source-proof retirement.
  // The old gateway, source-extracted gallery, roof, sky and new shaft all
  // consume one physically earned, WebGL-return-gated optical passage.
  // Never fade the physical original grille faster than the exact same
  // returned-frame-and-duration contract tinting the already walkable roof.
  const visibleProgress=observedOriginalGatewayOpticalBudget(held);
  // Do not erase the real bronze gate while the actual climber still occupies
  // the threshold. Only a fully-cleared original opening can retire its
  // physically shared surrounding gallery / material.
  // The FIRST old-gateway render is the authentic fully visible grille.
  // Source motion arriving after that return must not retroactively fade a
  // frame the GPU never submitted. A second successful return authorizes
  // physical mesh alpha; the already-rendered F9 roof may take its tiny
  // (<1.2%) color hint after one returned frame without erasing the gate.
  const consumed=wholeBodyCleared && held.submittedFrames>=2
    ?Math.min(physical.progress,visibleProgress):0;
  return {sourceBound:true,sourceTick:source.tick,
    actualSourcePosition:true,wholeBodyCleared,
    opacity:1-consumed,sourceProgress:physical.progress,
    submittedProgress:visibleProgress,
    limitation:'Existing original gate material only; no actual video pixel or acceptance claim'};
}

// A cold host may miss the *near* first-F9 source packet and first observe
// the real climber already beyond the entire old F8 cap on the actual F9 roof.
// That is NOT an excuse to keep the old bronze room covering a completely
// separate, successfully returned new-world shaft. Certify the late far-side
// exit from the immutable same-run HP-zero crossing, the exact shared roof,
// present full-width grounded contact, and the original GPU owner. No guessed
// route/portal/pose, renderer receipt or change to the authoritative simulation.
export function observedLateImmutableFarRoofDeparture(source,held,ground) {
  const p=source?.player,w=source?.lastGuardianCrossing,c=w?.cap;
  if(source?.lifecycle!=='running' || source.floor!==9 ||
     source.theme!=='void' || !(p?.health>0) ||
     !source.runToken || held?.runToken!==source.runToken ||
     held.floor!==9 || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' ||
     ![source.tick,held.sourceTick,held.firstWorldRenderTick,
       held.submittedFrames,held.oldCapX,held.oldCapWidth,held.oldRoofY,
       held.thresholdX,p.x,p.y,p.halfWidth,p.halfHeight,
       ground?.x,ground?.y,ground?.width,ground?.height,
       w?.sourceTick,w?.exitX,w?.crossingX,w?.halfWidth,w?.halfHeight,
       c?.x,c?.y,c?.width,c?.height].every(valid) ||
     held.oldCapWidth<=0 || ground.width<=0 || ground.height<=0 ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     ground?.id!=='f9:ground' ||
     ground.y+ground.height!==held.oldRoofY ||
     c?.id!=='f8:cap' || c.x!==held.oldCapX ||
     c.width!==held.oldCapWidth ||
     c.y+c.height!==held.oldRoofY ||
     w.runToken!==source.runToken || w.fromFloor!==8 ||
     w.toFloor!==9 || w.exitX!==held.thresholdX ||
     w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
     w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
     w.guardian?.kind!=='guardian' ||
     w.guardian.active!==false ||
     !valid(w.guardian.health) || w.guardian.health>0 ||
     w.sourceTick>held.sourceTick ||
     held.sourceTick-w.sourceTick>12 ||
     (held.crossingTick!=null && held.crossingTick!==w.sourceTick) ||
     source.tick<held.sourceTick || source.tick-w.sourceTick>70 ||
     source.tick<held.firstWorldRenderTick ||
     held.submittedFrames<1 || held.submittedFrames>=30 ||
     p.grounded!==true || p.groundedPlatformId!=='f9:ground' ||
     !(p.state==='standing'||p.state==='hurt') || p.vy!==0 ||
     p.y-p.halfHeight!==held.oldRoofY ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width ||
     // The full real player must have cleared the entire old cap, not just
     // stepped 4m through its still-visible opened gateway.
     p.x-p.halfWidth<held.oldCapX+held.oldCapWidth+4000)
    return false;
  return true;
}

// P0 physical 8→9 rendering: one bounded, source-authenticated optical
// envelope for the ORIGINAL bronze gateway, connected roof and gallery.
// Browser acceptance and a returned WebGL frame do not establish native pixels.
// Only the actual old-world material owners contribute; this cannot create
// a scene, new actor, collider, floor, victory or camera timeline.
const clamp = value => Math.max(0,Math.min(1,value));
export function sourceOwnedOriginalArchitectureCoverage(source,held) {
  // The world certifies each source-tick optical tail using the identical
  // original HP-zero, physical raised/airborne body, and GPU-return checks.
  // The stored scalar can hold only the visible old geometry, not recreate
  // expired gameplay authority or a different expedition's door.
  const paintedHistory=held?.opticalLease?.historicalOpticalTail===true &&
    held.opticalLease.sourceTick===source?.tick &&
    Number.isFinite(held.opticalLease.opacity) &&
    held.opticalLease.opacity>.01 && held.opticalLease.opacity<=1;
  if (!source || !held || held.guardianGateRetained!==true ||
      source.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || !(source.player?.health>0) ||
      typeof source.runToken!=='string' || !source.runToken ||
      held.runToken!==source.runToken || held.floor!==9 ||
      !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.firstWorldRenderTick) ||
      source.tick<held.firstWorldRenderTick ||
      source.tick-held.firstWorldRenderTick>(paintedHistory?150:
        (observedSourceRetainedRaisedExit(source,held,held.oldRoofY)
          ?SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS:70)) ||
      !Number.isSafeInteger(held.submittedFrames) ||
      held.submittedFrames<0 || held.submittedFrames>=30 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
      held.opticalExitSubmitted===true) return 0;
  let coverage=0;
  const sample=opacity=>{
    if(Number.isFinite(opacity)) coverage=Math.max(coverage,clamp(opacity));
  };
  // The world may pass a READ-ONLY primitive witness to the camera/sky
  // rather than expose actual writable GPU materials. Its scalar coverage
  // is measured from those same real meshes by the world owner.
  sample(held.originalArchitectureCoverage);
  sample(held.originalGatewayOpacity);
  sample(held.originalDeckSurface?.opacity);
  if(Array.isArray(held.originalGalleryMaterials))
    for(const material of held.originalGalleryMaterials) sample(material?.opacity);
  // The original mesh can still be GPU-owned and highly opaque after the
  // AUTHENTIC body has walked far beyond it. A simple max(alpha) coverage
  // veto hid the incoming shaft until historical retention expired, then
  // instantly swapped the entire skyline on the next source poll. Release
  // this *sightline* coverage based on actual supported source movement,
  // not browser time, a speculative AI target, or a fake floor transition.
  // This changes only incoming 3D scene visibility, never gate collision or
  // the authoritative stage of the winch.
  const p=source.player,ground=source.platforms?.find(
    platform=>platform?.id==='f9:ground');
  const w=source.lastGuardianCrossing;
  const witnessedCrossing=w==null || (
    w.runToken===source.runToken && w.fromFloor===8 &&
    w.toFloor===9 && w.cap?.id==='f8:cap' &&
    w.cap.y+w.cap.height===held.oldRoofY &&
    w.exitX===held.thresholdX && w.guardian?.kind==='guardian' &&
    w.guardian.active===false && Number.isFinite(w.guardian.health) &&
    w.guardian.health<=0 && valid(w.sourceTick) &&
    w.sourceTick<=source.tick);
  const supportedDeparture=
    held.verifiedObservedFloorAdvance===true &&
    held.oldCapId==='f8:cap' &&
    valid(held.oldCapX) && valid(held.oldCapWidth) &&
    held.oldCapWidth>0 &&
    held.thresholdX===held.oldCapX+Math.floor(held.oldCapWidth*.76) &&
    valid(held.crossingTick) && held.crossingTick<=source.tick &&
    source.tick-held.crossingTick<=SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS &&
    witnessedCrossing &&
    observedSourceFloorNineRouteSupport(source,ground,held.oldRoofY);
  if(supportedDeparture && held.submittedFrames>=1 &&
     valid(p.x) && valid(p.halfWidth) && valid(p.y) &&
     p.halfWidth>0 && valid(p.halfHeight) && p.halfHeight>0) {
    // The real F9 route doubles back in X before ascending above the old
    // gantry. Horizontal-only clearance kept almost the entire bronze room
    // covering the next biome, then removed it in one discontinuous source
    // lease expiration. The same source-authenticated walk/flight/raised-deck
    // validator used for collision-aligned physical arrival also certifies
    // actual sole height. No speculative AI target or presentation clock can
    // grant clearance, and the first original GPU return remains fully bronze.
    const sole=p.y-p.halfHeight;
    const measuredRise=valid(sole) && valid(held.oldRoofY) &&
      sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+230000
      ?Math.max(0,sole-held.oldRoofY):0;
    const pastSill=p.x-p.halfWidth-held.thresholdX;
    const horizontalClearance=smooth((pastSill-55000)/70000);
    // Genuine raised F9:p2 support is about 126m above the old cap, but only
    // ~2m beyond its X threshold. Open the new *existing* tower depth during
    // the real rise, not after an impossible 125m horizontal ground run.
    // This affects only non-colliding incoming structure exposure; the real
    // guardian grille, gateway collider and fixed-step game remain unchanged.
    const verticalClearance=smooth((measuredRise-35000)/85000);
    coverage*=1-Math.max(horizontalClearance,verticalClearance);
  }
  // Original unedited desktop/portrait films: the source-authentic gate
  // remains opaque while the climber has ALREADY walked across the F9 sill.
  // Expose a thin layer of the ACTUAL, deferred successor tower in depth
  // after one real old-gate render, BEFORE its later 7m vertical jump.
  // This is an overlap of existing authored 3D geometry, not a fake floor,
  // a violet sky cut or a faster deletion of the physical bronze gate.
  const sillDepth=observedEarnedSillDepthExposure(source,held);
  if(sillDepth?.sourceBound===true)
    coverage=Math.min(coverage,1-sillDepth.maxDepthReveal);
  // A later immutable crossing can arrive after the first browser F9 packet.
  // If the actually grounded living body is already beyond the WHOLE original
  // cap, stop letting that off-camera bronze room hide the true incoming
  // shaft. The new geometry still requires its own successful GPU returns.
  if(observedLateImmutableFarRoofDeparture(source,held,ground))
    // Clearing the *entire* historical bronze room after just one first F9
    // GPU return creates precisely the hard violet cut seen in native film.
    // Release its NONINTERACTIVE incoming-shaft sightline only as actual
    // returned frames and displayed GPU duration accrue, like the same
    // original physical gate; never from HUD/simulation distance alone.
    coverage*=1-observedOriginalGatewayOpticalBudget(held);
  return coverage;
}
/**
 * P0: the full fixed-step climb can travel beyond the 70/110-tick historical
 * cap lease while its cold original WebGL gateway has reached the native film
 * only once. This is a VERY short, source-certified optical afterimage of
 * the real previously rendered geometry, never a new floor/collision/guardian
 * proof. A true current airborne successor route and an already-witnessed,
 * same-run HP-zero crossing are mandatory. Actual GPU returns, not source
 * ticks or a fabricated fps, must complete its fade, under a hard 150-tick
 * safety limit even on stalled graphics.
 */
export function observedCertifiedOriginalGatewayOpticalLease(source,held,handoff) {
  const p=source?.player, proof=handoff?.lastVerifiedProof;
  const actual=source?.lastGuardianCrossing;
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(p?.health>0) ||
     !source.runToken || source.runToken!==held?.runToken ||
     held.floor!==9 || held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' ||
     ![source.tick,held.sourceTick,held.oldRoofY,held.thresholdX,
       held.oldCapX,held.oldCapWidth,held.submittedFrames,
       p.x,p.y,p.halfHeight,p.halfWidth].every(valid) ||
     held.oldCapWidth<=0 || p.halfHeight<=0 || p.halfWidth<=0 ||
     held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
     held.submittedFrames<1 || held.submittedFrames>=20 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
     held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
     !Number.isFinite(held.lastSourceOldGateOpacity) ||
     held.lastSourceOldGateOpacity<=0 || held.lastSourceOldGateOpacity>1 ||
     handoff?.runToken!==source.runToken ||
     (handoff.retiring!==true && handoff.retiring!==false) ||
     proof?.runToken!==source.runToken ||
     !(proof.kind==='recorded-source-zero-hp' ||
       proof.kind==='verified-original-roof-receipt') ||
     ![proof.sourceTick,proof.crossingTick].every(valid) ||
     proof.crossingTick>proof.sourceTick ||
     source.tick<proof.sourceTick ||
     source.tick-proof.crossingTick>150 ||
     held.sourceTick>source.tick ||
     (held.crossingTick!=null && held.crossingTick!==proof.crossingTick) ||
     !valid(handoff.retirementFrames) || handoff.retirementFrames<0 ||
     handoff.retirementFrames>60 ||
     !Number.isFinite(handoff.retirementSeconds) ||
     handoff.retirementSeconds<0 || handoff.retirementSeconds>1.5 ||
     handoff.retirementSeconds>handoff.retirementFrames*.1+1e-8 ||
     !Number.isFinite(handoff.retirementStartProgress) ||
     handoff.retirementStartProgress<0 ||
     handoff.retirementStartProgress>1) return null;
  if(actual!=null && (
     actual.runToken!==source.runToken ||
     actual.fromFloor!==8 || actual.toFloor!==9 ||
     actual.sourceTick!==proof.crossingTick ||
     actual.cap?.id!=='f8:cap' ||
     !valid(actual.cap?.x) || !valid(actual.cap?.width) ||
     !valid(actual.cap?.y) || !valid(actual.cap?.height) ||
     actual.cap.x!==held.oldCapX ||
     actual.cap.width!==held.oldCapWidth ||
     actual.cap.y+actual.cap.height!==held.oldRoofY ||
     actual.exitX!==held.thresholdX ||
     actual.guardian?.kind!=='guardian' ||
     actual.guardian.active!==false ||
     !Number.isFinite(actual.guardian.health) ||
     actual.guardian.health>0)) return null;
  // Current actor and the true previous gateway must still occupy one real
  // connected 3D space. Grounded f9:p2 needs exact sole/width support; a
  // jumping climber must be genuine airborne, with bounded height and reach.
  const sole=p.y-p.halfHeight;
  if(!valid(sole) || sole<held.oldRoofY-2500 ||
     sole>held.oldRoofY+230000 ||
     Math.abs(p.x-held.thresholdX)>100000 ||
     !(p.x-p.halfWidth>=held.thresholdX+4000 ||
       sole>=held.oldRoofY+70000) ||
     !(observedSourceSuccessorRaisedDeck(source,held.oldRoofY) ||
       (p.grounded===false && p.groundedPlatformId==null &&
        Number.isFinite(p.vy) &&
        (p.state==='airborne'||(p.state==='dashing' &&
          observedSourceAirborneSuccessorApproach(source,held,held.oldRoofY))))))
    return null;
  const progress=Math.min(1,
    handoff.retirementSeconds/.95,handoff.retirementFrames/5);
  if(progress>=1)return null;
  const eased=smooth(progress);
  // The first authoritative unsupported snapshot may arrive BEFORE the
  // parent world marks the material owner as retiring. Preserve the last
  // genuine sampled opacity for that single processing boundary; otherwise
  // the entire original mesh group would be disposed before retirement
  // could even begin on the next GPU-submitted image.
  const opacity=handoff.retiring===false
    ?held.lastSourceOldGateOpacity
    :Math.min(held.lastSourceOldGateOpacity,
      1-(handoff.retirementStartProgress+
        (1-handoff.retirementStartProgress)*eased));
  if(opacity<=.01)return null;
  return {historicalOpticalTail:true,sourceTick:source.tick,
    authenticatedCrossingTick:proof.crossingTick,opacity,
    limitation:'Already-rendered original gate only; never a new source event or native visual acceptance'};
}

/**
 * The first actually returned guardian doorway and first Floor9 shaft are
 * ONE ORIGINAL physically connected room. Native desktop + portrait 1x
 * footage (44489480762) draws a warm HP-open exit and then a fully violet
 * sky without any sustained shared-room frames. An eligible source actor
 * may advance through many fixed ticks while a cold GPU returns ZERO new
 * structural frames. Do not let that unpainted successor recolor the roof,
 * bearings, sky and old gateway independently.
 *
 * This is only a read-only source/return co-paint certificate. It preserves
 * the already-existing old material until the actual shaft has participated
 * in returned WebGL frames. It never paints a pixel, fabricates a frame,
 * invents a threshold/guardian/landing or changes physics/gameplay. The
 * caller uses its same oldWeight for original architecture and atmosphere.
 */
export function observedReturnedSharedRoomPalette(source,held,job) {
  const p=source?.player,w=source?.lastGuardianCrossing,c=w?.cap;
  const ground=source?.platforms?.find(x=>x?.id==='f9:ground');
  if(source?.lifecycle!=='running' || source.floor!==9 ||
     source.theme!=='void' || !(p?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     held?.runToken!==source.runToken || held.floor!==9 ||
     held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' || held.opticalExitSubmitted===true ||
     job?.runToken!==source.runToken || job.floor!==9 ||
     job.proof!=='recorded-source-gateway' ||
     job.structureDeferred!==true ||
     ![source.tick,held.sourceTick,held.crossingTick,
       held.firstWorldRenderTick,held.submittedFrames,
       held.oldCapX,held.oldCapWidth,held.oldRoofY,held.thresholdX,
       p.x,p.y,p.halfWidth,p.halfHeight,
       ground?.x,ground?.y,ground?.width,ground?.height,
       w?.sourceTick,w?.exitX,w?.crossingX,w?.halfWidth,w?.halfHeight,
       c?.x,c?.y,c?.width,c?.height,
       job.sourceTick,job.structuralVisibleReturns].every(valid) ||
     !Number.isFinite(job.structuralVisibleSeconds) ||
     job.structuralVisibleSeconds<0 || job.structuralVisibleSeconds>3 ||
     job.structuralVisibleSeconds>job.structuralVisibleReturns*.1+1e-8 ||
     held.oldCapWidth<=0 || p.halfWidth<=0 || p.halfHeight<=0 ||
     ground.width<=0 || ground.height<=0 ||
     held.oldCapX!==c.x || held.oldCapWidth!==c.width ||
     c.id!=='f8:cap' || c.y+c.height!==held.oldRoofY ||
     ground.y+ground.height!==held.oldRoofY ||
     held.thresholdX!==c.x+Math.floor(c.width*.76) ||
     w.runToken!==source.runToken || w.fromFloor!==8 || w.toFloor!==9 ||
     w.sourceTick!==held.crossingTick || w.sourceTick>source.tick ||
     w.exitX!==held.thresholdX || w.crossingX<w.exitX ||
     w.crossingX>w.exitX+60000 ||
     w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
     w.guardian?.kind!=='guardian' || w.guardian.active!==false ||
     !Number.isFinite(w.guardian.health) || w.guardian.health>0 ||
     held.sourceTick<held.crossingTick ||
     source.tick<held.sourceTick || source.tick-held.crossingTick>110 ||
     held.firstWorldRenderTick>source.tick ||
     job.sourceTick!==held.firstWorldRenderTick ||
     held.submittedFrames<1 || held.submittedFrames>=30 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
     !(held.originalGatewayOpacity>.01) ||
     held.originalGatewayOpacity>1 ||
     !(held.originalDeckSurface?.opacity>.01) ||
     held.originalDeckSurface.opacity>1 ||
     job.structuralVisibleReturns<0 || job.structuralVisibleReturns>30 ||
     !observedSourceFloorNineRouteSupport(source,ground,held.oldRoofY) &&
     !observedSourceAirborneSuccessorApproach(source,held,held.oldRoofY) &&
     !observedSourceRetainedRaisedExit(source,held,held.oldRoofY))
    return null;
  // A new shaft's first return earns depth but not instantaneous 100% Void
  // lighting. Its following returns progressively retire the same warm
  // architecture. The source cannot spend these returns by advancing ticks.
  // The observed 1x native desktop/portrait cut from the original bronze
  // guardian room to the F9 violet shaft with NO sustained shared-room image.
  // Previously six very fast render returns could spend the full warm paint
  // lease in ~.2 seconds, even while the old gateway retirement independently
  // requires .95 returned seconds. One TRUE returned-frame clock now owns
  // both the original physical roof and the incoming architectural materials:
  // a count alone cannot erase the old source-certified room. No HTTP tick,
  // construction, RAF or failed submission advances either proof.
  const paintedProgress=smooth(Math.min(
    Math.max(0,(job.structuralVisibleReturns-1)/5),
    job.structuralVisibleSeconds/.9));
  const oldWeight=Math.min(held.originalGatewayOpacity,
    held.originalDeckSurface.opacity)*(1-paintedProgress);
  if(oldWeight<=.01)return null;
  return {sourceBound:true,runToken:source.runToken,
    sourceTick:source.tick,crossingTick:w.sourceTick,
    kind:'recorded-source-zero-hp',sharedOriginalGpuRoom:true,
    oldWeight,returnedStructuralFrames:job.structuralVisibleReturns,
    limitation:'Source/returned-WebGL material cohesion only; native pixels, event pairing and experience NOT EVALUATED'};
}

export function sourceAlignedIncomingShaftOpacity(source,held,nominalOpacity){
  if(!Number.isFinite(nominalOpacity))return 0;
  // The OLD cap can disappear only when genuinely expired/retired; neither
  // a speculative old run nor an expired resource may suppress normal F9.
  return Math.min(clamp(nominalOpacity),
    1-sourceOwnedOriginalArchitectureCoverage(source,held));
}
