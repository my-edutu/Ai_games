/**
 * Read-only, deterministic choreography for real adjacent physical attacks.
 * This never decides hits, damage, targets, movement or cooldowns. One
 * short-lived WebGL crescent follows the *already verified* public attack lane.
 * Grid coordinates are converted to world coordinates only by the renderer.
 */
export const MELEE_ARC_DURATION=.35;
const MELEE_KINDS=new Set(['vanguard','revenant','warden']);
const gridPoint=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z);

export function canStageMeleeArc(kind,action,source,target){
 return action==='attack'&&MELEE_KINDS.has(kind)&&gridPoint(source)&&gridPoint(target)&&
  Math.abs(target.x-source.x)+Math.abs(target.z-source.z)===1;
}

/** Cosmetic 3D pose; finite and bounded even under stalled rendered frames. */
export function planMeleeArcFrame(source,target,life,reducedMotion=false){
 if(!gridPoint(source)||!gridPoint(target)||!Number.isFinite(life)||
  Math.abs(target.x-source.x)+Math.abs(target.z-source.z)!==1)return null;
 const t=Math.max(0,Math.min(1,life/MELEE_ARC_DURATION));
 const smooth=t*t*(3-2*t);
 const travel=reducedMotion?.82:.24+.64*smooth;
 return {
  x:source.x+(target.x-source.x)*travel,
  z:source.z+(target.z-source.z)*travel,
  y:1.1+(reducedMotion?0:.16*Math.sin(Math.PI*t)),
  yaw:Math.atan2(source.z-target.z,target.x-source.x),
  roll:reducedMotion?-.12:-.30+.58*smooth,
  scale:reducedMotion?.68:.72+.12*Math.sin(Math.PI*t),
  opacity:(reducedMotion?.65:.86)*(1-.80*t)
 };
}

/**
 * Contact-focused presentation trajectory for a genuine one-cell attack.
 * A real, cell-bound animated wrist and target spine may guide the ribbon;
 * absent/stale bones fall back to the same valid public grid strike. The
 * blade is never proof of damage: only positive HP delta creates injury FX.
 * No authoritative time, hitbox, actor transform or action is changed.
 */
export function planBodyTrackedArcFrame(source,target,life,reducedMotion=false,{
 from=null,to=null,hand=null,chest=null
}={}){
 const pose=planMeleeArcFrame(source,target,life,reducedMotion);
 if(!pose)return null;
 const valid=(p,u,r,requiresY=false)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&
  Math.hypot(p.x-u.x,p.z-u.z)<=r&&(!requiresY||
   (Number.isFinite(p.y)&&p.y>=.34&&p.y<=3.10));
 const start=valid(from,source,.58)?from:source;
 const end=valid(to,target,.58)?to:target;
 const wrist=valid(hand,source,.84,true)?hand:null;
 const sternum=valid(chest,target,.72,true)?chest:null;
 const t=Math.max(0,Math.min(1,life/MELEE_ARC_DURATION));
 const ease=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)};
 const travel=reducedMotion?.82:.22+.66*ease(t);
 pose.x=start.x+(end.x-start.x)*travel;
 pose.z=start.z+(end.z-start.z)*travel;
 // Preserve a single quiet, non-moving readable stroke for reduced motion.
 if(reducedMotion){
  pose.y=1.13;pose.skinnedHand=false;pose.skinnedChest=false;
  pose.bodyContactWeight=0;return pose;
 }
 // Anticipation starts from the true moving native wrist. It fades out
 // before contact, avoiding a detached trail following a stale hand.
 const wristWeight=wrist?.73*(1-ease((t-.08)/.39)):0;
 if(wristWeight){
  pose.x+=(wrist.x-pose.x)*wristWeight;
  pose.z+=(wrist.z-pose.z)*wristWeight;
  pose.y+=(wrist.y-pose.y)*wristWeight;
 }
 // A bounded drawn-through impact closes on the target's moving chest
 // instead of sweeping past an empty tile. No strike is declared a hit.
 const land=ease((t-.22)/.34)*(1-ease((t-.68)/.23));
 const contactWeight=.88*land;
 const anchor=sternum??{x:end.x,y:target.kind==='warden'?1.55:1.16,z:end.z};
 pose.x+=(anchor.x-pose.x)*contactWeight;
 pose.z+=(anchor.z-pose.z)*contactWeight;
 pose.y+=(anchor.y-pose.y)*contactWeight;
 pose.yaw=Math.atan2(start.z-end.z,end.x-start.x);
 pose.scale*=1-.16*contactWeight;
 pose.skinnedHand=Boolean(wrist)&&wristWeight>.02;
 pose.skinnedChest=Boolean(sternum)&&contactWeight>.02;
 pose.bodyContactWeight=Number(contactWeight.toFixed(4));
 return pose;
}
