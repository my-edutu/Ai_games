/**
 * One presentation-only camera coordinator for the ACTUAL autonomous Dungeon.
 *
 * Owns beat precedence, manual/auto ownership, cinema continuity, the optional
 * physical visibility orbit and the final view transition. Existing authored
 * shots and real geometry solvers remain specialist inputs, not competing
 * directors with independent emergency or recovery timers.
 *
 * This module never changes simulation snapshots, the map, damage, AI, actor
 * positions, warning cells, or the spectator's selected view. No render passes,
 * timers, global caches, per-frame arrays, randomness or external effects.
 */
const finite=Number.isFinite;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const VALID_WARNING=new Set(['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']);
const BEATS=Object.freeze({
 manual:{priority:0,rate:4.6,aim:5.5,lens:5.2,orbit:false,urgent:false},
 journey:{priority:10,rate:5.2,aim:5.5,lens:5.2,orbit:true,urgent:false},
 portal:{priority:35,rate:5.4,aim:5.8,lens:5.2,orbit:false,urgent:false},
 approach:{priority:45,rate:6.2,aim:6.5,lens:5.5,orbit:true,urgent:false},
 combat:{priority:60,rate:7.2,aim:7.5,lens:6.2,orbit:true,urgent:false},
 recovery:{priority:72,rate:7.0,aim:7.5,lens:5.5,orbit:true,urgent:false},
 counter:{priority:80,rate:8.5,aim:9.0,lens:7.0,orbit:true,urgent:false},
 defeat:{priority:90,rate:4.6,aim:5.0,lens:5.0,orbit:false,urgent:true},
 release:{priority:95,rate:11.5,aim:12.0,lens:10.0,orbit:false,urgent:true},
 warning:{priority:100,rate:15.0,aim:17.0,lens:13.0,orbit:false,urgent:true}
});
const hasScene=s=>Number.isSafeInteger(s?.run)&&Number.isSafeInteger(s?.floor)&&
 s.run>=0&&s.floor>=1;
const sceneKey=s=>hasScene(s)?s.run+':'+s.floor:null;
function liveWarden(s){
 return Array.isArray(s?.units)&&s.units.length<=80?
  s.units.find(u=>u?.kind==='warden'&&u?.faction==='enemy'&&finite(u.hp)&&u.hp>0):null;
}
function imminentWarning(s,boss){
 const w=s?.bossWarning,n=Array.isArray(s?.map)?s.map.length:0;
 return Boolean(boss&&Number.isSafeInteger(s?.tick)&&w&&VALID_WARNING.has(w.shape)&&
  Number.isSafeInteger(w.attackTick)&&w.attackTick>s.tick&&w.attackTick<=s.tick+3&&
  Array.isArray(w.cells)&&w.cells.length>0&&w.cells.length<=n*n&&
  n>=7&&n<=41&&w.cells.every(c=>Number.isSafeInteger(c?.x)&&
   Number.isSafeInteger(c?.z)&&c.x>=0&&c.z>=0&&c.x<n&&c.z<n));
}
/**
 * No signal is promoted from a stale shot label. An active authority-backed
 * Warden danger always wins, even if an older contact shot was held for a
 * rendered frame. Real cast release outranks recovery only on its own tick.
 */
export function classifyAdventureBeat(s,shot){
 if(s?.phase==='intermission')return 'defeat';
 if(!hasScene(s)||!Array.isArray(s?.units)||!shot)return 'journey';
 const boss=liveWarden(s);
 if(imminentWarning(s,boss))return 'warning';
 if(shot.mode==='warden-release'&&boss?.action==='cast'&&
    Number.isSafeInteger(s.tick)&&boss.actionTick===s.tick)return 'release';
 const recovered=Boolean(boss&&!s.guardianWard&&
    Number.isSafeInteger(s?.bossRecovery?.remaining)&&
    s.bossRecovery.remaining>0&&s.bossRecovery.remaining<=6);
 if(shot.mode==='warden-counter'&&recovered)return 'counter';
 if(shot.mode==='warden-exposed'&&recovered)return 'recovery';
 if(shot.mode==='last-stand'||shot.mode==='descent'||shot.mode==='portal-descent')return 'portal';
 if(['contact','warden-contact','oathguard-cover'].includes(shot.mode))return 'combat';
 if(['skirmish-approach','warden-approach'].includes(shot.mode))return 'approach';
 return 'journey';
}
const vector=v=>v&&[v.x,v.y,v.z].every(finite);
const copy=v=>({x:v.x,y:v.y,z:v.z});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
/**
 * No independently invented camera timer. This is a constant-size state
 * machine; all movement is computed from render frame delta with an upper
 * bound under delayed software WebGL. Hazard FOV widens immediately, never
 * concealing a genuinely imminent floor warning while a pan is easing.
 */
