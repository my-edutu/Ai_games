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
const ONE_SHOT_RECOVERY=Object.freeze({attack:.62,cast:.64,hurt:.55});
const finite=Number.isFinite;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const safeAge=(n,max=5)=>finite(n)?clamp(n,0,max):0;
const MODES=Object.freeze(['idle','move','guard','cast','attack','evade','hurt','defeat']);
export const FULL_BODY_ANIMATION_MODES=MODES;

/**
 * Actual pinned TacticalSlash rigs contain both a horizontal melee clip
 * and a distinct 41-joint two-handed ranged release. Selecting the generic
 * first "attack" clip for a Ranger wrongly performs sword-body mechanics.
 * This is presentation-only and does not authorize an arrow or a hit.
 */
const SOURCE_CLIP_PREFERENCES=Object.freeze({
 idle:[/\bidle\b/i,/idle/i,/stand/i],
 move:[/run/i,/walk/i,/move/i],
 attack:[/attack/i,/melee/i,/slash/i,/shoot/i],
 cast:[/cast/i,/spell/i,/magic/i,/attack/i],
 hurt:[/hit/i,/hurt/i,/damage/i,/impact/i],
 defeat:[/^death(?:[_\s-]|$)/i],
 guard:[/block/i,/shield/i,/defend/i,/idle/i]
});
const RANGER_SOURCE_RELEASE=/(?:ranged|bow|archer)[_\s-]*(?:shoot|attack|release)/i;
export function chooseImportedSourceClip(available=[],action='idle',kind=''){
 if(!Array.isArray(available))return null;
 if(action==='defeat')return available.find(c=>typeof c?.name==='string'&&SOURCE_CLIP_PREFERENCES.defeat[0].test(c.name))||null;
 if(kind==='ranger'&&action==='attack'){
  const ranged=available.find(clip=>typeof clip?.name==='string'&&
   RANGER_SOURCE_RELEASE.test(clip.name));
  if(ranged)return ranged;
 }
 const prefer=SOURCE_CLIP_PREFERENCES[action]||SOURCE_CLIP_PREFERENCES.idle;
 for(const regex of prefer){
  const found=available.find(clip=>typeof clip?.name==='string'&&regex.test(clip.name));
  if(found)return found;
 }
 return available.find(clip=>typeof clip?.name==='string'&&/idle/i.test(clip.name))||
  available[0]||null;
}


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
 unit={},grounded=null,damageBeat=null,evasionBeat=null,combatFacing=null,
 actionAge=0,frameDelta=0,frameInterval=frameDelta,visible=true,reducedMotion=false,teleport=false
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
 const walking=alive&&!teleport&&grounded?.moving===true&&grounded?.clipAction==='move'&&
  !reducedMotion;
 const requestedAge=safeAge(actionAge);
 // A genuine visual teleport cancels the old source attack/cast even if its
 // action label persists. Keep that tick quarantined until a NEW lawful tick,
 // or the first landed frame can replay a displaced swing or casting gesture.
 const teleportSuppressedTick=teleport?actionTick:
  previous?.teleportSuppressedTick===actionTick?actionTick:null;
 // An actual HP-loss reaction or legal one-cell evasion interrupts the
 // original sword/spell one-shot. The surviving public action label cannot
 // restart that imported clip after Hit_A or dodge; only a NEW source tick
 // may authorize a new attack/cast. No damage or movement is synthesized.
 const interruptionSuppressedTick=(injury||evasion)&&
  ['attack','cast'].includes(authorityAction)&&actionTick!==null?actionTick:
  Number.isSafeInteger(previous?.interruptionSuppressedTick)&&
   previous.interruptionSuppressedTick===actionTick?actionTick:null;
 const sourceOneShotSuppressed=Boolean(teleport||(
  Number.isSafeInteger(teleportSuppressedTick)&&teleportSuppressedTick===actionTick)||(
  Number.isSafeInteger(interruptionSuppressedTick)&&interruptionSuppressedTick===actionTick));
 const requestedOneShot=!sourceOneShotSuppressed&&
  Object.hasOwn(ONE_SHOT_RECOVERY,authorityAction)&&
  authorityAction!=='hurt'&&requestedAge<ONE_SHOT_RECOVERY[authorityAction];
 // Each fixed authoritative tick resets the unit action and actionTick, but
 // an imported sword/spell one-shot lasts longer than the 350ms server tick.
 // Preserve only RECOVERY of a previously witnessed event, and only during
 // one subsequent idle tick with no new walking, hit, evade or guard. A skipped
 // tick, new combat event or defeat must not resurrect stale visual damage.
 const priorOneShot=previous?.mode==='attack'||previous?.mode==='cast'?
  previous.mode:null;
 const delta=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 const eligibleHold=Boolean(alive&&!teleport&&!injury&&!evasion&&!reducedMotion&&
  authorityAction==='idle'&&!walking&&priorOneShot&&
  Number.isSafeInteger(previous?.actionTick)&&Number.isSafeInteger(actionTick)&&
  actionTick>=previous.actionTick&&actionTick-previous.actionTick<=1&&
  finite(previous.age)&&previous.age>=0);
 const heldStep=planFullBodyVisibleFrameStep({mode:priorOneShot??'idle',
  frameDelta,frameInterval,reducedMotion,visible});
 const inheritedAge=eligibleHold?Math.min(5,previous.age+heldStep):0;
 const holding=Boolean(eligibleHold&&inheritedAge<ONE_SHOT_RECOVERY[priorOneShot]);
 const mode=!alive?'defeat':injury?'hurt':evasion?'evade':
  requestedOneShot?authorityAction:holding?priorOneShot:
  authorityAction==='guard'?'guard':walking?'move':'idle';
 // The renderer may hold one witnessed positive-HP-loss beat while the
 // authoritative heartbeat advances actionTick on every 350ms snapshot.
 // Source Hit_A belongs to the HP-drop EVENT, not the unrelated current
 // public tick: otherwise its skeleton and weapon snap back to impact.
 // A subsequent genuine HP drop carries a new eventTick and may restart.
 const damageEventTick=injury&&Number.isSafeInteger(damageBeat?.eventTick)&&
  damageBeat.eventTick>=0?damageBeat.eventTick:null;
 const visualActionTick=holding?previous.actionTick:
  mode==='hurt'&&damageEventTick!==null?damageEventTick:actionTick;
 const clipAction=mode==='evade'?'idle':mode;
 const beatAge=mode==='hurt'&&injury?damageBeat.age:
  mode==='evade'?evasionBeat.age:holding?inheritedAge:requestedAge;
 const age=safeAge(beatAge);
 const same=previous?.mode===mode;
 const tickChanged=ONESHOTS.has(mode)&&previous?.actionTick!==visualActionTick;
 const beatRestart=same&&(mode==='evade'||(mode==='hurt'&&injury))&&
  finite(previous?.age)&&age+.025<previous.age;
 const changed=!same||tickChanged||Boolean(beatRestart);
 const restarted=same&&Boolean(tickChanged||beatRestart);
 const completed=Boolean(previous&&ONESHOTS.has(previous.mode)&&mode==='idle'&&
  (previous.age>=(ONE_SHOT_RECOVERY[previous.mode]??.55)-.05||
   (authorityAction===previous.mode&&requestedAge>=(ONE_SHOT_RECOVERY[previous.mode]??.55))));
 const interrupted=Boolean(previous&&ONESHOTS.has(previous.mode)&&!completed&&
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
 // This is a pose-only latch from a real, validated combat-facing result
 // and the SAME explicit authority target. It permits a finishing planted
 // stance when the next idle tick erases targetId. It never schedules a hit,
 // adds a damage cue, or selects a different nearby enemy.
 const confirmedAtSource=mode==='attack'&&!holding&&authorityAction==='attack'&&
  Number.isSafeInteger(actionTick)&&typeof unit?.targetId==='string'&&
  unit.targetId.trim().length>0&&unit.targetId.length<=96&&
  combatFacing?.targetId===unit.targetId&&combatFacing?.distance===1&&
  finite(combatFacing?.yaw)?
  Object.freeze({targetId:unit.targetId,distance:1,actionTick}):null;
 const confirmedContact=holding&&previous?.confirmedContact?.actionTick===visualActionTick?
  previous.confirmedContact:confirmedAtSource;
 // Keep the original Ranger's witnessed aim only while the SAME legitimate
 // 2H_Ranged_Shoot recovers through one idle authority tick. That tick has
 // already erased targetId; dropping the source aim there otherwise strips
 // its pelvis, planted legs, spine and weapon-supporting arms in mid-release.
 // Pose-only: this value is never an attack, hit, target selection or event.
 const rangedAtSource=unit?.kind==='ranger'&&mode==='attack'&&!holding&&
  authorityAction==='attack'&&Number.isSafeInteger(actionTick)&&
  typeof unit?.id==='string'&&unit.id.length>0&&unit.id.length<=96&&
  typeof unit?.targetId==='string'&&unit.targetId.trim().length>0&&
  unit.targetId.length<=96&&combatFacing?.targetId===unit.targetId&&
  Number.isInteger(combatFacing?.distance)&&combatFacing.distance>=1&&
  combatFacing.distance<=4&&finite(combatFacing?.yaw)?
  Object.freeze({actorId:unit.id,targetId:unit.targetId,
   distance:combatFacing.distance,actionTick}):null;
 const witnessedRangedAim=holding&&unit?.kind==='ranger'&&
  previous?.witnessedRangedAim?.actorId===unit?.id&&
  previous.witnessedRangedAim.actionTick===visualActionTick?
  previous.witnessedRangedAim:rangedAtSource;
 const phase=mode==='attack'?age<.12?'anticipation':age<.28?'contact':age<.62?'recovery':'settled':
  mode==='cast'?age<.16?'anticipation':age<.48?'release':'recovery':
  mode==='hurt'?age<.12?'impact':'recovery':
  mode==='evade'?age<.16?'departure':'recovery':
  mode==='defeat'?'down':mode==='move'?'stride':mode;
 return Object.freeze({mode,phase,age,actionTick:visualActionTick,authorityAction,clipAction,
  holding,completed,confirmedContact,witnessedRangedAim,changed,restarted,interrupted,transition,owner,
  teleportSuppressedTick,interruptionSuppressedTick,reducedMotion:Boolean(reducedMotion)});
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
  left:left>0?{upper:-.011*left,lower:.034*left,foot:-.062*left}:NEUTRAL_LEGS.left,
  right:right>0?{upper:-.011*right,lower:.034*right,foot:-.062*right}:NEUTRAL_LEGS.right
 };
}

