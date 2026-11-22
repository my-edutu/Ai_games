// Final camera continuity during the first source-authentic Floor9 ascent.
// Presentation only: no authority, collision, source ticks or fabricated scene.
const vec = a => Array.isArray(a) && a.length===3 && a.every(Number.isFinite);
const dist = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function sourceFirstFloorNineCameraDeparture({source,lastRendered,
  firstReturnedF9Tick,previousCamera,previousFocus,previousHero,
  desiredCamera,desiredFocus,hero,dt,cameraMode,stale,reducedMotion}) {
  if(source?.floor!==9||source.theme!=='void'||
     source.lifecycle!=='running'||!(source.player?.health>0)||
     typeof source.runToken!=='string'||!source.runToken||
     !Number.isSafeInteger(source.tick)||
     lastRendered?.runToken!==source.runToken||lastRendered.floor!==9||
     !Number.isSafeInteger(lastRendered.tick)||source.tick<lastRendered.tick||
     !Number.isSafeInteger(firstReturnedF9Tick)||
     source.tick<firstReturnedF9Tick||
     source.tick-firstReturnedF9Tick>110||
     cameraMode!=='follow'||stale||reducedMotion||
     !Number.isFinite(dt)||dt<=0||
     ![previousCamera,previousFocus,previousHero,desiredCamera,desiredFocus,hero]
       .every(vec))return null;
  const actorMovement=dist(previousHero,hero);
  // An authentic source jump is NOT an invitation to freeze the hero lens.
  if(actorMovement>12)return null;
  const requested=dist(previousCamera,desiredCamera);
  const originalRange=dist(previousCamera,hero);
  const newRange=dist(desiredCamera,hero);
  const budget=Math.min(3.5,
    Math.max(.85,20*Math.min(dt,.08),actorMovement*1.4+.5));
  const pRadius=Math.hypot(previousCamera[0],previousCamera[2]);
  const dRadius=Math.hypot(desiredCamera[0],desiredCamera[2]);
  const pAngle=Math.atan2(previousCamera[0],previousCamera[2]);
  const dAngle=Math.atan2(desiredCamera[0],desiredCamera[2]);
  const requestedTurn=Math.atan2(Math.sin(dAngle-pAngle),Math.cos(dAngle-pAngle));
  // Exact native candidate 7ef8f9b: portrait camera swings from
  // [2.5,16.9,56.5] to [38,17.7,33.9] with only ~4m of authentic
  // climber movement. The lens MOVES INWARD, so an outward-only
  // catapult guard cannot catch the sudden ~0.8rad shoulder cut.
  const shoulderCut=requested>Math.max(7,actorMovement*2+3) &&
    Math.abs(requestedTurn)>.28 &&
    pRadius>=23.5&&dRadius>=23.5&&pRadius<=135&&dRadius<=135;
  if(shoulderCut){
    // Rotate around the original tower core from the last successfully
    // returned same-run lens. Time that the browser did not render never
    // grants a camera teleport; source physics remain authoritative.
    const seconds=clamp(dt,.001,.085);
    const turn=clamp(requestedTurn,-.78*seconds,.78*seconds);
    const radius=pRadius+clamp(dRadius-pRadius,-18*seconds,18*seconds);
    const height=previousCamera[1]+clamp(
      desiredCamera[1]-previousCamera[1],-15*seconds,15*seconds);
    const camera=[Math.sin(pAngle+turn)*radius,height,
      Math.cos(pAngle+turn)*radius];
    // Do not anchor the gaze on an old roof while a real climber vaults
    // upward. Allow observed 3D displacement to fund focus recovery;
    // the Scene still vetoes cropped body or obstructed tower-core rays.
    const gazeDistance=dist(previousFocus,desiredFocus);
    const gazeBudget=Math.min(12,actorMovement*1.8+24*seconds);
    const amount=gazeDistance>0?Math.min(1,gazeBudget/gazeDistance):1;
    const focus=previousFocus.map((v,i)=>v+(desiredFocus[i]-v)*amount);
    return {camera,focus,sourceTick:source.tick,runToken:source.runToken,
      requestedMovement:+requested.toFixed(3),
      boundedMovement:+dist(previousCamera,camera).toFixed(3),
      requestedTurnRadians:+requestedTurn.toFixed(4),
      boundedTurnRadians:+turn.toFixed(4),
      reason:'first-original-floor-nine-camera-shoulder-cut'};
  }
  // Leave ordinary tracking and inward catch-up untouched. Only the
  // discontinuous OUTWARD dolly which shrinks the hero is constrained.
  if(requested<=budget||newRange-originalRange<=Math.max(1.25,actorMovement*.5)||
     originalRange<1||originalRange>65)return null;
  const fraction=budget/requested;
  const blend=(a,b)=>a.map((v,i)=>+(v+(b[i]-v)*fraction).toFixed(6));
  return {camera:blend(previousCamera,desiredCamera),
    focus:blend(previousFocus,desiredFocus),sourceTick:source.tick,
    runToken:source.runToken,requestedMovement:+requested.toFixed(3),
    boundedMovement:+budget.toFixed(3),
    reason:'first-original-floor-nine-camera-outward-dolly'};
}
