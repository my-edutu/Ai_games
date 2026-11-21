// A single physical follow-camera handoff after the actually submitted F8
// guardian gateway leaves the F9 scene. This is renderer-only: no source pose,
// predicted route, floor event, camera teleport or synthetic gateway.
const finite=Number.isFinite;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const validPoint=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
export function sourceReturnedGateCameraRelease({
  source,lastGate,previousCamera,previousFocus,desiredCamera,desiredFocus,dt
}){
  if(source?.floor!==9||source.theme!=='void'||
      source.lifecycle!=='running'||!(source.player?.health>0)||
      typeof source.runToken!=='string'||!source.runToken||
      !Number.isSafeInteger(source.tick)||
      lastGate?.floor!==9||lastGate.runToken!==source.runToken||
      !Number.isSafeInteger(lastGate.tick)||
      source.tick<lastGate.tick||source.tick-lastGate.tick>110||
      !finite(dt)||dt<=0||dt>.5||
      !validPoint(previousCamera)||!validPoint(previousFocus)||
      !validPoint(desiredCamera)||!validPoint(desiredFocus))
    return null;
  // Only completed renderer intervals (bounded on a stalled browser), not
  // simulation ticks, can move this camera. Keep motion predictable on phones.
  const seconds=clamp(dt,.001,.065);
  const [px,py,pz]=previousCamera,[dx,dy,dz]=desiredCamera;
  const pRadius=Math.hypot(px,pz),dRadius=Math.hypot(dx,dz);
  if(pRadius<23.5||dRadius<23.5||pRadius>130||dRadius>130)
    return null;
  const oldAngle=Math.atan2(px,pz),newAngle=Math.atan2(dx,dz);
  const arc=Math.atan2(Math.sin(newAngle-oldAngle),Math.cos(newAngle-oldAngle));
  const turn=clamp(arc,-.72*seconds,.72*seconds);
  const radius=pRadius+clamp(dRadius-pRadius,-14*seconds,14*seconds);
  const angle=oldAngle+turn;
  const y=py+clamp(dy-py,-12*seconds,12*seconds);
  const camera=[Math.sin(angle)*radius,y,Math.cos(angle)*radius];
  const deltaFocus=desiredFocus.map((v,i)=>v-previousFocus[i]);
  const focusDistance=Math.hypot(...deltaFocus);
  const focusTravel=focusDistance>0
    ?Math.min(1,18*seconds/focusDistance):1;
  const focus=previousFocus.map((v,i)=>v+deltaFocus[i]*focusTravel);
  const remaining=Math.hypot(dx-camera[0],dy-camera[1],dz-camera[2]);
  const settled=remaining<.035&&Math.hypot(...desiredFocus.map((v,i)=>v-focus[i]))<.035;
  return {camera,focus,seconds,turnRadians:turn,remainingMetres:remaining,
    settled,limited:!settled,
    scope:'same-run actually returned original gateway, current real F9 camera'};
}


