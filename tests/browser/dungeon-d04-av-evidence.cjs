'use strict';

/**
 * Evidence policy for the isolated D04 preview. An authentic browser run may
 * produce a WebM from the actual canvas + opted-in soundstage and a separate
 * live PCM sample. Neither file proves sample-level A/V alignment.
 *
 * Keep this pure and conservative: a missing device, silent track, codec
 * failure or synthetic audition is UNVERIFIED, not a passing realism score.
 */
const MAX_CLIP_BYTES=20*1024*1024;
const MAX_PCM_BYTES=2*1024*1024;
const MAX_ISOLATED_VIDEO_BYTES=MAX_CLIP_BYTES;
const MAX_ISOLATED_AUDIO_BYTES=2*1024*1024;
function hasConfirmedCanvasFrames(framePump){
 return framePump?.requestFailures===0&&
  Number.isSafeInteger(framePump.observedFrameAdvances)&&framePump.observedFrameAdvances>0&&
  ((framePump.mode==='submitted-frame-request'&&
    Number.isSafeInteger(framePump.requestedFrames)&&framePump.requestedFrames>0&&
    framePump.requestedFrames<=framePump.observedFrameAdvances)||
   (framePump.mode==='native-capture-stream'&&framePump.requestedFrames===0));
}
/**
 * A read-only HTMLVideoElement receives the original canvas.captureStream()
 * track during authentic playback. requestVideoFrameCallback on that consumer
 * establishes track delivery, not encoder success or A/V sample alignment.
 * A mute event alone does not identify a WebGL, compositor or codec root cause.
 */
function classifyCanvasTrackDelivery({delivery={},encodedBytes=0,submittedFrames=0}={}){
 const observations=delivery.frames,events=delivery.events;
 if(delivery.source!=='real-webgl-canvas-capture-video-monitor'||
  delivery.mode!=='request-video-frame-callback'||
  delivery.playStatus!=='PLAYING'||
  !Array.isArray(observations)||observations.length>32||
  !Array.isArray(events)||events.length>32||
  !Number.isSafeInteger(submittedFrames)||submittedFrames<0||
  !Number.isSafeInteger(encodedBytes)||encodedBytes<0||encodedBytes>MAX_CLIP_BYTES||
  !events.every(e=>['mute','unmute','ended'].includes(e.kind)&&
   Number.isFinite(e.atMs)&&e.atMs>=0&&e.atMs<=20000))
  return 'TRACK_DELIVERY_UNVERIFIED';
 let lastTime=-1,lastPresented=0,lastMedia=-1;
 for(const observation of observations){
  if(!Number.isFinite(observation.atMs)||observation.atMs<0||
   observation.atMs>20000||observation.atMs<=lastTime||
   !Number.isSafeInteger(observation.presentedFrames)||
   observation.presentedFrames<=lastPresented||
   !Number.isFinite(observation.mediaTime)||observation.mediaTime<lastMedia||
   !Number.isSafeInteger(observation.submittedReceipt)||observation.submittedReceipt<0)
   return 'TRACK_DELIVERY_UNVERIFIED';
  lastTime=observation.atMs;
  lastPresented=observation.presentedFrames;
  lastMedia=observation.mediaTime;
 }
 if(observations.length>0&&submittedFrames>0)
  return encodedBytes>1024?'CANVAS_FRAMES_DELIVERED_AND_ENCODED_UNALIGNED':
   'CANVAS_FRAMES_DELIVERED_ENCODER_EMPTY';
 if(observations.length===0&&delivery.mutedAtStop===true&&
  events.some(e=>e.kind==='mute')&&submittedFrames>0)
  return 'TRACK_MUTED_WITHOUT_PRESENTED_FRAMES';
 return 'TRACK_DELIVERY_UNVERIFIED';
}

/**
 * Timeline-only diagnostic. These events share one performance.now() origin,
 * but they are not media PTS, are never proof of audible/rendered alignment,
 * and cannot certify real video without the consumer's frame callback.
 */
