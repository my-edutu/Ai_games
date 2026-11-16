'use strict';
/**
 * D04: honest read-only classification of genuine Dungeon post-WebGL receipt
 * diagnostics. A DRAWABLE receipt is a retained-pool / submission witness,
 * NOT independently decoded pixels; original source.start() is scheduling
 * evidence, NOT a measured Opus/PCM onset or physical contact.
 *
 * This file cannot emit effects, play audio, mutate authority or extend the
 * original 400ms admission deadline. The authentic browser spec supplies data
 * from the actual opt-in Dungeon session; unit fixtures are synthetic.
 */
const MAX_DAMAGE_RECEIPT_INSPECTION=64;
const MAX_ORIGINAL_SOURCE_START_INSPECTION=32;
const MAX_RECEIPT_AGE_MS=400;
const canonicalId=/^(\d+):([1-9]\d*):(\d+):(damage|damage-fatal):-:([^:]+)$/;

function validReceipt(r){
 if(!r||r.kind!=='damage'&&r.kind!=='damage-fatal'||
  typeof r.cueId!=='string'||r.cueId.length>256)return false;
 const m=canonicalId.exec(r.cueId);
 if(!m||!Number.isSafeInteger(Number(m[1]))||
  !Number.isSafeInteger(Number(m[2]))||
  !Number.isSafeInteger(Number(m[3]))||
  typeof r.scene!=='string'||r.scene!==m[1]+':'+m[2]||
  r.tick!==Number(m[3])||r.kind!==m[4])return false;
 return true;
}
function frameReceiptIsTimelyDrawable(r){
 if(r.visual!==true||r.visualDrawableAtSubmission!==true||
  r.decision!=='delivered'||r.audio!==true||
  !(Number.isSafeInteger(r.frameId)&&r.frameId>=0||
    typeof r.frameId==='string'&&r.frameId.length>0&&r.frameId.length<=128))return false;
 const start=r.observedClockMs,end=r.submittedClockMs,
  reported=r.observationToSubmissionMs;
 return Number.isFinite(start)&&start>=0&&
  Number.isFinite(end)&&end>=start&&
  Number.isFinite(reported)&&reported>=0&&
  end-start<=MAX_RECEIPT_AGE_MS&&
  Math.abs(end-start-reported)<=2;
}
function canonicalOriginalStartMatch(r,start){
 if(!start||start.cueId!==r.cueId||
  start.sceneKey!==r.scene||start.tick!==r.tick||start.kind!==r.kind||
  start.audio!==(r.kind==='damage-fatal'?'fatal-impact':'impact')||
  start.verifiedCanonicalCue!==true||
  !Number.isSafeInteger(start.startedSources)||start.startedSources<1||
  start.startedSources>5||
  !Number.isFinite(start.scheduledContextMs)||
  start.scheduledContextMs<0)return false;
 return true;
}
function auditD04ImpactSubmissionWitnesses({
 receipts=[],sourceStarts=[]
}={}){
 // Only bounded, immutable report values. Invalid and duplicated identifiers
 // are never promoted into visual evidence or an original-source witness.
 const recent=Array.isArray(receipts)?receipts.slice(-MAX_DAMAGE_RECEIPT_INSPECTION):[];
 const starts=Array.isArray(sourceStarts)?
  sourceStarts.slice(-MAX_ORIGINAL_SOURCE_START_INSPECTION):[];
 const seen=new Set(),duplicates=new Set();
 for(const r of recent)if(validReceipt(r)){
  if(seen.has(r.cueId))duplicates.add(r.cueId);
  seen.add(r.cueId);
 }
 const cases=[];let timelyDrawableReceipts=0,originalSourceStartMatches=0,
  staleOrUnsubmittedReceipts=0,invalidOrDuplicateReceipts=0;
 for(const r of recent){
  if(!validReceipt(r)){invalidOrDuplicateReceipts++;continue}
  if(duplicates.has(r.cueId)){
   invalidOrDuplicateReceipts++;continue;
  }
  const drawable=frameReceiptIsTimelyDrawable(r);
  const sourceCount=drawable?starts.filter(start=>canonicalOriginalStartMatch(r,start)).length:0;
  // Any duplicate source.start record leaves attribution unverified. A cue
  // identity join does not calibrate AudioContext time to PCM or video PTS.
  const correlated=drawable&&sourceCount===1;
  if(drawable)timelyDrawableReceipts++;
  else staleOrUnsubmittedReceipts++;
  if(correlated)originalSourceStartMatches++;
  cases.push(Object.freeze({
   cueId:r.cueId,scene:r.scene,tick:r.tick,kind:r.kind,
   frameId:drawable?r.frameId:null,
   visualDrawableAtSubmission:drawable,
   soundStartScheduled:correlated,
   status:correlated?'DRAWABLE_SUBMITTED_AUDIO_START_ONLY':
    drawable?'DRAWABLE_SUBMITTED_SOURCE_UNVERIFIED':'STALE_OR_UNSUBMITTED',
   sampleSynchronized:false
  }));
 }
 return Object.freeze({
  status:originalSourceStartMatches>0?'FRAME_RECEIPT_IMPACT_PRESENT_AUDIO_UNALIGNED':
   timelyDrawableReceipts>0?'FRAME_RECEIPT_IMPACT_PRESENT_AUDIO_UNVERIFIED':
   'NO_TIMELY_DRAWABLE_IMPACT',
  source:'read-only-D04-post-WebGL-receipts-and-original-source-starts',
  hpReceipts:cases.length,timelyDrawableReceipts,
  originalSourceStartMatches,staleOrUnsubmittedReceipts,
  invalidOrDuplicateReceipts,
  maxReceipts:MAX_DAMAGE_RECEIPT_INSPECTION,
  maxSourceStarts:MAX_ORIGINAL_SOURCE_START_INSPECTION,
  cases,
  pixelMotionVerified:false,audibleImpactVerified:false,
  sampleSynchronized:false,
  limitation:'A genuine renderer receipt and an original source.start event are neither encoded visible contact nor independently decoded audible PCM onset'
 });
}
module.exports={auditD04ImpactSubmissionWitnesses};
