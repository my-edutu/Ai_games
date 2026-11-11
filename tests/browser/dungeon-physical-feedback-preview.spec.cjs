'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {classifyAuthenticD04RenderObservation}=require('./dungeon-d04-real-feedback-observation.cjs');
const {correlateD04OriginalSourceStarts}=require('./dungeon-d04-source-start-correlation.cjs');
const fs=require('node:fs');
const {decodeSerialRealWebGLMotion,decodeReceiptReadbackMotion,decodeSameWindowReadbackMotion}=require('./dungeon-d04-decoded-video-proof.cjs');
fs.mkdirSync('artifacts',{recursive:true});

function witnessActualDamage(){
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','dungeon-ui-round17']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let n=0;n<1300;n++){
   const after=game.step();
   if(after.run===before.run&&after.floor===before.floor&&after.tick===before.tick+1){
    const victims=after.units.filter(u=>before.units.some(old=>old.id===u.id&&old.hp>u.hp));
    if(victims.length){
     // Continue only real DungeonRuntime.step() outcomes. Holding a single
     // HP-delta pair for 70s triggers the genuine stream-stall watchdog
     // and cannot test subsequent attack / original foley presentation.
     const followups=[];
     for(let i=0;i<180;i++)followups.push(game.step());
     return{seed,before,after,victimIds:victims.map(x=>x.id),followups};
    }
   }
   before=after;
  }
 }
 throw Error('No authentic adjacent DungeonRuntime HP-loss pair found; cannot fake the combat witness');
}


const {assessD04Capture,persistD04CaptureEvidence,classifyCompositorWitness,MAX_CLIP_BYTES,MAX_PCM_BYTES}=
 require('./dungeon-d04-av-evidence.cjs');

/**
 * This starts during a real opted-in Dungeon WebGL session. It records the
 * canvas and the actual soundstage output bus, plus an independent live
 * processor tap of original PCM. Both capture clocks are overlapping, NOT
 * calibrated for sample-accurate synchronization.
 */
