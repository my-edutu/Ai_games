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
const validShot=shot=>shot&&Array.isArray(shot.offsets)&&shot.offsets.length===3&&
 shot.offsets.every(Number.isFinite)&&Array.isArray(shot.subjects)&&
 shot.subjects.length>0&&shot.subjects.every(id=>typeof id==='string'&&id.length>0)&&
 Number.isFinite(shot.x)&&Number.isFinite(shot.z)&&typeof shot.mode==='string';
const snapshotKey=s=>Number.isSafeInteger(s?.run)&&Number.isSafeInteger(s?.floor)?s.run+':'+s.floor:null;
const round=n=>Number(n.toFixed(3));
export function createCombatShotContinuity(){
 let key=null,previous=null,holds=0,emergencies=0,resets=0;
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
  if(!sameDuel){previous=shot;return shot;}
  // In the same physically real engagement, the camera's viewing SIDE is
  // not permitted to snap 180 degrees when attack becomes boss recovery.
  // Current state owns mode, centre, aim, subjects and all warning geometry.
  const step=CLIP(Number.isFinite(dt)?dt:0,0,.24);
  const alpha=1-Math.exp(-6*step);
  const offsets=prev.offsets.map((offset,i)=>round(offset+(shot.offsets[i]-offset)*alpha));
  if(offsets.some((n,i)=>Math.abs(n-shot.offsets[i])>.01))holds++;
  const current=Object.freeze({...shot,offsets:Object.freeze(offsets)});
  previous=current;
  return current;
 }
 return Object.freeze({resolve,reset,metrics:()=>Object.freeze({holds,emergencies,resets,mode:previous?.mode??'none'})});
}