/**
 * A source GLB death is a terminal one-shot, not a new attack on each server
 * heartbeat. DungeonRuntime legally increments every unit's actionTick even
 * after HP reaches zero, so using the general one-shot tick rule would reset
 * Death_A every 350 ms instead of letting its original 0.792 s pose settle.
 * Only a true living->defeated source-action transition starts/restarts death.
 * A genuine revival changes the source action away from defeat first.
 */
export function shouldRestartImportedOneShot(action,previousAction,previousTick,nextTick,forceRestart=false){
 if(!['attack','cast','hurt','defeat'].includes(action))return false;
 if(action==='defeat')return previousAction!=='defeat';
 return previousTick!==nextTick||Boolean(forceRestart);
}

/**
 * Place only a newly witnessed lawful original one-shot at its exact event
 * age. Never scrub an already running mixer clip with this entry function;
 * uninterrupted recovery is owned by the monotonic forward-only planner.
 */
export function planImportedOneShotEntry({mode='idle',age=0,sourceDuration=0,
 effectiveSpeed=1,legalTransition=false,reducedMotion=false}={}){
 if(!legalTransition||reducedMotion||!Object.hasOwn(ONE_SHOT_RECOVERY,mode)||
  ![age,sourceDuration,effectiveSpeed].every(Number.isFinite)||
  age<0||age>=ONE_SHOT_RECOVERY[mode]||sourceDuration<=.002||
  effectiveSpeed<=.001)return null;
 return Math.min(Math.max(0,sourceDuration-.002),age*effectiveSpeed);
}

