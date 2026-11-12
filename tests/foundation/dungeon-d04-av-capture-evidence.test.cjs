'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assessD04Capture,persistD04CaptureEvidence}=require('../browser/dungeon-d04-av-evidence.cjs');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const good={
 optedIn:true,
 clip:{source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',bytes:150000,videoTracks:1,
  audioTracks:1,recordingMs:5000,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:5,
   requestedFrames:5,requestFailures:0}},
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
  {clip:{...good.clip,recordingMs:16000}},
  {clip:{...good.clip,bytes:25000000}},
  {pcm:{...good.pcm,sampleRate:192000}}
 ])assert.equal(assessD04Capture({...good,...variation}).classification,'UNVERIFIED');
});

test('D04 retains a manifest and exact browser bytes on a passing CI run',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-av-evidence-'));
 try{
  const clipBytes=Buffer.alloc(150000,31),pcmBytes=Buffer.alloc(480044,0);
  const raw={
   clip:{...good.clip,base64:clipBytes.toString('base64')},
   pcm:{...good.pcm,wavBase64:pcmBytes.toString('base64')},
   frames:good.frames
  };
  const saved=persistD04CaptureEvidence({directory,raw,started:{status:'STARTED'},
   assessment:assessD04Capture({...good})});
  assert.equal(fs.readFileSync(saved.webm).compare(clipBytes),0);
  assert.equal(fs.readFileSync(saved.wav).compare(pcmBytes),0);
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.assessment.sampleSynchronized,false);
  assert.equal(manifest.clip.base64,undefined);
  assert.equal(manifest.pcm.wavBase64,undefined);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});
test('D04 always preserves UNVERIFIED capture manifest without inventing media',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-av-unverified-'));
 try{
  const raw={clip:{status:'UNAVAILABLE',reason:'MediaRecorder unsupported'},
   pcm:{status:'SILENT'},frames:{before:1,after:2}};
  const saved=persistD04CaptureEvidence({directory,raw,started:{status:'UNAVAILABLE'},
   assessment:assessD04Capture({optedIn:false,...raw})});
  assert.equal(fs.existsSync(saved.manifest),true);
  assert.equal(saved.webm,null);
  assert.equal(saved.wav,null);
  assert.equal(fs.readdirSync(directory).length,1);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

test('D04 does not certify a WebM without observed submitted canvas frames',()=>{
 for(const framePump of [
  undefined,
  {mode:'submitted-frame-request',observedFrameAdvances:0,requestedFrames:0,requestFailures:0},
  {mode:'submitted-frame-request',observedFrameAdvances:0,requestedFrames:2,requestFailures:0},
  {mode:'submitted-frame-request',observedFrameAdvances:2,requestedFrames:3,requestFailures:0},
  {mode:'submitted-frame-request',observedFrameAdvances:2,requestedFrames:2,requestFailures:1},
  {mode:'unknown',observedFrameAdvances:2,requestedFrames:2,requestFailures:0}
 ]){
  assert.equal(assessD04Capture({...good,clip:{...good.clip,framePump}}).classification,
   'UNVERIFIED','A claimed encoded clip must have read-only real frame receipt proof');
 }
});
test('D04 accepts a native stream fallback ONLY after real renderer submissions',()=>{
 const framePump={mode:'native-capture-stream',observedFrameAdvances:4,requestedFrames:0,requestFailures:0};
 assert.equal(assessD04Capture({...good,clip:{...good.clip,framePump}}).combinedVideoAudio,true);
 assert.equal(assessD04Capture({...good,clip:{...good.clip,framePump:{...framePump,observedFrameAdvances:0}}}).classification,'UNVERIFIED');
});


const isolatedValid={
 videoOnly:{source:'real-webgl-canvas-video-only',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8',bytes:32000,videoTracks:1,audioTracks:0,recordingMs:5500,
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:5,requestedFrames:5,requestFailures:0}},
 audioOnly:{source:'real-opted-in-soundstage-audio-only',status:'RECORDED',
  mimeType:'audio/webm;codecs=opus',bytes:8000,videoTracks:0,audioTracks:1,recordingMs:5500}
};

test('D04 independent real source encoders diagnose broken combined mux WITHOUT asserting sample synchronization',()=>{
 const assessment=assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},
  isolated:isolatedValid});
 assert.equal(assessment.combinedVideoAudio,false);
 assert.equal(assessment.isolatedVideoRecorded,true);
 assert.equal(assessment.isolatedAudioRecorded,true);
 assert.equal(assessment.encoderDiagnosis,'SEPARATE_TRACKS_RECORDED_UNALIGNED');
 assert.equal(assessment.classification,'UNVERIFIED');
 assert.equal(assessment.sampleSynchronized,false);
});

test('D04 rejects fabricated video frames and audio-only tracks without consent',()=>{
 const noFrames={...isolatedValid.videoOnly,framePump:{...isolatedValid.videoOnly.framePump,
  observedFrameAdvances:0,requestedFrames:0}};
 const videoFailure=assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE'},
  isolated:{...isolatedValid,videoOnly:noFrames}});
 assert.equal(videoFailure.encoderDiagnosis,'VIDEO_ONLY_ENCODER_UNVERIFIED');
 assert.equal(videoFailure.isolatedVideoRecorded,false);
 const noAudioConsent=assessD04Capture({...good,optedIn:false,isolated:isolatedValid});
 assert.equal(noAudioConsent.isolatedAudioRecorded,false);
 assert.equal(noAudioConsent.encoderDiagnosis,'INDEPENDENT_ENCODERS_UNVERIFIED');
 for(const badAudio of [
  {...isolatedValid.audioOnly,source:'standalone-procedural-audition'},
  {...isolatedValid.audioOnly,mimeType:'video/mp4'},
  {...isolatedValid.audioOnly,bytes:0},
  {...isolatedValid.audioOnly,audioTracks:0}
 ])assert.equal(assessD04Capture({...good,isolated:{...isolatedValid,audioOnly:badAudio}})
  .isolatedAudioRecorded,false);
});

