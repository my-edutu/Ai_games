'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {MIN_CAPTURE_MS,MAX_CAPTURE_MS,captureWindowDecision,nextCaptureObservation}=require('../../scripts/tower-capture-window.cjs');
test('wrong-floor danger remains evidence-incomplete after 68s, and caps without claiming PASS',()=>{
 assert.equal(captureWindowDecision('danger',68000,false).continueRecording,true);
 assert.equal(captureWindowDecision('danger',179999,false).continueRecording,true);
 const out=captureWindowDecision('danger',180000,false);
 assert.equal(out.continueRecording,false);
 assert.equal(out.sourceReady,false);
 assert.equal(out.stopReason,'source-story-absent-at-real-time-cap');
 assert.equal(out.videoQualityVerdict,'NOT EVALUATED');
});
test('early source story cannot produce a short video',()=>{
 assert.equal(captureWindowDecision('danger',20000,true).continueRecording,true);
 assert.equal(captureWindowDecision('danger',MIN_CAPTURE_MS,true).continueRecording,false);
 assert.equal(captureWindowDecision('outcome',MIN_CAPTURE_MS,true).continueRecording,false);
});
test('all scenario caps bounded and no missing story becomes a quality pass',()=>{
 assert.deepEqual(Object.keys(MAX_CAPTURE_MS).sort(),['ascent','danger','moving','outcome']);
 for(const [s,cap] of Object.entries(MAX_CAPTURE_MS)){
  assert.ok(cap>=MIN_CAPTURE_MS&&cap<=180000);
  assert.equal(captureWindowDecision(s,cap,false).sourceReady,false);
  assert.equal(captureWindowDecision(s,cap,false).videoQualityVerdict,'NOT EVALUATED');
 }
 assert.throws(()=>captureWindowDecision('other',68000,true),RangeError);
 assert.throws(()=>captureWindowDecision('danger',-1,true),RangeError);
});
test('absolute wall deadlines skip delayed screenshots rather than stacking waits',()=>{
 assert.deepEqual(nextCaptureObservation(1000,1000,1000,0),{index:1,delayMs:1000});
 assert.deepEqual(nextCaptureObservation(1000,2450,1000,1),{index:2,delayMs:550});
 assert.deepEqual(nextCaptureObservation(1000,16200,1000,2),{index:16,delayMs:800});
 assert.deepEqual(nextCaptureObservation(1000,17000,1000,16),{index:17,delayMs:1000});
 assert.throws(()=>nextCaptureObservation(0,0,0,0),RangeError);
});