function classifyCanvasSubmissionTiming({delivery={},framePump={}}={}){
 const samples=framePump.submissionSamples,events=delivery.events;
 if(delivery.source!=='real-webgl-canvas-capture-video-monitor'||
  delivery.presentation!=='visible-2px-real-track'||
  delivery.clock!=='performance-now-relative-capture-start'||
  delivery.consumerVisibleAtStart!==true||delivery.playStatus!=='PLAYING'||
  !['submitted-frame-request','native-capture-stream'].includes(framePump.mode)||
  !Array.isArray(samples)||samples.length<1||samples.length>32||
  !Array.isArray(events)||events.length>32||
  !Array.isArray(delivery.frames)||delivery.frames.length>32)
  return 'SUBMISSION_TIMING_UNVERIFIED';
 let lastAt=-1,lastReceipt=-1;
 for(const sample of samples){
  if(!Number.isFinite(sample.atMs)||sample.atMs<0||sample.atMs>20000||
   sample.atMs<=lastAt||!Number.isSafeInteger(sample.receipt)||
   sample.receipt<=lastReceipt||
   typeof sample.requestAttempted!=='boolean'||
   typeof sample.requestSucceeded!=='boolean'||
   (framePump.mode==='submitted-frame-request'&&
     (!sample.requestAttempted||!sample.requestSucceeded))||
   (framePump.mode==='native-capture-stream'&&sample.requestAttempted))
   return 'SUBMISSION_TIMING_UNVERIFIED';
  lastAt=sample.atMs;lastReceipt=sample.receipt;
 }
 let lastEvent=-1;
 for(const event of events){
  if(!['mute','unmute','ended'].includes(event.kind)||
   !Number.isFinite(event.atMs)||event.atMs<0||event.atMs>20000||
   event.atMs<lastEvent)return 'SUBMISSION_TIMING_UNVERIFIED';
  lastEvent=event.atMs;
 }
 if(delivery.frames.length>0){
  const confirmed=classifyCanvasTrackDelivery({delivery,encodedBytes:0,
   submittedFrames:samples.length});
  return confirmed==='CANVAS_FRAMES_DELIVERED_ENCODER_EMPTY'?
   'PRESENTED_CANVAS_FRAME_RECEIPT_TIMED':'SUBMISSION_TIMING_UNVERIFIED';
 }
 const mute=events.find(event=>event.kind==='mute');
 if(!mute)return 'SUBMISSIONS_WITHOUT_PRESENTATION_MUTE_UNOBSERVED';
 return samples.some(s=>s.atMs<mute.atMs)?
  'PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION':
  'ONLY_POST_MUTE_SUBMISSIONS_WITHOUT_PRESENTATION';
}

/**
 * Synthetic 2D canvas: explicitly isolated encoder POSITIVE CONTROL only.
 * This is not a Dungeon frame, gameplay witness or synchronized audiovisual
 * source. A positive control merely narrows the capture failure surface.
 * Both tracks must be observed in the SAME real browser, not compared with
 * unrelated CI executions. Never infer a definitive GPU root cause.
 */
function classifyCanvasEncoderControl({control={},real={}}={}){
 const isReal=real.source==='real-webgl-canvas-video-only'&&
  /^video\/webm(?:;|$)/i.test(real.mimeType||'')&&
  real.videoTracks===1&&real.audioTracks===0&&
  Number.isFinite(real.recordingMs)&&real.recordingMs>=1000&&real.recordingMs<=15500&&
  hasConfirmedCanvasFrames(real.framePump);
 const isControl=control.source==='synthetic-2d-canvas-encoder-control-not-gameplay'&&
  /^video\/webm(?:;|$)/i.test(control.mimeType||'')&&
  control.videoTracks===1&&control.audioTracks===0&&
  Number.isInteger(control.canvasWidth)&&control.canvasWidth>=16&&control.canvasWidth<=128&&
  Number.isInteger(control.canvasHeight)&&control.canvasHeight>=16&&control.canvasHeight<=128&&
  Number.isSafeInteger(control.drawnFrames)&&control.drawnFrames>=3&&control.drawnFrames<=128&&
  Number.isFinite(control.recordingMs)&&control.recordingMs>=1000&&control.recordingMs<=15500;
 if(!isReal||!isControl)return 'CONTROL_COMPARISON_UNVERIFIED';
 const encoded=(record)=>record.status==='RECORDED'&&
  Number.isSafeInteger(record.bytes)&&record.bytes>1024&&record.bytes<=MAX_CLIP_BYTES;
 const empty=(record)=>record.status==='UNAVAILABLE'&&
  Number.isSafeInteger(record.bytes)&&record.bytes===0;
 const gameOK=encoded(real),controlOK=encoded(control);
 if(!gameOK&&!empty(real)||!controlOK&&!empty(control))
  return 'CONTROL_COMPARISON_UNVERIFIED';
 if(controlOK&&!gameOK)return 'CONTROL_ENCODES_REAL_WEBGL_EMPTY';
 if(!controlOK&&!gameOK)return 'BOTH_VIDEO_PATHS_UNVERIFIED';
 if(gameOK&&controlOK)return 'BOTH_VIDEO_PATHS_ENCODED_UNALIGNED';
 return 'REAL_VIDEO_ENCODED_CONTROL_UNVERIFIED';
}


