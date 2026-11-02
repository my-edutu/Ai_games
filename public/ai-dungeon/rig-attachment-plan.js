/**
 * Pure presentation-only selector for existing GLB hand bones and bounded
 * original weapon fittings. Never reads simulation state or external data.
 * A missing/ambiguous source rig simply retains the previous pivot accessory.
 */
const ROLE_WEAPONS=Object.freeze({
 ranger:Object.freeze(['flexed-back-bow','taut-bowstring']),
 mystic:Object.freeze(['staff-shaft','staff-crescent','staff-heart'])
});
const EMPTY=Object.freeze([]);
// The pinned CC0 GLB rigs have deliberately toy-sized heads. Reduce only the
// genuine cloned cranial joint, not the collision body or the source asset.
// Ratios are conservative so expressions, helmets and silhouettes stay legible.
const CRANIAL_RATIOS=Object.freeze({
 vanguard:.75,ranger:.73,mystic:.76,revenant:.71,cultist:.74,warden:.77
});
export function planCranialRatio(kind){
 return typeof kind==='string'&&Object.hasOwn(CRANIAL_RATIOS,kind)?CRANIAL_RATIOS[kind]:1;
}
// The imported AnimationMixer owns the unmodified bone scale. Each frame
// removes the previous cosmetic overlay BEFORE the mixer and reapplies it
// AFTERWARDS; clips with no scale channel therefore cannot accumulate drift.
export function restoreCranialProportion(mount){
 if(!mount?.applied)return false;
 const ratio=mount.ratio;
 if(!Number.isFinite(ratio)||ratio<=0)return false;
 mount.bone.scale.divideScalar(ratio);
 mount.applied=false;
 return true;
}
export function stageCranialProportion(mount){
 if(!mount||mount.applied)return false;
 const scale=mount.bone?.scale,ratio=mount.ratio;
 if(!Number.isFinite(ratio)||ratio<.70||ratio>1||
  ![scale?.x,scale?.y,scale?.z].every(Number.isFinite)||
  Math.min(scale.x,scale.y,scale.z)<=0||
  Math.max(scale.x,scale.y,scale.z)>100)return false;
 scale.multiplyScalar(ratio);
 mount.applied=true;
 return true;
}
export function selectCranialBone(bones){
 if(!Array.isArray(bones))return null;
 return bones.find(bone=>bone?.isBone&&typeof bone.name==='string'&&
  /^(?:head|mixamorighead|bip\d+head)$/i.test(bone.name.replace(/[\s._:-]/g,'')))||null;
}

// Original prop coordinates in the external normalized 1.82m visual pivot.
// Each marks the hand-contact point, not an actor position or collision point.
const GRIP_ANCHORS=Object.freeze({
 ranger:Object.freeze({x:.43,y:1.18,z:.37}),
 mystic:Object.freeze({x:.53,y:1.12,z:.39})
});
export function rigGripAnchor(kind){
 return typeof kind==='string'&&Object.hasOwn(GRIP_ANCHORS,kind)?GRIP_ANCHORS[kind]:null;
}
/** Return a safe world-space correction length, or null for bad/misaligned rigs. */
export function boundedGripOffset(dx,dy,dz,max=1.14){
 if(![dx,dy,dz,max].every(Number.isFinite)||max<=0||max>1.14)return null;
 // R28 real GLB inspection: current CC0 right-hand bones require 0.798m
 // (archer) and 1.054m (priest) correction from legacy pivot fittings.
 // Cap remains < normalized hero height; never snap an arbitrary distant rig.
 const distance=Math.hypot(dx,dy,dz);
 return Number.isFinite(distance)&&distance<=max?distance:null;
}
export function rigWeaponParts(kind){
 return typeof kind==='string'&&Object.hasOwn(ROLE_WEAPONS,kind)?ROLE_WEAPONS[kind]:EMPTY;
}
function scoreBone(bone,side){
 if(!bone?.isBone||typeof bone.name!=='string')return -1;
 const name=bone.name.toLowerCase().replace(/[^a-z0-9]/g,'');
 if(/thumb|index|middle|ring|pinky|pinkie|little|finger|tip|nub|end/.test(name))return -1;
 const hand=name.includes('hand'),wrist=name.includes('wrist');
 if(!hand&&!wrist)return -1;
 const right=/right/.test(name)||/(?:^|[0-9])r(?:hand|wrist)/.test(name)||/(?:hand|wrist)r$/.test(name);
 const left=/left/.test(name)||/(?:^|[0-9])l(?:hand|wrist)/.test(name)||/(?:hand|wrist)l$/.test(name);
 // Recognise names such as "Bip001 R Hand" and "Hand.R", including mixamorig.
 const original=bone.name.toLowerCase();
 const separatedRight=/(?:^|[\s._:-])r(?:[\s._:-]*)(?:hand|wrist)(?:$|[\s._:-])/.test(original);
 const separatedLeft=/(?:^|[\s._:-])l(?:[\s._:-]*)(?:hand|wrist)(?:$|[\s._:-])/.test(original);
 const isRight=right||separatedRight,isLeft=left||separatedLeft;
 if(isRight===isLeft||(side==='right'&&!isRight)||(side==='left'&&!isLeft))return -1;
 return (hand?100:10)-Math.min(name.length,50)*.01;
}
export function selectHandBone(bones,side='right'){
 if(!Array.isArray(bones)||!['right','left'].includes(side))return null;
 let best=null,high=-1;
 for(const bone of bones){
  const score=scoreBone(bone,side);
  if(score>high){high=score;best=bone;}
 }
 return best;
}