/**
 * The original 0.792s Death_A must not require 16 frames to finish when a
 * software WebGL capture yields only one visible frame per second.
 * Cap catch-up to 280ms to keep 3 distinct sampled native joint poses.
 * All nonterminal actions keep their former 50ms/frame behaviour.
 */
/**
 * A single bounded visible clock for authentic attack/cast source and overlay.
 * This cannot invent an event, move an authority actor or accelerate a hidden
 * scene. Keep distinct anticipatory poses despite sparse WebGL frame delivery.
 */
export function planFullBodyVisibleFrameStep({mode='idle',frameDelta=0,
 frameInterval=frameDelta,reducedMotion=false,visible=true}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(reducedMotion||visible!==true||!['attack','cast'].includes(mode)||
  !finite(frameInterval)||frameInterval<0)return ordinary;
 return Math.max(ordinary,Math.min(.28,frameInterval));
}

/**
 * Apply the actual imported-rig attack/cast visual step once. The generic
 * action-age function re-clamps its delta to 50ms, undoing this clock's
 * bounded slow-frame correction. Injury and accessibility retain 50ms.
 */
export function advanceFullBodyVisibleActionAge(elapsed,options={}){
 const prior=finite(elapsed)?clamp(elapsed,0,5):0;
 return Math.min(5,prior+planFullBodyVisibleFrameStep(options));
}

