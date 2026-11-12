'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createD04CaptureProfile,skippedConcurrentD04Probe}=
 require('../browser/dungeon-d04-capture-profile.cjs');

test('opted-in live D04 browser recording starts exactly one genuine combined A/V encoder',()=>{
 const profile=createD04CaptureProfile();
 assert.equal(profile.id,'single-primary-authentic-av');
 assert.deepEqual(profile.concurrentRecorders,['real-canvas-plus-opted-in-soundstage']);
 assert.equal(profile.concurrentRecorders.length,1);
 assert.equal(profile.concurrentIsolatedProbes,false);
 assert.equal(profile.allowSerialDiagnostics,true);
 assert.equal(profile.audioSource,'opted-in-original-soundstage');
 assert.equal(profile.sampleSynchronized,false);
 assert.equal(Object.isFrozen(profile),true);
});

test('rejected concurrent controls never masquerade as missing media or evidence of encoder failure',()=>{
 for(const source of ['real-webgl-canvas-video-only',
  'real-opted-in-soundstage-audio-only','real-webgl-canvas-native-video-only',
  'synthetic-2d-canvas-encoder-control-not-gameplay']){
  const probe=skippedConcurrentD04Probe(source);
  assert.deepEqual(probe,{source,status:'SKIPPED',
   reason:'Single-primary-encoder trial: concurrent diagnostic recorder intentionally disabled',
   evidence:'NOT_CAPTURED_NOT_GAMEPLAY_NOT_AV_PROOF'});
 }
 assert.throws(()=>skippedConcurrentD04Probe('fabricated gameplay video'));
});

test('actual D04 browser harness must honor single-encoder policy before serial diagnostics',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,
  '../browser/dungeon-physical-feedback-preview.spec.cjs'),'utf8');
 assert.match(source,/createD04CaptureProfile\(\)/);
 assert.match(source,/beginD04LiveAVCapture\(page,\s*createD04CaptureProfile\(\)\)/);
 assert.match(source,/skippedConcurrentD04Probe\('real-webgl-canvas-video-only'\)/);
 assert.match(source,/skippedConcurrentD04Probe\('real-opted-in-soundstage-audio-only'\)/);
 assert.match(source,/skippedConcurrentD04Probe\('real-webgl-canvas-native-video-only'\)/);
 assert.match(source,/skippedConcurrentD04Probe\('synthetic-2d-canvas-encoder-control-not-gameplay'\)/);
 assert.match(source,/start2DEncoderPositiveControl\(\{serial:true\}\)/);
 assert.match(source,/startSerialReceiptReadbackVideoProbe\(\{withOriginalAudio:true\}\)/);
});

test('strict single-encoder capture credits only genuine combined video bytes in track-delivery classification',()=>{
 const {assessD04Capture}=require('../browser/dungeon-d04-av-evidence.cjs');
 const trackDelivery={
  source:'real-webgl-canvas-capture-video-monitor',
  mode:'request-video-frame-callback',
  playStatus:'PLAYING',
  mutedAtStart:false,
  events:[],
  frames:[{atMs:300,presentedFrames:1,mediaTime:.3,submittedReceipt:6},
   {atMs:650,presentedFrames:2,mediaTime:.65,submittedReceipt:9}]
 };
 const clip={source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',bytes:36000,
  videoTracks:1,audioTracks:1,recordingMs:5500,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:2,
   requestedFrames:2,requestFailures:0}};
 const skipped=skippedConcurrentD04Probe('real-webgl-canvas-video-only');
 const assessed=assessD04Capture({optedIn:true,clip,trackDelivery,
  frames:{before:1,after:10},isolated:{videoOnly:skipped}});
 assert.equal(assessed.combinedVideoAudio,true);
 assert.equal(assessed.isolatedVideoRecorded,false);
 assert.equal(assessed.trackDiagnosis,'CANVAS_FRAMES_DELIVERED_AND_ENCODED_UNALIGNED',
  'an intentionally skipped diagnostic encoder cannot imply the combined WebM is empty');
 assert.equal(assessed.canvasEncoderDifferential,'CONTROL_COMPARISON_UNVERIFIED');
 assert.equal(assessed.sampleSynchronized,false);
});

test('browser capture must retain observed recorder-count evidence, not just the requested plan',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,
  '../browser/dungeon-physical-feedback-preview.spec.cjs'),'utf8');
 assert.match(s,/const registerRecorder=rec=>/);
 assert.match(s,/peakActiveMediaRecorders=Math\.max\(/);
 assert.match(s,/primaryMediaRecordersAtStart:activeRecorders\.size/);
 assert.match(s,/peakPrimaryConcurrentMediaRecorders:peakActiveMediaRecorders/);
});
