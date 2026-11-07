/**
 * Read-only secondary animation for existing CC0 GLB dungeon characters.
 * A tiny local pivot sits OUTSIDE the imported skeleton, so its authored
 * AnimationMixer and foot normalization remain untouched. These values are
 * scene-space metres/radians, never movement/collision/authority coordinates.
 * Forward is local -Z in the dungeon presentation.
 */
const rest=()=>({x:0,y:0,z:0,pitch:0,roll:0});
const clamp01=x=>Math.min(1,Math.max(0,x));
const ease=x=>{const n=clamp01(x);return n*n*(3-2*n)};
const REACH=Object.freeze({vanguard:.145,ranger:.055,mystic:.075,revenant:.12,cultist:.06,warden:.13});

/**
 * Accumulate the authored one-shot's age in *rendered* frames, not elapsed
 * wall time. A slow software-WebGL/compositor frame must not consume a whole
 * strike before the camera can show it. Authority ticks and real actions
 * remain unchanged, and the presentation age cannot exceed five seconds.
 */
export function advancePresentationActionAge(elapsed,frameDelta){
 const current=Number.isFinite(elapsed)?Math.min(5,Math.max(0,elapsed)):0;
 const step=Number.isFinite(frameDelta)?Math.min(.05,Math.max(0,frameDelta)):0;
 return Math.min(5,current+step);
}

export function planAuthoredMotion(kind,action,elapsed=0,reducedMotion=false){
 if(reducedMotion)return rest();
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(60,elapsed)):0;
 if(action==='attack'){
  const reach=REACH[kind]??.10;
  // Anticipate; commit through the opponent; settle without positional drift.
  if(t<.12){const p=ease(t/.12);return{x:0,y:-.038*p,z:.048*p,pitch:.108*p,roll:0};}
  if(t<.28){const p=ease((t-.12)/.16);return{x:0,y:-.038+.028*p,z:.048-(.048+reach)*p,pitch:.108-.274*p,roll:0};}
  if(t<.58){const p=1-ease((t-.28)/.30);return{x:0,y:-.010*p,z:-reach*p,pitch:-.166*p,roll:0};}
  return rest();
 }
 if(action==='cast'){
  if(t>=.64)return rest();
  const p=Math.sin(Math.PI*t/.64);
  return{x:0,y:.082*p,z:-.019*p,pitch:-.065*p,roll:(kind==='cultist'?.045:-.035)*p};
 }
 if(action==='hurt'){
  if(t>=.38)return rest();
  const p=Math.sin(Math.PI*t/.38);
  const direction=kind==='vanguard'||kind==='mystic'||kind==='ranger'?-1:1;
  return{x:.025*direction*p,y:.014*p,z:.056*p,pitch:.052*p,roll:.157*direction*p};
 }
 if(action==='guard'){
  const p=ease(t/.17);
  return{x:0,y:-.046*p,z:.014*p,pitch:.088*p,roll:0};
 }
 if(action==='move')return{x:0,y:.024*Math.sin(t*11),z:0,pitch:-.035*ease(t/.15),roll:.018*Math.sin(t*5.5)};
 if(action==='idle')return{x:0,y:.007*Math.sin(t*2.2),z:0,pitch:0,roll:0};
 return rest();
}

/**
 * The existing animated GLB delivers an extra grounded torso weight-transfer
 * only when real public authority identifies an adjacent melee target. Local
 * pivot meters, reversible on recovery; never touches AI, hitboxes or RNG.
 */
const CONTACT_ROLES=Object.freeze({
 vanguard:Object.freeze({reach:.085,side:1,weight:1}),
 revenant:Object.freeze({reach:.072,side:-1,weight:.88}),
 warden:Object.freeze({reach:.062,side:0,weight:1.16})
});
const noContactPose=()=>({x:0,y:0,z:0,pitch:0,yaw:0,roll:0});
export function planContactBodyLanguage(kind,action,elapsed=0,contact={}){
 const profile=CONTACT_ROLES[kind];
 if(!profile||action!=='attack'||contact?.reducedMotion||
  typeof contact?.targetId!=='string'||contact.targetId.length<1||
  contact.targetId.length>128||contact.distance!==1||
  !Number.isFinite(elapsed)||elapsed<0||elapsed>=.62)return noContactPose();
 const t=elapsed,prepare=t<.14?ease(t/.14):t<.30?1-ease((t-.14)/.16):0;
 const follow=t<.14?0:t<.30?ease((t-.14)/.16):1-ease((t-.30)/.32);
 return {
  x:profile.side*(prepare*.018+follow*.052),
  y:-prepare*.018+follow*.014,
  z:prepare*.026-follow*profile.reach,
  pitch:prepare*.054-follow*.084*profile.weight,
  yaw:profile.side*follow*.105,
  roll:-profile.side*(prepare*.042-follow*.050)
 };
}
