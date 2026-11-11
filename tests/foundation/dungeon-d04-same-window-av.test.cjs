'use strict';
// Contract fixtures exercise the D04 evidence gate, never simulated Dungeon playback.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const child=require('node:child_process');
const {classifyDecodedSameWindowReadbackAV,assessD04Capture,persistD04CaptureEvidence}=
 require('../browser/dungeon-d04-av-evidence.cjs');
const {decodeSameWindowReadbackMotion}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
const hashes=['11111111111111111111111111111111','22222222222222222222222222222222'];
const recorded=()=>({
 source:'real-webgl-receipt-readback-serial-original-audio',
 phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true,
 optedInAtStart:true,originalSoundstageTrackLive:true,
 status:'RECORDED',mimeType:'video/webm;codecs=vp8,opus',
 bytes:4096,videoTracks:1,audioTracks:1,recordingMs:5500,
 canvasWidth:640,canvasHeight:400,
 framePump:{mode:'real-webgl-render-receipt-readback',receiptStart:2,receiptEnd:5,
  observedFrameAdvances:3,requestFailures:0,requestedFrames:2,
  samples:[{receipt:3,atMs:1000,colors:110,signature:'12345678'},
   {receipt:4,atMs:1500,colors:130,signature:'87654321'}]}
});
const decoded=()=>({source:'ffmpeg-decoded-real-webgl-receipt-readback-original-audio',
 method:'framemd5-24x16-first-64',status:'DECODED',codec:'vp8',audioCodec:'opus',
 frameCount:2,distinctFrames:2,hashes});
test('same-window authentic retained-frame WebGL and original Opus is only a moving UNALIGNED witness',()=>{
 const v=recorded(),d=decoded();
 assert.equal(classifyDecodedSameWindowReadbackAV({video:v,decoder:d}),
  'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED');
 const evidence=assessD04Capture({optedIn:true,frames:{before:1,after:2},
  isolated:{sameWindowReadbackAV:v},decoder:{sameWindowReadbackAV:d}});
 assert.equal(evidence.sameWindowMovingAV,true);
 assert.equal(evidence.sampleSynchronized,false,'MediaRecorder track coexistence is not sample-onset evidence');
 assert.notEqual(evidence.classification,'REAL_BROWSER_A_V_SYNCHRONIZED');
});
test('reject invented, muted, static, cross-phase, malformed or source-less same-window audiovisual evidence',()=>{
 const v=recorded(),d=decoded();
 for(const invalid of [
  {...v,source:'synthetic-2d-canvas-encoder-control-not-gameplay'},
  {...v,audioTracks:0},{...v,originalSoundstageTrackLive:false},
  {...v,optedInAtStart:false},{...v,phase:'different-unrelated-audio-window'},
  {...v,framePump:{...v.framePump,requestFailures:1}},
  {...v,framePump:{...v.framePump,samples:[v.framePump.samples[0]]}},
  {...v,framePump:{...v.framePump,samples:[{...v.framePump.samples[0],colors:1},v.framePump.samples[1]]}}
 ])assert.notEqual(classifyDecodedSameWindowReadbackAV({video:invalid,decoder:d}),
  'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED');
 for(const invalid of [
  {...d,audioCodec:'aac'}, {...d,frameCount:1,distinctFrames:1,hashes:[hashes[0]]},
  {...d,hashes:[hashes[0],hashes[0]],distinctFrames:1},
  {...d,source:'ffmpeg-decoded-synthetic-test-video'}
 ])assert.notEqual(classifyDecodedSameWindowReadbackAV({video:v,decoder:invalid}),
  'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED');
});
test('native decoder verifies both original Opus and more than one VP8 frame; never trusts WebM byte count',()=>{
 const v={...recorded(),base64:Buffer.alloc(4096,7).toString('base64')};
 const old=child.spawnSync;
 try{
  child.spawnSync=(cmd,args)=>{
   if(cmd==='ffprobe')return {status:0,stdout:args.includes('a:0')?'opus\n':'vp8\n'};
   if(cmd==='ffmpeg')return {status:0,stdout:'#version 2\n'+hashes.map((h,i)=>'0, '+i+', '+i+', 1, 576, '+h).join('\n')+'\n'};
   throw Error('unrecognized decoder');
  };
  const d=decodeSameWindowReadbackMotion(v);
  assert.equal(d.status,'DECODED');assert.equal(d.audioCodec,'opus');
  assert.equal(d.frameCount,2);assert.equal(d.distinctFrames,2);
  assert.equal(classifyDecodedSameWindowReadbackAV({video:v,decoder:d}),
   'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED');
  child.spawnSync=(cmd,args)=>{if(cmd==='ffprobe')return {status:0,stdout:args.includes('a:0')?'aac\n':'vp8\n'};return {status:0,stdout:''}};
  assert.equal(decodeSameWindowReadbackMotion(v).status,'UNAVAILABLE');
 }finally{child.spawnSync=old}
});
test('only accepted real moving same-window A/V survives manifest persistence; never declared synchronized',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'d04-same-window-av-'));
 try{
  const v={...recorded(),base64:Buffer.alloc(4096,7).toString('base64')};
  const raw={isolated:{sameWindowReadbackAV:v},decoder:{sameWindowReadbackAV:decoded()},
   frames:{before:1,after:2}};
  const assessment=assessD04Capture({optedIn:true,...raw});
  const saved=persistD04CaptureEvidence({directory:dir,raw,assessment});
  assert.equal(fs.statSync(saved.sameWindowAVWebm).size,4096);
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.retained.sameWindowAVWebm,true);
  assert.equal(manifest.isolated.sameWindowReadbackAV.base64,undefined);
  assert.equal(manifest.assessment.sampleSynchronized,false);
  const rejected=assessD04Capture({optedIn:true,...raw,
   decoder:{sameWindowReadbackAV:{...decoded(),distinctFrames:1,hashes:[hashes[0],hashes[0]]}}});
  const dir2=path.join(dir,'rejected');
  const no=persistD04CaptureEvidence({directory:dir2,raw,assessment:rejected});
  assert.equal(no.sameWindowAVWebm,null,'static encoded clip is not retained as moving gameplay A/V');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
