'use strict';
/** Test-only: preserve proof of consecutive renderer frames, not a foot plant. */
function pairOriginalSourceFrames(observations,expectedTick,expectedActorId){
 const pairs=[];const rejected={};
 const reject=reason=>{rejected[reason]=(rejected[reason]||0)+1;};
 if(!Array.isArray(observations)||!Number.isSafeInteger(expectedTick)||expectedTick<0||
   typeof expectedActorId!=='string'||!expectedActorId){
  return {pairs,rejected:{'invalid-input':1}};
 }
 for(let i=1;i<observations.length;i++){
  const before=observations[i-1],after=observations[i];
  if(!Number.isSafeInteger(before?.frame)||!Number.isSafeInteger(after?.frame)||
   after.frame!==before.frame+1){reject('nonconsecutive-render-frame');continue;}
  if(before.tick!==expectedTick||after.tick!==expectedTick){reject('different-authority-tick');continue;}
  if(before.visible!==true||after.visible!==true){reject('not-visible');continue;}
  const a=before.actor,b=after.actor;
  if(!a||!b||a.id!==expectedActorId||b.id!==expectedActorId||
   !a.sourceInstanceId||a.sourceInstanceId!==b.sourceInstanceId||
   a.kind!==b.kind){reject('different-original-source-rig');continue;}
  if(a.mode!=='move'||b.mode!=='move'){reject('not-witnessed-source-walk');continue;}
  pairs.push({before:a,after:b,beforeFrame:before.frame,afterFrame:after.frame,
   beforeTick:before.tick,afterTick:after.tick,visible:true});
 }
 return {pairs,rejected};
}
module.exports={pairOriginalSourceFrames};
