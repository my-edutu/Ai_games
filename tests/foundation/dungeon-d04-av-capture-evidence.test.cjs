'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assessD04Capture}=require('../browser/dungeon-d04-av-evidence.cjs');
const good={
 optedIn:true,
 clip:{source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',bytes:150000,videoTracks:1,
  audioTracks:1,recordingMs:5000},
 pcm:{status:'RECORDED',sampleRate:48000,channels:1,frames:240000,
  bytes:480044,peak:.04,rms:.002},
 frames:{before:11,after:220}
};
test('D04 qualifies genuine overlapping browser A/V and PCM but NEVER sample synchronization',()=>{
 const assessment=assessD04Capture(good);
 assert.equal(assessment.classification,'REAL_BROWSER_A_V_CAPTURED_UNALIGNED');
 assert.equal(assessment.combinedVideoAudio,true);
 assert.equal(assessment.liveOriginalPcm,true);
 assert.equal(assessment.renderFramesAdvanced,true);
 assert.equal(assessment.sampleSynchronized,false);
});
test('D04 rejects missing opt-in and fabricated video-only soundtrack',()=>{
 for(const bad of [
  {...good,optedIn:false},
  {...good,clip:{...good.clip,audioTracks:0}},
  {...good,clip:{...good.clip,source:'offline-render'}},
  {...good,clip:{...good.clip,status:'UNAVAILABLE'}},
  {...good,clip:{...good.clip,bytes:0}}
 ])assert.equal(assessD04Capture(bad).classification,'UNVERIFIED');
});
test('D04 does not confuse a WAV audition or a silent device with verified mix',()=>{
 for(const pcm of [
  {...good.pcm,status:'SILENT'},
  {...good.pcm,frames:0},
  {...good.pcm,bytes:120},
  {...good.pcm,rms:0},
  {...good.pcm,peak:0}
 ])assert.equal(assessD04Capture({...good,pcm}).classification,'UNVERIFIED');
});
test('D04 requires actual frame progress, bounded duration and bounded files',()=>{
 for(const variation of [
  {frames:{before:20,after:20}},
  {frames:{before:20,after:19}},
  {clip:{...good.clip,recordingMs:150}},
  {clip:{...good.clip,bytes:25000000}},
  {pcm:{...good.pcm,sampleRate:192000}}
 ])assert.equal(assessD04Capture({...good,...variation}).classification,'UNVERIFIED');
});
