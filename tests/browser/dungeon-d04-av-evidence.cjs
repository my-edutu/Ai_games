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


/**
 * A pixel-readback 2D canvas can be legitimate Dungeon *video* only when
 * it is copied after distinct real renderer receipt increments. Classify
 * such evidence separately from both synthetic diagnostic 2D animation
 * and direct WebGL capture. It is NEVER aligned with earlier original PCM.
 *
 * The browser producer owns the pixel read; this pure boundary checks its
 * bounded source/phase/timeline/contrast records and fails closed.
 */
function classifyReceiptReadbackVideo(video={},options={}){
 const combined=options.combined===true;
 const pump=video.framePump||{},samples=pump.samples;
 const valid=video.source===(combined?'real-webgl-receipt-readback-serial-original-audio':
  'real-webgl-receipt-readback-serial-video-only')&&
  (!combined||(video.optedInAtStart===true&&video.originalSoundstageTrackLive===true))&&
  video.phase==='after-all-primary-encoders-settled'&&
  video.primaryRecordersSettled===true&&
  /^video\/webm(?:;|$)/i.test(video.mimeType||'')&&
  video.videoTracks===1&&video.audioTracks===(combined?1:0)&&
  video.canvasWidth>=160&&video.canvasWidth<=960&&Number.isInteger(video.canvasWidth)&&
  video.canvasHeight>=100&&video.canvasHeight<=600&&Number.isInteger(video.canvasHeight)&&
  Number.isFinite(video.recordingMs)&&video.recordingMs>=1000&&video.recordingMs<=15500&&
  Number.isSafeInteger(video.bytes)&&video.bytes>=0&&video.bytes<=MAX_CLIP_BYTES&&
  pump.mode==='real-webgl-render-receipt-readback'&&pump.requestFailures===0&&
  Number.isSafeInteger(pump.receiptStart)&&pump.receiptStart>=0&&
  Number.isSafeInteger(pump.receiptEnd)&&pump.receiptEnd>pump.receiptStart&&
  Number.isSafeInteger(pump.observedFrameAdvances)&&
  pump.observedFrameAdvances===pump.receiptEnd-pump.receiptStart&&
  Array.isArray(samples)&&samples.length>=2&&samples.length<=32&&
  Number.isSafeInteger(pump.requestedFrames)&&pump.requestedFrames===samples.length;
 if(!valid)return 'READBACK_PROVENANCE_UNVERIFIED';
 let prevReceipt=pump.receiptStart,prevMs=-1;const signatures=new Set();
 for(const sample of samples){
  if(!Number.isSafeInteger(sample.receipt)||sample.receipt<=prevReceipt||
   sample.receipt>pump.receiptEnd||!Number.isFinite(sample.atMs)||
   sample.atMs<=prevMs||sample.atMs>video.recordingMs+300||
   !Number.isSafeInteger(sample.colors)||sample.colors<8||sample.colors>256||
   !/^[a-f0-9]{8}$/.test(sample.signature||''))
   return 'READBACK_PROVENANCE_UNVERIFIED';
  prevReceipt=sample.receipt;prevMs=sample.atMs;
  signatures.add(sample.signature);
 }
 if(signatures.size<2)return 'READBACK_PROVENANCE_UNVERIFIED';
 if(video.status==='UNAVAILABLE'&&video.bytes===0)
  return 'REAL_WEBGL_READBACK_VIDEO_UNVERIFIED';
 if(video.status==='RECORDED'&&video.bytes>1024)
  return combined?'REAL_WEBGL_READBACK_AV_RECORDED_UNALIGNED':
   'REAL_WEBGL_READBACK_VIDEO_RECORDED_UNALIGNED';
 return 'READBACK_PROVENANCE_UNVERIFIED';
}


/**
 * Playwright's element screenshot is an actual browser COMPOSITOR pixel read,
 * independent of canvas.captureStream, delayed canvas.drawImage and encoder
 * availability. It may establish visibly changing authentic world stills,
 * NEVER video, original foley timing, or matched camera directions.
 *
 * Browser producer must take each screenshot of #world while running the
 * real seeded Dungeon stream and bracket it with renderer receipts.
 */