test('D04 persists independent encoded tracks with explicit UNALIGNED provenance and bounded bytes',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-isolated-encoder-'));
 try{
  const raw={clip:{status:'UNAVAILABLE',reason:'Combined WebM returned zero bytes'},
   pcm:{status:'UNAVAILABLE'},isolated:{
    videoOnly:{...isolatedValid.videoOnly,base64:Buffer.alloc(32000,21).toString('base64')},
    audioOnly:{...isolatedValid.audioOnly,base64:Buffer.alloc(8000,42).toString('base64')}},
   frames:{before:1,after:6}};
  const assessment=assessD04Capture({...good,...raw});
  const saved=persistD04CaptureEvidence({directory,raw,assessment,started:{status:'STARTED'}});
  assert.equal(fs.statSync(saved.isolatedVideoWebm).size,32000);
  assert.equal(fs.statSync(saved.isolatedAudioWebm).size,8000);
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.assessment.encoderDiagnosis,'SEPARATE_TRACKS_RECORDED_UNALIGNED');
  assert.equal(manifest.assessment.sampleSynchronized,false);
  assert.equal(manifest.isolated.videoOnly.base64,undefined);
  assert.equal(manifest.isolated.audioOnly.base64,undefined);
  assert.deepEqual(manifest.retained,{webm:false,wav:false,isolatedVideoWebm:true,isolatedAudioWebm:true});
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});


const nativeVideoGood={...isolatedValid.videoOnly,
 source:'real-webgl-canvas-native-video-only',
 framePump:{mode:'native-capture-stream',observedFrameAdvances:3,requestedFrames:0,requestFailures:0}};

test('D04 differentiates genuine native canvas capture from failing explicit-frame encoder',()=>{
 const assessed=assessD04Capture({...good,clip:{...good.clip,bytes:0,status:'UNAVAILABLE'},
  isolated:{videoOnly:{...isolatedValid.videoOnly,status:'UNAVAILABLE',bytes:0},
   nativeVideoOnly:nativeVideoGood,audioOnly:isolatedValid.audioOnly}});
 assert.equal(assessed.isolatedVideoRecorded,false);
 assert.equal(assessed.isolatedNativeVideoRecorded,true);
 assert.equal(assessed.isolatedAudioRecorded,true);
 assert.equal(assessed.encoderDiagnosis,'NATIVE_VIDEO_RECORDED_EXPLICIT_VIDEO_UNVERIFIED');
 assert.equal(assessed.classification,'UNVERIFIED');
 assert.equal(assessed.sampleSynchronized,false);
});

test('D04 native canvas encoder cannot pass from frame requests or generic screen capture alone',()=>{
 for(const invalid of [
  {...nativeVideoGood,source:'playwright-page-video'},
  {...nativeVideoGood,framePump:{...nativeVideoGood.framePump,observedFrameAdvances:0}},
  {...nativeVideoGood,framePump:{mode:'submitted-frame-request',observedFrameAdvances:3,requestedFrames:3,requestFailures:0}},
  {...nativeVideoGood,audioTracks:1},
  {...nativeVideoGood,bytes:0}
 ]){
  assert.equal(assessD04Capture({...good,isolated:{nativeVideoOnly:invalid}})
   .isolatedNativeVideoRecorded,false);
 }
});

test('D04 retains a native video-only probe separately, never as combined A/V',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-native-canvas-'));
 try{
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},
   isolated:{nativeVideoOnly:{...nativeVideoGood,base64:Buffer.alloc(32000,7).toString('base64')}},
   frames:good.frames};
  const assessment=assessD04Capture({...good,...raw});
  const files=persistD04CaptureEvidence({directory,raw,assessment});
  assert.equal(fs.statSync(files.isolatedNativeVideoWebm).size,32000);
  assert.equal(files.webm,null);
  const doc=JSON.parse(fs.readFileSync(files.manifest,'utf8'));
  assert.equal(doc.assessment.combinedVideoAudio,false);
  assert.equal(doc.assessment.sampleSynchronized,false);
  assert.equal(doc.retained.isolatedNativeVideoWebm,true);
  assert.equal(doc.isolated.nativeVideoOnly.base64,undefined);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

