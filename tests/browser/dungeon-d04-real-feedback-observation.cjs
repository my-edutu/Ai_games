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
 const base={authoritativeDamage:true,damageVictims:victims,
  queued:frame.queued,expiredQueuedCues:frame.expiredQueuedCues,
  framesAcknowledged:frame.framesAcknowledged,visualAccepted:frame.visualAccepted};
 if(frame.adapterFailures>0)
  return verdict('BROWSER_ADAPTER_FAILURE',base);
 if(frame.framesAcknowledged===0)
  return verdict('NO_REAL_FRAME_RECEIPTS',base);
 if(frame.visualAccepted>0)
  return verdict('VISUAL_ADMITTED_NOT_AV_VERIFIED',{...base,visualAcceptance:true});
 if(frame.queued>0&&frame.expiredQueuedCues===frame.queued)
  return verdict('ALL_CUES_EXPIRED_WITH_REAL_FRAMES',base);
 return verdict('NO_ADMITTED_VISUAL_EVIDENCE',base);
}
module.exports={actualDamageVictimCount,classifyAuthenticD04RenderObservation};
