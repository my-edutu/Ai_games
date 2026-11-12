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
