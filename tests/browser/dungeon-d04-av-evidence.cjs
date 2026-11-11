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
  isolatedVideoRecorded,isolatedNativeVideoRecorded,isolatedAudioRecorded,encoderDiagnosis,
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
  started,clip,pcm,isolated:{videoOnly,nativeVideoOnly,audioOnly},frames:raw.frames??null,assessment,
  retained:{webm:!!webm,wav:!!wav,
   isolatedVideoWebm:!!isolatedVideoWebm,isolatedAudioWebm:!!isolatedAudioWebm,
   ...(raw.isolated?.nativeVideoOnly?{isolatedNativeVideoWebm:!!isolatedNativeVideoWebm}:{})},
  caveat:'Independent authentic tracks are NOT aligned or combined. Encoded bytes alone do not prove audiovisual synchronization.'
 },null,2)+'\n');
 return Object.freeze({manifest,webm,wav,isolatedVideoWebm,isolatedNativeVideoWebm,isolatedAudioWebm});
}
module.exports={assessD04Capture,classifyCanvasTrackDelivery,persistD04CaptureEvidence,
 MAX_CLIP_BYTES,MAX_PCM_BYTES,MAX_ISOLATED_VIDEO_BYTES,MAX_ISOLATED_AUDIO_BYTES};
