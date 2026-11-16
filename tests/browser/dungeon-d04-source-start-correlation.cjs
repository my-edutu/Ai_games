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
 counter:'counter',interrupt:'interrupt',defeat:'defeat',
 'boss-warning-final':'boss-warning-final',
 'boss-warning-rising':'boss-warning-rising',
 'boss-warning':'boss-warning','threat-warning':'threat-warning',
 'cast-utility':'utility','cast-unmatched':'cast-dry',
 'ranged-unmatched':'draw'
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
/**
 * Evidence-only audit of the genuine D04 browser's bounded impact receipts.
 * Timings are monotonically sampled CPU intervals (milliseconds). They are
 * NOT decoded WebM presentation timestamps, original PCM sample onsets, proof
 * of blade contact, or proof that D04 caused renderer stalls. This module
 * does not affect the gameplay controller or its 400ms deadline.
 */
function auditD04ImpactFramePhases({receipts=[]}={}){
 const reject=reason=>Object.freeze({
  classification:'IMPACT_PHASE_AUDIT_UNVERIFIED',damageReceipts:[],
  sampleSynchronized:false,reason});
 if(!Array.isArray(receipts)||receipts.length>MAX_RECEIPTS)
  return reject('invalid-or-over-budget-receipt-history');
 const damage=receipts.filter(r=>r?.kind==='damage'||r?.kind==='damage-fatal');
 const seen=new Set();
 for(const r of damage){
  if(!validId(r.cueId)||!validScene(r.scene)||!validTick(r.tick)||
   seen.has(r.cueId))return reject('missing-or-duplicated-damage-identity');
  seen.add(r.cueId);
 }
 const number=n=>Number.isFinite(n)&&n>=0;
 const within=(a,b,tolerance=2)=>Math.abs(a-b)<=tolerance;
 const audited=damage.map(r=>{
  const age=r.observationToSubmissionMs;
  const timingVerified=validFrame(r.frameId)&&
   number(r.observedClockMs)&&number(r.submittedClockMs)&&
   number(age)&&r.submittedClockMs>=r.observedClockMs&&
   within(r.submittedClockMs-r.observedClockMs,age);
  const before=r.beforeVisualAdvanceMs,retained=r.visualAdvanceMs,
   emission=r.visualEmissionMs,after=r.afterVisualAdvanceToSubmissionMs,
   render=r.renderSubmissionMs;
  // Keep the CPU timeline independent of the *visual* success decision.
  // Genuine Chrome had a 308ms damage receipt with complete phase clocks but
  // no confirmed drawable shard: discarding its timings hid the next
  // bottleneck, while accepting it as a visible impact would invent pixels.
  const cpuPhasesVerified=timingVerified&&
   [before,retained,emission,after,render].every(number)&&
   within(before+retained+emission+after,age,3)&&
   render<=after+2;
  const late=number(age)&&age>400;
  const stale=cpuPhasesVerified&&late&&r.decision==='stale-frame'&&r.audio===false;
  // The last condition is a frame receipt, not decoded-pixel or audible
  // sample evidence; original browser acceptance remains independent.
  const timely=cpuPhasesVerified&&!late&&r.decision==='delivered'&&
   r.visual===true&&r.audio===true&&
   r.visualDrawableAtSubmission===true;
  let dominantPhase='UNVERIFIED';
  if(cpuPhasesVerified){
   if(!late)dominantPhase='NO_DOMINANT_STALL_MEASURED';
   else if(render>=400&&render>=age*.5)
    dominantPhase='RENDERER_CALL_INTERVAL';
   else if(retained+emission>=400&&retained+emission>=age*.5)
    dominantPhase='D04_VISUAL_CPU_INTERVAL';
   else dominantPhase='OTHER_OR_MIXED_CPU_INTERVAL';
  }
  // These are bounded, noncausal CPU partitions only. A missing frame is
  // distinct from an expired impact, a cancelled effect, or absent pixels.
  const failureReason=!validFrame(r.frameId)?'NO_SUBMITTED_FRAME_RECEIPT':
   !timingVerified?'UNTRUSTED_RECEIPT_CLOCKS':
   !cpuPhasesVerified?'UNRECONCILED_CPU_PHASES':
   stale?'STALE_RENDER_DEADLINE':
   late?'LATE_OR_CONTRADICTED_SUBMISSION':
   r.decision==='delivered'&&r.visualDrawableAtSubmission!==true?
    'NO_DRAWABLE_HP_EFFECT':
   timely?'FRAME_RECEIPT_ONLY':'NO_VALID_VISUAL_AUDIO_ADMISSION';
  return Object.freeze({
   cueId:r.cueId,kind:r.kind,scene:r.scene,tick:r.tick,frameId:r.frameId??null,
   status:stale?'STALE_NOT_ACCEPTED':
    timely?'TIMELY_FRAME_RECEIPT_ONLY':'UNVERIFIED',
   failureReason,dominantPhase,
   observationToSubmissionMs:number(age)?age:null,
   renderSubmissionMs:cpuPhasesVerified?render:null,
   rendererSharePct:cpuPhasesVerified&&age>0?Math.round(render/age*100):null,
   d04VisualCpuMs:cpuPhasesVerified?retained+emission:null,
   nonRendererCpuMs:cpuPhasesVerified?Math.max(0,age-retained-emission):null,
   otherCpuMs:cpuPhasesVerified?Math.max(0,before+after-render):null,
   visualSubmissionVerified:timely,
   audibleImpactVerified:false,
   sampleSynchronized:false
  });
 });
 return Object.freeze({
  classification:audited.length&&audited.every(r=>r.dominantPhase!=='UNVERIFIED')?
   'MEASURED_HP_FRAME_RECEIPTS_UNALIGNED':'IMPACT_PHASE_AUDIT_PARTIAL_UNVERIFIED',
  damageReceipts:audited,sampleSynchronized:false,
  limitations:'Genuine post-WebGL CPU receipts, not decoded video PTS or original PCM; intervals do not prove GPU completion or causal attribution'
 });
}
module.exports={correlateD04OriginalSourceStarts,auditD04ImpactFramePhases};
