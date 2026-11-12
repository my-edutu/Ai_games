/**
 * Physical combat-camera continuity for the TRUE autonomous public snapshot.
 * This never holds a fictional attack, target, position, damage, or action.
 * Only the relative viewing orbit is eased for a still-living same-pair duel.
 * Real Warden/breach danger, last-stand, portal, new floor and new subjects
 * override every camera transition. All gameplay state remains authoritative.
 */
const CLIP=(n,a,b)=>Math.max(a,Math.min(b,n));
const IMMEDIATE=new Set(['warden-warning','breach-warning','last-stand','descent','portal-descent']);
const CONTACT=new Set(['contact','warden-contact','warden-counter','warden-exposed','warden-approach','skirmish-approach']);
// A true Warden warning ALWAYS takes the safe immediate wide overview.
// On actual strike and earned counter, blend only a continuous physical orbit.
// The current shot still owns every real subject, target, mode and danger tile.
const WARDEN_BEAT=new Set(['warden-warning','warden-release','warden-counter','warden-exposed']);
const WARDEN_FOLLOW=new Set(['warden-release','warden-counter','warden-exposed']);
const easeWardenOrbit=(a,b,t)=>{
 const oldRadius=Math.hypot(a[0],a[2]),newRadius=Math.hypot(b[0],b[2]);
 if(oldRadius<.01||newRadius<.01)return a.map((n,i)=>round(n+(b[i]-n)*t));
 const oldAngle=Math.atan2(a[2],a[0]),newAngle=Math.atan2(b[2],b[0]);
 const turn=Math.atan2(Math.sin(newAngle-oldAngle),Math.cos(newAngle-oldAngle));
 const angle=oldAngle+turn*t,radius=oldRadius+(newRadius-oldRadius)*t;
 return [round(Math.cos(angle)*radius),round(a[1]+(b[1]-a[1])*t),round(Math.sin(angle)*radius)];
};
const validShot=shot=>shot&&Array.isArray(shot.offsets)&&shot.offsets.length===3&&
 shot.offsets.every(Number.isFinite)&&Array.isArray(shot.subjects)&&
 shot.subjects.length>0&&shot.subjects.every(id=>typeof id==='string'&&id.length>0)&&
 Number.isFinite(shot.x)&&Number.isFinite(shot.z)&&typeof shot.mode==='string';