/**
 * Read-only, local additive upper-arm poses for cloned, licensed CC0 GLB rigs.
 * The original AnimationMixer remains the base motion. These tiny shoulder
 * offsets are reversible cosmetics (radians) rather than combat authority.
 */
function scoreUpperArmBone(bone,side){
 if(!bone?.isBone||typeof bone.name!=='string')return -1;
 const raw=bone.name.toLowerCase(),name=raw.replace(/[^a-z0-9]/g,'');
 if(!name.includes('arm')||/forearm|lowerarm|shoulder|clavicle|twist|roll|hand|finger|elbow/.test(name))return -1;
 const right=name.includes('right')||/(?:^|[0-9])r(?:upper)?arm/.test(name)||/(?:upper)?armr$/.test(name);
 const left=name.includes('left')||/(?:^|[0-9])l(?:upper)?arm/.test(name)||/(?:upper)?arml$/.test(name);
 if(right===left||(side==='right'&&!right)||(side==='left'&&!left))return -1;
 return (name.includes('upperarm')?120:100)-Math.min(50,name.length)*.01;
}
export function selectUpperArmBone(bones,side='right'){
 if(!Array.isArray(bones)||!['left','right'].includes(side))return null;
 let best=null,score=-1;
 for(const bone of bones){const next=scoreUpperArmBone(bone,side);if(next>score){best=bone;score=next;}}
 return best;
}
const ARM_REST=Object.freeze({
 left:Object.freeze({pitch:0,roll:0}),
 right:Object.freeze({pitch:0,roll:0})
});
const smooth=n=>{const x=Math.max(0,Math.min(1,n));return x*x*(3-2*x)};
export function planRigArmGesture(kind,action,elapsed=0,reducedMotion=false){
 if(reducedMotion)return ARM_REST;
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(5,elapsed)):0;
 if(action==='attack'&&t<.58){
  // Hold the blade for a readable wind-up, accelerate through contact, recover.
  const wave=t<.12?smooth(t/.12):t<.28?1-1.8*smooth((t-.12)/.16):-.8*(1-smooth((t-.28)/.30));
  const bow=kind==='ranger';
  return {
   left:{pitch:(bow?.17:.10)*wave,roll:.075*wave},
   right:{pitch:(bow?-.23:.29)*wave,roll:-.11*wave}
  };
 }
 if(action==='cast'&&t<.64){
  const wave=Math.sin(Math.PI*t/.64);
  return {
   left:{pitch:-.30*wave,roll:-.13*wave},
   right:{pitch:-.36*wave,roll:.13*wave}
  };
 }
 if(action==='hurt'&&t<.38){
  const wave=Math.sin(Math.PI*t/.38);
  return {
   left:{pitch:.08*wave,roll:.12*wave},
   right:{pitch:.13*wave,roll:-.16*wave}
  };
 }
 if(action==='guard'){
  const p=smooth(t/.17);
  return {left:{pitch:.21*p,roll:-.10*p},right:{pitch:.26*p,roll:.10*p}};
 }
 return ARM_REST;
}

/**
 * Match actual left/right lower-body joints on the cloned CC0 rigs.
 * Reject toes, twist helpers, opposite sides and unrelated limbs. Never
 * synthesize a joint or allow a display animation to alter gameplay.
 */
