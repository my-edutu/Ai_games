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
function assessD04Capture({optedIn=false,clip={},pcm={},frames={}}={}){
 const framePump=clip.framePump;
 const confirmedCanvasFrames=framePump?.requestFailures===0&&
  Number.isSafeInteger(framePump.observedFrameAdvances)&&framePump.observedFrameAdvances>0&&
  ((framePump.mode==='submitted-frame-request'&&
    Number.isSafeInteger(framePump.requestedFrames)&&framePump.requestedFrames>0&&
    framePump.requestedFrames<=framePump.observedFrameAdvances)||
   (framePump.mode==='native-capture-stream'&&framePump.requestedFrames===0));
 const combinedVideoAudio=confirmedCanvasFrames&&optedIn===true&&
  clip.source==='real-canvas-plus-opted-in-soundstage'&&
  clip.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(clip.mimeType||'')&&
  clip.videoTracks===1&&clip.audioTracks>=1&&
  Number.isSafeInteger(clip.bytes)&&clip.bytes>1024&&clip.bytes<=MAX_CLIP_BYTES&&
  Number.isFinite(clip.recordingMs)&&clip.recordingMs>=1000&&clip.recordingMs<=10000;
 const liveOriginalPcm=optedIn===true&&pcm.status==='RECORDED'&&
  Number.isSafeInteger(pcm.sampleRate)&&pcm.sampleRate>=8000&&pcm.sampleRate<=96000&&
  pcm.channels===1&&Number.isSafeInteger(pcm.frames)&&pcm.frames>=2048&&
  Number.isSafeInteger(pcm.bytes)&&pcm.bytes===44+pcm.frames*2&&pcm.bytes<=MAX_PCM_BYTES&&
  Number.isFinite(pcm.peak)&&pcm.peak>.0005&&
  Number.isFinite(pcm.rms)&&pcm.rms>.0001;
 const renderFramesAdvanced=Number.isSafeInteger(frames.before)&&
  Number.isSafeInteger(frames.after)&&frames.before>=0&&frames.after>frames.before;
 return Object.freeze({
  classification:combinedVideoAudio&&liveOriginalPcm&&renderFramesAdvanced?
   'REAL_BROWSER_A_V_CAPTURED_UNALIGNED':'UNVERIFIED',
  combinedVideoAudio,liveOriginalPcm,renderFramesAdvanced,
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
 const manifest=path.join(directory,'dungeon-d04-live-av-evidence.json');
 let webm=null,wav=null;
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
 fs.writeFileSync(manifest,JSON.stringify({
  started,clip,pcm,frames:raw.frames??null,assessment,
  retained:{webm:!!webm,wav:!!wav},
  caveat:'Authentic browser recording and separate live PCM tap are not sample-aligned audiovisual proof.'
 },null,2)+'\n');
 return Object.freeze({manifest,webm,wav});
}
module.exports={assessD04Capture,persistD04CaptureEvidence,
 MAX_CLIP_BYTES,MAX_PCM_BYTES};