/**
 * SECOND, non-gameplay encoder comparison: attempt a bounded 2D-only recording
 * AFTER all initial live capture recorders have stopped. Five simultaneous
 * recorders can overwhelm a headless worker, so a failed concurrent control
 * alone cannot establish that even one canvas encoder fails in isolation.
 * A successful serial control suggests resource contention is worth testing,
 * but does NOT prove that contention, WebGL encoding or synchronized combat.
 */
function classifySequentialCanvasEncoderProbe({concurrent={},serial={}}={}){
 const bounded=(r,source)=>r.source===source&&
  /^video\/webm(?:;|$)/i.test(r.mimeType||'')&&
  r.videoTracks===1&&r.audioTracks===0&&
  Number.isInteger(r.canvasWidth)&&r.canvasWidth>=16&&r.canvasWidth<=128&&
  Number.isInteger(r.canvasHeight)&&r.canvasHeight>=16&&r.canvasHeight<=128&&
  Number.isSafeInteger(r.drawnFrames)&&r.drawnFrames>=3&&r.drawnFrames<=128&&
  Number.isFinite(r.recordingMs)&&r.recordingMs>=1000&&r.recordingMs<=15500&&
  Number.isSafeInteger(r.bytes)&&r.bytes>=0&&r.bytes<=2*1024*1024&&
  (r.status==='RECORDED'&&r.bytes>1024||
   r.status==='UNAVAILABLE'&&r.bytes===0);
 if(!bounded(concurrent,'synthetic-2d-canvas-encoder-control-not-gameplay')||
  !bounded(serial,'synthetic-2d-canvas-serial-control-not-gameplay')||
  serial.phase!=='after-all-primary-encoders-settled'||
  serial.primaryRecordersSettled!==true)return 'SERIAL_CONTROL_UNVERIFIED';
 const first=concurrent.status==='RECORDED',second=serial.status==='RECORDED';
 if(first&&second)return 'CONTROL_RECORDED_WITH_AND_WITHOUT_PARALLEL_ENCODERS';
 if(!first&&second)return 'POST_RELEASE_ENCODER_RECOVERED';
 if(!first&&!second)return 'POST_RELEASE_ENCODER_STILL_UNVERIFIED';
 return 'POST_RELEASE_ENCODER_UNVERIFIED';
}