/**
 * Advance the original GLB only toward the SAME witnessed visual event age.
 * On a delayed first sample preserve original anticipation; on later samples
 * catch up in bounded steps. The source clock never moves backwards.
 */
export function planImportedLivingSourceStep({mode='idle',age=0,sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,frameInterval=frameDelta,
 reducedMotion=false,visible=true,groundedTravel=0,groundedMoving=false,
 walkingClip=false,teleport=false}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 // Authentic Walking_A has a 41-joint foot cycle but sparse WebGL delivery
 // previously advanced its imported clip by 50ms while the actual actor root
 // and its witnessed footfall travelled up to 0.54m. Share the real distance
 // clock with original source locomotion; never create an authority move.
 if(mode==='move'){
  if(reducedMotion||visible!==true||teleport||groundedMoving!==true||
   walkingClip!==true||
   ![sourceDuration,effectiveSpeed,sourceTime,frameInterval,groundedTravel].every(finite)||
   sourceDuration<=.002||effectiveSpeed<=.001||sourceTime<0||
   frameInterval<=0||groundedTravel>.54)return ordinary;
  // Base source gait time on the SAME real root travel at 60Hz and slow capture.
  // Fixed-frame playback at ordinary rates previously lagged a fast-moving
  // root and oversped a creeping actor relative to its real footfall phase.
  // Two 0.53m footfall intervals approximate one original Walking_A cycle;
  // this is bounded cadence calibration, not verified sole-contact IK.
  // A valid moving owner can spend several real WebGL frames with its root
  // planted between server snapshots. Original Walking_A must not cycle its
  // imported feet while that measured root travel is exactly zero. Sub-3mm
  // genuine movement likewise advances only its tiny witnessed distance,
  // rather than falling back to a 16/50ms wall-clock step. The visible ground
  // stamp and leg stride already use this same root-distance clock.
  // Never seek backwards or fabricate movement, contact or footsteps.
  return clamp(groundedTravel/1.06*sourceDuration/effectiveSpeed,0,.28);
 }
 // Authentic Hit_A cannot outrun the age of a witnessed positive HP loss.
 // This prevents source wrist/spine recoil preceding the owned injury pose.
 // Never seek a still-playing source clip backwards or create another hit.
 if(mode==='hurt'&&!reducedMotion&&visible===true&&
  [age,sourceTime,sourceDuration,effectiveSpeed].every(finite)&&
  age>=0&&sourceTime>=0&&sourceDuration>.002&&effectiveSpeed>.001){
  const target=Math.min(sourceDuration-.002,age*effectiveSpeed);
  return Math.min(ordinary,Math.max(0,(target-sourceTime)/effectiveSpeed));
 }
 if(reducedMotion||visible!==true||!['attack','cast'].includes(mode)||
  ![age,sourceTime,sourceDuration,effectiveSpeed,frameInterval].every(finite)||
  age<0||sourceTime<0||sourceDuration<=.002||effectiveSpeed<=.001||
  frameInterval<0)return ordinary;
 const ceiling=Math.max(0,sourceDuration-.002);
 const deficit=Math.max(0,Math.min(ceiling/effectiveSpeed,age)-sourceTime/effectiveSpeed);
 // The first legitimate pose still shows anticipation; subsequent samples
 // move the licensed mixer only as far as the SAME full-body owner clock.
 // Adding an unconditional extra 50ms used to put wrist, weapon and soles
 // one sampled frame AHEAD of the owning pelvis/shoulder performance.
 if(age===0&&sourceTime===0)return ordinary;
 return Math.min(.28,frameInterval,deficit);
}


/**
 * Native Walking_A is distance-paced, while Three.js mixer fades must be
 * elapsed-time-paced. A single mixer.update(distanceStep) would incorrectly
 * drag out the old idle pose on creeping movement, and prematurely finish a
 * crossfade on large valid steps. The renderer may temporarily time-scale
 * only the active original walk action around mixer.update(visibleDelta).
 * Returning null preserves the existing clock for every other action.
 */
