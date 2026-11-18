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

/**
 * Actual lightweight native requestAnimationFrame delivery witness.
 * Counts ONLY consecutive real renderer indices for the SAME imported
 * Walking_A actor, clip, tick and still-visible original source clone.
 * Never infer WebGL fps from a MediaRecorder 24fps request or duplicate
 * milestone-held WebM packets, and never call this a foot-plant or native
 * motion-quality certification. The recording harness supplies real
 * rAF callback timestamps without expensive per-rAF skinned-sole scans.
 */
function summarizeOriginalSourceRafCadence(observations,expectedTick,actorId){
 const empty=()=>({source:'original-GLB-browser-rAF-callbacks',
  comparablePairs:0,rejectedPairs:0,medianFrameGapMs:null,
  p95FrameGapMs:null,observedCallbackFps:null,nativeMotionVerified:false});
 if(!Array.isArray(observations)||observations.length>256||
  !Number.isSafeInteger(expectedTick)||expectedTick<0||
  typeof actorId!=='string'||actorId.length===0)return empty();
 const intervals=[];
 let rejectedPairs=0;
 for(let i=1;i<observations.length;i++){
  const a=observations[i-1],b=observations[i];
  if(!a||!b||!Number.isSafeInteger(a.frame)||
   !Number.isSafeInteger(b.frame)||b.frame!==a.frame+1||
   a.tick!==expectedTick||b.tick!==expectedTick||
   a.actorId!==actorId||b.actorId!==actorId||
   typeof a.sourceInstanceId!=='string'||!a.sourceInstanceId||
   a.sourceInstanceId!==b.sourceInstanceId||
   a.sourceClipName!=='Walking_A'||b.sourceClipName!=='Walking_A'||
   a.visible!==true||b.visible!==true||
   !Number.isFinite(a.timeMs)||!Number.isFinite(b.timeMs)||
   b.timeMs<=a.timeMs||b.timeMs-a.timeMs>10000){
   rejectedPairs++;
   continue;
  }
  intervals.push(b.timeMs-a.timeMs);
 }
 if(!intervals.length)return {...empty(),rejectedPairs};
 const ascending=intervals.slice().sort((a,b)=>a-b);
 const percentile=p=>ascending[Math.max(0,Math.ceil(ascending.length*p)-1)];
 const mean=intervals.reduce((sum,n)=>sum+n,0)/intervals.length;
 return {source:'original-GLB-browser-rAF-callbacks',
  comparablePairs:intervals.length,rejectedPairs,
  medianFrameGapMs:Number(percentile(.5).toFixed(3)),
  p95FrameGapMs:Number(percentile(.95).toFixed(3)),
  observedCallbackFps:Number((1000/mean).toFixed(2)),
  nativeMotionVerified:false};
}

module.exports={pairOriginalSourceFrames,summarizeOriginalSourceRafCadence};
