'use strict';
// Bounded native VIDEO collection only: no virtual-time, simulation or rewind.
const MIN_CAPTURE_MS=68000;
const MAX_CAPTURE_MS=Object.freeze({ascent:84000,moving:90000,danger:180000,outcome:120000});
function captureWindowDecision(scenario,elapsedMs,sourceSequenceObserved){
 const maximumMs=MAX_CAPTURE_MS[scenario];
 if(!Number.isFinite(maximumMs))throw new RangeError('unknown capture scenario');
 if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new RangeError('elapsedMs');
 const minReached=elapsedMs>=MIN_CAPTURE_MS,maxReached=elapsedMs>=maximumMs;
 const sourceReady=sourceSequenceObserved===true;
 const continueRecording=!maxReached&&(!minReached||!sourceReady);
 return{continueRecording,sourceReady,minReached,maxReached,minimumMs:MIN_CAPTURE_MS,maximumMs,
  stopReason:continueRecording?null:maxReached&&!sourceReady?'source-story-absent-at-real-time-cap':
   maxReached?'maximum-real-time-window-with-source-story':'minimum-native-footage-and-source-story-observed',
  videoQualityVerdict:'NOT EVALUATED'};
}
function nextCaptureObservation(anchorMs,nowMs,cadenceMs,lastIndex){
 if(![anchorMs,nowMs,cadenceMs,lastIndex].every(Number.isFinite)||
   cadenceMs<=0||!Number.isSafeInteger(lastIndex)||lastIndex<0)
   throw new RangeError('invalid capture observation clock');
 const index=Math.max(lastIndex+1,Math.floor((nowMs-anchorMs)/cadenceMs)+1);
 return{index,delayMs:Math.max(0,anchorMs+index*cadenceMs-nowMs)};
}
module.exports={MIN_CAPTURE_MS,MAX_CAPTURE_MS,captureWindowDecision,nextCaptureObservation};