async function beginD04LiveAVCapture(page){
 return page.evaluate(()=>{
  const unavailable=reason=>({status:'UNAVAILABLE',reason});
  const canvas=document.querySelector('#world');
  const sound=window.__DUNGEON_CAPTURE_SOUND__?.();
  if(document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')!=='true')
   return unavailable('Spectator has not opted into original audio');
  if(typeof MediaRecorder==='undefined'||!canvas?.captureStream||!sound?.getAudioTracks)
   return unavailable('Real canvas MediaRecorder or opted-in output stream unavailable');
  const soundTracks=sound.getAudioTracks();
  if(!soundTracks.length)return unavailable('No opted-in soundstage audio track');
  // Software-WebGL can render only a few real frames in five seconds.
  // Capture *those submitted frames*, never a synthetic timer-driven redraw.
  let canvasStream=canvas.captureStream(0),videoTracks=canvasStream.getVideoTracks();
  const explicitFrames=videoTracks.length===1&&
   typeof videoTracks[0].requestFrame==='function';
  if(!explicitFrames){
   videoTracks.forEach(track=>track.stop());
   canvasStream=canvas.captureStream(24);
   videoTracks=canvasStream.getVideoTracks();
  }
  if(videoTracks.length!==1)return unavailable('No actual WebGL canvas video track');
  const videoTrack=videoTracks[0];
  const all=new MediaStream([...videoTracks,...soundTracks]);
  const types=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'];
  const type=types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!type){videoTracks.forEach(t=>t.stop());return unavailable('WebM encoder unsupported')}
  const toBase64=bytes=>{
   const size=16384,parts=[];
   for(let at=0;at<bytes.length;at+=size)
    parts.push(String.fromCharCode(...bytes.subarray(at,at+size)));
   return btoa(parts.join(''));
  };
  let recorder;
  try{recorder=new MediaRecorder(all,{mimeType:type})}
  catch(e){videoTracks.forEach(t=>t.stop());return unavailable('MediaRecorder constructor: '+String(e))}
  // A post-release positive control must never overlap an unfinished primary
  // media encoder, including an encoder that errored before its stop event.
  const activeRecorders=new Set();
  const before=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1;
  const began=performance.now();
  const framePump={
   mode:explicitFrames?'submitted-frame-request':'native-capture-stream',
   initialReceipt:before,observedFrameAdvances:0,requestedFrames:0,requestFailures:0,
   rendererEpochChanges:0,dataEvents:0,dataBytes:0,videoMutedAtStart:videoTrack.muted===true,
   submissionSamples:[]
  };
  let lastSubmittedFrame=before,pumpActive=false,pumpHandle=null;

  // Diagnose whether this ACTUAL canvas capture track delivers frames at all.
  // A muted HTMLVideoElement consumes the borrowed track; it never draws to
  // the game canvas, generates video frames or authors a combat outcome.
  function startCanvasTrackDeliveryMonitor(){
   const trace={source:'real-webgl-canvas-capture-video-monitor',
    mode:'request-video-frame-callback',playStatus:'NOT_STARTED',
    presentation:'visible-2px-real-track',clock:'performance-now-relative-capture-start',
    consumerVisibleAtStart:false,
    mutedAtStart:videoTrack.muted===true,events:[],frames:[],readyStateAtStart:videoTrack.readyState};
   let active=true,callbackId=null,stopped=false;
   const video=document.createElement('video');
   video.muted=true;video.playsInline=true;video.autoplay=true;
   // Never hide the consumer behind opacity:0 or offscreen placement:
   // Chromium may cull its requestVideoFrameCallback presentation.
   // A two-pixel visible monitor consumes only the ORIGINAL canvas track.
   video.style.cssText='position:fixed;right:4px;bottom:4px;width:2px;height:2px;opacity:1;visibility:visible;pointer-events:none;z-index:2147483647';
   const recordEvent=kind=>{
    if(!active||trace.events.length>=32)return;
    trace.events.push({kind,atMs:Math.max(0,performance.now()-began)});
   };
   const listeners=[['mute',()=>recordEvent('mute')],
    ['unmute',()=>recordEvent('unmute')],['ended',()=>recordEvent('ended')]];
   listeners.forEach(([name,cb])=>videoTrack.addEventListener(name,cb));
   if(typeof video.requestVideoFrameCallback!=='function'){
    trace.mode='unavailable';trace.playStatus='UNSUPPORTED';
   }else{
    video.srcObject=new MediaStream([videoTrack]);
    document.body.appendChild(video);
    const bounds=video.getBoundingClientRect(),style=getComputedStyle(video);
    trace.consumerVisibleAtStart=video.isConnected&&bounds.width>=2&&bounds.height>=2&&
     style.opacity==='1'&&style.visibility==='visible'&&document.visibilityState==='visible';
    trace.visibilityStateAtStart=document.visibilityState;
    const observeFrame=(now,meta)=>{
     if(!active)return;
     if(trace.frames.length<32){
      trace.frames.push({atMs:Math.max(0,performance.now()-began),
       presentedFrames:meta.presentedFrames,mediaTime:meta.mediaTime,
       submittedReceipt:window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1});
     }
     if(active&&trace.frames.length<32)
      callbackId=video.requestVideoFrameCallback(observeFrame);
    };
    // Register BEFORE play(): otherwise first real frame may be missed
    // on slow, sparse software-WebGL renderers.
    callbackId=video.requestVideoFrameCallback(observeFrame);
    Promise.resolve().then(()=>video.play()).then(()=>{
     if(active)trace.playStatus='PLAYING';
    }).catch(error=>{
     if(active){trace.playStatus='REJECTED';trace.playReason=String(error).slice(0,160)}
    });
   }
   return ()=>{
    if(stopped)return trace;
    stopped=true;active=false;
    trace.mutedAtStop=videoTrack.muted===true;
    trace.readyStateAtStop=videoTrack.readyState;
    trace.videoReadyStateAtStop=video.readyState;
    trace.videoWidth=video.videoWidth;trace.videoHeight=video.videoHeight;
    trace.videoCurrentTimeAtStop=video.currentTime;
    trace.visibilityStateAtStop=document.visibilityState;
    if(callbackId!==null&&typeof video.cancelVideoFrameCallback==='function')
     video.cancelVideoFrameCallback(callbackId);
    listeners.forEach(([name,cb])=>videoTrack.removeEventListener(name,cb));
    video.pause();video.srcObject=null;video.remove();
    return trace;
   };
  }
  const finishCanvasDeliveryMonitor=startCanvasTrackDeliveryMonitor();
  // These record the SAME actual canvas and opted-in soundstage separately.
  // They do not inject a frame, replay a synthetic attack or claim time alignment.
  function startIsolatedRecorder(stream,candidates,source,limit,videoOnly,frameMode=null){
   const mimeType=candidates.find(t=>MediaRecorder.isTypeSupported(t));
   if(!mimeType)return Promise.resolve({source,status:'UNAVAILABLE',reason:'Independent encoder unsupported',
    candidates,videoTracks:stream.getVideoTracks().length,audioTracks:stream.getAudioTracks().length});
   let rec;
   try{rec=new MediaRecorder(stream,{mimeType})}
   catch(error){return Promise.resolve({source,status:'UNAVAILABLE',
    reason:'Independent MediaRecorder constructor: '+String(error).slice(0,200)})}
   return new Promise(resolve=>{
    const beganAt=performance.now(),chunks=[];
    let bytes=0,dataEvents=0,settled=false,overflow=false;
    const track=videoOnly?stream.getVideoTracks()[0]:stream.getAudioTracks()[0];
    const trackAtStart={readyState:track?.readyState,muted:track?.muted===true};
    let stopTimer=null,watchdog=null;
    const finish=(status,reason,data)=>{
     if(settled)return;settled=true;clearTimeout(stopTimer);clearTimeout(watchdog);
     resolve({source,status,reason:reason||null,mimeType,bytes:data?.length??bytes,
      videoTracks:stream.getVideoTracks().length,audioTracks:stream.getAudioTracks().length,
      recordingMs:performance.now()-beganAt,dataEvents,
      trackAtStart,trackAtStop:{readyState:track?.readyState,muted:track?.muted===true},
      framePump:videoOnly&&frameMode!=='control-canvas'?{...framePump,
       ...(frameMode==='native-capture-stream'?{mode:'native-capture-stream',requestedFrames:0}:{})}:undefined,
      base64:data&&frameMode!=='control-canvas'?toBase64(data):null});
    };
    rec.ondataavailable=event=>{
     dataEvents++;const blob=event.data;
     bytes+=blob?.size||0;
     if(bytes>limit){overflow=true;chunks.length=0}
     else if(!overflow&&blob?.size)chunks.push(blob);
    };
    rec.onerror=event=>{
     try{if(rec.state!=='inactive')rec.stop()}catch{}
     finish('UNAVAILABLE','Independent recorder: '+String(event.error??event).slice(0,200));
    };
    rec.onstop=async()=>{
     activeRecorders.delete(rec);
     if(overflow||bytes<=1024)return finish('UNAVAILABLE',overflow?'Independent encoded file exceeded budget':'Empty independent WebM');
     try{
      const data=new Uint8Array(await new Blob(chunks,{type:mimeType}).arrayBuffer());
      finish(data.length===bytes?'RECORDED':'UNAVAILABLE',
       data.length===bytes?null:'Independent chunks missing',data.length===bytes?data:null);
     }catch(error){finish('UNAVAILABLE','Independent WebM read: '+String(error).slice(0,200))}
    };
    try{rec.start(250);activeRecorders.add(rec)}catch(error){finish('UNAVAILABLE','Independent recorder start: '+String(error).slice(0,200));return}
    stopTimer=setTimeout(()=>{try{if(rec.state!=='inactive')rec.stop()}catch(error){finish('UNAVAILABLE',String(error))}},5500);
    watchdog=setTimeout(()=>{try{if(rec.state!=='inactive')rec.stop()}catch{}
     finish('UNAVAILABLE','Independent recorder exceeded 15-second budget')},15000);
   });
  }
  /**
   * Diagnostic positive control, deliberately NOT gameplay. The synthetic 2D
   * source tests whether THIS browser can encode any small changing canvas
   * while the same session's REAL WebGL canvas encoder is being exercised.
   * Its frames are never used for combat footage, audio or sync claims.
   */
  function start2DEncoderPositiveControl({serial=false}={}){
   const source=serial?'synthetic-2d-canvas-serial-control-not-gameplay':
    'synthetic-2d-canvas-encoder-control-not-gameplay';
   const phase=serial?'after-all-primary-encoders-settled':'overlapping-primary-encoders';
   const primaryRecordersSettled=serial&&recorder.state==='inactive'&&activeRecorders.size===0;
   if(serial&&!primaryRecordersSettled)return Promise.resolve({source,status:'UNAVAILABLE',
    reason:'An earlier media recorder remains active; serial comparison skipped',
    phase,primaryRecordersSettled:false});
   const width=64,height=64;
   const control=document.createElement('canvas');
   control.width=width;control.height=height;
   const ctx=control.getContext('2d',{alpha:false});
   if(!ctx)return Promise.resolve({source,status:'UNAVAILABLE',reason:'2D drawing context missing',
    bytes:0,drawnFrames:0,canvasWidth:width,canvasHeight:height});
   let drawnFrames=0,timer=null,track=null;
   const paint=()=>{
    if(drawnFrames>=128)return;
    const alternate=drawnFrames%2===0;
    ctx.fillStyle=alternate?'#111':'#eee';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle=alternate?'#eee':'#111';
    ctx.fillRect((drawnFrames*7)%48,12,16,32);
    drawnFrames++;
   };
   try{
    paint();
    const stream=control.captureStream(24);
    track=stream.getVideoTracks()[0];
    if(!track)return Promise.resolve({source,status:'UNAVAILABLE',
     reason:'No diagnostic 2D canvas video track',bytes:0,drawnFrames,
     canvasWidth:width,canvasHeight:height});
    timer=setInterval(paint,100);
    return startIsolatedRecorder(new MediaStream([track]),
     ['video/webm;codecs=vp8','video/webm'],source,2*1024*1024,true,'control-canvas')
     .then(({base64,...record})=>({
      ...record,drawnFrames,canvasWidth:width,canvasHeight:height,
      phase,primaryRecordersSettled,
      evidence:'Synthetic encoder control ONLY, not Dungeon footage or A/V synchronization'
     })).finally(()=>{
      if(timer!==null)clearInterval(timer);
      track.stop();control.width=0;control.height=0;
     });
   }catch(error){
    if(timer!==null)clearInterval(timer);
    track?.stop();control.width=0;control.height=0;
    return Promise.resolve({source,status:'UNAVAILABLE',
     reason:'2D control probe: '+String(error).slice(0,160),bytes:0,drawnFrames,
     canvasWidth:width,canvasHeight:height});
   }
  }

  // This second VIDEO-ONLY window uses the unchanged, genuine Dungeon WebGL
  // canvas after every primary MediaRecorder has settled. Earlier synthetic
  // 2D success is a diagnostic, NOT a substitute for gameplay video.
  async function startSerialRealVideoProbe(){
   const source='real-webgl-canvas-serial-video-only';
   const phase='after-all-primary-encoders-settled';
   const primaryRecordersSettled=recorder.state==='inactive'&&activeRecorders.size===0;
   if(!primaryRecordersSettled)return {source,phase,primaryRecordersSettled:false,
    status:'UNAVAILABLE',reason:'An earlier recorder is still active'};
   const receiptStart=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
   let track=null;
   try{
    track=canvas.captureStream(24).getVideoTracks()[0];
    if(!track)return {source,phase,primaryRecordersSettled,
     status:'UNAVAILABLE',reason:'New real WebGL canvas track unavailable'};
    const media=await startIsolatedRecorder(new MediaStream([track]),
     ['video/webm;codecs=vp8','video/webm'],source,20*1024*1024,true,'serial-native-capture');
    const receiptEnd=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
    const observedFrameAdvances=Number.isSafeInteger(receiptStart)&&receiptStart>=0&&
     Number.isSafeInteger(receiptEnd)&&receiptEnd>=receiptStart?receiptEnd-receiptStart:0;
    return {...media,source,phase,primaryRecordersSettled,
     framePump:{mode:'native-capture-stream',observedFrameAdvances,requestedFrames:0,
      requestFailures:0,receiptStart,receiptEnd},
     evidence:'Separate authentic WebGL canvas video only, no shared PCM/PTS synchronization'};
   }catch(error){
    return {source,phase,primaryRecordersSettled,status:'UNAVAILABLE',
     reason:'Serial real WebGL encoder: '+String(error).slice(0,160)};
   }finally{track?.stop()}
  }

  /**
   * Last-resort, serial REAL-Dungeon pixels experiment. The canvas here is a
   * transport for readback from the existing rendered WebGL world, NOT a
   * generated animation. Only new acknowledged renderer receipts may paint
   * pixels or request encoded frames. Blank or static readback is rejected.
   * This track is intentionally NOT synchronized with previously captured PCM.
   */
  async function startSerialReceiptReadbackVideoProbe({withOriginalAudio=false}={}){
   const source=withOriginalAudio?
    'real-webgl-receipt-readback-serial-original-audio':
    'real-webgl-receipt-readback-serial-video-only';
   const phase='after-all-primary-encoders-settled';
   const primaryRecordersSettled=recorder.state==='inactive'&&activeRecorders.size===0;
   if(!primaryRecordersSettled)return {source,phase,primaryRecordersSettled:false,
    status:'UNAVAILABLE',reason:'Earlier MediaRecorder still active'};
   const receiptStart=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
   // A borrowed soundstage track is valid only after the real button gesture
   // and only while live. The later audio is NOT the earlier saved PCM.
   const originalSoundstageTrackLive=withOriginalAudio&&soundTracks.length===1&&
    soundTracks[0].readyState==='live';
   const optedInAtStart=withOriginalAudio&&
    document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')==='true';
   if(withOriginalAudio&&(!originalSoundstageTrackLive||!optedInAtStart))
    return {source,phase,primaryRecordersSettled,status:'UNAVAILABLE',
     reason:'Original soundstage no longer opted-in or live'};
   if(!Number.isSafeInteger(receiptStart)||receiptStart<0)
    return {source,phase,primaryRecordersSettled,
     status:'UNAVAILABLE',reason:'No authentic starting WebGL frame receipt'};
   const width=640,height=400;
   const mirror=document.createElement('canvas');
   mirror.width=width;mirror.height=height;
   const ctx=mirror.getContext('2d',{alpha:false,willReadFrequently:false});
   const thumbnail=document.createElement('canvas');
   thumbnail.width=24;thumbnail.height=16;
   const small=thumbnail.getContext('2d',{alpha:false,willReadFrequently:true});
   if(!ctx||!small)return {source,phase,primaryRecordersSettled,
    status:'UNAVAILABLE',reason:'Readback 2D contexts unavailable'};
   let track=null,timer=null,lastReceipt=receiptStart,requestFailures=0;
   let requestedFrames=0,error=null;
   const samples=[];
   const beganAt=performance.now();
   try{
    const readbackStream=mirror.captureStream(0);
    track=readbackStream.getVideoTracks()[0];
    if(!track||typeof track.requestFrame!=='function')
     return {source,phase,primaryRecordersSettled,status:'UNAVAILABLE',
      reason:'2D readback track does not support authenticated requestFrame'};
    // Record the live 2D readback canvas, not new synthetic paint activity.
    // One recorder owns real readback video AND the actual opted-in original
    // soundstage simultaneously when requested; never audio from a WAV file.
    const stream=new MediaStream(withOriginalAudio?[track,...soundTracks]:[track]);
    const record=startIsolatedRecorder(stream,
     withOriginalAudio?['video/webm;codecs=vp8,opus','video/webm']:
      ['video/webm;codecs=vp8','video/webm'],
     source,20*1024*1024,true,'real-webgl-receipt-readback');
    const capture=()=>{
     if(samples.length>=32)return;
     const receipt=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
     if(!Number.isSafeInteger(receipt)||receipt<=lastReceipt)return;
     lastReceipt=receipt;
     try{
      // No draw may occur without the above fresh authentic renderer receipt.
      ctx.drawImage(canvas,0,0,width,height);
      small.drawImage(mirror,0,0,thumbnail.width,thumbnail.height);
      const pixels=small.getImageData(0,0,thumbnail.width,thumbnail.height).data;
      const colors=new Set();
      let hash=2166136261;
      for(let i=0;i<pixels.length;i+=4){
       colors.add(((pixels[i]>>3)<<10)|((pixels[i+1]>>3)<<5)|(pixels[i+2]>>3));
       for(let c=0;c<3;c++){
        hash^=pixels[i+c];hash=Math.imul(hash,16777619)>>>0;
       }
      }
      // requestFrame acts only on the genuine, receipt-gated pixel copy.
      track.requestFrame();requestedFrames++;
      samples.push({receipt,atMs:Math.max(0,performance.now()-beganAt),
       colors:colors.size,signature:hash.toString(16).padStart(8,'0')});
     }catch(e){
      requestFailures++;error=String(e).slice(0,160);
      // A readback/security failure cannot be repaired with placeholder art.
      if(timer!==null){clearInterval(timer);timer=null}
     }
    };
    timer=setInterval(capture,60);
    const media=await record;
    const receiptEnd=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
    const observedFrameAdvances=Number.isSafeInteger(receiptEnd)&&receiptEnd>=receiptStart?
     receiptEnd-receiptStart:0;
    return {...media,source,phase,primaryRecordersSettled,
     ...(withOriginalAudio?{optedInAtStart,originalSoundstageTrackLive}:{}),
     canvasWidth:width,canvasHeight:height,
     framePump:{mode:'real-webgl-render-receipt-readback',
      receiptStart,receiptEnd,observedFrameAdvances,requestedFrames,requestFailures,
      samples,...(error?{readbackError:error}:{})},
     evidence:'Readback copies only actual new WebGL frames; separate unaligned video, not synthetic gameplay'};
   }catch(e){
    return {source,phase,primaryRecordersSettled,status:'UNAVAILABLE',
     reason:'Receipt-gated WebGL readback: '+String(e).slice(0,180)};
   }finally{
    if(timer!==null)clearInterval(timer);
    track?.stop();mirror.width=0;mirror.height=0;
    thumbnail.width=0;thumbnail.height=0;
   }
  }

  function sampleRealSubmittedFrame(){
   if(!pumpActive)return;
   const receipt=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
   if(Number.isSafeInteger(receipt)&&receipt>=0){
    if(lastSubmittedFrame<0)lastSubmittedFrame=receipt;
    else if(receipt>lastSubmittedFrame){
     framePump.observedFrameAdvances+=receipt-lastSubmittedFrame;
     lastSubmittedFrame=receipt;
     let requestAttempted=false,requestSucceeded=false;
     if(explicitFrames){
      requestAttempted=true;
      try{videoTrack.requestFrame();framePump.requestedFrames++;requestSucceeded=true}
      catch(error){framePump.requestFailures++;framePump.requestError=String(error).slice(0,200)}
     }
     if(framePump.submissionSamples.length<32)framePump.submissionSamples.push({
      atMs:Math.max(0,performance.now()-began),receipt,requestAttempted,requestSucceeded
     });
    }else if(receipt<lastSubmittedFrame){
     // WebGL recovery/reset is not a new frame in the previous receipt epoch.
     lastSubmittedFrame=receipt;framePump.rendererEpochChanges++;
    }
   }
   if(pumpActive)pumpHandle=requestAnimationFrame(sampleRealSubmittedFrame);
  }
  function stopFramePump(){
   pumpActive=false;
   if(pumpHandle!==null)cancelAnimationFrame(pumpHandle);
   framePump.videoTrackStateAtStop=videoTrack.readyState;
   framePump.videoMutedAtStop=videoTrack.muted===true;
  }
  let finishClip;
  const clipDone=new Promise(resolve=>{
   let settled=false;
   const finish=clip=>{if(settled)return;settled=true;clearTimeout(watchdog);
    // The independent video encoder still owns the borrowed canvas track.
    // Do not stop it until ALL same-source encoders have finished.
    resolve(clip)};
   const chunks=[];
   recorder.ondataavailable=e=>{
    framePump.dataEvents++;
    framePump.dataBytes+=e.data?.size??0;
    if(e.data?.size)chunks.push(e.data);
   };
   recorder.onerror=e=>finish({status:'UNAVAILABLE',reason:'Real MediaRecorder error: '+String(e.error??e)});
   recorder.onstop=async()=>{
    activeRecorders.delete(recorder);
    try{
     const data=new Uint8Array(await new Blob(chunks,{type}).arrayBuffer());
     const bounded=data.length>1024&&data.length<=20*1024*1024;
     finish({source:'real-canvas-plus-opted-in-soundstage',status:bounded?'RECORDED':'UNAVAILABLE',
      reason:bounded?null:'Empty or oversized real WebM',
      mimeType:type,bytes:data.length,videoTracks:videoTracks.length,
      audioTracks:soundTracks.length,recordingMs:performance.now()-began,
      framePump:{...framePump},base64:bounded?toBase64(data):null});
    }catch(e){finish({status:'UNAVAILABLE',reason:'Failed reading real WebM: '+String(e)})}
   };
   const watchdog=setTimeout(()=>{try{if(recorder.state!=='inactive')recorder.stop()}catch{}
     finish({status:'UNAVAILABLE',reason:'WebM recorder did not finish inside 15-second budget',
      framePump:{...framePump}})},15000);
  });
  try{recorder.start(250);activeRecorders.add(recorder)}
  catch(e){finishCanvasDeliveryMonitor();stopFramePump();videoTracks.forEach(t=>t.stop());
   return unavailable('Recorder start: '+String(e))}
  const videoProbe=startIsolatedRecorder(new MediaStream([videoTrack]),
   ['video/webm;codecs=vp8','video/webm'],'real-webgl-canvas-video-only',20*1024*1024,true);
  const audioProbe=startIsolatedRecorder(new MediaStream(soundTracks),
   ['audio/webm;codecs=opus','audio/webm'],'real-opted-in-soundstage-audio-only',2*1024*1024,false);
  // Chromium software-WebGL delivered explicit requestFrame receipts but zero
  // video bytes. Probe a truly native canvas capture track from the SAME
  // running Dungeon canvas; never draw substitute frames or touch authority.
  let nativeCanvasStream=null;
  try{if(explicitFrames)nativeCanvasStream=canvas.captureStream(24)}catch{}
  const nativeTracks=nativeCanvasStream?.getVideoTracks()||[];
  const nativeVideoProbe=nativeTracks.length===1?
   startIsolatedRecorder(new MediaStream(nativeTracks),
    ['video/webm;codecs=vp8','video/webm'],'real-webgl-canvas-native-video-only',
    20*1024*1024,true,'native-capture-stream'):
   Promise.resolve({source:'real-webgl-canvas-native-video-only',status:'UNAVAILABLE',
    reason:'Distinct native canvas track unavailable'});
  const control2dProbe=start2DEncoderPositiveControl();
  pumpActive=true;pumpHandle=requestAnimationFrame(sampleRealSubmittedFrame);
  const livePcm=Promise.race([
   Promise.resolve().then(()=>window.__DUNGEON_RECORD_ORIGINAL_PCM__?.(5.5)??unavailable('Live PCM tap missing')),
   new Promise(resolve=>setTimeout(()=>resolve(unavailable('Live PCM processor timed out')),9000))
  ]).then(pcm=>{
   if(!pcm)return unavailable('Live PCM gave no result');
   const {wav,...meta}=pcm;
   if(wav?.length>44&&wav.length<=2*1024*1024)
    meta.wavBase64=toBase64(wav);
   return meta;
  }).catch(e=>unavailable('Live PCM capture error: '+String(e)));
  setTimeout(()=>{try{if(recorder.state!=='inactive')recorder.stop()}catch{}},5500);
  window.__D04_REAL_AV_CAPTURE__=Promise.all([clipDone,livePcm,videoProbe,audioProbe,nativeVideoProbe,control2dProbe])
   .then(async ([clip,pcm,videoOnly,audioOnly,nativeVideoOnly,control2dOnly])=>{
    // Freeze authentic game receipt timing BEFORE beginning any serial
    // synthetic recording. Later game frames must not certify earlier media.
    const trackDelivery=finishCanvasDeliveryMonitor();
    stopFramePump();
    const frames={before,
     after:window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1};
    const serial2dOnly=await start2DEncoderPositiveControl({serial:true});
    const serialRealVideo=await startSerialRealVideoProbe();
    const receiptReadbackVideo=await startSerialReceiptReadbackVideoProbe();
    // Serial, not competing with the earlier encoders. Unlike the separate
    // video probe, this captures ORIGINAL live soundstage + genuine copied
    // WebGL pixels in one bounded media window. Still no sample PTS proof.
    const sameWindowReadbackAV=await startSerialReceiptReadbackVideoProbe({withOriginalAudio:true});
    return {clip,pcm,
     isolated:{videoOnly,audioOnly,nativeVideoOnly,control2dOnly,serial2dOnly,serialRealVideo,receiptReadbackVideo,sameWindowReadbackAV},
     frames,trackDelivery};
   }).finally(()=>{finishCanvasDeliveryMonitor();stopFramePump();
    videoTracks.forEach(t=>t.stop());nativeTracks.forEach(t=>t.stop());
   });
  return {status:'STARTED',videoTracks:videoTracks.length,audioTracks:soundTracks.length,
   evidence:'Actual canvas + opted-in sound bus; independent live PCM; no sample-sync assertion'};
 });
}

