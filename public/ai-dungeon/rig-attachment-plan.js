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