export function planImportedWalkingBlendRate({mode='idle',sourceStep=0,
 frameDelta=0,frameInterval=frameDelta,sourceDuration=0,sourceTime=0,
 effectiveSpeed=1,walkingClip=false,groundedMoving=false,groundedTravel=0,
 teleport=false,reducedMotion=false,visible=true}={}){
 const visibleStep=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(mode!=='move'||!walkingClip||!groundedMoving||teleport||reducedMotion||
  visible!==true||visibleStep<=0||
  ![sourceStep,frameInterval,sourceDuration,sourceTime,effectiveSpeed,groundedTravel].every(finite)||
  sourceStep<0||sourceStep>.28||frameInterval<=0||
  sourceDuration<=.002||sourceTime<0||effectiveSpeed<=.001||
  groundedTravel<0||groundedTravel>.54)return null;
 return sourceStep/visibleStep;
}

/**
 * Rejoin the original Walking_A keyframes on the same real left/right planted
 * foot as the distance-paced original-world ground stamps and joint overlays.
 * The mixer will advance this rendered frame's distance ONCE after re-entry.
 * No continuous seeking, assumed sole geometry or invented movement.
 */
/**
 * A long *genuine* root step may need more than the permitted 280ms of native
 * Walking_A playback. If the source clip was in phase before that step, the
 * cap leaves its ankles behind the already-advanced real grounded footfall.
 * Align only the missed fraction within this SAME displayed travel frame.
 * Never wind the native feet forward on planted/hidden/teleported frames.
 *
 * This is bounded source-clip retiming, NOT IK or evidence of sole contact.
 * Reject source/foot phases that were already unrelated rather than seeking
 * arbitrary animation frames. The existing mixer still evaluates once.
 */
export function planImportedWalkingContinuity({mode='idle',continuous=false,
 sourceTime=0,sourceDuration=0,effectiveSpeed=1,sourceStep=0,
 groundedTravel=NaN,footPhase=NaN,groundedMoving=false,walkingClip=false,
 frameInterval=0,visible=true,teleport=false,reducedMotion=false}={}){
 if(mode!=='move'||continuous!==true||!groundedMoving||!walkingClip||
  teleport||reducedMotion||visible!==true||
  ![sourceTime,sourceDuration,effectiveSpeed,sourceStep,groundedTravel,footPhase,frameInterval].every(finite)||
  sourceDuration<=.002||sourceDuration>10||sourceTime<0||sourceTime>sourceDuration+.002||
  effectiveSpeed<=.001||sourceStep<0||sourceStep>.28||frameInterval<=0||
  groundedTravel<=.003||groundedTravel>.54||footPhase<0||footPhase>1)return null;
 const needed=groundedTravel/1.06*sourceDuration/effectiveSpeed;
 // A normal 60Hz step already reached the stamped native phase. Only a
 // genuinely capped movement frame is allowed to seek a source skeleton.
 if(needed-sourceStep<=.02||Math.abs(sourceStep-.28)>.00001)return null;
 const cycle=x=>((x%1)+1)%1;
 const priorExpected=cycle(footPhase-groundedTravel/1.06);
 const priorActual=cycle(sourceTime/sourceDuration);
 const cyclicError=Math.min(Math.abs(priorExpected-priorActual),
  1-Math.abs(priorExpected-priorActual));
 if(cyclicError>.025)return null;
 const projected=cycle((sourceTime+sourceStep*effectiveSpeed)/sourceDuration);
 const missing=cycle(footPhase-projected);
 const expectedMissing=(needed-sourceStep)*effectiveSpeed/sourceDuration;
 // Reject a phase wrap that would reverse or skip too much source animation.
 // A legal .53m movement at original speed 1.25 needs only .164 of a cycle.
 if(missing<.018||missing>.20||Math.abs(missing-expectedMissing)>.025)return null;
 const start=cycle(sourceTime/sourceDuration+missing)*sourceDuration;
 return Number.isFinite(start)?start:null;
}