function assessD04Capture({optedIn=false,clip={},pcm={},frames={},isolated={},trackDelivery={}}={}){
 const confirmedCanvasFrames=hasConfirmedCanvasFrames(clip.framePump);
 const combinedVideoAudio=confirmedCanvasFrames&&optedIn===true&&
  clip.source==='real-canvas-plus-opted-in-soundstage'&&
  clip.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(clip.mimeType||'')&&
  clip.videoTracks===1&&clip.audioTracks>=1&&
  Number.isSafeInteger(clip.bytes)&&clip.bytes>1024&&clip.bytes<=MAX_CLIP_BYTES&&
  Number.isFinite(clip.recordingMs)&&clip.recordingMs>=1000&&clip.recordingMs<=15500;
 const liveOriginalPcm=optedIn===true&&pcm.status==='RECORDED'&&
  Number.isSafeInteger(pcm.sampleRate)&&pcm.sampleRate>=8000&&pcm.sampleRate<=96000&&
  pcm.channels===1&&Number.isSafeInteger(pcm.frames)&&pcm.frames>=2048&&
  Number.isSafeInteger(pcm.bytes)&&pcm.bytes===44+pcm.frames*2&&pcm.bytes<=MAX_PCM_BYTES&&
  Number.isFinite(pcm.peak)&&pcm.peak>.0005&&
  Number.isFinite(pcm.rms)&&pcm.rms>.0001;
 const renderFramesAdvanced=Number.isSafeInteger(frames.before)&&
  Number.isSafeInteger(frames.after)&&frames.before>=0&&frames.after>frames.before;
 // An isolated encoder can diagnose mux/track failure, not certify synchronized playback.
 const video=isolated.videoOnly||{},nativeVideo=isolated.nativeVideoOnly||{},
  audio=isolated.audioOnly||{};
 const isolatedVideoRecorded=optedIn===true&&renderFramesAdvanced&&
  video.source==='real-webgl-canvas-video-only'&&video.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(video.mimeType||'')&&
  video.videoTracks===1&&video.audioTracks===0&&hasConfirmedCanvasFrames(video.framePump)&&
  Number.isSafeInteger(video.bytes)&&video.bytes>1024&&video.bytes<=MAX_ISOLATED_VIDEO_BYTES&&
  Number.isFinite(video.recordingMs)&&video.recordingMs>=1000&&video.recordingMs<=15500;
 const isolatedNativeVideoRecorded=optedIn===true&&renderFramesAdvanced&&
  nativeVideo.source==='real-webgl-canvas-native-video-only'&&nativeVideo.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(nativeVideo.mimeType||'')&&
  nativeVideo.videoTracks===1&&nativeVideo.audioTracks===0&&
  hasConfirmedCanvasFrames(nativeVideo.framePump)&&
  nativeVideo.framePump.mode==='native-capture-stream'&&
  Number.isSafeInteger(nativeVideo.bytes)&&nativeVideo.bytes>1024&&
  nativeVideo.bytes<=MAX_ISOLATED_VIDEO_BYTES&&
  Number.isFinite(nativeVideo.recordingMs)&&nativeVideo.recordingMs>=1000&&
  nativeVideo.recordingMs<=15500;
 const isolatedAudioRecorded=optedIn===true&&renderFramesAdvanced&&
  audio.source==='real-opted-in-soundstage-audio-only'&&audio.status==='RECORDED'&&
  /^audio\/webm(?:;|$)/i.test(audio.mimeType||'')&&
  audio.videoTracks===0&&audio.audioTracks===1&&
  Number.isSafeInteger(audio.bytes)&&audio.bytes>1024&&audio.bytes<=MAX_ISOLATED_AUDIO_BYTES&&
  Number.isFinite(audio.recordingMs)&&audio.recordingMs>=1000&&audio.recordingMs<=15500;
 const trackDiagnosis=classifyCanvasTrackDelivery({delivery:trackDelivery,
  encodedBytes:isolated.videoOnly?.bytes??0,
  submittedFrames:clip.framePump?.observedFrameAdvances??0});
 const submissionDiagnosis=classifyCanvasSubmissionTiming({delivery:trackDelivery,framePump:clip.framePump});
 const canvasEncoderDifferential=optedIn===true?classifyCanvasEncoderControl({control:isolated.control2dOnly,real:isolated.videoOnly}):'CONTROL_COMPARISON_UNVERIFIED';
  const serialCanvasEncoderDifferential=optedIn===true?
   classifySequentialCanvasEncoderProbe({concurrent:isolated.control2dOnly,serial:isolated.serial2dOnly}):
   'SERIAL_CONTROL_UNVERIFIED';
 const encoderDiagnosis=isolatedVideoRecorded&&isolatedAudioRecorded?
  'SEPARATE_TRACKS_RECORDED_UNALIGNED':
  !isolatedVideoRecorded&&isolatedNativeVideoRecorded&&isolatedAudioRecorded?
  'NATIVE_VIDEO_RECORDED_EXPLICIT_VIDEO_UNVERIFIED':
  (isolatedVideoRecorded||isolatedNativeVideoRecorded)?'AUDIO_ONLY_ENCODER_UNVERIFIED':
  isolatedAudioRecorded?'VIDEO_ONLY_ENCODER_UNVERIFIED':'INDEPENDENT_ENCODERS_UNVERIFIED';
 return Object.freeze({
  classification:combinedVideoAudio&&liveOriginalPcm&&renderFramesAdvanced?
   'REAL_BROWSER_A_V_CAPTURED_UNALIGNED':'UNVERIFIED',
  combinedVideoAudio,liveOriginalPcm,renderFramesAdvanced,
  isolatedVideoRecorded,isolatedNativeVideoRecorded,isolatedAudioRecorded,encoderDiagnosis,trackDiagnosis,submissionDiagnosis,canvasEncoderDifferential,serialCanvasEncoderDifferential,
  sampleSynchronized:false, // Never infer precise timing from RMS or MediaRecorder bytes.
  limits:Object.freeze({clipBytes:MAX_CLIP_BYTES,pcmBytes:MAX_PCM_BYTES})
 });
}

/**
 * Playwright can discard passing-test attachments from test-results. Persist
 * the evidence manifest and exact captured bytes under the workflow's
 * explicit artifact path. A missing recording is retained as a documented
 * UNVERIFIED result, never silently converted into a successful clip.
 */
