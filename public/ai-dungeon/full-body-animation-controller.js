/**
 * AI Dungeon source-rig animation arbiter.
 *
 * This is a read-only presentation controller. A state is derived exclusively
 * from the existing public unit, actual rendered travel and witnessed damage /
 * evasion beats. It NEVER creates an attack, a target, a grid step or a hit.
 *
 * Ownership (high -> low):
 *   defeat > verified injury > witnessed evasion > authored one-shot >
 *   guard > travelled locomotion > idle.
 *
 * The existing imported AnimationMixer remains the base pose. All secondary
 * quaternion deltas are reversed before its next update; the arbiter decides
 * which secondary performance can touch that base pose in the current frame.
 * Source-rig bone names/retargeting are an adapter contract, not modified here.
 */
const ACTIONS=new Set(['idle','move','attack','cast','hurt','guard']);
const ONESHOTS=new Set(['attack','cast','hurt']);
const finite=Number.isFinite;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const safeAge=(n,max=5)=>finite(n)?clamp(n,0,max):0;
const MODES=Object.freeze(['idle','move','guard','cast','attack','evade','hurt','defeat']);
export const FULL_BODY_ANIMATION_MODES=MODES;

export function auditImportedAnimationClips(clips=[]){
 const entries=[],names=new Set(),rootMotionTracks=[];
 let invalidClips=0,invalidTracks=0;
 if(!Array.isArray(clips))return Object.freeze({clips:[],invalidClips:1,invalidTracks:0,rootMotionTracks:[]});
 for(const clip of clips.slice(0,80)){
  if(!clip||typeof clip.name!=='string'||!finite(clip.duration)||clip.duration<0||
   !Array.isArray(clip.tracks)){invalidClips++;continue}
  const name=clip.name.slice(0,96);
  let rotation=0,translation=0,scale=0;
  for(const track of clip.tracks.slice(0,1500)){
   if(typeof track?.name!=='string'){invalidTracks++;continue}
   const path=track.name;
   if(path.endsWith('.quaternion'))rotation++;
   else if(path.endsWith('.position'))translation++;
   else if(path.endsWith('.scale'))scale++;
   if(/(?:^|[/.:])(?:root|armature|scene|master)\.position$/i.test(path))
    rootMotionTracks.push((name+':'+path).slice(0,160));
  }
  if(names.has(name))invalidClips++;
  names.add(name);
  entries.push(Object.freeze({name,duration:Number(clip.duration.toFixed(3)),
   tracks:clip.tracks.length,rotation,translation,scale}));
 }
 return Object.freeze({clips:entries,invalidClips,invalidTracks,
  rootMotionTracks:rootMotionTracks.slice(0,24)});
}

