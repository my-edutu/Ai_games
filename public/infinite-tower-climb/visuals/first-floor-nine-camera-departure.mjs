// Final camera continuity during the first source-authentic Floor9 ascent.
// Presentation only: no authority, collision, source ticks or fabricated scene.
const vec = a => Array.isArray(a) && a.length===3 && a.every(Number.isFinite);
const dist = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
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