async function attachD04LiveAVCapture(page,started,testInfo){
 let raw={clip:{status:'UNAVAILABLE',reason:started?.reason??'No capture attempted'},
  pcm:{status:'UNAVAILABLE'},frames:{before:-1,after:-1},trackDelivery:null};
 if(started?.status==='STARTED')try{
  raw=await page.evaluate(()=>window.__D04_REAL_AV_CAPTURE__);
 }catch(e){raw.clip={status:'UNAVAILABLE',reason:'Live browser retrieval: '+String(e)}}
 raw.decoder={serialRealVideo:decodeSerialRealWebGLMotion(raw.isolated?.serialRealVideo),
   readbackVideo:decodeReceiptReadbackMotion(raw.isolated?.receiptReadbackVideo),
   sameWindowReadbackAV:decodeSameWindowReadbackMotion(raw.isolated?.sameWindowReadbackAV)};
 const assessment=assessD04Capture({optedIn:started?.status==='STARTED',...raw});
 console.log('D04 verified real WebGL frames:',JSON.stringify({
  decoded:raw.decoder.serialRealVideo.frameCount??0,
  distinct:raw.decoder.serialRealVideo.distinctFrames??0,
  motionQualified:assessment.serialRealVideoMotionQualified,
  status:raw.decoder.serialRealVideo.status
 }));
 const {base64,...clip}=raw.clip||{};
 const {wavBase64,...pcm}=raw.pcm||{};
 const {base64:isolatedVideoBase64,...videoOnly}=raw.isolated?.videoOnly||{};
 const {base64:isolatedNativeVideoBase64,...nativeVideoOnly}=raw.isolated?.nativeVideoOnly||{};
 const {base64:isolatedAudioBase64,...audioOnly}=raw.isolated?.audioOnly||{};
 const {base64:discardedSyntheticVideo,...control2dOnly}=raw.isolated?.control2dOnly||{};
 const {base64:discardedSerialSyntheticVideo,...serial2dOnly}=raw.isolated?.serial2dOnly||{};
 const {base64:serialRealVideoBase64,...serialRealVideo}=raw.isolated?.serialRealVideo||{};
 const {base64:receiptReadbackBase64,...receiptReadbackVideo}=raw.isolated?.receiptReadbackVideo||{};
 const {base64:sameWindowAVBase64,...sameWindowReadbackAV}=raw.isolated?.sameWindowReadbackAV||{};
 const retained=persistD04CaptureEvidence({directory:'artifacts',raw,started,assessment});
 if(base64)await testInfo.attach('d04-real-canvas-and-opted-in-original-audio.webm',{
  body:Buffer.from(base64,'base64'),contentType:'video/webm'});
 if(wavBase64)await testInfo.attach('d04-live-original-soundstage-pcm.wav',{
  body:Buffer.from(wavBase64,'base64'),contentType:'audio/wav'});
 if(assessment.isolatedVideoRecorded&&isolatedVideoBase64)
  await testInfo.attach('d04-real-webgl-video-only.webm',{
   body:Buffer.from(isolatedVideoBase64,'base64'),contentType:'video/webm'});
 if(assessment.serialRealVideoRecorded&&serialRealVideoBase64)
  await testInfo.attach('d04-real-webgl-serial-video-only.webm',{
   body:Buffer.from(serialRealVideoBase64,'base64'),contentType:'video/webm'});
 if(assessment.receiptReadbackVideoRecorded&&receiptReadbackBase64)
  await testInfo.attach('d04-authentic-webgl-receipt-readback-video-only.webm',{
   body:Buffer.from(receiptReadbackBase64,'base64'),contentType:'video/webm'});
 if(assessment.sameWindowMovingAV&&sameWindowAVBase64)
  await testInfo.attach('d04-real-webgl-readback-original-audio-same-window-unaligned.webm',{
   body:Buffer.from(sameWindowAVBase64,'base64'),contentType:'video/webm'});
 if(assessment.isolatedAudioRecorded&&isolatedAudioBase64)
  await testInfo.attach('d04-real-opted-in-audio-only.webm',{
   body:Buffer.from(isolatedAudioBase64,'base64'),contentType:'audio/webm'});
 if(assessment.isolatedNativeVideoRecorded&&isolatedNativeVideoBase64)
  await testInfo.attach('d04-real-webgl-native-video-only.webm',{
   body:Buffer.from(isolatedNativeVideoBase64,'base64'),contentType:'video/webm'});
 await testInfo.attach('d04-live-browser-av-evidence.json',{
  body:Buffer.from(JSON.stringify({started,clip,pcm,
   isolated:{videoOnly,nativeVideoOnly,audioOnly,control2dOnly,serial2dOnly,serialRealVideo,receiptReadbackVideo,sameWindowReadbackAV},frames:raw.frames,
   trackDelivery:raw.trackDelivery??null,decoder:raw.decoder??null,
   assessment,retained,limits:{MAX_CLIP_BYTES,MAX_PCM_BYTES},
   caveat:'Separate real-source encoders diagnose combined failure; no measured A/V sync. No borrowed audio.'},null,2)),
  contentType:'application/json'});
 return assessment;
}