test('D04 requires authentic captured-video consumer callbacks before diagnosing encoder-only failure',()=>{
 const {classifyCanvasTrackDelivery}=require('../browser/dungeon-d04-av-evidence.cjs');
 const proof={source:'real-webgl-canvas-capture-video-monitor',mode:'request-video-frame-callback',
  playStatus:'PLAYING',mutedAtStart:false,mutedAtStop:true,
  events:[{kind:'mute',atMs:3000}],frames:[
   {atMs:200,presentedFrames:1,mediaTime:0.04,submittedReceipt:12},
   {atMs:1400,presentedFrames:2,mediaTime:1.24,submittedReceipt:13}]};
 assert.equal(classifyCanvasTrackDelivery({delivery:proof,encodedBytes:0,submittedFrames:2}),
  'CANVAS_FRAMES_DELIVERED_ENCODER_EMPTY');
 assert.equal(classifyCanvasTrackDelivery({delivery:proof,encodedBytes:32000,submittedFrames:2}),
  'CANVAS_FRAMES_DELIVERED_AND_ENCODED_UNALIGNED');
});
test('D04 video monitor never mistakes a mute event or renderer receipt for decoded canvas video',()=>{
 const {classifyCanvasTrackDelivery}=require('../browser/dungeon-d04-av-evidence.cjs');
 const source='real-webgl-canvas-capture-video-monitor';
 const noFrames={source,mode:'request-video-frame-callback',playStatus:'PLAYING',
  mutedAtStart:false,mutedAtStop:true,events:[{kind:'mute',atMs:1200}],frames:[]};
 assert.equal(classifyCanvasTrackDelivery({delivery:noFrames,encodedBytes:0,submittedFrames:3}),
  'TRACK_MUTED_WITHOUT_PRESENTED_FRAMES');
 assert.equal(classifyCanvasTrackDelivery({delivery:{...noFrames,mutedAtStop:false,events:[]},
  encodedBytes:0,submittedFrames:3}),'TRACK_DELIVERY_UNVERIFIED');
 assert.equal(classifyCanvasTrackDelivery({delivery:{...noFrames,playStatus:'REJECTED'},
  encodedBytes:0,submittedFrames:3}),'TRACK_DELIVERY_UNVERIFIED');
});
test('D04 video delivery monitor rejects fabricated, unbounded or non-monotonic frame evidence',()=>{
 const {classifyCanvasTrackDelivery}=require('../browser/dungeon-d04-av-evidence.cjs');
 const ok={source:'real-webgl-canvas-capture-video-monitor',mode:'request-video-frame-callback',
  playStatus:'PLAYING',mutedAtStart:false,mutedAtStop:false,events:[],
  frames:[{atMs:100,presentedFrames:1,mediaTime:0.1,submittedReceipt:3},
   {atMs:240,presentedFrames:2,mediaTime:0.2,submittedReceipt:4}]};
 for(const bad of [
  {...ok,source:'synthetic-test-canvas'},
  {...ok,frames:[ok.frames[1],ok.frames[0]]},
  {...ok,frames:[{...ok.frames[0],presentedFrames:0}]},
  {...ok,frames:Array.from({length:33},(_,i)=>({...ok.frames[0],atMs:i*20,presentedFrames:i+1}))},
  {...ok,frames:[{...ok.frames[0],mediaTime:NaN}]}
 ])assert.equal(classifyCanvasTrackDelivery({delivery:bad,encodedBytes:0,submittedFrames:2}),
  'TRACK_DELIVERY_UNVERIFIED');
});

