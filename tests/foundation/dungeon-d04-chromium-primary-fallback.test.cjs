'use strict';
// Synthetic selections test ONLY provenance and fallback policy. They are
// never genuine gameplay pixels, original PCM or a synchronized A/V score.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectAuthenticatedOriginalD04WebM}=
 require('../browser/dungeon-d04-decoded-video-proof.cjs');

const primary=()=>({
 source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
 mimeType:'video/webm;codecs=vp8,opus',
 videoTracks:1,audioTracks:1,optedInAtStart:true,
 originalSoundstageTrackLive:true,bytes:10240,
 framePump:{mode:'submitted-frame-request',observedFrameAdvances:12,
  requestedFrames:12,requestFailures:0}
});
const serial=()=>({
 source:'real-webgl-receipt-readback-serial-original-audio',
 status:'RECORDED',videoTracks:1,audioTracks:1,
 optedInAtStart:true,originalSoundstageTrackLive:true,bytes:8192
});

test('D04 selects authentic primary WebGL plus original sound when a nominal serial diagnostic is not authentic',()=>{
 const source=selectAuthenticatedOriginalD04WebM(
  {...serial(),originalSoundstageTrackLive:false},primary());
 assert.equal(source?.source,'real-canvas-plus-opted-in-soundstage',
  'RECORDED alone must never hide the real opted-in primary original capture');
});

test('D04 prefers valid serial when present, otherwise fail-closed or use genuine primary',()=>{
 assert.equal(selectAuthenticatedOriginalD04WebM(serial(),primary())?.source,
  'real-webgl-receipt-readback-serial-original-audio');
 assert.equal(selectAuthenticatedOriginalD04WebM(null,primary())?.source,
  'real-canvas-plus-opted-in-soundstage');
 for(const invalid of [
  {...primary(),optedInAtStart:false},
  {...primary(),videoTracks:0},
  {...primary(),framePump:{...primary().framePump,requestFailures:1}},
  {...primary(),mimeType:'video/webm;codecs=vp9'},
  {...primary(),bytes:5*1024*1024}
 ])assert.equal(selectAuthenticatedOriginalD04WebM(null,invalid),null);
 assert.equal(selectAuthenticatedOriginalD04WebM(null,null),null);
});

test('a failed serial decode can choose eligible original primary without accepting a fake fallback',()=>{
 assert.equal(selectAuthenticatedOriginalD04WebM(null,primary())?.source,
  'real-canvas-plus-opted-in-soundstage');
 assert.equal(selectAuthenticatedOriginalD04WebM(null,
  {...primary(),source:'synthetic-2d-canvas-encoder-control-not-gameplay'}),null);
});