export function selectLegBone(bones,side='left',part='upper'){
 if(!Array.isArray(bones)||!['left','right'].includes(side)||!['upper','lower','foot'].includes(part))return null;
 let best=null,score=-1;
 for(const bone of bones){
  if(!bone?.isBone||typeof bone.name!=='string')continue;
  const raw=bone.name.toLowerCase(),name=raw.replace(/[^a-z0-9]/g,'');
  if(/toe|twist|roll|nub|end|helper|pole|finger|hand|arm|spine|pelvis|hip/.test(name))continue;
  const l=name.includes('left')||/(?:^|[\s._:-])l[\s._:-]*(?:up|upper|lower|leg|thigh|calf|shin|foot|ankle)/.test(raw)||/(?:leg|foot|thigh|calf|shin|ankle)l$/.test(name);
  const r=name.includes('right')||/(?:^|[\s._:-])r[\s._:-]*(?:up|upper|lower|leg|thigh|calf|shin|foot|ankle)/.test(raw)||/(?:leg|foot|thigh|calf|shin|ankle)r$/.test(name);
  if(l===r||(side==='left'&&!l)||(side==='right'&&!r))continue;
  const upper=/upleg|upperleg|thigh|femur/.test(name);
  const lower=/lowerleg|calf|shin|tibia/.test(name)||(!upper&&/leg$/.test(name));
  const foot=/foot|ankle/.test(name);
  if((part==='upper'&&!upper)||(part==='lower'&&!lower)||(part==='foot'&&!foot))continue;
  const n=(part==='upper'&&/upleg|upperleg/.test(name)?120:100)-name.length*.01;
  if(n>score){score=n;best=bone}
 }
 return best;
}

const TAU=Math.PI*2;
const clampWeight=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
/**
 * Distance-paced spectator gait. A slow software renderer cannot make an
 * otherwise stationary dungeon actor march in place. Teleports and corrupt
 * numerical inputs reset rather than generating unbounded joint rotation.
 */
export function advanceRigGait(phase=0,weight=0,travelMeters=0,reducedMotion=false){
 if(reducedMotion||!Number.isFinite(travelMeters)||travelMeters<0||travelMeters>.32)
  return {phase:0,weight:0};
 const p=Number.isFinite(phase)?((phase%TAU)+TAU)%TAU:0;
 const w=clampWeight(weight);
 if(travelMeters<=.0015)return {phase:p,weight:Math.max(0,w-.14)};
 return {phase:(p+Math.min(travelMeters,.24)*TAU/1.05)%TAU,weight:Math.min(1,w+.24)};
}
const LEG_REST=Object.freeze({
 left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})
});
/** Small mirrored thigh/knee/ankle arcs layered over the imported animation. */
export function planRigLegGesture(phase=0,weight=0,reducedMotion=false){
 if(reducedMotion)return LEG_REST;
 const p=Number.isFinite(phase)?((phase%TAU)+TAU)%TAU:0;
 const w=clampWeight(weight);
 if(w===0)return LEG_REST;
 const left=Math.sin(p)*w,right=-left;
 return {
  left:{upper:.235*left,lower:.165*Math.max(0,-left),foot:-.075*left},
  right:{upper:.235*right,lower:.165*Math.max(0,-right),foot:-.075*right}
 };
}


/**
 * Genuine imported elbow/forearm joints, separate from shoulder or hand
 * transforms. No new character rigs or collision-affecting coordinates.
 * A missing or ambiguously sided bone is deliberately left unchanged.
 */
export function selectForearmBone(bones,side='right'){
 if(!Array.isArray(bones)||!['right','left'].includes(side))return null;
 let best=null,score=-1;
 for(const bone of bones){
  if(!bone?.isBone||typeof bone.name!=='string')continue;
  const raw=bone.name.toLowerCase(),name=raw.replace(/[^a-z0-9]/g,'');
  if(!/forearm|lowerarm/.test(name)||/twist|roll|nub|end|helper|hand|finger|thumb|wrist/.test(name))continue;
  const right=name.includes('right')||/(?:forearm|lowerarm)r$/.test(name)||
   /(?:^|[\s._:-])r[\s._:-]*(?:forearm|lowerarm)(?:$|[\s._:-])/.test(raw);
  const left=name.includes('left')||/(?:forearm|lowerarm)l$/.test(name)||
   /(?:^|[\s._:-])l[\s._:-]*(?:forearm|lowerarm)(?:$|[\s._:-])/.test(raw);
  if(right===left||(side==='right'&&!right)||(side==='left'&&!left))continue;
  const value=(name.includes('forearm')?120:110)-Math.min(name.length,50)*.01;
  if(value>score){best=bone;score=value;}
 }
 return best;
}

const FOREARM_REST=Object.freeze({left:0,right:0});
/**
 * An original, bounded additive elbow gesture layered onto CC0 animation.
 * Wind-up bends the wrist toward the body, the attack extends through the
 * recorded action, then both joints return to the authored clip. Presentational
 * time is clamped; this does not determine hit registration or target choice.
 */
