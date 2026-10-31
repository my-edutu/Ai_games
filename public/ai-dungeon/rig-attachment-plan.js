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
