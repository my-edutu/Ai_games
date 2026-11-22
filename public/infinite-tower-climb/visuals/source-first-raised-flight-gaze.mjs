// A final-pass, source-authenticated gaze proposal for the FIRST raised
// Floor9 flight after the original defeated Floor8 guardian threshold.
// Genuine desktop/portrait 1x video 45008437069 loses the whole moving hero
// behind the old crane / near the phone's right edge while the rendered
// camera leaves the retained original gateway for the elevated route.
// Proposes only a bounded orientation correction to the EXISTING camera:
// no actor pose, movement, destination, platform, source time, fake camera,
// teleported viewpoint or new WebGL pass. Scene must verify actual 3D
// projection, core rays and preserved old-steel visibility before accepting.
const finite=Number.isFinite;
const point=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
export function sourceFirstRaisedFlightGaze(source, options={}) {
  const p=source?.player, earned=source?.lastGuardianCrossing;
  const raised=source?.platforms?.find(item=>
    item?.id===source?.intent?.targetPlatformId);
  if(source?.floor!==9||source.theme!=='void'||
     source.lifecycle!=='running'||source.stale===true||
     typeof source.runToken!=='string'||!source.runToken||
     !(p?.health>0)||p.state!=='airborne'||p.grounded!==false||
     earned?.runToken!==source.runToken||earned.fromFloor!==8||
     earned.toFloor!==9||earned.cap?.id!=='f8:cap'||
     earned.guardian?.kind!=='guardian'||
     earned.guardian?.active!==false||
     !(finite(earned.guardian.health)&&earned.guardian.health<=0)||
     !Number.isSafeInteger(source.tick)||
     !Number.isSafeInteger(earned.sourceTick)||
     source.tick<earned.sourceTick||
     source.tick-earned.sourceTick>110||
     !raised||!/^f9:p[0-9]+$/.test(raised.id)||
     ![raised.x,raised.y,raised.width,raised.height].every(Number.isSafeInteger)||
     raised.width<=0||raised.height<=0||
     options.camera!=='follow'||options.reducedMotion===true||
     options.stale===true||
     !finite(options.aspect)||options.aspect<=.35||options.aspect>=2.5||
     !finite(options.dt)||options.dt<=0||
     !point(options.focus)||!point(options.hero)||!point(options.landing)||
     !Array.isArray(options.heroNdc)||options.heroNdc.length!==4||
     !options.heroNdc.every(finite))return null;
  const [nx,ny,depth,halfBody]=options.heroNdc;
  if(depth<-1||depth>1||halfBody<.025||halfBody>.65||
     Math.abs(nx)>1.5||Math.abs(ny)>1.5)return null;
  // Compensate BEFORE actual cropping, but only on the actual raised flight;
  // do not steer the hero across the old gateway during grounded crossing.
  const portrait=options.aspect<.85;
  const horizontal=portrait?.43:.63;
  const vertical=portrait?.64:.72;
  const edge=Math.max(
    (Math.abs(nx)+halfBody*.14-horizontal)/.32,
    (Math.abs(ny)+halfBody-vertical)/.26,0);
  if(edge<=0)return null;
  const urgency=clamp(edge,0,1);
  const target=options.hero.map((v,i)=>v*.84+options.landing[i]*.16);
  const delta=target.map((v,i)=>v-options.focus[i]);
  const length=Math.hypot(...delta);
  if(!finite(length)||length<.001)return null;
  // Never invent an instant floor transition by moving the camera. This
  // is a measured maximum gaze *distance* per genuine display iteration.
  const seconds=clamp(options.dt,.001,.065);
  const step=Math.min(length,seconds*(portrait?25:20)*urgency);
  const gaze=options.focus.map((v,i)=>v+delta[i]*step/length);
  return {sourceBound:true,runToken:source.runToken,
    sourceTick:source.tick,landingId:raised.id,gaze,
    gazeStepMetres:step,urgency,kind:'first-authentic-floor-nine-raised-flight',
    limitation:'Proposed view only: final Three.js whole-body, actual steel, source roof and camera occlusion acceptance required; NOT native footage approval'};
}
