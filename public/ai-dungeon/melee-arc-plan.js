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