export function planImportedWalkingEntryPhase({mode='idle',previousMode='idle',
 sourceDuration=0,effectiveSpeed=1,frameDelta=.016,frameInterval=frameDelta,
 visible=true,footPhase=NaN,groundedTravel=NaN,groundedMoving=false,
 walkingClip=false,teleport=false,reducedMotion=false}={}){
 if(mode!=='move'||previousMode==='move'||groundedMoving!==true||
  walkingClip!==true||teleport||reducedMotion||visible!==true||
  ![sourceDuration,effectiveSpeed,frameDelta,frameInterval,footPhase,groundedTravel].every(finite)||
  sourceDuration<=.002||sourceDuration>10||effectiveSpeed<=.001||
  frameDelta<=0||frameInterval<=0||
  footPhase<0||footPhase>1||groundedTravel<=.003||groundedTravel>.54)return null;
 // Three.js caps source travel to 280ms per visible frame. The earlier
 // walking-entry seek subtracted UNBOUNDED root distance from a stamped
 // footfall, then mixer.update() advanced only the capped source time.
 // On a legal .53m visible step this left source ankles as much as 16.4%
 // of the original cycle out of phase with real grounded leg overlays.
 // Use the EXACT step the source planner will apply this frame, including
 // clip speed, bound, visibility and teleport checks. No second mixer step,
 // fake footprint, root motion or joint alteration is introduced here.
 const step=planImportedLivingSourceStep({mode:'move',sourceTime:0,
  sourceDuration,effectiveSpeed,frameDelta,frameInterval,
  reducedMotion,visible,groundedTravel,groundedMoving,walkingClip,teleport});
 const sourceCycleAdvance=step*effectiveSpeed/sourceDuration;
 const previousPhase=footPhase-sourceCycleAdvance;
 // Floating-point subtraction of two exactly equal stride fractions must
 // not wrap zero to the last Walking_A keyframe.
 const phase=Math.abs(previousPhase)<1e-10?0:((previousPhase%1+1)%1);
 return phase*sourceDuration;
}

export function planImportedDeathSourceStep({mode='idle',sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,frameInterval=0,
 reducedMotion=false,visible=true}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(mode!=='defeat'||reducedMotion||visible!==true||
  ![sourceTime,sourceDuration,effectiveSpeed,frameInterval].every(finite)||
  sourceDuration<=0||sourceTime<0||effectiveSpeed<=.001||frameInterval<0)
  return ordinary;
 const remaining=Math.max(0,(sourceDuration-sourceTime)/effectiveSpeed);
 return Math.min(remaining,Math.max(ordinary,clamp(frameInterval,0,.28)));
}

/**
 * Imported skinned source clips and reversible native full-body overlays must
 * share one witnessed clock. Slow browser frames can advance mixer time by
 * only 50ms even while the real event has moved into recovery. This bounded
 * source-time correction cannot change a hit, target, authority tick or grip.
 * It may catch up to a witnessed action age, but must never scrub an
 * unbroken imported clip backwards: only a new legal action can reset it.
 */
export function planImportedOneShotPhase({mode='idle',actionTick=null,age=0,sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,reducedMotion=false}={}){
 const invalid=Object.freeze({valid:false,align:false,startTime:0,driftSeconds:0,remainingSeconds:0});
 if(reducedMotion||!['attack','cast','hurt'].includes(mode)||
  !Number.isSafeInteger(actionTick)||actionTick<0||
  ![age,sourceTime,sourceDuration,effectiveSpeed,frameDelta].every(Number.isFinite)||
  age<0||sourceTime<0||sourceDuration<=.002||effectiveSpeed<=.001||frameDelta<0)return invalid;
 const ceiling=Math.max(0,sourceDuration-.002);
 const step=Math.min(.28,frameDelta),advance=step*effectiveSpeed;
 const target=Math.min(ceiling,age*effectiveSpeed);
 const projected=Math.min(ceiling,sourceTime+advance);
 const driftSeconds=(target-projected)/effectiveSpeed;
 // Rewinding an active mixer creates abrupt reverse wrist/weapon/foot poses.
 // New legal events already reset their clip in changeAction; ordinary
 // source-age drift may only advance an uninterrupted clip.
 // A phase seek and the mixer step share ONE total visible-frame budget:
 // neither may sneak a second 125ms jump past the 280ms source-pose cap.
 const spareBudget=Math.max(0,.28-step);
 const align=driftSeconds>.028&&spareBudget>0;
 const correctionSeconds=align?Math.min(.125,driftSeconds,spareBudget):0;
 const startTime=Math.max(0,Math.min(ceiling,sourceTime+correctionSeconds*effectiveSpeed));
 const remainingSeconds=(target-Math.min(ceiling,startTime+advance))/effectiveSpeed;
 return {valid:true,align,startTime,driftSeconds,remainingSeconds};
}