export function planRigForearmGesture(kind,action,elapsed=0,reducedMotion=false){
 if(reducedMotion)return FOREARM_REST;
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(5,elapsed)):0;
 if(action==='attack'&&t<.58){
  const wave=t<.12?smooth(t/.12):
   t<.28?1-1.65*smooth((t-.12)/.16):
   -.65*(1-smooth((t-.28)/.30));
  const ranger=kind==='ranger';
  return {left:(ranger?.36:.16)*wave,right:(ranger?.15:.40)*wave};
 }
 if(action==='cast'&&t<.64){
  const wave=Math.sin(Math.PI*t/.64);
  return {left:.29*wave,right:.34*wave};
 }
 if(action==='hurt'&&t<.38){
  const wave=Math.sin(Math.PI*t/.38);
  return {left:-.11*wave,right:.17*wave};
 }
 if(action==='guard'){
  const weight=smooth(t/.17);
  return {left:.30*weight,right:.38*weight};
 }
 return FOREARM_REST;
}

/**
 * Truth-gated melee weight transfer on actual imported thigh/knee/ankle bones.
 * Only an adjacent, wall-cleared public contact from planCombatFacing can
 * authorize a visibly braced strike. This never moves feet in the simulation,
 * extends hit reach, selects victims, or perturbs seeded replay.
 */
const CONTACT_BRACE_REST=Object.freeze({
 left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})
});
export function planRigContactBrace(kind,action,elapsed=0,contactDistance=null,reducedMotion=false){
 if(reducedMotion||action!=='attack'||contactDistance!==1||
    !['vanguard','revenant','warden'].includes(kind)||!Number.isFinite(elapsed)||elapsed<0||elapsed>=.58)
  return CONTACT_BRACE_REST;
 // The rear leg receives the weight on wind-up, then extends into contact
 // as the leading knee flexes and the ankle counter-rotates.
 const prepare=elapsed<.12?smooth(elapsed/.12):
  elapsed<.20?1-smooth((elapsed-.12)/.08):0;
 const drive=elapsed<=.14?0:elapsed<.28?smooth((elapsed-.14)/.14):
  1-smooth((elapsed-.28)/.30);
 return {
  left:{
   upper:-.13*prepare+.16*drive,
   lower:.12*prepare+.075*drive,
   foot:-.095*prepare-.07*drive
  },
  right:{
   upper:.095*prepare-.145*drive,
   lower:.06*prepare+.05*drive,
   foot:-.075*prepare+.098*drive
  }
 };
}


/**
 * Real skinned-rig follow-through at a validated adjacent melee contact.
 * Each pose affects only the visual chest and weapon wrist. It cannot alter
 * the authoritative attack, victim, reach, physics, path or replay checksum.
 */
const MELEE_STAGING_REST=Object.freeze({
 spine:Object.freeze({pitch:0,yaw:0,roll:0}),
 wrist:Object.freeze({pitch:0,yaw:0,roll:0})
});
const MELEE_STAGING_WEIGHT=Object.freeze({vanguard:1,revenant:.79,warden:1.06});
export function selectCombatTorsoBone(bones){
 if(!Array.isArray(bones))return null;
 let found=null,highest=0;
 for(const bone of bones){
  if(!bone?.isBone||typeof bone.name!=='string')continue;
  const name=bone.name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!/(spine|chest|torso)/.test(name)||/(twist|helper|nub|end|neck|head|pelvis|hip|arm|leg)/.test(name))continue;
  const score=/upperchest/.test(name)?170:
   /spine(?:2|02|002)/.test(name)?160:
   /chest/.test(name)?150:
   /spine(?:1|01|001)/.test(name)?130:105;
  if(score>highest){found=bone;highest=score;}
 }
 return found;
}
export function planRigMeleeFollowThrough(kind,action,elapsed=0,contactDistance=null,targetId=null,reducedMotion=false){
 const weight=Object.hasOwn(MELEE_STAGING_WEIGHT,kind)?MELEE_STAGING_WEIGHT[kind]:0;
 if(reducedMotion||!weight||action!=='attack'||contactDistance!==1||
  typeof targetId!=='string'||targetId.trim().length<1||targetId.length>96||
  !Number.isFinite(elapsed)||elapsed<0||elapsed>=.58)return MELEE_STAGING_REST;
 const prepare=elapsed<.12?smooth(elapsed/.12):
  elapsed<.18?1-smooth((elapsed-.12)/.06):0;
 const drive=elapsed<=.13?0:
  elapsed<.26?smooth((elapsed-.13)/.13):
  1-smooth((elapsed-.26)/.32);
 // Contact crosses the target facing only after the visible wind-up.
 // Shoulder/elbow clips remain owned by their imported AnimationMixer.
 return {
  spine:{
   pitch:weight*(.09*prepare-.105*drive),
   yaw:weight*(-.225*prepare+.29*drive),
   roll:weight*(.065*prepare+.10*drive)
  },
  wrist:{
   pitch:weight*(-.25*prepare+.315*drive),
   yaw:weight*(.11*prepare-.13*drive),
   roll:weight*(.10*prepare+.18*drive)
  }
 };
}
