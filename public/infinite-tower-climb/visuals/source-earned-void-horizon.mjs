// P0: Real Floor9 exists BEYOND a still-warm old guardian door. Release only
// its original global sky/fog after source-matched first-bearing GPU returns.
// No physics, new renderable, fake winning event or native-pixel certification.
const integer=Number.isSafeInteger;
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function observedSourceEarnedVoidHorizon(source,held,submission) {
  const p=source?.player,w=source?.lastGuardianCrossing;
  const cap=w?.cap,guardian=w?.guardian;
  const ground=source?.platforms?.find(s=>s?.id==='f9:ground');
  if(source?.floor!==9 || source.theme!=='void' ||
    source.lifecycle!=='running' || !integer(source.tick) ||
    typeof source.runToken!=='string' || !source.runToken ||
    !p || !(p.health>0) ||
    ![p.x,p.y,p.halfWidth,p.halfHeight].every(integer) ||
    p.halfWidth<=0 || p.halfHeight<=0 ||
    w?.runToken!==source.runToken || w.fromFloor!==8 ||
    w.toFloor!==9 || !integer(w.sourceTick) || w.sourceTick>source.tick ||
    guardian?.kind!=='guardian' || guardian.active!==false ||
    !Number.isFinite(guardian.health) || guardian.health>0 ||
    cap?.id!=='f8:cap' || ![cap.x,cap.y,cap.width,cap.height,w.exitX].every(integer) ||
    cap.width<=0 || cap.height<=0 ||
    w.exitX!==cap.x+Math.floor(cap.width*.76) ||
    !held || held.runToken!==source.runToken || held.floor!==9 ||
    held.guardianGateRetained!==true || held.oldCapId!=='f8:cap' ||
    held.crossingTick!==w.sourceTick || held.thresholdX!==w.exitX ||
    held.oldCapX!==cap.x || held.oldCapWidth!==cap.width ||
    held.oldRoofY!==cap.y+cap.height ||
    !integer(held.submittedFrames) || held.submittedFrames<1 ||
    held.submittedFrames>30 || !Number.isFinite(held.visibleSeconds) ||
    held.visibleSeconds<0 || held.visibleSeconds>2.8 ||
    held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
    !Number.isFinite(held.originalGatewayOpacity) ||
    held.originalGatewayOpacity<=.035 || held.originalGatewayOpacity>1 ||
    !ground || ![ground.x,ground.y,ground.width,ground.height].every(integer) ||
    ground.width<=0 || ground.height<=0 ||
    ground.y+ground.height!==held.oldRoofY ||
    p.x-p.halfWidth<=held.thresholdX ||
    p.x-p.halfWidth<ground.x || p.x+p.halfWidth>ground.x+ground.width ||
    p.y-p.halfHeight<held.oldRoofY-2500 ||
    !submission || submission.sourceBound!==true ||
    submission.runToken!==source.runToken || submission.floor!==9 ||
    submission.sourceTick!==source.tick ||
    !integer(submission.firstBearingReturnedFrames) ||
    submission.firstBearingReturnedFrames<1 ||
    submission.firstBearingReturnedFrames>held.submittedFrames ||
    submission.firstBearingReturnedFrames>30) return null;
  const grounded=p.grounded===true && p.vy===0 &&
    typeof p.groundedPlatformId==='string' &&
    source.platforms.some(s=>s?.id===p.groundedPlatformId &&
      s.id.startsWith('f9:') &&
      [s.x,s.y,s.width,s.height].every(integer) && s.width>0 && s.height>0 &&
      p.x-p.halfWidth>=s.x && p.x+p.halfWidth<=s.x+s.width &&
      p.y-p.halfHeight===s.y+s.height);
  const realFlight=p.grounded===false && p.state==='airborne' &&
    p.groundedPlatformId==null && Number.isFinite(p.vy);
  if(!grounded && !realFlight)return null;
  // Source-grounded prior bearing submissions are not a screenshot or claim
  // of visibly painted pixels. Require multiple returned frames AND bounded
  // returned display time for a continuous, non-flashing exterior atmosphere.
  const byReturns=(submission.firstBearingReturnedFrames-1)/4;
  const byTime=Math.max(0,(held.visibleSeconds-.10)/.45);
  const progress=smooth(Math.min(byReturns,byTime));
  return {sourceBound:true,runToken:source.runToken,sourceTick:source.tick,grounded,realFlight,
    firstBearingReturnedFrames:submission.firstBearingReturnedFrames,
    maxOldHorizonWeight:1-progress,
    limitation:'Actual same-run guardian HP0, physical F9 support/flight, previously returned original bearing; not painted native pixels or gameplay authority'};
}