test('D04 track delivery diagnosis survives assessment and evidence persistence without upgrading sync',()=>{
 const delivery={source:'real-webgl-canvas-capture-video-monitor',
  mode:'request-video-frame-callback',playStatus:'PLAYING',
  mutedAtStart:false,mutedAtStop:true,
  events:[{kind:'mute',atMs:3400}],
  frames:[{atMs:1400,presentedFrames:1,mediaTime:0.1,submittedReceipt:18}]};
 const raw={clip:{...good.clip,status:'UNAVAILABLE',bytes:0},
  pcm:good.pcm,frames:good.frames,trackDelivery:delivery};
 const assessed=assessD04Capture({...good,...raw});
 assert.equal(assessed.trackDiagnosis,'CANVAS_FRAMES_DELIVERED_ENCODER_EMPTY');
 assert.equal(assessed.sampleSynchronized,false);
 assert.equal(assessed.classification,'UNVERIFIED');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-track-receipt-'));
 try{
  const saved=persistD04CaptureEvidence({directory,raw,assessment:assessed});
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.deepEqual(manifest.trackDelivery,delivery);
  assert.equal(manifest.assessment.trackDiagnosis,'CANVAS_FRAMES_DELIVERED_ENCODER_EMPTY');
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});


test('D04 visible real-canvas monitor resolves the pre-mute submission window without inventing presented frames',()=>{
 const {classifyCanvasSubmissionTiming}=require('../browser/dungeon-d04-av-evidence.cjs');
 const delivery={
  source:'real-webgl-canvas-capture-video-monitor',
  presentation:'visible-2px-real-track',
  mode:'request-video-frame-callback',
  consumerVisibleAtStart:true,
  clock:'performance-now-relative-capture-start',
  playStatus:'PLAYING',
  events:[{kind:'mute',atMs:4800}],
  frames:[]
 };
 const framePump={mode:'submitted-frame-request',submissionSamples:[
  {atMs:700,receipt:3,requestAttempted:true,requestSucceeded:true},
  {atMs:5200,receipt:4,requestAttempted:true,requestSucceeded:true}
 ]};
 assert.equal(classifyCanvasSubmissionTiming({delivery,framePump}),
  'PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION');
 assert.equal(classifyCanvasSubmissionTiming({delivery,
  framePump:{...framePump,submissionSamples:[framePump.submissionSamples[1]]}}),
  'ONLY_POST_MUTE_SUBMISSIONS_WITHOUT_PRESENTATION');
 assert.equal(classifyCanvasSubmissionTiming({delivery:{...delivery,events:[]},framePump}),
  'SUBMISSIONS_WITHOUT_PRESENTATION_MUTE_UNOBSERVED');
 assert.equal(classifyCanvasSubmissionTiming({delivery:{...delivery,
  frames:[{atMs:1200,presentedFrames:1,mediaTime:0.5,submittedReceipt:3}]},framePump}),
  'PRESENTED_CANVAS_FRAME_RECEIPT_TIMED');
});

test('D04 submission diagnostic rejects hidden/cross-clock/fabricated or unbounded timeline receipts',()=>{
 const {classifyCanvasSubmissionTiming}=require('../browser/dungeon-d04-av-evidence.cjs');
 const delivery={
  source:'real-webgl-canvas-capture-video-monitor',presentation:'visible-2px-real-track',
  mode:'request-video-frame-callback',
  consumerVisibleAtStart:true,
  clock:'performance-now-relative-capture-start',playStatus:'PLAYING',
  events:[{kind:'mute',atMs:1000}],frames:[]};
 const samples=[{atMs:200,receipt:9,requestAttempted:true,requestSucceeded:true},
  {atMs:300,receipt:10,requestAttempted:true,requestSucceeded:true}];
 const framePump={mode:'submitted-frame-request',submissionSamples:samples};
 for(const bad of [
  {delivery:{...delivery,presentation:'hidden-transparent'},framePump},
  {delivery:{...delivery,clock:'unrelated-clock'},framePump},
  {delivery,framePump:{...framePump,submissionSamples:[samples[1],samples[0]]}},
  {delivery,framePump:{...framePump,submissionSamples:[samples[0],samples[0]]}},
  {delivery,framePump:{...framePump,submissionSamples:[{...samples[0],receipt:NaN}]}},
  {delivery,framePump:{...framePump,submissionSamples:Array.from({length:33},(_,i)=>({
   atMs:i*25,receipt:i+1,requestAttempted:true,requestSucceeded:true
  }))}},
  {delivery,framePump:{...framePump,submissionSamples:[{...samples[0],requestSucceeded:false}]}},
  {delivery:{...delivery,events:[{kind:'mute',atMs:-1}]},framePump}
 ])assert.equal(classifyCanvasSubmissionTiming(bad),'SUBMISSION_TIMING_UNVERIFIED');
});

test('D04 retains diagnostic classification without treating track delivery as sample sync',()=>{
 const {classifyCanvasSubmissionTiming}=require('../browser/dungeon-d04-av-evidence.cjs');
 const delivery={source:'real-webgl-canvas-capture-video-monitor',
  presentation:'visible-2px-real-track',
  mode:'request-video-frame-callback',
  consumerVisibleAtStart:true,clock:'performance-now-relative-capture-start',
  playStatus:'PLAYING',events:[{kind:'mute',atMs:4800}],frames:[]};
 const framePump={mode:'submitted-frame-request',observedFrameAdvances:1,
  requestedFrames:1,requestFailures:0,submissionSamples:[
   {atMs:100,receipt:2,requestAttempted:true,requestSucceeded:true}]};
 const raw={...good,clip:{...good.clip,framePump},trackDelivery:delivery};
 const a=assessD04Capture(raw);
 assert.equal(classifyCanvasSubmissionTiming({delivery,framePump}),
  'PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION');
 assert.equal(a.submissionDiagnosis,'PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION');
 assert.equal(a.sampleSynchronized,false);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-visible-receipt-'));
 try{
  const saved=persistD04CaptureEvidence({directory,raw,assessment:a});
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.assessment.submissionDiagnosis,'PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION');
  assert.equal(manifest.clip.framePump.submissionSamples.length,1);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

// Differential control probes must never be presented as genuine combat media.

const {classifyCanvasEncoderControl}=require('../browser/dungeon-d04-av-evidence.cjs');
const comparisonControl={
 source:'synthetic-2d-canvas-encoder-control-not-gameplay',
 status:'RECORDED',mimeType:'video/webm;codecs=vp8',
 bytes:18000,recordingMs:5500,videoTracks:1,audioTracks:0,
 drawnFrames:40,canvasWidth:64,canvasHeight:64
};
const comparisonReal={
 source:'real-webgl-canvas-video-only',status:'UNAVAILABLE',
 mimeType:'video/webm;codecs=vp8',bytes:0,videoTracks:1,audioTracks:0,
 recordingMs:5500,framePump:{mode:'submitted-frame-request',
  observedFrameAdvances:4,requestedFrames:4,requestFailures:0}
};
test('D04 synthetic 2D positive-control encoding isolates real WebGL track failure without claiming A/V sync',()=>{
 const comparison=classifyCanvasEncoderControl({control:comparisonControl,real:comparisonReal});
 assert.equal(comparison,'CONTROL_ENCODES_REAL_WEBGL_EMPTY');
 const assessed=assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},isolated:{
  videoOnly:comparisonReal,control2dOnly:comparisonControl}});
 assert.equal(assessed.canvasEncoderDifferential,'CONTROL_ENCODES_REAL_WEBGL_EMPTY');
 assert.equal(assessed.classification,'UNVERIFIED'); // synthetic control MUST NOT certify actual game.
 assert.equal(assessed.isolatedVideoRecorded,false);
 assert.equal(assessed.sampleSynchronized,false);
});
test('D04 comparison is inconclusive if BOTH video paths fail; no encoder root cause is invented',()=>{
 const failedControl={...comparisonControl,status:'UNAVAILABLE',bytes:0};
 assert.equal(classifyCanvasEncoderControl({control:failedControl,real:comparisonReal}),
  'BOTH_VIDEO_PATHS_UNVERIFIED');
 assert.equal(classifyCanvasEncoderControl({control:comparisonControl,real:{
  ...comparisonReal,status:'RECORDED',bytes:24000}}),
  'BOTH_VIDEO_PATHS_ENCODED_UNALIGNED');
});
test('D04 rejects synthetic or non-video provenance, unbounded controls and absent real frame receipts',()=>{
 const invalidControls=[
  {...comparisonControl,source:'real-webgl-canvas-video-only'},
  {...comparisonControl,drawnFrames:0},
  {...comparisonControl,drawnFrames:500},
  {...comparisonControl,bytes:25*1024*1024},
  {...comparisonControl,canvasWidth:2048},
  {...comparisonControl,mimeType:'audio/webm'},
  {...comparisonControl,videoTracks:0},
  {...comparisonControl,recordingMs:250}
 ];
 for(const control of invalidControls)assert.equal(
  classifyCanvasEncoderControl({control,real:comparisonReal}),
  'CONTROL_COMPARISON_UNVERIFIED');
 for(const real of [
  {...comparisonReal,source:'playwright-screen-recording'},
  {...comparisonReal,framePump:{...comparisonReal.framePump,observedFrameAdvances:0}},
  {...comparisonReal,framePump:{...comparisonReal.framePump,requestFailures:1}}
 ])assert.equal(classifyCanvasEncoderControl({control:comparisonControl,real}),
  'CONTROL_COMPARISON_UNVERIFIED');
});
test('D04 diagnostic manifest records synthetic control metadata but NEVER stores synthetic video bytes',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-2d-encoder-control-'));
 try{
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},
   isolated:{videoOnly:comparisonReal,control2dOnly:{
    ...comparisonControl,base64:Buffer.alloc(18000,3).toString('base64')}},
   frames:{before:10,after:14}};
  const assessment=assessD04Capture({...good,...raw});
  const saved=persistD04CaptureEvidence({directory,raw,assessment});
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.assessment.canvasEncoderDifferential,'CONTROL_ENCODES_REAL_WEBGL_EMPTY');
  assert.equal(manifest.isolated.control2dOnly.base64,undefined);
  assert.equal(manifest.isolated.control2dOnly.source,comparisonControl.source);
  assert.deepEqual(fs.readdirSync(directory),['dungeon-d04-live-av-evidence.json']);
  assert.equal(manifest.assessment.sampleSynchronized,false);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