function classifyCompositorWitness(witness={}){
 const viewport=witness.viewport||{},samples=witness.samples;
 const desktop=witness.view==='desktop-1440x900'&&
  viewport.width===1440&&viewport.height===900;
 const mobile=witness.view==='mobile-390x844'&&
  viewport.width===390&&viewport.height===844;
 if(witness.source!=='playwright-world-element-compositor-screenshots'||
  witness.capture!=='receipt-bracketed-png'||(!desktop&&!mobile)||
  typeof witness.seed!=='string'||witness.seed.length<1||witness.seed.length>128||
  !Array.isArray(samples)||samples.length<2||samples.length>5)
  return 'COMPOSITOR_WITNESS_UNVERIFIED';
 let prevReceipt=-1,prevMs=-1,prevTick=-1;
 let run=null,floor=null;
 const signatures=new Set();
 for(const s of samples){
  if(!Number.isSafeInteger(s.beforeReceipt)||s.beforeReceipt<=prevReceipt||
   !Number.isSafeInteger(s.afterReceipt)||s.afterReceipt<s.beforeReceipt||
   !Number.isFinite(s.atMs)||s.atMs<=prevMs||s.atMs>300000||
   !Number.isSafeInteger(s.tick)||s.tick<=prevTick||
   !(Number.isSafeInteger(s.run)||typeof s.run==='string'&&s.run.length>0)||
   !(Number.isSafeInteger(s.floor)||typeof s.floor==='string'&&s.floor.length>0)||
   typeof s.checksum!=='string'||s.checksum.length<1||s.checksum.length>128||
   !Number.isSafeInteger(s.pngBytes)||s.pngBytes<=1024||s.pngBytes>2*1024*1024||
   !Number.isSafeInteger(s.colors)||s.colors<8||s.colors>768||
   !/^[a-f0-9]{8}$/.test(s.signature||'')||
   !Number.isSafeInteger(s.width)||s.width<160||s.width>1440||
   !Number.isSafeInteger(s.height)||s.height<100||s.height>900||
   (run!==null&&(s.run!==run||s.floor!==floor)))
    return 'COMPOSITOR_WITNESS_UNVERIFIED';
  if(run===null){run=s.run;floor=s.floor}
  prevReceipt=s.afterReceipt;prevMs=s.atMs;prevTick=s.tick;
  signatures.add(s.signature);
 }
 return signatures.size>1?'REAL_COMPOSITOR_WORLD_STILLS_CHANGING_UNALIGNED':
  'COMPOSITOR_WORLD_STILLS_STATIC_UNVERIFIED';
}


/**
 * The real serial WebGL recorder can emit valid VP8 WebM bytes with only
 * ONE decodable frame. ffmpeg's bounded, decoded first-64-frame thumbnail
 * hashes provide a strictly stronger motion gate than MediaRecorder bytes.
 * Even two distinct decoded frames remain UNALIGNED with earlier audio.
 */
function classifyDecodedSerialGameplay({video={},decoder={}}={}){
 const authentic=video.source==='real-webgl-canvas-serial-video-only'&&
  video.phase==='after-all-primary-encoders-settled'&&
  video.primaryRecordersSettled===true&&video.status==='RECORDED'&&
  video.videoTracks===1&&video.audioTracks===0&&
  /^video\/webm(?:;|$)/i.test(video.mimeType||'')&&
  Number.isSafeInteger(video.bytes)&&video.bytes>1024&&video.bytes<=MAX_CLIP_BYTES;
 const valid=decoder.source==='ffmpeg-decoded-real-webgl-serial-video'&&
  decoder.method==='framemd5-24x16-first-64'&&
  decoder.status==='DECODED'&&decoder.codec==='vp8'&&
  Number.isSafeInteger(decoder.frameCount)&&decoder.frameCount>=1&&decoder.frameCount<=64&&
  Number.isSafeInteger(decoder.distinctFrames)&&decoder.distinctFrames>=1&&
  decoder.distinctFrames<=decoder.frameCount&&
  Array.isArray(decoder.hashes)&&decoder.hashes.length===decoder.frameCount&&
  decoder.hashes.every(h=>typeof h==='string'&&/^[0-9a-f]{32}$/.test(h))&&
  new Set(decoder.hashes).size===decoder.distinctFrames;
 if(!authentic||!valid)return 'SERIAL_REAL_WEBGL_MOTION_UNVERIFIED';
 return decoder.frameCount>=2&&decoder.distinctFrames>=2?
  'SERIAL_REAL_WEBGL_MOVING_VIDEO_UNALIGNED':
  'SERIAL_REAL_WEBGL_ONE_OR_STATIC_FRAME_UNVERIFIED';
}

