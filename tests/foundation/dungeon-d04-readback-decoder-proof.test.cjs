'use strict';
// Synthetic decoder fixtures test a strict parser, NOT Dungeon footage.
// Only Playwright's authentic WebGL source may produce runtime evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const child=require('node:child_process');
const {decodeReceiptReadbackMotion}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
const bytes=Buffer.alloc(2048,7);
const authentic=()=>({
 source:'real-webgl-receipt-readback-serial-video-only',
 status:'RECORDED',bytes:bytes.length,base64:bytes.toString('base64'),
 videoTracks:1,audioTracks:0
});
const hashes=['11111111111111111111111111111111','22222222222222222222222222222222'];
function withDecoderFrames(list,callback,{codec='vp8'}={}){
 const original=child.spawnSync;
 child.spawnSync=(exe)=>{
  if(exe==='ffprobe')return {status:0,stdout:codec+'\n'};
  if(exe==='ffmpeg')return {status:0,stdout:'#version: 2\n'+list.map((hash,i)=>
   '0, '+i+', '+i+', 1, 576, '+hash).join('\n')+'\n'};
  throw Error('Unexpected decoder binary '+exe);
 };
 try{return callback()}finally{child.spawnSync=original}
}
test('D04 receipt-readback decode fails closed without authenticated real WebGL source',()=>{
 assert.equal(typeof decodeReceiptReadbackMotion,'function');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),source:'synthetic-2d-canvas'}).status,'UNAVAILABLE');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),base64:'AAAA'}).status,'UNAVAILABLE');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),videoTracks:0}).status,'UNAVAILABLE');
});
test('strict decode distinguishes two real-source frame hashes from a single/static frame',()=>{
 const moving=withDecoderFrames(hashes,()=>decodeReceiptReadbackMotion(authentic()));
 assert.equal(moving.status,'DECODED');
 assert.equal(moving.source,'ffmpeg-decoded-real-webgl-receipt-readback-video');
 assert.equal(moving.frameCount,2);assert.equal(moving.distinctFrames,2);
 const staticVideo=withDecoderFrames([hashes[0],hashes[0]],()=>decodeReceiptReadbackMotion(authentic()));
 assert.equal(staticVideo.frameCount,2);assert.equal(staticVideo.distinctFrames,1);
 const invalid=withDecoderFrames(hashes,()=>decodeReceiptReadbackMotion(authentic()),{codec:'h264'});
 assert.equal(invalid.status,'UNAVAILABLE','no codec substitution');
});

test('moving receipt-readback evidence remains source-verified and explicitly unaligned with original audio',()=>{
 const {classifyDecodedReceiptReadbackGameplay,assessD04Capture}=
  require('../browser/dungeon-d04-av-evidence.cjs');
 const v={...authentic(),phase:'after-all-primary-encoders-settled',
  primaryRecordersSettled:true,mimeType:'video/webm;codecs=vp8',
  canvasWidth:640,canvasHeight:400,recordingMs:5500,
  framePump:{mode:'real-webgl-render-receipt-readback',receiptStart:2,receiptEnd:5,
   observedFrameAdvances:3,requestFailures:0,requestedFrames:2,
   samples:[{receipt:3,atMs:1000,colors:110,signature:'12345678'},
            {receipt:4,atMs:1500,colors:130,signature:'87654321'}]}};
 const decoded=withDecoderFrames(hashes,()=>decodeReceiptReadbackMotion(v));
 assert.equal(classifyDecodedReceiptReadbackGameplay({video:v,decoder:decoded}),
  'REAL_WEBGL_READBACK_MOVING_VIDEO_UNALIGNED');
 const a=assessD04Capture({optedIn:true,frames:{before:1,after:2},
  isolated:{receiptReadbackVideo:v},decoder:{readbackVideo:decoded}});
 assert.equal(a.receiptReadbackVideoMotionQualified,true);
 assert.equal(a.sampleSynchronized,false);
 assert.notEqual(a.classification,'REAL_BROWSER_A_V_SYNCHRONIZED');
 const staticDecoded={...decoded,hashes:[hashes[0],hashes[0]],distinctFrames:1};
 assert.equal(classifyDecodedReceiptReadbackGameplay({video:v,decoder:staticDecoded}),
  'REAL_WEBGL_READBACK_ONE_OR_STATIC_FRAME_UNVERIFIED');
 assert.equal(classifyDecodedReceiptReadbackGameplay({video:{...v,source:'synthetic-2d-canvas'},decoder:decoded}),
  'READBACK_REAL_WEBGL_MOTION_UNVERIFIED');
});

test('Chromium decoded WebM witness never upgrades a fabricated or non-opted source',()=>{
 const {classifyChromiumDecodedRealWebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 const media={source:'real-webgl-receipt-readback-serial-original-audio',
  status:'RECORDED',videoTracks:1,audioTracks:1,optedInAtStart:true,
  originalSoundstageTrackLive:true,bytes:2400};
 const proof={source:'chromium-decoded-real-webgl-original-webm',status:'SAMPLED',
  width:688,height:397,durationSeconds:5.5,
  samples:[{requestedSeconds:.3,hash:'11111111',lumaRange:75},
   {requestedSeconds:2.4,hash:'22222222',lumaRange:80}]};
 const valid=classifyChromiumDecodedRealWebM(media,proof);
 assert.equal(valid.classification,'BROWSER_DECODED_MOVING_PIXELS_UNALIGNED');
 assert.equal(valid.sampleSynchronized,false);
 assert.equal(valid.sampledFrames,2);
 assert.equal(valid.distinctFrames,2);
 for(const variant of [
  {...media,source:'synthetic-2d-canvas-encoder-control-not-gameplay'},
  {...media,originalSoundstageTrackLive:false},
  {...media,videoTracks:0},
  {...media,status:'UNAVAILABLE'}
 ]){
  assert.equal(classifyChromiumDecodedRealWebM(variant,proof).classification,
   'BROWSER_DECODE_UNVERIFIED');
 }
});
test('Chromium pixel samples do not count as motion when static, blank, corrupted, reversed or over budget',()=>{
 const {classifyChromiumDecodedRealWebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 const media={source:'real-webgl-receipt-readback-serial-original-audio',
  status:'RECORDED',videoTracks:1,audioTracks:1,optedInAtStart:true,
  originalSoundstageTrackLive:true,bytes:2400};
 const witness={source:'chromium-decoded-real-webgl-original-webm',status:'SAMPLED',
  width:688,height:397,durationSeconds:5.5,
  samples:[{requestedSeconds:.3,hash:'11111111',lumaRange:75},
   {requestedSeconds:2.4,hash:'11111111',lumaRange:75}]};
 const staticProof=classifyChromiumDecodedRealWebM(media,witness);
 assert.equal(staticProof.classification,'BROWSER_DECODED_STATIC_OR_SPARSE_UNALIGNED');
 assert.equal(staticProof.sampleSynchronized,false);
 const bad=[
  {...witness,samples:[witness.samples[0]]},
  {...witness,samples:[{...witness.samples[0],lumaRange:0},
   {...witness.samples[1],hash:'22222222',lumaRange:0}]},
  {...witness,samples:[witness.samples[1],witness.samples[0]]},
  {...witness,samples:[{...witness.samples[0],hash:'not-a-hash'},witness.samples[1]]},
  {...witness,samples:Array(9).fill(witness.samples[0])},
  {...witness,source:'synthetic-2d-canvas-encoder-control-not-gameplay'}
 ];
 for(const result of bad)
  assert.equal(classifyChromiumDecodedRealWebM(media,result).classification,
   'BROWSER_DECODE_UNVERIFIED');
});
