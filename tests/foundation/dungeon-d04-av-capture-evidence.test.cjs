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