/**
 * Decoded receipt-readback motion is independent authentic WebGL video ONLY:
 * the pixels come from increasing submitted-frame receipts, never synthetic
 * 2D control frames. A few decoded distinct frames cannot establish timing
 * alignment with the original earlier soundstage recording.
 */
function classifyDecodedReceiptReadbackGameplay({video={},decoder={}}={}){
 if(classifyReceiptReadbackVideo(video)!=='REAL_WEBGL_READBACK_VIDEO_RECORDED_UNALIGNED'||
  decoder.source!=='ffmpeg-decoded-real-webgl-receipt-readback-video'||
  decoder.method!=='framemd5-24x16-first-64'||
  decoder.status!=='DECODED'||decoder.codec!=='vp8'||
  !Number.isSafeInteger(decoder.frameCount)||decoder.frameCount<1||decoder.frameCount>64||
  !Number.isSafeInteger(decoder.distinctFrames)||decoder.distinctFrames<1||
  decoder.distinctFrames>decoder.frameCount||
  !Array.isArray(decoder.hashes)||decoder.hashes.length!==decoder.frameCount||
  !decoder.hashes.every(h=>typeof h==='string'&&/^[0-9a-f]{32}$/.test(h))||
  new Set(decoder.hashes).size!==decoder.distinctFrames)
  return 'READBACK_REAL_WEBGL_MOTION_UNVERIFIED';
 return decoder.frameCount>=2&&decoder.distinctFrames>=2?
  'REAL_WEBGL_READBACK_MOVING_VIDEO_UNALIGNED':
  'REAL_WEBGL_READBACK_ONE_OR_STATIC_FRAME_UNVERIFIED';
}

/**
 * A single WebM may contain both genuinely sourced tracks yet still omit
 * precise audiovisual sample presentation timestamps. Require decoded moving
 * WebGL frames AND the actual Opus stream, never merely recorded bytes.
 */
function classifyDecodedSameWindowReadbackAV({video={},decoder={}}={}){
 if(classifyReceiptReadbackVideo(video,{combined:true})!=='REAL_WEBGL_READBACK_AV_RECORDED_UNALIGNED'||
  decoder.source!=='ffmpeg-decoded-real-webgl-receipt-readback-original-audio'||
  decoder.method!=='framemd5-24x16-first-64'||
  decoder.status!=='DECODED'||decoder.codec!=='vp8'||decoder.audioCodec!=='opus'||
  !Number.isSafeInteger(decoder.frameCount)||decoder.frameCount<1||decoder.frameCount>64||
  !Number.isSafeInteger(decoder.distinctFrames)||decoder.distinctFrames<1||
  decoder.distinctFrames>decoder.frameCount||
  !Array.isArray(decoder.hashes)||decoder.hashes.length!==decoder.frameCount||
  !decoder.hashes.every(h=>typeof h==='string'&&/^[0-9a-f]{32}$/.test(h))||
  new Set(decoder.hashes).size!==decoder.distinctFrames)
  return 'SAME_WINDOW_READBACK_AV_UNVERIFIED';
 return decoder.frameCount>=2&&decoder.distinctFrames>=2?
  'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED':
  'REAL_WEBGL_SAME_WINDOW_ONE_OR_STATIC_FRAME_UNVERIFIED';
}