/**
 * Real, non-synthetic compositor pixel witness. The real #world screenshot
 * is captured between live WebGL frame receipts; a 24x16 decoded-PNG probe
 * checks whether the screenshot actually contains varied, changing pixels.
 * It never upgrades these stills to original audio/video synchronization.
 */
async function captureRealCompositorWorldStills(page,{view,seed},testInfo){
 const witness={source:'playwright-world-element-compositor-screenshots',
  capture:'receipt-bracketed-png',view,viewport:page.viewportSize(),seed,samples:[]};
 const label=view==='mobile-390x844'?'mobile':'desktop';
 let lastReceipt=-1,lastTick=-1;
 for(let i=0;i<2;i++){
  try{
   // Distinct genuine renderer submissions, not synthetic substitute frames.
   await expect.poll(()=>page.evaluate(()=>
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1),
    {timeout:16000}).toBeGreaterThan(lastReceipt);
   await expect.poll(()=>page.evaluate(()=>
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick??-1),
    {timeout:16000}).toBeGreaterThan(lastTick);
   const before=await page.evaluate(()=>{
    const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    return {receipt:d?.physicalFeedback?.framesAcknowledged??-1,
     atMs:performance.now(),state:d?.renderedState??null};
   });
   const png=await page.locator('#world').screenshot({type:'png',timeout:25000});
   const decoded=await page.evaluate(async b64=>{
    const binary=atob(b64),data=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)data[i]=binary.charCodeAt(i);
    const image=await createImageBitmap(new Blob([data],{type:'image/png'}));
    const thumb=document.createElement('canvas');thumb.width=24;thumb.height=16;
    const ctx=thumb.getContext('2d',{willReadFrequently:true});
    if(!ctx){image.close?.();throw Error('No screenshot decoder context')}
    ctx.drawImage(image,0,0,24,16);
    const pixels=ctx.getImageData(0,0,24,16).data;
    const colors=new Set();let hash=2166136261;
    for(let i=0;i<pixels.length;i+=4){
     colors.add(((pixels[i]>>3)<<10)|((pixels[i+1]>>3)<<5)|(pixels[i+2]>>3));
     for(let c=0;c<3;c++){hash^=pixels[i+c];hash=Math.imul(hash,16777619)>>>0}
    }
    const result={width:image.width,height:image.height,colors:colors.size,
     signature:hash.toString(16).padStart(8,'0')};
    image.close?.();thumb.width=0;thumb.height=0;
    return result;
   },png.toString('base64'));
   const after=await page.evaluate(()=>
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1);
   if(!before.state)throw Error('Missing real rendered Dungeon state');
   const state=before.state;
   witness.samples.push({beforeReceipt:before.receipt,afterReceipt:after,
    atMs:before.atMs,run:state.run,floor:state.floor,tick:state.tick,
    checksum:state.checksum,pngBytes:png.length,...decoded});
   lastReceipt=after;lastTick=state.tick;
   fs.writeFileSync('artifacts/dungeon-d04-compositor-'+label+'-'+String(i+1).padStart(2,'0')+'.png',png);
  }catch(error){
   witness.captureError=String(error).slice(0,240);
   break;
  }
 }
 witness.classification=classifyCompositorWitness(witness);
 witness.sampleSynchronized=false;witness.movingVideo=false;
 witness.caveat='Authenticated real-world compositor stills only, not moving video, a second camera angle or synchronized original sound';
 const out='artifacts/dungeon-d04-real-compositor-'+label+'-witness.json';
 fs.writeFileSync(out,JSON.stringify(witness,null,2)+'\n');
 await testInfo.attach('d04-'+label+'-compositor-world-witness.json',{
  body:Buffer.from(JSON.stringify(witness,null,2)),contentType:'application/json'});
 return witness;
}