/** Classify a real visual frame without relying on wall-clock time. */
export function advanceFullBodyController(previous=null,{
 unit={},grounded=null,damageBeat=null,evasionBeat=null,
 actionAge=0,frameDelta=0,reducedMotion=false
}={}){
 const raw=unit?.action;
 const authorityAction=ACTIONS.has(raw)?raw:'idle';
 const actionTick=Number.isSafeInteger(unit?.actionTick)&&unit.actionTick>=0?unit.actionTick:null;
 const alive=!(finite(unit?.hp)&&unit.hp<=0);
 const injury=alive&&damageBeat&&damageBeat.id===unit.id&&damageBeat.kind===unit.kind&&
  finite(damageBeat.damage)&&damageBeat.damage>0&&
  finite(damageBeat.maxHp)&&damageBeat.maxHp>0&&
  finite(damageBeat.age)&&damageBeat.age>=0&&damageBeat.age<.55&&!damageBeat.fatal;
 const evasion=alive&&!injury&&evasionBeat&&evasionBeat.id===unit.id&&
  evasionBeat.kind===unit.kind&&Number.isSafeInteger(evasionBeat.tick)&&
  Number.isInteger(evasionBeat.dx)&&Number.isInteger(evasionBeat.dz)&&
  Math.abs(evasionBeat.dx)+Math.abs(evasionBeat.dz)===1&&
  finite(evasionBeat.age)&&evasionBeat.age>=0&&evasionBeat.age<.58;
 // Never animate a "move" that has no actual rendered displacement.
 const walking=alive&&grounded?.moving===true&&grounded?.clipAction==='move'&&
  !reducedMotion;
 const mode=!alive?'defeat':injury?'hurt':evasion?'evade':
  authorityAction==='attack'?'attack':authorityAction==='cast'?'cast':
  authorityAction==='hurt'?'idle':authorityAction==='guard'?'guard':
  walking?'move':'idle';
 const clipAction=mode==='evade'||mode==='defeat'?'idle':mode;
 const beatAge=mode==='hurt'&&injury?damageBeat.age:
  mode==='evade'?evasionBeat.age:safeAge(actionAge);
 const age=safeAge(beatAge);
 const same=previous?.mode===mode;
 const tickChanged=ONESHOTS.has(mode)&&previous?.actionTick!==actionTick;
 const beatRestart=same&&(mode==='evade'||(mode==='hurt'&&injury))&&
  finite(previous?.age)&&age+.025<previous.age;
 const changed=!same||tickChanged||Boolean(beatRestart);
 const restarted=same&&Boolean(tickChanged||beatRestart);
 const interrupted=Boolean(previous&&ONESHOTS.has(previous.mode)&&
  (previous.mode!==mode||tickChanged||beatRestart));
 const transition=changed?0:clamp((finite(previous?.transition)?previous.transition:0)+
  (finite(frameDelta)?clamp(frameDelta,0,.05):0),0,1);
 // This is a pose-ownership mask, NOT weights accumulated by several systems.
 const owner=Object.freeze({
  locomotion:mode==='move',
  duel:mode==='attack',
  cast:mode==='cast',
  guard:mode==='guard',
  evasion:mode==='evade',
  injury:mode==='hurt'&&Boolean(injury),
  defeat:mode==='defeat',
  support:mode==='move'||mode==='attack'||mode==='guard',
  // The real Warden warning is a genuine separate authority-backed telegraph.
  warning:alive&&!['hurt','evade'].includes(mode)
 });
 const phase=mode==='attack'?age<.12?'anticipation':age<.28?'contact':age<.62?'recovery':'settled':
  mode==='cast'?age<.16?'anticipation':age<.48?'release':'recovery':
  mode==='hurt'?age<.12?'impact':'recovery':
  mode==='evade'?age<.16?'departure':'recovery':
  mode==='defeat'?'down':mode==='move'?'stride':mode;
 return Object.freeze({mode,phase,age,actionTick,authorityAction,clipAction,
  changed,restarted,interrupted,transition,owner,reducedMotion:Boolean(reducedMotion)});
}

/**
 * Conservative planted-foot constraint over real cloned thigh/calf/foot joints.
 * This is bounded ankle counter-rotation, not fabricated root translation and
 * not a claim of three-dimensional ground-contact IK. It counteracts stance
 * drift while the REAL distance-paced stride is moving the actor.
 */
const NEUTRAL_LEGS=Object.freeze({
 left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})
});
export function planConstrainedFootSupport(phase=0,weight=0,{
 moving=false,teleport=false,reducedMotion=false
}={}){
 if(!moving||teleport||reducedMotion||!finite(phase)||!finite(weight)||
  weight<=0)return NEUTRAL_LEGS;
 const w=clamp(weight,0,1),wave=Math.sin(phase);
 const left=clamp(-wave,0,1)*w,right=clamp(wave,0,1)*w;
 // Damped counter-rotation prevents the loaded foot from being driven
 // through its visual support by a hip-led side-to-side gait. The original
 // heel and toe meshes remain children of the SAME imported foot joint.
 return {
  left:{upper:-.011*left,lower:.034*left,foot:-.062*left},
  right:{upper:-.011*right,lower:.034*right,foot:-.062*right}
 };
}