/**
 * Two simultaneously failing canvas recorders cannot reveal whether competing
 * MediaRecorder instances starve this CI environment. A serial positive control
 * must run AFTER the live game/PCM probes settle, and may never certify Dungeon.
 */
test('D04 post-release 2D recorder distinguishes serial recovery from concurrent failure',()=>{
 const {classifySequentialCanvasEncoderProbe}=require('../browser/dungeon-d04-av-evidence.cjs');
 const concurrent={...comparisonControl,status:'UNAVAILABLE',bytes:0};
 const serial={...comparisonControl,
  source:'synthetic-2d-canvas-serial-control-not-gameplay',
  phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true};
 assert.equal(classifySequentialCanvasEncoderProbe({concurrent,serial}),
  'POST_RELEASE_ENCODER_RECOVERED');
 assert.equal(classifySequentialCanvasEncoderProbe({concurrent,
  serial:{...serial,status:'UNAVAILABLE',bytes:0}}),
  'POST_RELEASE_ENCODER_STILL_UNVERIFIED');
 assert.equal(classifySequentialCanvasEncoderProbe({concurrent:comparisonControl,serial}),
  'CONTROL_RECORDED_WITH_AND_WITHOUT_PARALLEL_ENCODERS');
});

test('D04 serial control fails closed on overlapping recorders or untrustworthy provenance',()=>{
 const {classifySequentialCanvasEncoderProbe}=require('../browser/dungeon-d04-av-evidence.cjs');
 const serial={...comparisonControl,source:'synthetic-2d-canvas-serial-control-not-gameplay',
  phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true};
 for(const bad of [
  {...serial,source:'real-gameplay'},
  {...serial,phase:'overlapping-encoders'},
  {...serial,primaryRecordersSettled:false},
  {...serial,primaryRecordersSettled:undefined},
  {...serial,drawnFrames:0},
  {...serial,mimeType:'audio/webm'},
  {...serial,videoTracks:0},
  {...serial,bytes:2*1024*1024+1},
  {...serial,recordingMs:20000}
 ])assert.equal(classifySequentialCanvasEncoderProbe({
   concurrent:comparisonControl,serial:bad}),'SERIAL_CONTROL_UNVERIFIED');
});

test('D04 serial-only encoder success never upgrades actual game A/V acceptance',()=>{
 const concurrent={...comparisonControl,status:'UNAVAILABLE',bytes:0};
 const serial={...comparisonControl,source:'synthetic-2d-canvas-serial-control-not-gameplay',
  phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true};
 const assessed=assessD04Capture({...good,
  clip:{...good.clip,status:'UNAVAILABLE',bytes:0},
  isolated:{videoOnly:comparisonReal,control2dOnly:concurrent,serial2dOnly:serial}});
 assert.equal(assessed.serialCanvasEncoderDifferential,'POST_RELEASE_ENCODER_RECOVERED');
 assert.equal(assessed.combinedVideoAudio,false);
 assert.equal(assessed.isolatedVideoRecorded,false);
 assert.equal(assessed.sampleSynchronized,false);
 assert.equal(assessed.classification,'UNVERIFIED');
});

test('D04 serial synthetic control keeps only bounded metadata and never persists video',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-serial-control-'));
 try{
  const serial={...comparisonControl,source:'synthetic-2d-canvas-serial-control-not-gameplay',
   phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true,
   base64:Buffer.alloc(18000,17).toString('base64')};
  const concurrent={...comparisonControl,status:'UNAVAILABLE',bytes:0};
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},
   isolated:{videoOnly:comparisonReal,control2dOnly:concurrent,serial2dOnly:serial},
   frames:{before:10,after:14}};
  const assessment=assessD04Capture({...good,...raw});
  const saved=persistD04CaptureEvidence({directory,raw,assessment});
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.assessment.serialCanvasEncoderDifferential,'POST_RELEASE_ENCODER_RECOVERED');
  assert.equal(manifest.isolated.serial2dOnly.base64,undefined);
  assert.equal(manifest.isolated.serial2dOnly.source,serial.source);
  assert.deepEqual(fs.readdirSync(directory),['dungeon-d04-live-av-evidence.json']);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