const snapshotKey=s=>Number.isSafeInteger(s?.run)&&Number.isSafeInteger(s?.floor)?s.run+':'+s.floor:null;
const round=n=>Number(n.toFixed(3));
export function createCombatShotContinuity(){
 let key=null,previous=null,holds=0,emergencies=0,resets=0,wardenBeatBlends=0,wardenBeatTransfers=0;
 let earnedExposureBridges=0,wardenAimBridges=0,maxWardenAimLag=0;
 function reset(){previous=null;key=null;resets++;}
 function resolve(s,shot,dt=0,{reducedMotion=false}={}){
  const currentKey=snapshotKey(s);
  if(!validShot(shot)||!currentKey){reset();return shot??null;}
  if(currentKey!==key){key=currentKey;previous=null;}
  const live=new Map((Array.isArray(s.units)?s.units:[]).filter(u=>u?.hp>0).map(u=>[u.id,u]));
  const safeSubjects=shot.subjects.every(id=>live.has(id))||shot.mode==='last-stand';
  if(!safeSubjects||reducedMotion){previous=shot;return shot;}
  if(IMMEDIATE.has(shot.mode)||s?.bossWarning){
   if(previous&&previous.mode!==shot.mode)emergencies++;
   previous=shot;return shot;
  }
  const prev=previous;
  const sameDuel=prev&&CONTACT.has(shot.mode)&&CONTACT.has(prev.mode)&&
   prev.subjects.length===2&&shot.subjects.length===2&&
   prev.subjects.every(id=>shot.subjects.includes(id))&&
   prev.subjects.every(id=>live.has(id))&&
   prev.subjects.every(id=>{
    const u=live.get(id);return Number.isInteger(u.x)&&Number.isInteger(u.z);
   });
  // Real 390px source films jump from ~33px figures in the 23-cell Warden
  // warning to >80px on strike and >120px at counter. Preserve current
  // authority, aim, focus and threat geometry while easing only orbit/height.
  // A new boss, dead combatant, floor, reduced motion or urgent warning cuts.
  const commonLivingBoss=prev&&prev.subjects.find(id=>
   shot.subjects.includes(id)&&live.get(id)?.kind==='warden'&&live.get(id)?.hp>0);
  // The real organic Warden counter is authored as "warden-exposed", not
  // "warden-counter". The old bridge stopped at that exact beat: authentic
  // 390px film jumped from a ~64px frontline on release to a different camera
  // and ~71px on exposure. Continue only while the SAME living Warden has a
  // genuinely active authoritative recovery. No invented counter or hit.
  const earnedExposure=shot.mode==='warden-exposed'&&
   Number.isSafeInteger(s?.bossRecovery?.remaining)&&s.bossRecovery.remaining>0;
  const sameWardenBeat=Boolean(commonLivingBoss&&!s?.bossWarning&&
   WARDEN_BEAT.has(prev.mode)&&WARDEN_FOLLOW.has(shot.mode)&&
   (shot.mode!=='warden-exposed'||earnedExposure)&&
   shot.subjects.every(id=>live.has(id)));
  if(!sameDuel&&!sameWardenBeat){previous=shot;return shot;}
  const step=CLIP(Number.isFinite(dt)?dt:0,0,.24);
  const alpha=1-Math.exp(-(sameWardenBeat?7.2:6)*step);
  const offsets=sameWardenBeat?
   easeWardenOrbit(prev.offsets,shot.offsets,alpha):
   prev.offsets.map((offset,i)=>round(offset+(shot.offsets[i]-offset)*alpha));
  if(sameWardenBeat&&offsets.some((n,i)=>Math.abs(n-shot.offsets[i])>.01)){
   wardenBeatBlends++;
   if(prev.mode!==shot.mode)wardenBeatTransfers++;
  }
  if(offsets.some((n,i)=>Math.abs(n-shot.offsets[i])>.01))holds++;
  // An orbit alone cannot hold a coherent shot if the selected live frontline
  // changes from Ranger to Vanguard at the actual earned counter. Bridge the
  // original authored aim as well, but within 0.9m of the CURRENT real scene
  // target. This lets the existing physical body/stone director veto unsafe
  // views and never drags the camera onto a departed or invented fighter.
  let x=shot.x,z=shot.z;
  if(sameWardenBeat){
   const dx=prev.x-shot.x,dz=prev.z-shot.z,dist=Math.hypot(dx,dz);
   if(dist>.01&&dist<=3.2){
    const remaining=Math.exp(-5.8*step),cap=Math.min(1,.9/(dist*remaining));
    x=round(shot.x+dx*remaining*cap);
    z=round(shot.z+dz*remaining*cap);
    const lag=Math.hypot(x-shot.x,z-shot.z);
    if(lag>.01){wardenAimBridges++;maxWardenAimLag=Math.max(maxWardenAimLag,lag);}
   }
   if(earnedExposure&&prev.mode!==shot.mode)earnedExposureBridges++;
  }
  const current=Object.freeze({...shot,x,z,offsets:Object.freeze(offsets)});
  previous=current;
  return current;
 }
 return Object.freeze({resolve,reset,metrics:()=>Object.freeze({holds,emergencies,resets,wardenBeatBlends,wardenBeatTransfers,earnedExposureBridges,wardenAimBridges,maxWardenAimLag:Number(maxWardenAimLag.toFixed(3)),mode:previous?.mode??'none'})});
}
