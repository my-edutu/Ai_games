'use strict';
// Read-only D04 real-browser evidence classifier. This module must never grant
// combat damage or pretend MediaRecorder timestamps/audio are synchronized.
// A WebGL submission receipt is not a visual hit, and a stale effect is not
// recoverable by stretching its audio deadline.
const validCount=value=>Number.isSafeInteger(value)&&value>=0;
function actualDamageVictimCount(before,after){
 if(!before||!after||!validCount(before.run)||!validCount(after.run)||
  !validCount(before.floor)||!validCount(after.floor)||
  !validCount(before.tick)||!validCount(after.tick)||
  before.run!==after.run||before.floor!==after.floor||
  after.tick!==before.tick+1||
  !Array.isArray(before.units)||!Array.isArray(after.units))return null;
 const old=new Map();
 for(const unit of before.units){
  if(typeof unit?.id!=='string'||!unit.id||!Number.isFinite(unit.hp)||
   unit.hp<0||old.has(unit.id))return null;
  old.set(unit.id,unit.hp);
 }
 const seen=new Set();let victims=0;
 for(const unit of after.units){
  if(typeof unit?.id!=='string'||!unit.id||!Number.isFinite(unit.hp)||
   unit.hp<0||seen.has(unit.id))return null;
  seen.add(unit.id);
  const previous=old.get(unit.id);
  if(previous!==undefined&&previous>unit.hp)victims++;
 }
 return victims>0?victims:null;
}
function classifyAuthenticD04RenderObservation({before,after,atDamage,latest}={}){
 const verdict=(status,extra={})=>({
  status,authoritativeDamage:false,damageVictims:0,visualAcceptance:false,
  sampleSynchronized:false,...extra
 });
 const victims=actualDamageVictimCount(before,after);
 if(victims===null)return verdict('INVALID_AUTHORITY_PAIR');
 const during=atDamage?.renderedState;
 const expectedScene=after.run+':'+after.floor;
 if(!during||during.run!==after.run||during.floor!==after.floor||
  during.tick!==after.tick||typeof after.checksum!=='string'||
  after.checksum.length===0||during.checksum!==after.checksum||
  atDamage?.physicalFeedback?.scene!==expectedScene)
  return verdict('INVALID_RENDERED_DAMAGE_WITNESS');
 // Cumulative presentation counters may survive a new run or be sampled
 // after a floor transition. Do not borrow another encounter's successful
 // VFX admission to certify this specific authenticated combat scene.
 const latestState=latest?.renderedState;
 if(!latestState||latestState.run!==after.run||
  latestState.floor!==after.floor||
  !validCount(latestState.tick)||latestState.tick<after.tick||
  latest?.physicalFeedback?.scene!==expectedScene)
  return verdict('INVALID_LATEST_RENDERED_SCENE');
 const frame=latest.physicalFeedback;
 const counts=['queued','visualAccepted','expiredQueuedCues','framesAcknowledged','adapterFailures'];
 if(!frame||counts.some(key=>!validCount(frame[key]))||
  frame.expiredQueuedCues>frame.queued||
  frame.visualAccepted>frame.queued||
  frame.visualAccepted+frame.expiredQueuedCues>frame.queued)
  return verdict('INVALID_BROWSER_COUNTERS');
 // The previous classifier counted ANY admitted cue after HP loss as a
 // successful impact. In genuine Chrome evidence the original tick-4 damage
 // expired, while an unrelated later visual was admitted. Only the exact
 // anonymous injury cue for each actual HP-loss target can satisfy this gate.
 // Do not attribute an attacker, infer blade contact, or equate frame
 // admission with decoded moving video/audio sample synchronization.
 const priorHp=new Map(before.units.map(unit=>[unit.id,unit.hp]));
 const targetIds=after.units.filter(unit=>priorHp.has(unit.id)&&
  priorHp.get(unit.id)>unit.hp).map(unit=>unit.id);
 const receipts=[
  ...(Array.isArray(atDamage.physicalFeedback?.recentDeliveryReceipts)?
   atDamage.physicalFeedback.recentDeliveryReceipts:[]),
  ...(Array.isArray(frame.recentDeliveryReceipts)?
   frame.recentDeliveryReceipts:[])
 ];
 const admitted=new Set();
 let originalDamageReceiptObserved=false;
 for(const receipt of receipts){
  if(!receipt||receipt.scene!==expectedScene||receipt.tick!==after.tick||
   !['damage','damage-fatal'].includes(receipt.kind))continue;
  // The frozen D04 planner encodes observed HP loss with actorId=null:
  // scene:tick:kind:-:victimId. Never accept invented attacker attribution.
  const target=targetIds.find(id=>receipt.cueId===
   `${expectedScene}:${after.tick}:${receipt.kind}:-:${id}`);
  if(!target)continue;
  originalDamageReceiptObserved=true;
  if(receipt.visual!==true||receipt.decision!=='delivered'||
   !validCount(receipt.frameId)||
   !Number.isFinite(receipt.observedClockMs)||
   !Number.isFinite(receipt.submittedClockMs)||
   receipt.submittedClockMs<receipt.observedClockMs||
   !Number.isFinite(receipt.observationToSubmissionMs)||
   receipt.observationToSubmissionMs<0||
   receipt.observationToSubmissionMs>400||
   Math.abs(receipt.submittedClockMs-receipt.observedClockMs-
    receipt.observationToSubmissionMs)>3)continue;
  admitted.add(target);
 }
 const base={authoritativeDamage:true,damageVictims:victims,
  damageVisualAdmitted:admitted.size,
  damageCueReceiptObserved:originalDamageReceiptObserved,
  queued:frame.queued,expiredQueuedCues:frame.expiredQueuedCues,
  framesAcknowledged:frame.framesAcknowledged,visualAccepted:frame.visualAccepted};
 if(frame.adapterFailures>0)
  return verdict('BROWSER_ADAPTER_FAILURE',base);
 if(frame.framesAcknowledged===0)
  return verdict('NO_REAL_FRAME_RECEIPTS',base);
 if(admitted.size===targetIds.length&&frame.visualAccepted>=admitted.size)
  return verdict('VISUAL_ADMITTED_NOT_AV_VERIFIED',{...base,visualAcceptance:true});
 if(originalDamageReceiptObserved)
  return verdict('AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED',base);
 if(frame.visualAccepted>0)
  return verdict('DAMAGE_VISUAL_RECEIPT_UNVERIFIED',base);
 if(frame.queued>0&&frame.expiredQueuedCues===frame.queued)
  return verdict('ALL_CUES_EXPIRED_WITH_REAL_FRAMES',base);
 return verdict('NO_ADMITTED_VISUAL_EVIDENCE',base);
}
module.exports={actualDamageVictimCount,classifyAuthenticD04RenderObservation};