// Continuous FIRST genuinely returned F9 gateway shot. The earlier camera
// release only ran AFTER the old doorway was gone; full-motion portrait film
// shows a large camera orbit while the old room is still visible. Bound the
// actual current 3D director to the LAST completed source-matched F9 view
// throughout that retained physical gate/roof. Source conditions here are a
// VETO, not a simulation cue or permission to resurrect old geometry.
// Scene must independently test the full skinned body, gate and opaque-core
// sightlines before accepting the camera proposal.
export function sourceRetainedGatewayCameraContinuity({
  source, held, lastReturned, previousCamera, previousFocus,
  desiredCamera, desiredFocus, dt
}) {
  const p=source?.player;
  const ground=source?.platforms?.find(deck=>deck?.id==='f9:ground');
  if(source?.floor!==9 || source.theme!=='void' ||
      source.lifecycle!=='running' || !(p?.health>0) ||
      !Array.isArray(source.platforms) || !ground ||
      held?.sourceOwnedOriginalCameraRoom!==true ||
      held.originalArchitectureWorldCertified!==true ||
      held.originalArchitectureCoverageSourceTick!==source.tick ||
      held.guardianGateRetained!==true || held.oldCapId!=='f8:cap' ||
      held.floor!==9 || held.runToken!==source.runToken ||
      lastReturned?.floor!==9 || lastReturned.runToken!==source.runToken ||
      ![source.tick,held.sourceTick,held.thresholdX,held.oldRoofY,
        held.oldCapX,held.oldCapWidth,held.submittedFrames,
        lastReturned.tick,p.x,p.y,p.halfHeight,
        ground.x,ground.y,ground.width,ground.height].every(Number.isSafeInteger) ||
      !finite(held.originalGatewayOpacity) ||
      held.originalGatewayOpacity<=.035 || held.originalGatewayOpacity>1 ||
      !finite(held.visibleSeconds) || held.visibleSeconds<0 ||
      held.visibleSeconds>=2.8 || held.submittedFrames<1 ||
      held.submittedFrames>=30 || source.tick<held.sourceTick ||
      source.tick-held.sourceTick>110 ||
      lastReturned.tick<held.sourceTick ||
      lastReturned.tick>source.tick ||
      held.oldCapWidth<=0 ||
      held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76) ||
      ground.width<=0 || ground.height<=0 ||
      ground.y+ground.height!==held.oldRoofY ||
      p.halfHeight<=0 ||
      Math.abs(p.x-held.thresholdX)>120000 ||
      p.y-p.halfHeight<held.oldRoofY-2500 ||
      p.y-p.halfHeight>held.oldRoofY+160000)
    return null;
  const result=sourceReturnedGateCameraRelease({
    source,
    lastGate:{floor:9,runToken:lastReturned.runToken,tick:lastReturned.tick},
    previousCamera,previousFocus,desiredCamera,desiredFocus,dt
  });
  return result?{...result,scope:
    'current same-run submitted Floor9 guardian-gateway/roof and real climber'}:null;
}

/**
 * A real returned follow camera is useful only when it preserves the ACTUAL
 * original bronze gate's projected steel, the complete climber, and current
 * F9 platform sightlines. A mathematical gateway centre is not a painted
 * doorway. Every input comes from the current Three.js scene: this cannot
 * approve a missing mesh, invent an opened guardian, or claim a video pass.
 * A bad candidate is vetoed and the previous source-owned director is kept.
 */
export function assessSourceRetainedGatewayPhysicalShot({
  fullBodyVisible, gateCenterVisible, receivingRoofVisible,
  originalGateSteel, actualDeckSightline, raisedDeckBackdrop
}) {
  const steel=originalGateSteel;
  const sight=actualDeckSightline;
  const finitePhysical=steel?.sourceBound===true &&
    finite(steel.projectedMetalArea) &&
    Number.isSafeInteger(steel.projectedPanes) &&
    steel.projectedPanes>=2 && steel.projectedMetalArea>=.012;
  const clearTriangles=sight?.active===true &&
    Number.isSafeInteger(sight.bodyBlockedRays) &&
    Number.isSafeInteger(sight.gatewayBlockedRays) &&
    sight.bodyBlockedRays===0 && sight.gatewayBlockedRays===0;
  const raisedClear=raisedDeckBackdrop?.active!==true ||
    (finite(raisedDeckBackdrop.coverage) &&
      raisedDeckBackdrop.coverage<=.36);
  return {
    allowed:fullBodyVisible===true && gateCenterVisible===true &&
      receivingRoofVisible===true && finitePhysical &&
      clearTriangles && raisedClear,
    reasons:[
      ...(!finitePhysical?['original-gateway-steel-not-readable']:[]),
      ...(!clearTriangles?['real-world-triangles-interrupt-three-subject-shot']:[]),
      ...(!raisedClear?['raised-deck-dominates-gateway-backdrop']:[]),
      ...(fullBodyVisible!==true?['full-body-not-visible']:[]),
      ...(gateCenterVisible!==true?['original-gate-not-projected']:[]),
      ...(receivingRoofVisible!==true?['source-walkable-roof-not-projected']:[])
    ],
    basis:'current returned source-owned original mesh/deck and real 3D camera; NOT native video pixels'
  };
}