function assessD04Capture({optedIn=false,clip={},pcm={},frames={},isolated={},trackDelivery={},decoder={}}={}){
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
 // The follow-on REAL WebGL encoder must have exclusive MediaRecorder use.
 // Late submitted frames certify only this serial capture window, never the
 // original simultaneous A/V or unrelated synthetic positive-control video.
 const serialVideo=isolated.serialRealVideo||{},serialPump=serialVideo.framePump;
 const serialRealVideoRecorded=optedIn===true&&renderFramesAdvanced&&
  serialVideo.source==='real-webgl-canvas-serial-video-only'&&
  serialVideo.phase==='after-all-primary-encoders-settled'&&
  serialVideo.primaryRecordersSettled===true&&
  serialVideo.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(serialVideo.mimeType||'')&&
  serialVideo.videoTracks===1&&serialVideo.audioTracks===0&&
  Number.isSafeInteger(serialVideo.bytes)&&serialVideo.bytes>1024&&
  serialVideo.bytes<=MAX_ISOLATED_VIDEO_BYTES&&
  Number.isFinite(serialVideo.recordingMs)&&serialVideo.recordingMs>=1000&&
  serialVideo.recordingMs<=15500&&hasConfirmedCanvasFrames(serialPump)&&
  serialPump?.mode==='native-capture-stream'&&
  Number.isSafeInteger(serialPump.receiptStart)&&serialPump.receiptStart>=0&&
  Number.isSafeInteger(serialPump.receiptEnd)&&serialPump.receiptEnd>serialPump.receiptStart&&
  serialPump.observedFrameAdvances===serialPump.receiptEnd-serialPump.receiptStart;
 const serialRealVideoMotionQualified=serialRealVideoRecorded&&
  classifyDecodedSerialGameplay({video:serialVideo,decoder:decoder.serialRealVideo})===
   'SERIAL_REAL_WEBGL_MOVING_VIDEO_UNALIGNED';
 const receiptReadbackVideoRecorded=optedIn===true&&renderFramesAdvanced&&
  classifyReceiptReadbackVideo(isolated.receiptReadbackVideo)==='REAL_WEBGL_READBACK_VIDEO_RECORDED_UNALIGNED';
 const receiptReadbackVideoMotionQualified=receiptReadbackVideoRecorded&&
  classifyDecodedReceiptReadbackGameplay({video:isolated.receiptReadbackVideo,
   decoder:decoder.readbackVideo})==='REAL_WEBGL_READBACK_MOVING_VIDEO_UNALIGNED';
 const sameWindowAVClassification=optedIn===true?
  classifyDecodedSameWindowReadbackAV({video:isolated.sameWindowReadbackAV,
   decoder:decoder.sameWindowReadbackAV}):'SAME_WINDOW_READBACK_AV_UNVERIFIED';
 const sameWindowMovingAV=sameWindowAVClassification===
  'REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED';
 const isolatedAudioRecorded=optedIn===true&&renderFramesAdvanced&&
  audio.source==='real-opted-in-soundstage-audio-only'&&audio.status==='RECORDED'&&
  /^audio\/webm(?:;|$)/i.test(audio.mimeType||'')&&
  audio.videoTracks===0&&audio.audioTracks===1&&
  Number.isSafeInteger(audio.bytes)&&audio.bytes>1024&&audio.bytes<=MAX_ISOLATED_AUDIO_BYTES&&
  Number.isFinite(audio.recordingMs)&&audio.recordingMs>=1000&&audio.recordingMs<=15500;
 // In the low-contention browser trial, the only concurrent encoder is
 // the genuine combined canvas+consented-soundstage recorder. An explicitly
 // SKIPPED auxiliary video-only probe is not an empty or failed encoder.
 const diagnosticVideoSkipped=isolated.videoOnly?.status==='SKIPPED'&&
  isolated.videoOnly?.source==='real-webgl-canvas-video-only';
 const actualEncodedVideoBytes=diagnosticVideoSkipped?
  (combinedVideoAudio?clip.bytes:0):(isolated.videoOnly?.bytes??0);
 const trackDiagnosis=classifyCanvasTrackDelivery({delivery:trackDelivery,
  encodedBytes:actualEncodedVideoBytes,
  submittedFrames:clip.framePump?.observedFrameAdvances??0});
 const submissionDiagnosis=classifyCanvasSubmissionTiming({delivery:trackDelivery,framePump:clip.framePump});
 const canvasEncoderDifferential=optedIn===true?classifyCanvasEncoderControl({control:isolated.control2dOnly,real:isolated.videoOnly}):'CONTROL_COMPARISON_UNVERIFIED';
  const serialCanvasEncoderDifferential=optedIn===true?
   classifySequentialCanvasEncoderProbe({concurrent:isolated.control2dOnly,serial:isolated.serial2dOnly}):
   'SERIAL_CONTROL_UNVERIFIED';
 const encoderDiagnosis=receiptReadbackVideoRecorded&&isolatedAudioRecorded?
  'RECEIPT_READBACK_VIDEO_AND_EARLIER_AUDIO_RECORDED_UNALIGNED':
  serialRealVideoRecorded&&isolatedAudioRecorded?
  'SERIAL_REAL_VIDEO_AND_EARLIER_AUDIO_RECORDED_UNALIGNED':
  isolatedVideoRecorded&&isolatedAudioRecorded?
  'SEPARATE_TRACKS_RECORDED_UNALIGNED':
  !isolatedVideoRecorded&&isolatedNativeVideoRecorded&&isolatedAudioRecorded?
  'NATIVE_VIDEO_RECORDED_EXPLICIT_VIDEO_UNVERIFIED':
  (isolatedVideoRecorded||isolatedNativeVideoRecorded)?'AUDIO_ONLY_ENCODER_UNVERIFIED':
  isolatedAudioRecorded?'VIDEO_ONLY_ENCODER_UNVERIFIED':'INDEPENDENT_ENCODERS_UNVERIFIED';
 return Object.freeze({
  classification:combinedVideoAudio&&liveOriginalPcm&&renderFramesAdvanced?
   'REAL_BROWSER_A_V_CAPTURED_UNALIGNED':'UNVERIFIED',
  combinedVideoAudio,liveOriginalPcm,renderFramesAdvanced,
  isolatedVideoRecorded,isolatedNativeVideoRecorded,serialRealVideoRecorded,serialRealVideoMotionQualified,receiptReadbackVideoRecorded,receiptReadbackVideoMotionQualified,sameWindowMovingAV,sameWindowAVClassification,isolatedAudioRecorded,encoderDiagnosis,trackDiagnosis,submissionDiagnosis,canvasEncoderDifferential,serialCanvasEncoderDifferential,
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

/**
 * Forensic RETENTION ONLY, never an acceptance result. Real same-window
 * browser recordings are valuable to inspect exactly because their video
 * can contain only one frame; discarding their bytes hides the failure.
 * The caller's separate decoder still owns motion and sync classification.
 */
function shouldArchiveUnalignedOriginalReadback(media={}){
 return media.source==='real-webgl-receipt-readback-serial-original-audio'&&
  media.status==='RECORDED'&&
  /^video\/webm(?:;|$)/i.test(media.mimeType||'')&&
  media.videoTracks===1&&media.audioTracks===1&&
  media.optedInAtStart===true&&media.originalSoundstageTrackLive===true&&
  media.phase==='after-all-primary-encoders-settled'&&
  media.primaryRecordersSettled===true&&
  Number.isSafeInteger(media.bytes)&&media.bytes>1024&&
  media.bytes<=MAX_CLIP_BYTES&&
  Number.isFinite(media.recordingMs)&&media.recordingMs>=1000&&
  media.recordingMs<=15500;
}

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
 const {base64:serialRealVideoBytes,...serialRealVideo}=raw.isolated?.serialRealVideo||{};
 const {base64:receiptReadbackBytes,...receiptReadbackVideo}=raw.isolated?.receiptReadbackVideo||{};
 const {base64:sameWindowAVBytes,...sameWindowReadbackAV}=raw.isolated?.sameWindowReadbackAV||{};
 const manifest=path.join(directory,'dungeon-d04-live-av-evidence.json');
 let webm=null,wav=null,isolatedVideoWebm=null,isolatedNativeVideoWebm=null,isolatedAudioWebm=null,serialRealVideoWebm=null,receiptReadbackVideoWebm=null,sameWindowAVWebm=null,unverifiedSameWindowAVWebm=null;
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
 if(assessment?.serialRealVideoRecorded&&typeof serialRealVideoBytes==='string'){
  const bytes=Buffer.from(serialRealVideoBytes,'base64');
  if(bytes.length===serialRealVideo.bytes&&bytes.length>1024&&bytes.length<=MAX_ISOLATED_VIDEO_BYTES){
   serialRealVideoWebm=path.join(directory,'dungeon-d04-real-webgl-serial-video-only.webm');
   fs.writeFileSync(serialRealVideoWebm,bytes);
  }
 }
 if(assessment?.receiptReadbackVideoRecorded&&typeof receiptReadbackBytes==='string'){
  const bytes=Buffer.from(receiptReadbackBytes,'base64');
  if(bytes.length===receiptReadbackVideo.bytes&&bytes.length>1024&&bytes.length<=MAX_CLIP_BYTES){
   receiptReadbackVideoWebm=path.join(directory,'dungeon-d04-real-webgl-receipt-readback-video-only.webm');
   fs.writeFileSync(receiptReadbackVideoWebm,bytes);
  }
 }
 // Preserve the exact same-window REAL browser recording for independent
 // diagnosis even when it is one-frame/static/undecodable. Never label that
 // file accepted moving audiovisual evidence: only the original strict
 // assessment may populate sameWindowAVWebm. The separate forensic filename
 // includes UNVERIFIED so an encoded WebM cannot imply physical contact.
 if(shouldArchiveUnalignedOriginalReadback(sameWindowReadbackAV)&&
    typeof sameWindowAVBytes==='string'){
  const bytes=Buffer.from(sameWindowAVBytes,'base64');
  if(bytes.length===sameWindowReadbackAV.bytes&&bytes.length>1024&&bytes.length<=MAX_CLIP_BYTES){
   if(assessment?.sameWindowMovingAV){
    sameWindowAVWebm=path.join(directory,'dungeon-d04-real-webgl-readback-original-sound-same-window.webm');
    fs.writeFileSync(sameWindowAVWebm,bytes);
   }else{
    unverifiedSameWindowAVWebm=path.join(directory,
     'dungeon-d04-real-webgl-readback-original-sound-UNVERIFIED.webm');
    fs.writeFileSync(unverifiedSameWindowAVWebm,bytes);
   }
  }
 }
 fs.writeFileSync(manifest,JSON.stringify({
  started,clip,pcm,isolated:{videoOnly,nativeVideoOnly,audioOnly,control2dOnly,serial2dOnly,serialRealVideo,receiptReadbackVideo,sameWindowReadbackAV},frames:raw.frames??null,
  trackDelivery:raw.trackDelivery??null,decoder:raw.decoder??null,assessment,
  retained:{webm:!!webm,wav:!!wav,
   isolatedVideoWebm:!!isolatedVideoWebm,isolatedAudioWebm:!!isolatedAudioWebm,
   ...(raw.isolated?.nativeVideoOnly?{isolatedNativeVideoWebm:!!isolatedNativeVideoWebm}:{}),
   ...(raw.isolated?.serialRealVideo?{serialRealVideoWebm:!!serialRealVideoWebm}:{}),
   ...(raw.isolated?.receiptReadbackVideo?{receiptReadbackVideoWebm:!!receiptReadbackVideoWebm}:{}),
   ...(raw.isolated?.sameWindowReadbackAV?{sameWindowAVWebm:!!sameWindowAVWebm,
    unverifiedSameWindowAVWebm:!!unverifiedSameWindowAVWebm}:{})},
  caveat:'Source-verified same-window moving WebGL video and original Opus may coexist, but event-to-sample contact synchronization is UNVERIFIED.'
 },null,2)+'\n');
 return Object.freeze({manifest,webm,wav,isolatedVideoWebm,isolatedNativeVideoWebm,isolatedAudioWebm,serialRealVideoWebm,receiptReadbackVideoWebm,sameWindowAVWebm,unverifiedSameWindowAVWebm});
}
module.exports={classifyDecodedSerialGameplay,classifyDecodedReceiptReadbackGameplay,classifyDecodedSameWindowReadbackAV,classifyCompositorWitness,assessD04Capture,classifyCanvasTrackDelivery,classifyCanvasSubmissionTiming,classifyCanvasEncoderControl,classifySequentialCanvasEncoderProbe,classifyReceiptReadbackVideo,persistD04CaptureEvidence,
 MAX_CLIP_BYTES,MAX_PCM_BYTES,MAX_ISOLATED_VIDEO_BYTES,MAX_ISOLATED_AUDIO_BYTES,
 shouldArchiveUnalignedOriginalReadback};