const serialGameVideo={
 source:'real-webgl-canvas-serial-video-only',phase:'after-all-primary-encoders-settled',
 primaryRecordersSettled:true,status:'RECORDED',mimeType:'video/webm;codecs=vp8',
 videoTracks:1,audioTracks:0,bytes:4096,recordingMs:5500,
 framePump:{mode:'native-capture-stream',observedFrameAdvances:3,requestedFrames:0,
  requestFailures:0,receiptStart:13,receiptEnd:16}
};
test('D04 strictly gates the real serial video-only experiment on independent actual frame receipts',()=>{
 const raw={...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},
  isolated:{videoOnly:comparisonReal,audioOnly:isolatedValid.audioOnly,
   serialRealVideo:serialGameVideo}};
 const a=assessD04Capture(raw);
 assert.equal(a.serialRealVideoRecorded,true);
 assert.equal(a.combinedVideoAudio,false);
 assert.equal(a.classification,'UNVERIFIED');
 assert.equal(a.sampleSynchronized,false);
});
test('D04 serial real-video bytes cannot be certified by unrelated late frames or synthetic control',()=>{
 for(const bad of [
  {...serialGameVideo,source:'synthetic-2d-canvas-serial-control-not-gameplay'},
  {...serialGameVideo,phase:'overlapping-primary-encoders'},
  {...serialGameVideo,primaryRecordersSettled:false},
  {...serialGameVideo,bytes:0},
  {...serialGameVideo,videoTracks:0},
  {...serialGameVideo,audioTracks:1},
  {...serialGameVideo,framePump:{...serialGameVideo.framePump,receiptStart:16}},
  {...serialGameVideo,framePump:{...serialGameVideo.framePump,observedFrameAdvances:0}},
  {...serialGameVideo,framePump:{...serialGameVideo.framePump,requestFailures:1}},
  {...serialGameVideo,framePump:{...serialGameVideo.framePump,mode:'submitted-frame-request'}},
  {...serialGameVideo,framePump:{...serialGameVideo.framePump,receiptEnd:50}},
 ]){
  assert.equal(assessD04Capture({...good,isolated:{serialRealVideo:bad}})
   .serialRealVideoRecorded,false);
 }
});
test('D04 persists only independently qualified serial real WebGL bytes and never upgrades sync',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-serial-real-video-'));
 try{
  const media=Buffer.alloc(4096,19);
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},frames:good.frames,
   isolated:{serialRealVideo:{...serialGameVideo,base64:media.toString('base64')}}};
  const assessment=assessD04Capture({...good,...raw});
  const saved=persistD04CaptureEvidence({directory,raw,assessment});
  assert.equal(fs.readFileSync(saved.serialRealVideoWebm).compare(media),0);
  const manifest=JSON.parse(fs.readFileSync(saved.manifest,'utf8'));
  assert.equal(manifest.isolated.serialRealVideo.base64,undefined);
  assert.equal(manifest.retained.serialRealVideoWebm,true);
  assert.equal(manifest.assessment.classification,'UNVERIFIED');
  assert.equal(manifest.assessment.sampleSynchronized,false);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});


/**
 * D04 real WebGL readback-to-2D capture is NOT the synthetic canvas control.
 * It must copy pixels only when a new authenticated renderer receipt arrives,
 * prove multiple distinguishable non-flat game images and preserve phase bounds.
 */
const authenticReadback={
 source:'real-webgl-receipt-readback-serial-video-only',
 phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true,
 status:'RECORDED',mimeType:'video/webm;codecs=vp8',videoTracks:1,audioTracks:0,
 bytes:8400,recordingMs:5500,canvasWidth:640,canvasHeight:400,
 framePump:{mode:'real-webgl-render-receipt-readback',receiptStart:21,receiptEnd:25,
  observedFrameAdvances:4,requestedFrames:3,requestFailures:0,
  samples:[{receipt:22,atMs:180,colors:48,signature:'a8d0c1f2'},
   {receipt:23,atMs:990,colors:52,signature:'d9b6c201'},
   {receipt:25,atMs:4100,colors:51,signature:'f813caa9'}]}
};
test('D04 qualifies exclusively real receipt-driven WebGL pixel readback as separate UNALIGNED video',()=>{
 const {classifyReceiptReadbackVideo}=require('../browser/dungeon-d04-av-evidence.cjs');
 assert.equal(classifyReceiptReadbackVideo(authenticReadback),'REAL_WEBGL_READBACK_VIDEO_RECORDED_UNALIGNED');
 const assessed=assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},
  isolated:{receiptReadbackVideo:authenticReadback}});
 assert.equal(assessed.receiptReadbackVideoRecorded,true);
 assert.equal(assessed.combinedVideoAudio,false);
 assert.equal(assessed.sampleSynchronized,false);
 assert.equal(assessed.classification,'UNVERIFIED');
});
test('D04 never certifies flat, identical, unsupported or synthetic pixels as genuine changing game footage',()=>{
 const {classifyReceiptReadbackVideo}=require('../browser/dungeon-d04-av-evidence.cjs');
 for(const invalid of [
  {...authenticReadback,source:'synthetic-2d-canvas-serial-control-not-gameplay'},
  {...authenticReadback,phase:'overlapping-primary-encoders'},
  {...authenticReadback,primaryRecordersSettled:false},
  {...authenticReadback,videoTracks:0},
  {...authenticReadback,audioTracks:1},
  {...authenticReadback,canvasWidth:1920},
  {...authenticReadback,recordingMs:20000},
  {...authenticReadback,bytes:0},
  {...authenticReadback,framePump:{...authenticReadback.framePump,observedFrameAdvances:1}},
  {...authenticReadback,framePump:{...authenticReadback.framePump,requestedFrames:2}},
  {...authenticReadback,framePump:{...authenticReadback.framePump,requestFailures:1}},
  {...authenticReadback,framePump:{...authenticReadback.framePump,samples:
   authenticReadback.framePump.samples.map(s=>({...s,colors:1}))}},
  {...authenticReadback,framePump:{...authenticReadback.framePump,samples:
   authenticReadback.framePump.samples.map(s=>({...s,signature:'ffffffff'}))}},
  {...authenticReadback,framePump:{...authenticReadback.framePump,samples:
   [...authenticReadback.framePump.samples].reverse()}}
 ])assert.notEqual(classifyReceiptReadbackVideo(invalid),
  'REAL_WEBGL_READBACK_VIDEO_RECORDED_UNALIGNED');
});
test('D04 readback failures are explicitly UNVERIFIED rather than confused with missing video encoders',()=>{
 const {classifyReceiptReadbackVideo}=require('../browser/dungeon-d04-av-evidence.cjs');
 assert.equal(classifyReceiptReadbackVideo({...authenticReadback,status:'UNAVAILABLE',bytes:0}),
  'REAL_WEBGL_READBACK_VIDEO_UNVERIFIED');
 assert.equal(classifyReceiptReadbackVideo({source:'fake-game',status:'RECORDED'}),
  'READBACK_PROVENANCE_UNVERIFIED');
});
test('D04 retains only provenance-qualified readback video and excludes diagnostic synthetic bytes',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-real-webgl-readback-'));
 try{
  const content=Buffer.alloc(8400,29);
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},frames:good.frames,
   isolated:{receiptReadbackVideo:{...authenticReadback,base64:content.toString('base64')},
    serial2dOnly:{source:'synthetic-2d-canvas-serial-control-not-gameplay',
     base64:Buffer.alloc(3000,17).toString('base64')}}};
  const assessment=assessD04Capture({...good,...raw});
  const files=persistD04CaptureEvidence({directory,raw,assessment});
  assert.equal(fs.readFileSync(files.receiptReadbackVideoWebm).compare(content),0);
  const saved=JSON.parse(fs.readFileSync(files.manifest,'utf8'));
  assert.equal(saved.assessment.receiptReadbackVideoRecorded,true);
  assert.equal(saved.assessment.sampleSynchronized,false);
  assert.equal(saved.retained.receiptReadbackVideoWebm,true);
  assert.equal(saved.isolated.receiptReadbackVideo.base64,undefined);
  assert.equal(saved.isolated.serial2dOnly.base64,undefined);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});


