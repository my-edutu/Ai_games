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
test('the genuine primary canvas and original soundstage can supply decoded pixels when serial WebM is unavailable',()=>{
 const {classifyChromiumDecodedRealWebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 const primary={source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  optedInAtStart:true,originalSoundstageTrackLive:true,bytes:2400,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:3,
   requestedFrames:3,requestFailures:0}};
 const proof={source:'chromium-decoded-real-webgl-original-webm',status:'SAMPLED',
  width:1440,height:900,durationSeconds:5.5,
  samples:[{requestedSeconds:.4,hash:'11111111',lumaRange:75},
   {requestedSeconds:3.5,hash:'22222222',lumaRange:80}]};
 const result=classifyChromiumDecodedRealWebM(primary,proof);
 assert.equal(result.classification,'BROWSER_DECODED_MOVING_PIXELS_UNALIGNED');
 assert.equal(result.sampleSynchronized,false,'actual VP8 frames alone are never synchronized PCM');
 for(const unverified of [
  {...primary,source:'synthetic-2d-canvas-encoder-control-not-gameplay'},
  {...primary,optedInAtStart:false},
  {...primary,originalSoundstageTrackLive:false},
  {...primary,framePump:{...primary.framePump,observedFrameAdvances:0}},
  {...primary,framePump:{...primary.framePump,requestFailures:1}},
  {...primary,framePump:{...primary.framePump,requestedFrames:4}},
  {...primary,mimeType:'video/webm;codecs=vp9'},
  {...primary,videoTracks:0},
  {...primary,bytes:4*1024*1024+1}
 ]){
  assert.equal(classifyChromiumDecodedRealWebM(unverified,proof).classification,
   'BROWSER_DECODE_UNVERIFIED');
 }
});
test('Chromium decode sampler stays self-contained when serialized into a clean page realm',async()=>{
 const {sampleChromiumDecodedD04WebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 const vm=require('node:vm');
 // Playwright serializes only this function, not module-level helpers.
 // A malformed input must fail closed without throwing ReferenceError.
 const evaluated=vm.runInNewContext('('+sampleChromiumDecodedD04WebM.toString()+')(input)',{
  input:{status:'UNAVAILABLE'},Number,String
 });
 const result=await evaluated;
 assert.equal(result.status,'UNAVAILABLE');
 assert.equal(result.sampleSynchronized,false);
 const primary={source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  optedInAtStart:true,originalSoundstageTrackLive:true,bytes:2400,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:300,
   requestedFrames:280,requestFailures:0},base64:'AAAA'};
 // One pristine browser evaluator sees authentic eligibility and continues
 // to verify bytes. It must NOT require an imported Node helper or treat
 // unrelated original content as moving contact evidence.
 const runner='('+sampleChromiumDecodedD04WebM.toString()+')(input)';
 const accepted=await vm.runInNewContext(runner,{input:primary,Number,String,atob:()=> 'X'});
 assert.equal(accepted.reason,'WebM encoded length mismatch');
 assert.equal(accepted.sampleSynchronized,false);
 for(const bad of [{...primary,optedInAtStart:false},
  {...primary,framePump:{...primary.framePump,requestFailures:1}}]){
  const rejected=await vm.runInNewContext(runner,{input:bad,Number,String,atob:()=> 'X'});
  assert.match(rejected.reason,/No bounded, opted-in/);
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

test('durationless genuine MediaRecorder WebM can prove moving decoded pixels only through bounded playback frames',()=>{
 // Authentic WebM from the prior Dungeon Chrome capture has two VP8 packets
 // but no finite container duration; Chromium seek-only evidence must fail
 // closed and a real frame-callback decoder must never invent A/V alignment.
 const {classifyChromiumDecodedRealWebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 const media={source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  optedInAtStart:true,originalSoundstageTrackLive:true,bytes:185973,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:45,
   requestedFrames:40,requestFailures:0}};
 const playback={source:'chromium-decoded-real-webgl-original-webm',
  status:'SAMPLED',samplingMode:'playback-frame-callback',
  width:688,height:397,durationSeconds:null,
  samples:[{requestedSeconds:2.994,hash:'b1a2c3d4',lumaRange:72},
   {requestedSeconds:3.816,hash:'a2b3c4d5',lumaRange:78}],
  sampleSynchronized:false};
 const actual=classifyChromiumDecodedRealWebM(media,playback);
 assert.equal(actual.classification,'BROWSER_DECODED_MOVING_PIXELS_UNALIGNED');
 assert.equal(actual.sampleSynchronized,false);
 assert.equal(actual.distinctFrames,2);
 for(const wrong of [
  {...playback,samplingMode:'seek'},
  {...playback,samples:[playback.samples[0]]},
  {...playback,samples:[playback.samples[1],playback.samples[0]]},
  {...playback,samples:[{...playback.samples[0],requestedSeconds:31},playback.samples[1]]},
  {...playback,samples:[{...playback.samples[0],lumaRange:0},playback.samples[1]]},
  {...playback,samples:[playback.samples[0],{...playback.samples[1],hash:playback.samples[0].hash}]}
 ]){
  const found=classifyChromiumDecodedRealWebM(media,wrong);
  if(wrong.samples.length===2&&wrong.samples[0].hash===wrong.samples[1].hash){
   assert.equal(found.classification,'BROWSER_DECODED_STATIC_OR_SPARSE_UNALIGNED');
  }else assert.equal(found.classification,'BROWSER_DECODE_UNVERIFIED');
 }
});

test('durationless decoder executes in an isolated browser realm with no Node imports or audible output',async()=>{
 const vm=require('node:vm');
 const {sampleChromiumDecodedD04WebM}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
 let frame=0;const listeners=new Map();
 const video={duration:Infinity,videoWidth:688,videoHeight:397,readyState:2,
  style:{},muted:false,volume:1,playsInline:false,
  addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},
  removeEventListener(name,fn){listeners.get(name)?.delete(fn)},
  emit(name){for(const fn of Array.from(listeners.get(name)||[]))fn()},
  load(){this.emit('loadedmetadata')},play(){return Promise.resolve()},pause(){},remove(){},
  removeAttribute(){},
  requestVideoFrameCallback(fn){
   Promise.resolve().then(()=>{
    if(frame<2){frame++;fn(0,{mediaTime:[2.994,3.816][frame-1]})}
    else video.emit('ended');
   });
   return frame+1;
  },
  cancelVideoFrameCallback(){}
 };
 const ctx={drawImage(){},getImageData(){
  const data=new Uint8Array(24*16*4);
  for(let i=0;i<data.length;i+=4){
   data[i]=((i/4)+frame*17)%210;
   data[i+1]=((i/4)*2+frame*19)%211;
   data[i+2]=((i/4)*3+frame*23)%212;data[i+3]=255;
  }return {data};
 }};
 const document={body:{appendChild(){}},createElement(tag){
  if(tag==='video')return video;
  if(tag==='canvas')return {getContext:()=>ctx};
  throw Error('Unexpected element '+tag);
 }};
 const input={source:'real-canvas-plus-opted-in-soundstage',
  status:'RECORDED',mimeType:'video/webm;codecs=vp8,opus',
  videoTracks:1,audioTracks:1,optedInAtStart:true,
  originalSoundstageTrackLive:true,bytes:2400,base64:'X'.repeat(3200),
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:3,
   requestedFrames:3,requestFailures:0}};
 const result=await vm.runInNewContext(
  '('+sampleChromiumDecodedD04WebM.toString()+')(input)',{
   input,atob:()=> 'X'.repeat(2400),Uint8Array,
   Blob:class FakeBlob{},URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},
   document,setTimeout:()=>1,clearTimeout(){}});
 assert.equal(result.status,'SAMPLED');
 assert.equal(result.samplingMode,'playback-frame-callback');
 assert.equal(result.durationSeconds,null);
 assert.equal(result.samples.length,2);
 assert.equal(result.sampleSynchronized,false);
 assert.equal(video.muted,true,'original sound must not be emitted by decoder');
 assert.equal(video.volume,0);
});