test('D04 gated preview observes genuine public damage, safe effect bounds and render-submitted sound',async({page,request})=>{
 test.setTimeout(240000);
 for(const endpoint of [
  '/dungeon/physical-feedback-plan.js',
  '/dungeon/physical-feedback-visuals.js',
  // Missing from the static serving allowlist until the D04 real-browser
  // trace caught a 404; an absent ESM dependency prevents renderer startup.
  '/dungeon/warden-warning-lifecycle.js',
  '/dungeon/original-combat-foley.js',
  '/dungeon/physical-combat-feedback.js'
 ])expect((await request.get(endpoint)).status(),endpoint).toBe(200);
 const real=witnessActualDamage();
 const errors=[],stream=[real.before,real.after,...real.followups];
 let cursor=0,ceiling=0;
 page.on('pageerror',e=>errors.push(String(e)));
 // Every response is one consecutive authentic authority snapshot. A gate
 // keeps the verified HP transition readable before releasing the followups.
 await page.route('**/dungeon/state',route=>{
  const index=Math.min(cursor,ceiling);
  const snapshot=stream[index];
  if(cursor<ceiling)cursor++;
  return route.fulfill({json:snapshot});
 });
 // Explicit forensic-only capture buffer: browser recorder can inspect the
 // actual retained WebGL output without changing the normal D04/legacy path.
 await page.goto('/dungeon?feedback=d04&captureProbe=retain');
 const probe=await page.evaluate(()=>document.querySelector('#world')?.getContext('webgl2')?.getContextAttributes?.()??
  document.querySelector('#world')?.getContext('webgl')?.getContextAttributes?.()??null);
 expect(probe?.preserveDrawingBuffer).toBe(true,'D04 forensic canvas must retain its actual rendered pixels');
 await test.info().attach('d04-retained-webgl-probe-contract.json',{
  body:Buffer.from(JSON.stringify({source:'actual Three.js WebGL context',
   explicitD04CaptureProbe:true,preserveDrawingBuffer:probe.preserveDrawingBuffer,
   caveat:'Retained drawing buffer is a capture diagnostic, not proof of encoded moving video or synchronized original foley'},null,2)),contentType:'application/json'});
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
  {timeout:90000}).toBe('D04-physical-authority-feedback');
 const initial=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(initial.d04PreviewEnabled).toBe(true);
 expect(initial.physicalFeedback.audioOptedIn).toBe(false,'no autoplay');
 expect(initial.physicalFeedback.visuals.reservedInstances).toBeLessThanOrEqual(104);
 expect(initial.physicalFeedback.visuals.drawCalls).toBeLessThanOrEqual(7);
 expect(initial.soundstage).toBeNull();
 const button=page.locator('#audio-toggle');
 await expect(button).toHaveAttribute('aria-pressed','false');
 await button.click();
 const optedIn=(await button.getAttribute('aria-pressed'))==='true';
 if(optedIn){
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:20000}).toBe(true);
  expect((await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage?.suppressCombat))).toBe(true);
 }
 // Record the ACTUAL running canvas and spectator's consented original sound
 // before releasing the real HP-loss transition, not a detached audio audition.
 const captureStarted=optedIn?await beginD04LiveAVCapture(page):
  {status:'UNAVAILABLE',reason:'User did not opt in'};
 // This state pair comes ONLY from real seeded DungeonRuntime.step().
 // No hand-edited HP, staged cinematic hit, or synthetic combat action.
 ceiling=1;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick),
   {timeout:70000}).toBe(real.after.tick);
 const atDamage=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(atDamage.renderedState.checksum).toBe(real.after.checksum);
 // Release authentic subsequent activity instead of synthesizing repeated
 // snapshots that stall the stream. Old cues remain subject to the 400ms
 // deadline; a stalled frame must never invent a late impact.
 ceiling=stream.length-1;
 // Genuine software-WebGL may need tens of seconds per submitted frame.
 // Observe a bounded number of ACTUAL frame receipts, never wait 70 seconds
 // for a positive visual counter that has already correctly expired its cues.
 // Neither the timeout nor expired cues can be upgraded to a pass.
 let followupWait='TWO_FRESH_REAL_FRAME_RECEIPTS';
 try{
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??0),
   {timeout:45000}).toBeGreaterThan((atDamage.physicalFeedback?.framesAcknowledged??0)+1);
 }catch(error){followupWait='FRESH_FRAME_RECEIPT_TIMEOUT'}
 const diagnostic=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 await test.info().attach('d04-real-stream-debug.json',{
  body:Buffer.from(JSON.stringify({seed:real.seed,victims:real.victimIds,
   beforeTick:real.before.tick,damageTick:real.after.tick,
   delivered:cursor,allowed:ceiling,followupWait,atDamage:atDamage?.physicalFeedback,
   latest:diagnostic?.physicalFeedback,rendered:diagnostic?.renderedState,
   lastPageErrors:errors.slice(-6)},null,2)),contentType:'application/json'
 });
 // Always preserve both actual media and independent PCM evidence when the
 // browser permits them. A successful smoke does not imply sample-level sync.
 const captureAssessment=await attachD04LiveAVCapture(page,captureStarted,test.info());
 console.log('D04 authentic independent encoding:',JSON.stringify({
  diagnosis:captureAssessment.encoderDiagnosis,
  combined:captureAssessment.combinedVideoAudio,
  explicitVideo:captureAssessment.isolatedVideoRecorded,
  nativeVideo:captureAssessment.isolatedNativeVideoRecorded,
  audio:captureAssessment.isolatedAudioRecorded,
  synchronized:captureAssessment.sampleSynchronized,
  trackDiagnosis:captureAssessment.trackDiagnosis,
  canvasEncoderDifferential:captureAssessment.canvasEncoderDifferential,
  serialCanvasEncoderDifferential:captureAssessment.serialCanvasEncoderDifferential,
  serialRealVideoRecorded:captureAssessment.serialRealVideoRecorded,
  receiptReadbackVideoRecorded:captureAssessment.receiptReadbackVideoRecorded,
  sameWindowMovingAV:captureAssessment.sameWindowMovingAV,
  sameWindowAVClassification:captureAssessment.sameWindowAVClassification,
  submissionDiagnosis:captureAssessment.submissionDiagnosis
 }));
 const observed=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 // Read-only forensic artifact from the ACTUAL opted-in Dungeon page. These
 // are authority-cue observation and post-WebGL receipt clocks, not decoded
 // VP8 PTS or PCM sample onset. Never use this to claim auditory sync.
 const earlyReceipts=atDamage.physicalFeedback?.recentDeliveryReceipts??[];
 const lateReceipts=observed.physicalFeedback?.recentDeliveryReceipts??[];
 const originalStartCorrelation=correlateD04OriginalSourceStarts({
  receipts:lateReceipts,sourceStarts:observed.physicalFeedback?.audio?.recentOriginalStarts??[]
 });
 const timeline={
  source:'real-DungeonRuntime-to-ThreeJS-D04-controller',
  seed:real.seed,run:real.after.run,floor:real.after.floor,
  authoritativeHpLoss:{beforeTick:real.before.tick,afterTick:real.after.tick,
   victimIds:real.victimIds,checksum:real.after.checksum},
  clock:'opt-in injected performance.now; receipt sampled AFTER WebGL submit',
  playback:'real Chrome, WebGL and opted-in original soundstage',
  atDamage:{frameReceipts:atDamage.physicalFeedback?.framesAcknowledged??null,
   audioAccepted:atDamage.physicalFeedback?.audioAccepted??null,
   recentReceipts:earlyReceipts},
  afterAuthenticFollowups:{
   frameReceipts:observed.physicalFeedback?.framesAcknowledged??null,
   audioAccepted:observed.physicalFeedback?.audioAccepted??null,
   queued:observed.physicalFeedback?.queued??null,
   expiredQueuedCues:observed.physicalFeedback?.expiredQueuedCues??null,
   staleAudioDropped:observed.physicalFeedback?.staleAudioDropped??null,
   visualAccepted:observed.physicalFeedback?.visualAccepted??null,
   recentReceipts:lateReceipts},
  // Separate audio scheduling domain: source.start() returns WebAudio context
  // milliseconds, NOT performance.now. Match only immutable cue identity,
  // never subtract the unlike clock origins or infer an audible PCM onset.
  originalSourceStarts:observed.physicalFeedback?.audio?.recentOriginalStarts??[],
  sourceStartClock:'AudioContext.currentTime, unmatched to decoded audio/video PTS',
  // A cueId-only join is NOT source-start provenance. Require the same
  // scene/tick/semantic recipe, one genuine submission receipt and one
  // successful original source.start audit. Neither clock establishes PCM PTS.
  sourceStartMatches:originalStartCorrelation.matches,
  sourceStartCorrelation:originalStartCorrelation,
  admittedFoleyReceipts:lateReceipts.filter(r=>r.audio===true&&
   r.frameId!==null).map(r=>({cueId:r.cueId,kind:r.kind,tick:r.tick,
    observedClockMs:r.observedClockMs,submittedClockMs:r.submittedClockMs,
    observationToSubmissionMs:r.observationToSubmissionMs,
    renderSubmissionMs:r.renderSubmissionMs,decision:r.decision})),
  sampleSynchronized:false,classification:'FRAME_TIMELINE_ONLY_UNALIGNED',
  limitations:[
   '64 retained receipts are a bounded sample, not the full combat history',
   'An accepted WebAudio emit or source.start is not proof of audible Opus sample onset',
   'Renderer acknowledgments are not decoded video presentation timestamps',
   'The actual HP loss does not identify an attacker, blade-tip or damage source'
  ]
 };
 const timelineJson=JSON.stringify(timeline,null,2);
 fs.writeFileSync('artifacts/dungeon-d04-real-cue-frame-foley-timeline.json',timelineJson+'\n');
 await test.info().attach('d04-real-cue-frame-foley-timeline.json',{
  body:Buffer.from(timelineJson),contentType:'application/json'
 });
 expect(observed.physicalFeedback.visuals.active).toBeLessThanOrEqual(104);
 expect(observed.physicalFeedback.visuals.activeDrawCalls).toBeLessThanOrEqual(7);
 expect(observed.physicalFeedback.adapterFailures).toBe(0);
 expect([...atDamage.physicalFeedback.recentDeliveryReceipts,
  ...observed.physicalFeedback.recentDeliveryReceipts].some(x=>
  x.kind==='damage'||x.kind==='damage-fatal')).toBe(true);
 if(optedIn){
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??0),
   {timeout:40000}).toBeGreaterThan(0);
  const fresh=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(fresh.physicalFeedback.recentDeliveryReceipts.filter(x=>x.audio).every(x=>
   x.frameId!==null)).toBe(true,'no audio before acknowledged WebGL submission');
 }
 await captureRealCompositorWorldStills(page,{view:'desktop-1440x900',seed:real.seed},test.info());
 await page.locator('#world').screenshot({path:'artifacts/dungeon-d04-real-combat-world.png'});
 // Partial mobile evidence uses the SAME real seed/run and existing camera.
 // A still frame is never described as a matched mobile moving A/V clip.
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
  {timeout:30000}).toBe('D04-physical-authority-feedback');
 await captureRealCompositorWorldStills(page,{view:'mobile-390x844',seed:real.seed},test.info());
 await page.screenshot({path:'artifacts/dungeon-d04-real-mobile-390.png'});
 const mobile=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(mobile.d04PreviewEnabled).toBe(true);
 expect(mobile.physicalFeedback.visuals.reservedInstances).toBeLessThanOrEqual(104);
 expect(mobile.physicalFeedback.visuals.drawCalls).toBeLessThanOrEqual(7);
 await test.info().attach('d04-real-390px-mobile-readonly-receipt.json',{
  body:Buffer.from(JSON.stringify({
   source:'same authentic seeded DungeonRuntime stream, existing camera, viewport-only resize',
   width:390,height:844,seed:real.seed,run:mobile.renderedState?.run,
   floor:mobile.renderedState?.floor,tick:mobile.renderedState?.tick,
   checksum:mobile.renderedState?.checksum,
   limitation:'Mobile screenshot only; no matched three-viewpoint moving audio/video proof.'
  },null,2)),contentType:'application/json'
 });
 const receipt={
  source:'seeded, actual DungeonRuntime.step -> publicState -> actual Three.js WebGL renderer',
  seed:real.seed,run:real.after.run,floor:real.after.floor,
  beforeTick:real.before.tick,afterTick:real.after.tick,victims:real.victimIds,
  checksum:real.after.checksum,optedIn,authenticFollowupSteps:real.followups.length,
  originalDamageFrame:atDamage?.renderedState,continuouslyDelivered:cursor,
  visual:observed.physicalFeedback.visuals,
  cues:observed.physicalFeedback.recentDeliveryReceipts,
  audio:observed.physicalFeedback.audio,
  evidenceLimit:'render submission receipt is not proof of audio/video sample-level synchronization'
 };
 await test.info().attach('d04-authentic-combat-presentation-receipt.json',{
  body:Buffer.from(JSON.stringify(receipt,null,2)),contentType:'application/json'
 });
 if(optedIn){
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','false');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:20000}).toBe(false);
 }
 expect(errors).toEqual([]);
 // Strictly classify the original, consecutive HP-loss event with REAL
 // renderer receipts and delivery counters. Save the verdict even on a red
 // acceptance result so an honest failure still produces inspectable media.
 const renderVerdict=classifyAuthenticD04RenderObservation({
  before:real.before,after:real.after,atDamage,latest:observed
 });
 const renderVerdictEvidence={
  ...renderVerdict,seed:real.seed,run:real.after.run,floor:real.after.floor,
  beforeTick:real.before.tick,afterTick:real.after.tick,
  damagedStateChecksum:real.after.checksum,followupWait,
  browserErrors:errors.slice(-6),
  limitation:'Visual admission is NOT measured sword contact or audio/video synchronization'
 };
 const verdictJson=JSON.stringify(renderVerdictEvidence,null,2);
 fs.writeFileSync('artifacts/dungeon-d04-real-render-feedback-verdict.json',verdictJson+'\n');
 await test.info().attach('d04-real-render-feedback-verdict.json',{
  body:Buffer.from(verdictJson),contentType:'application/json'
 });
 expect(renderVerdict.status,
  'Real combat feedback must be admitted on a genuine frame; expired cues and empty audio cannot pass realism acceptance. Review the saved real-media evidence and verdict.'
 ).toBe('VISUAL_ADMITTED_NOT_AV_VERIFIED');
});