/**
 * Pixel samples below represent DECODER measurements of real Playwright
 * screenshots of #world after authenticated WebGL render receipts. They are
 * a compositor visibility witness, not an invented alternate game video.
 */
const genuineWorldStills={
 source:'playwright-world-element-compositor-screenshots',
 capture:'receipt-bracketed-png',
 view:'desktop-1440x900',viewport:{width:1440,height:900},
 seed:'visual-room-art-18',samples:[
  {beforeReceipt:51,afterReceipt:52,atMs:1100,run:1,floor:1,tick:211,checksum:'state-A',
   pngBytes:190111,colors:50,signature:'abc102dc',width:800,height:500},
  {beforeReceipt:53,afterReceipt:54,atMs:2500,run:1,floor:1,tick:212,checksum:'state-B',
   pngBytes:185260,colors:44,signature:'8a009cad',width:800,height:500},
  {beforeReceipt:56,afterReceipt:56,atMs:3700,run:1,floor:1,tick:213,checksum:'state-C',
   pngBytes:181930,colors:64,signature:'88f4c91d',width:800,height:500}
 ]
};
test('D04 compositor witness admits changing real world stills but never certifies audiovisual sync',()=>{
 const {classifyCompositorWitness}=require('../browser/dungeon-d04-av-evidence.cjs');
 assert.equal(classifyCompositorWitness(genuineWorldStills),
  'REAL_COMPOSITOR_WORLD_STILLS_CHANGING_UNALIGNED');
 assert.equal(classifyCompositorWitness({...genuineWorldStills,view:'mobile-390x844',
  viewport:{width:390,height:844}}),
  'REAL_COMPOSITOR_WORLD_STILLS_CHANGING_UNALIGNED');
});
test('D04 compositor witness rejects static, flat, made-up, unbracketed and out-of-budget samples',()=>{
 const {classifyCompositorWitness}=require('../browser/dungeon-d04-av-evidence.cjs');
 const s=genuineWorldStills.samples;
 const bad=[
  {...genuineWorldStills,source:'synthetic-2d-canvas-encoder-control-not-gameplay'},
  {...genuineWorldStills,capture:'late-framebuffer-readback'},
  {...genuineWorldStills,view:'director-reoriented'},
  {...genuineWorldStills,viewport:{width:320,height:240}},
  {...genuineWorldStills,samples:s.slice(0,1)},
  {...genuineWorldStills,samples:s.map(v=>({...v,colors:1}))},
  {...genuineWorldStills,samples:s.map(v=>({...v,signature:'abc102dc'}))},
  {...genuineWorldStills,samples:s.map(v=>({...v,tick:211}))},
  {...genuineWorldStills,samples:[s[0],{...s[1],beforeReceipt:50},s[2]]},
  {...genuineWorldStills,samples:[s[0],{...s[1],afterReceipt:50},s[2]]},
  {...genuineWorldStills,samples:[s[0],{...s[1],atMs:500},s[2]]},
  {...genuineWorldStills,samples:[s[0],{...s[1],run:2},s[2]]},
  {...genuineWorldStills,samples:[s[0],{...s[1],pngBytes:25*1024*1024},s[2]]},
  {...genuineWorldStills,samples:[s[0],{...s[1],checksum:''},s[2]]}
 ];
 for(const example of bad)
  assert.notEqual(classifyCompositorWitness(example),
   'REAL_COMPOSITOR_WORLD_STILLS_CHANGING_UNALIGNED');
});


/**
 * The genuine GitHub browser artifact at D04 commit d123738 had 14,055 bytes
 * of VP8 WebM but ONLY ONE independently decoded frame. Container bytes are
 * not moving footage. The decoder must fail closed on that real failure mode.
 */
