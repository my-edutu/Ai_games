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
  const turn=clamp(arc,-.82*seconds,.82*seconds);
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