export function createAdventureCameraDirector({continuity=null,physical=null,threat=null,collision=null}={}){
 let scene=null,beat='manual',onset=false,automatic=false;
 let frames=0,modeChanges=0,urgentTurns=0,resets=0,orbits=0,physicalAccepted=0,manualEntries=0;
 let threatChecks=0,threatImprovements=0,threatCapped=0,lastThreat=null;
 let collisionChecks=0,collisionCorrections=0,collisionHolds=0,lastCollisionMode=null;
 function clearHelpers(){
  continuity?.reset?.();
  physical?.reset?.();
  lastThreat=null;
 }
 function reset(){
  clearHelpers();scene=null;beat='manual';automatic=false;onset=false;resets++;
 }
 function begin(s,rawShot,dt=0,{autoDirector=true,view='cinematic',reducedMotion=false}={}){
  const nextScene=sceneKey(s);
  if(nextScene!==scene){
   clearHelpers();scene=nextScene;beat='manual';onset=false;automatic=false;resets++;
  }
  const enabled=autoDirector===true&&view==='cinematic'&&nextScene!==null;
  if(!enabled){
   if(automatic){clearHelpers();manualEntries++;}
   automatic=false;beat='manual';onset=false;
   return Object.freeze({shot:null,beat,priority:BEATS.manual.priority,
    urgent:false,allowPhysical:false,scene});
  }
  if(!automatic){clearHelpers();automatic=true;}
  const continuous=continuity?.resolve?.(s,rawShot,dt,{reducedMotion})??rawShot??null;
  const nextBeat=classifyAdventureBeat(s,continuous);
  onset=beat!==nextBeat;
  if(onset){
   modeChanges++;
   if(BEATS[nextBeat].urgent)urgentTurns++;
   // Never reuse a physical orbit selected for a different crisis after a
   // new live warning/release/defeat. Ordinary combat continuity is delegated.
   if(BEATS[nextBeat].urgent)physical?.reset?.();
  }
  beat=nextBeat;frames++;
  const policy=BEATS[beat];
  return Object.freeze({shot:continuous,beat,priority:policy.priority,
   urgent:policy.urgent,allowPhysical:policy.orbit&&!reducedMotion,scene});
 }
 function selectPhysical(s,base,options={}){
  if(!automatic||!BEATS[beat].orbit||!base?.position||!base?.look||!physical?.resolve)return base;
  orbits++;
  const selected=physical.resolve(s,base,options);
  if(selected&&vector(selected.position)&&selected.look&&finite(selected.look.x)&&finite(selected.look.z)){
   physicalAccepted++;return selected;
  }
  return base;
 }
 /** The only authority allowed to request warning coverage correction is the
  * active AUTO cinematic Warden-warning beat; manual mode stays untouchable.
  * Geometry proposal is pure and delivered by the physical specialist.
  */
 function frameThreat(s,base,options={}){
  if(!automatic||beat!=='warning'||!threat?.plan)return null;
  const planned=threat.plan(s,base,options);
  if(!planned||!vector(planned.camera?.position)||!planned.camera?.look||
     ![planned.camera.look.x,planned.camera.look.z,planned.fov].every(finite))return null;
  threatChecks++;
  if(planned.changed)threatImprovements++;
  if(planned.coverage?.capped)threatCapped++;
  lastThreat=Object.freeze({reason:planned.reason,requiredFov:planned.coverage?.requiredFov,
   fov:planned.fov,cells:planned.coverage?.cells,capped:planned.coverage?.capped});
  return planned;
 }
 /** Guard the actual interpolated camera ray against already-rendered Gothic
  * wall/facade/prop volumes. Manual focus and camera mode remain sovereign;
  * the submitted proposal is read-only and cannot alter physical game lanes.
  */
 function protectWorld(actual,desired,options={}){
  if(!automatic||!collision?.plan)return null;
  const result=collision.plan(actual,desired,options);
  if(!result||!vector(result.position))return null;
  collisionChecks++;
  if(result.corrected)collisionCorrections++;
  if(result.mode==='held-at-physical-wall')collisionHolds++;
  lastCollisionMode=result.mode;
  return result;
 }
 function transition(actual,desired,dt=0,{following=null,reducedMotion=false,initialized=true,warningState=null,warningViewport=null}={}){
  if(!vector(desired?.position)||!vector(desired?.aim)||!finite(desired.fov)||
     desired.fov<25||desired.fov>105)return null;
  if(!initialized||reducedMotion||!vector(actual?.position)||!vector(actual?.aim)||!finite(actual?.fov)){
   onset=false;
   return Object.freeze({position:copy(desired.position),aim:copy(desired.aim),
    fov:desired.fov,beat,alpha:1});
  }
  const config=BEATS[beat],step=clamp(finite(dt)?dt:0,0,.24);
  // Preserve the authored follow speed for ordinary shots. A genuine ground
  // danger has priority over a comfortable but unusably slow chase rate.
  const speed=finite(following)?clamp(following,2,20):config.rate;
  let alpha=1-Math.exp(-Math.max(config.rate,speed)*step);
  let aimAlpha=1-Math.exp(-config.aim*step);
  let lensAlpha=1-Math.exp(-config.lens*step);
  if(onset&&beat==='warning'){
   alpha=Math.max(alpha,.36);aimAlpha=Math.max(aimAlpha,.42);
  }else if(onset&&beat==='release'){
   alpha=Math.max(alpha,.19);aimAlpha=Math.max(aimAlpha,.24);
  }
  if(config.urgent&&beat==='warning'&&desired.fov>actual.fov){
   lensAlpha=1; // hazard cells gain frame immediately; subject fit is final guard
  }
  onset=false;
  const fov=clamp(actual.fov+(desired.fov-actual.fov)*lensAlpha,25,105);
  let targetPose={position:mix(actual.position,desired.position,alpha),
   aim:mix(actual.aim,desired.aim,aimAlpha),fov,beat,alpha};
  // Do not let the usual pleasant cinematic easing consume the entire
  // warning while its genuine outer danger tiles are still off-camera.
  // The specialist may advance the same transition (never a new subject)
  // only when a bounded partial movement measurably improves coverage.
  if(beat==='warning'&&warningState&&warningViewport&&threat?.refine){
   const guarded=threat.refine(warningState,actual,targetPose,desired,warningViewport);
   if(guarded){
    if(guarded.changed)targetPose={...targetPose,
     position:guarded.pose.position,aim:guarded.pose.aim,fov:guarded.pose.fov};
    lastThreat=Object.freeze({...lastThreat,
     transition:Object.freeze({reason:guarded.reason,changed:guarded.changed,
      fraction:guarded.fraction,requiredFov:guarded.coverage?.requiredFov,
      covered:guarded.coverage?.covered})});
   }
  }
  return Object.freeze(targetPose);
 }
 function metrics(){
  return Object.freeze({scene,beat,frames,modeChanges,urgentTurns,resets,orbits,
   physicalAccepted,manualEntries,threatChecks,threatImprovements,threatCapped,lastThreat,
   collision:Object.freeze({checks:collisionChecks,corrected:collisionCorrections,
    held:collisionHolds,lastMode:lastCollisionMode})});
 }
 return Object.freeze({begin,selectPhysical,frameThreat,protectWorld,transition,reset,metrics});
}