const authenticDecodedVideo={
 source:'ffmpeg-decoded-real-webgl-serial-video',
 method:'framemd5-24x16-first-64',status:'DECODED',codec:'vp8',
 frameCount:3,distinctFrames:2,
 hashes:['6ea9125b620d27942879d5e3ab9af608',
  '2c6c11e357058753d8b68b0718b8b30e',
  '2c6c11e357058753d8b68b0718b8b30e']
};
test('D04 never upgrades real encoded WebM bytes to moving gameplay without two different decoded frames',()=>{
 const {classifyDecodedSerialGameplay}=require('../browser/dungeon-d04-av-evidence.cjs');
 const single={...authenticDecodedVideo,frameCount:1,distinctFrames:1,
  hashes:authenticDecodedVideo.hashes.slice(0,1)};
 assert.equal(classifyDecodedSerialGameplay({video:serialGameVideo,decoder:single}),
  'SERIAL_REAL_WEBGL_ONE_OR_STATIC_FRAME_UNVERIFIED');
 assert.equal(assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},isolated:{serialRealVideo:serialGameVideo},
  decoder:{serialRealVideo:single}}).serialRealVideoMotionQualified,false);
 assert.equal(classifyDecodedSerialGameplay({video:serialGameVideo,decoder:authenticDecodedVideo}),
  'SERIAL_REAL_WEBGL_MOVING_VIDEO_UNALIGNED');
 const verified=assessD04Capture({...good,clip:{...good.clip,status:'UNAVAILABLE',bytes:0},isolated:{serialRealVideo:serialGameVideo},
  decoder:{serialRealVideo:authenticDecodedVideo}});
 assert.equal(verified.serialRealVideoRecorded,true);
 assert.equal(verified.serialRealVideoMotionQualified,true);
 assert.equal(verified.sampleSynchronized,false);
 assert.equal(verified.classification,'UNVERIFIED');
});
test('D04 frame decoder policy rejects nonexistent, synthetic, forged or unbounded motion evidence',()=>{
 const {classifyDecodedSerialGameplay}=require('../browser/dungeon-d04-av-evidence.cjs');
 const invalid=[
  {...authenticDecodedVideo,source:'synthetic-2d-canvas'},
  {...authenticDecodedVideo,method:'claimed-screen-recorder'},
  {...authenticDecodedVideo,codec:'h264'},
  {...authenticDecodedVideo,frameCount:80},
  {...authenticDecodedVideo,frameCount:2},
  {...authenticDecodedVideo,distinctFrames:3},
  {...authenticDecodedVideo,hashes:['fake','fake','fake']},
  {...authenticDecodedVideo,status:'UNAVAILABLE'}
 ];
 for(const decoder of invalid)
  assert.notEqual(classifyDecodedSerialGameplay({video:serialGameVideo,decoder}),
   'SERIAL_REAL_WEBGL_MOVING_VIDEO_UNALIGNED');
 assert.notEqual(classifyDecodedSerialGameplay({video:{
  ...serialGameVideo,source:'synthetic-2d-canvas'},decoder:authenticDecodedVideo}),
  'SERIAL_REAL_WEBGL_MOVING_VIDEO_UNALIGNED');
});


test('D04 retains original same-window WebGL+Opus for independent forensic decoding even when motion cannot be accepted',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'d04-real-unaligned-original-'));
 try{
  const original=Buffer.alloc(4096,67);
  const actual={source:'real-webgl-receipt-readback-serial-original-audio',
   status:'RECORDED',mimeType:'video/webm;codecs=vp8,opus',
   videoTracks:1,audioTracks:1,optedInAtStart:true,
   originalSoundstageTrackLive:true,phase:'after-all-primary-encoders-settled',
   primaryRecordersSettled:true,bytes:original.length,recordingMs:5500,
   base64:original.toString('base64')};
  const raw={clip:{status:'UNAVAILABLE'},pcm:{status:'UNAVAILABLE'},
   isolated:{sameWindowReadbackAV:actual},frames:good.frames};
  const assessment={...assessD04Capture({...good,...raw}),
   sameWindowMovingAV:false,sampleSynchronized:false};
  const result=persistD04CaptureEvidence({directory,raw,assessment});
  assert.equal(fs.readFileSync(result.sameWindowAVWebm).compare(original),0,
   'retain genuine recording bytes to diagnose sparse/undecodable WebGL');
  assert.match(result.sameWindowAVWebm,/UNVERIFIED\\.webm$/);
  const manifest=JSON.parse(fs.readFileSync(result.manifest,'utf8'));
  assert.equal(manifest.retained.sameWindowAVWebm,true);
  assert.equal(manifest.assessment.sameWindowMovingAV,false);
  assert.equal(manifest.assessment.sampleSynchronized,false);
  assert.equal(manifest.isolated.sameWindowReadbackAV.base64,undefined);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});
test('D04 never archives synthetic, silent, nonconsented or mismatched original-readback bytes as gameplay evidence',()=>{
 const invalid=[
  {source:'synthetic-2d-canvas',status:'RECORDED'},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'UNAVAILABLE'},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',optedInAtStart:false},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',originalSoundstageTrackLive:false},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',videoTracks:0},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',audioTracks:0},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',bytes:25000000},
  {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',phase:'overlapping-primary-encoders'}
 ];
 const {shouldArchiveUnalignedOriginalReadback}=require('../browser/dungeon-d04-av-evidence.cjs');
 const correct={source:'real-webgl-receipt-readback-serial-original-audio',
  status:'RECORDED',mimeType:'video/webm;codecs=vp8,opus',
  videoTracks:1,audioTracks:1,optedInAtStart:true,
  originalSoundstageTrackLive:true,phase:'after-all-primary-encoders-settled',
  primaryRecordersSettled:true,bytes:4096,recordingMs:5500};
 assert.equal(shouldArchiveUnalignedOriginalReadback(correct),true);
 for(const variant of invalid){
  assert.equal(shouldArchiveUnalignedOriginalReadback({...correct,...variant}),false,
   JSON.stringify(variant));
 }
});