function persistD04CaptureEvidence({directory='artifacts',raw={},started=null,assessment=null}={}){
 const fs=require('node:fs'),path=require('node:path');
 fs.mkdirSync(directory,{recursive:true});
 const {base64,...clip}=raw.clip||{};
 const {wavBase64,...pcm}=raw.pcm||{};
 const {base64:isolatedVideoBase64,...videoOnly}=raw.isolated?.videoOnly||{};
 const {base64:isolatedNativeVideoBase64,...nativeVideoOnly}=raw.isolated?.nativeVideoOnly||{};
 const {base64:isolatedAudioBase64,...audioOnly}=raw.isolated?.audioOnly||{};
 // Neither synthetic control, concurrent or serial, may ever be saved as gameplay video.
 const {base64:syntheticControlBytes,...control2dOnly}=raw.isolated?.control2dOnly||{};
 const {base64:serialControlBytes,...serial2dOnly}=raw.isolated?.serial2dOnly||{};
 const manifest=path.join(directory,'dungeon-d04-live-av-evidence.json');
 let webm=null,wav=null,isolatedVideoWebm=null,isolatedNativeVideoWebm=null,isolatedAudioWebm=null;
 if(clip.status==='RECORDED'&&typeof base64==='string'){
  const bytes=Buffer.from(base64,'base64');
  if(bytes.length>1024&&bytes.length<=MAX_CLIP_BYTES&&bytes.length===clip.bytes){
   webm=path.join(directory,'dungeon-d04-real-canvas-original-sound.webm');
   fs.writeFileSync(webm,bytes);
  }
 }
 if(pcm.status==='RECORDED'&&typeof wavBase64==='string'){
  const bytes=Buffer.from(wavBase64,'base64');
  if(bytes.length>=44&&bytes.length<=MAX_PCM_BYTES&&bytes.length===pcm.bytes){
   wav=path.join(directory,'dungeon-d04-live-original-pcm.wav');
   fs.writeFileSync(wav,bytes);
  }
 }
 // Never store isolated encoded bytes if provenance verification rejects them.
 if(assessment?.isolatedVideoRecorded&&typeof isolatedVideoBase64==='string'){
  const bytes=Buffer.from(isolatedVideoBase64,'base64');
  if(bytes.length===videoOnly.bytes&&bytes.length>1024&&bytes.length<=MAX_ISOLATED_VIDEO_BYTES){
   isolatedVideoWebm=path.join(directory,'dungeon-d04-real-canvas-video-only.webm');
   fs.writeFileSync(isolatedVideoWebm,bytes);
  }
 }
 if(assessment?.isolatedNativeVideoRecorded&&typeof isolatedNativeVideoBase64==='string'){
  const bytes=Buffer.from(isolatedNativeVideoBase64,'base64');
  if(bytes.length===nativeVideoOnly.bytes&&bytes.length>1024&&bytes.length<=MAX_ISOLATED_VIDEO_BYTES){
   isolatedNativeVideoWebm=path.join(directory,'dungeon-d04-real-canvas-native-video-only.webm');
   fs.writeFileSync(isolatedNativeVideoWebm,bytes);
  }
 }
 if(assessment?.isolatedAudioRecorded&&typeof isolatedAudioBase64==='string'){
  const bytes=Buffer.from(isolatedAudioBase64,'base64');
  if(bytes.length===audioOnly.bytes&&bytes.length>1024&&bytes.length<=MAX_ISOLATED_AUDIO_BYTES){
   isolatedAudioWebm=path.join(directory,'dungeon-d04-real-soundstage-audio-only.webm');
   fs.writeFileSync(isolatedAudioWebm,bytes);
  }
 }
 fs.writeFileSync(manifest,JSON.stringify({
  started,clip,pcm,isolated:{videoOnly,nativeVideoOnly,audioOnly,control2dOnly,serial2dOnly},frames:raw.frames??null,
  trackDelivery:raw.trackDelivery??null,assessment,
  retained:{webm:!!webm,wav:!!wav,
   isolatedVideoWebm:!!isolatedVideoWebm,isolatedAudioWebm:!!isolatedAudioWebm,
   ...(raw.isolated?.nativeVideoOnly?{isolatedNativeVideoWebm:!!isolatedNativeVideoWebm}:{})},
  caveat:'Independent authentic tracks are NOT aligned or combined. Encoded bytes alone do not prove audiovisual synchronization.'
 },null,2)+'\n');
 return Object.freeze({manifest,webm,wav,isolatedVideoWebm,isolatedNativeVideoWebm,isolatedAudioWebm});
}
module.exports={assessD04Capture,classifyCanvasTrackDelivery,classifyCanvasSubmissionTiming,classifyCanvasEncoderControl,classifySequentialCanvasEncoderProbe,persistD04CaptureEvidence,
 MAX_CLIP_BYTES,MAX_PCM_BYTES,MAX_ISOLATED_VIDEO_BYTES,MAX_ISOLATED_AUDIO_BYTES};
