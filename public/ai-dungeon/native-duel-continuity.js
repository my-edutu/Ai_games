/**
 * Presentation-only truthful continuation of the ORIGINAL source-skinned duel.
 * A 350ms authority action can return to idle before its imported 620ms attack
 * clip has visually recovered. This retains only a verified previous attack's
 * torso/arm/boot RECOVERY, never damage, new attack contact or victim selection.
 */
const ROLES=new Set(['vanguard','revenant','warden']);
const MAX_AGE=.62,RECOVERY_START=.355,MAX_STEP=.35;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function planNativeDuelContinuity(previous,unit,visualAge,frameSeconds,{
 reducedMotion=false,teleport=false,attached=true,targetId=null,distance=null
}={}){
 const off=Object.freeze({memory:null,mode:'rest',age:0,targetId:null,distance:null,contactAllowed:false});
 const kind=unit?.kind,action=unit?.action,tick=unit?.actionTick;
 if(!attached||reducedMotion||teleport||unit?.hp<=0||!ROLES.has(kind)||
  !Number.isSafeInteger(tick)||tick<0)return off;
 const live=action==='attack'&&typeof targetId==='string'&&targetId.trim()&&
  targetId.length<=96&&distance===1&&Number.isFinite(visualAge)&&visualAge>=0&&visualAge<MAX_AGE;
 if(live){
  const age=clamp(visualAge,0,MAX_AGE);
  const memory=Object.freeze({kind,actionTick:tick,sourceTargetId:targetId,age,recoveryWitness:false});
  return Object.freeze({memory,mode:'attack',age,targetId,distance:1,contactAllowed:true});
 }
 // Cast, hurt, guard, movement, a fresh strike, defeat, floor swap, and
 // reduced-motion immediately interrupt any previous source-body recovery.
 if(action!=='idle'||!previous||previous.kind!==kind||
  typeof previous.sourceTargetId!=='string'||previous.sourceTargetId.length>96||
  !Number.isSafeInteger(previous.actionTick)||previous.actionTick>tick||
  !Number.isFinite(previous.age)||previous.age<0||previous.age>=MAX_AGE)return off;
 const dt=Number.isFinite(frameSeconds)?clamp(frameSeconds,0,MAX_STEP):0;
 const advanced=Math.max(RECOVERY_START,previous.age+dt);
 // Severe software-frame stalls may jump from 350ms to >620ms in ONE RAF.
 // Allow at most ONE real rendered recovery stance; DO NOT replay a missed
 // hit frame, recycle attacker attribution, or loop a speculative cue.
 if(advanced>=MAX_AGE){
  if(previous.recoveryWitness)return off;
  const memory=Object.freeze({...previous,age:.49,recoveryWitness:true});
  return Object.freeze({memory,mode:'recovery',age:.49,
   targetId:previous.sourceTargetId,distance:1,contactAllowed:false});
 }
 const memory=Object.freeze({...previous,age:advanced,recoveryWitness:previous.recoveryWitness});
 return Object.freeze({memory,mode:'recovery',age:advanced,
  targetId:previous.sourceTargetId,distance:1,contactAllowed:false});
}

/**
 * Hold the ORIGINAL imported source attack clip only for a witnessed,
 * adjacent 350ms-authority -> idle RECOVERY. Without this gate, the renderer
 * cross-fades the 620ms sword clip to idle before its authored wrists,
 * torso and boots finish, even while a cosmetic recovery pose continues.
 *
 * This is presentation-only: it never schedules contact, damage or sound,
 * never holds a new simulation tick, and never keeps a dead/stale clip alive.
 */
export function shouldRetainNativeRecoveryClip(continuation,{
 authoritativeAction=null,currentAction=null,currentActionTick=null,
 activeClipRunning=false,reducedMotion=false,attached=true
}={}){
 const memory=continuation?.memory;
 return continuation?.mode==='recovery'&&continuation.contactAllowed===false&&
  authoritativeAction==='idle'&&currentAction==='attack'&&
  activeClipRunning===true&&attached===true&&!reducedMotion&&
  Number.isSafeInteger(memory?.actionTick)&&currentActionTick===memory.actionTick&&
  typeof memory.sourceTargetId==='string'&&memory.sourceTargetId.length>0&&
  Number.isFinite(continuation.age)&&continuation.age>=RECOVERY_START&&
  continuation.age<MAX_AGE;
}
