'use strict';
/**
 * Diagnostic capture-window selector, NOT a combat or foley authorizer.
 * A real submitted, drawable HP injury with an identity-matched original
 * source.start retains an ALREADY RUNNING original A/V recorder for a short
 * tail. It does not prove audible PCM or contact pixels.
 * Never mint effects, infer attackers, or extend the 400ms sound gate here.
 * This dependency-free function is injected into the test browser at load.
 */
function selectD04AdmittedHpContactForRecording({receipts,sourceStarts,firstFrameId,lastFrameId}={}){
 if(!Array.isArray(receipts)||receipts.length>64||
  !Array.isArray(sourceStarts)||sourceStarts.length>64||
  !Number.isSafeInteger(firstFrameId)||firstFrameId<0||
  !Number.isSafeInteger(lastFrameId)||lastFrameId<firstFrameId)return null;
 for(const receipt of receipts){
  if(!receipt||!['damage','damage-fatal'].includes(receipt.kind)||
   receipt.decision!=='delivered'||receipt.audio!==true||receipt.visual!==true||
   receipt.visualDrawableAtSubmission!==true||
   !Number.isSafeInteger(receipt.frameId)||
   receipt.frameId<=firstFrameId||receipt.frameId>lastFrameId||
   !Number.isSafeInteger(receipt.tick)||receipt.tick<0||
   typeof receipt.scene!=='string'||!/^\d+:\d+$/.test(receipt.scene)||
   typeof receipt.cueId!=='string'||receipt.cueId.length>256||
   !receipt.cueId.startsWith(receipt.scene+':'+receipt.tick+':'+receipt.kind+':-:')||
   !Number.isFinite(receipt.observationToSubmissionMs)||
   receipt.observationToSubmissionMs<0||receipt.observationToSubmissionMs>400||
   !Number.isFinite(receipt.observedClockMs)||
   !Number.isFinite(receipt.submittedClockMs)||
   Math.abs((receipt.submittedClockMs-receipt.observedClockMs)-receipt.observationToSubmissionMs)>1)continue;
  const started=sourceStarts.some(start=>start?.cueId===receipt.cueId&&
   start.kind===receipt.kind&&start.sceneKey===receipt.scene&&
   start.tick===receipt.tick&&start.audio==='impact'&&
   start.verifiedCanonicalCue===true&&
   Number.isSafeInteger(start.startedSources)&&start.startedSources>0&&
   Number.isFinite(start.scheduledContextMs));
  if(started)return {cueId:receipt.cueId,kind:receipt.kind,scene:receipt.scene,
   tick:receipt.tick,frameId:receipt.frameId,ageMs:receipt.observationToSubmissionMs};
 }
 return null;
}
module.exports={selectD04AdmittedHpContactForRecording};
