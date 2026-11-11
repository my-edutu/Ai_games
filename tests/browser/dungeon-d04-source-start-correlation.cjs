'use strict';
/**
 * Evidence-only join between actual post-WebGL admission receipts and
 * ORIGINAL WebAudio source.start() history. These clocks have DIFFERENT
 * origins: never derive audible onset, decoded PTS, blade contact or attacker.
 * No gameplay, scene, renderer, audio node or buffer is changed.
 */
const MAX_RECEIPTS=64,MAX_STARTS=32;
const EVENT_RECIPE=Object.freeze({
 damage:'impact','damage-fatal':'fatal-impact',swing:'whoosh',
 guard:'guard',block:'block',evade:'evade',
 'ranged-release':'ranged-release','spell-release':'spell-release',
 'warden-release':'warden-release',opening:'recovery',
 counter:'counter',interrupt:'interrupt',defeat:'defeat'
});
const validScene=s=>typeof s==='string'&&/^(?:0|[1-9]\d*):[1-9]\d*$/.test(s)&&s.length<=128;
const validId=s=>typeof s==='string'&&s.length>0&&s.length<=256;
const validTick=t=>Number.isSafeInteger(t)&&t>=0;
const validFrame=f=>(Number.isSafeInteger(f)&&f>=0)||
 (typeof f==='string'&&f.length>0&&f.length<=128);
function countById(xs){
 const counts=new Map();
 for(const x of xs)if(validId(x?.cueId))
  counts.set(x.cueId,(counts.get(x.cueId)??0)+1);
 return counts;
}
function delivered(r){
 return validId(r?.cueId)&&validScene(r?.scene)&&validTick(r?.tick)&&
  typeof r?.kind==='string'&&r.kind.length>0&&r.audio===true&&
  r.decision==='delivered'&&validFrame(r.frameId);
}
function started(s){
 return validId(s?.cueId)&&validScene(s?.sceneKey)&&validTick(s?.tick)&&
  typeof s?.kind==='string'&&s.kind.length>0&&
  typeof s?.audio==='string'&&s.audio.length>0&&s.audio.length<=64&&
  Number.isFinite(s.scheduledContextMs)&&s.scheduledContextMs>=0&&
  Number.isSafeInteger(s.startedSources)&&s.startedSources>=1&&s.startedSources<=8;
}
function correlates(r,s){
 if(!delivered(r)||!started(s)||r.cueId!==s.cueId||
  r.scene!==s.sceneKey||r.tick!==s.tick||r.kind!==s.kind)return false;
 const expected=EVENT_RECIPE[r.kind];
 if(!expected||s.audio!==expected)return false;
 // Strict original production verifies authoritative swing/HP-cue identity.
 if(['swing','damage','damage-fatal'].includes(r.kind)&&
  s.verifiedCanonicalCue!==true)return false;
 return true;
}
function correlateD04OriginalSourceStarts({receipts=[],sourceStarts=[]}={}){
 // Controller receipt and original source-start rings are bounded at source.
 // Truncation or malformed data must not conceal duplicated IDs.
 if(!Array.isArray(receipts)||!Array.isArray(sourceStarts)||
  receipts.length>MAX_RECEIPTS||sourceStarts.length>MAX_STARTS)
  return {classification:'SOURCE_STARTS_UNVERIFIED',matches:[],
   unmatchedDeliveredReceiptCount:0,rejectedSourceStartCount:0,
   sampleSynchronized:false,reason:'invalid-or-over-budget-source-history'};
 const admitted=receipts.filter(delivered);
 const receiptCounts=countById(receipts),sourceCounts=countById(sourceStarts);
 const byId=new Map(admitted.map(r=>[r.cueId,r]));
 const matches=[];
 for(const s of sourceStarts){
  const r=byId.get(s?.cueId);
  if(r&&receiptCounts.get(s.cueId)===1&&sourceCounts.get(s.cueId)===1&&
   correlates(r,s))matches.push(Object.freeze({
    cueId:s.cueId,kind:s.kind,sceneKey:s.sceneKey,tick:s.tick,
    audio:s.audio,frameId:r.frameId,scheduledContextMs:s.scheduledContextMs,
    startedSources:s.startedSources,
    verifiedCanonicalCue:s.verifiedCanonicalCue===true,sampleSynchronized:false
   }));
 }
 return {
  classification:matches.length?'MATCHED_SOURCE_STARTS_UNALIGNED':'SOURCE_STARTS_UNVERIFIED',
  matches,unmatchedDeliveredReceiptCount:admitted.length-matches.length,
  rejectedSourceStartCount:sourceStarts.length-matches.length,
  sampleSynchronized:false,
  limitations:'source.start is scheduling, not decoded PCM; frame acknowledgment is not decoded video PTS'
 };
}
module.exports={correlateD04OriginalSourceStarts};
