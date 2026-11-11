'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
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


const {assessD04Capture,persistD04CaptureEvidence,MAX_CLIP_BYTES,MAX_PCM_BYTES}=
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
  const before=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1;
  const began=performance.now();
  const framePump={
   mode:explicitFrames?'submitted-frame-request':'native-capture-stream',
   initialReceipt:before,observedFrameAdvances:0,requestedFrames:0,requestFailures:0,
   rendererEpochChanges:0,dataEvents:0,dataBytes:0,videoMutedAtStart:videoTrack.muted===true
  };
  let lastSubmittedFrame=before,pumpActive=false,pumpHandle=null;

  // Diagnose whether this ACTUAL canvas capture track delivers frames at all.
  // A muted HTMLVideoElement consumes the borrowed track; it never draws to
  // the game canvas, generates video frames or authors a combat outcome.
  function startCanvasTrackDeliveryMonitor(){
   const trace={source:'real-webgl-canvas-capture-video-monitor',
    mode:'request-video-frame-callback',playStatus:'NOT_STARTED',
    mutedAtStart:videoTrack.muted===true,events:[],frames:[],readyStateAtStart:videoTrack.readyState};
   let active=true,callbackId=null,stopped=false;
   const video=document.createElement('video');
   video.muted=true;video.playsInline=true;video.autoplay=true;
   video.style.cssText='position:fixed;left:-5px;top:-5px;width:1px;height:1px;opacity:0;pointer-events:none';
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
    Promise.resolve().then(()=>video.play()).then(()=>{
     if(!active)return;
     trace.playStatus='PLAYING';
     callbackId=video.requestVideoFrameCallback(observeFrame);
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
      framePump:videoOnly?{...framePump,
       ...(frameMode==='native-capture-stream'?{mode:'native-capture-stream',requestedFrames:0}:{})}:undefined,
      base64:data?toBase64(data):null});
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
     if(overflow||bytes<=1024)return finish('UNAVAILABLE',overflow?'Independent encoded file exceeded budget':'Empty independent WebM');
     try{
      const data=new Uint8Array(await new Blob(chunks,{type:mimeType}).arrayBuffer());
      finish(data.length===bytes?'RECORDED':'UNAVAILABLE',
       data.length===bytes?null:'Independent chunks missing',data.length===bytes?data:null);
     }catch(error){finish('UNAVAILABLE','Independent WebM read: '+String(error).slice(0,200))}
    };
    try{rec.start(250)}catch(error){finish('UNAVAILABLE','Independent recorder start: '+String(error).slice(0,200));return}
    stopTimer=setTimeout(()=>{try{if(rec.state!=='inactive')rec.stop()}catch(error){finish('UNAVAILABLE',String(error))}},5500);
    watchdog=setTimeout(()=>{try{if(rec.state!=='inactive')rec.stop()}catch{}
     finish('UNAVAILABLE','Independent recorder exceeded 15-second budget')},15000);
   });
  }
  function sampleRealSubmittedFrame(){
   if(!pumpActive)return;
   const receipt=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
   if(Number.isSafeInteger(receipt)&&receipt>=0){
    if(lastSubmittedFrame<0)lastSubmittedFrame=receipt;
    else if(receipt>lastSubmittedFrame){
     framePump.observedFrameAdvances+=receipt-lastSubmittedFrame;
     lastSubmittedFrame=receipt;
     if(explicitFrames)try{videoTrack.requestFrame();framePump.requestedFrames++}
      catch(error){framePump.requestFailures++;framePump.requestError=String(error).slice(0,200)}
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
  try{recorder.start(250)}
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
  window.__D04_REAL_AV_CAPTURE__=Promise.all([clipDone,livePcm,videoProbe,audioProbe,nativeVideoProbe])
   .then(([clip,pcm,videoOnly,audioOnly,nativeVideoOnly])=>({clip,pcm,
    isolated:{videoOnly,audioOnly,nativeVideoOnly},
    frames:{before,after:window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1},
    trackDelivery:finishCanvasDeliveryMonitor()
   })).finally(()=>{finishCanvasDeliveryMonitor();stopFramePump();
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
 const assessment=assessD04Capture({optedIn:started?.status==='STARTED',...raw});
 const {base64,...clip}=raw.clip||{};
 const {wavBase64,...pcm}=raw.pcm||{};
 const {base64:isolatedVideoBase64,...videoOnly}=raw.isolated?.videoOnly||{};
 const {base64:isolatedNativeVideoBase64,...nativeVideoOnly}=raw.isolated?.nativeVideoOnly||{};
 const {base64:isolatedAudioBase64,...audioOnly}=raw.isolated?.audioOnly||{};
 const retained=persistD04CaptureEvidence({directory:'artifacts',raw,started,assessment});
 if(base64)await testInfo.attach('d04-real-canvas-and-opted-in-original-audio.webm',{
  body:Buffer.from(base64,'base64'),contentType:'video/webm'});
 if(wavBase64)await testInfo.attach('d04-live-original-soundstage-pcm.wav',{
  body:Buffer.from(wavBase64,'base64'),contentType:'audio/wav'});
 if(assessment.isolatedVideoRecorded&&isolatedVideoBase64)
  await testInfo.attach('d04-real-webgl-video-only.webm',{
   body:Buffer.from(isolatedVideoBase64,'base64'),contentType:'video/webm'});
 if(assessment.isolatedAudioRecorded&&isolatedAudioBase64)
  await testInfo.attach('d04-real-opted-in-audio-only.webm',{
   body:Buffer.from(isolatedAudioBase64,'base64'),contentType:'audio/webm'});
 if(assessment.isolatedNativeVideoRecorded&&isolatedNativeVideoBase64)
  await testInfo.attach('d04-real-webgl-native-video-only.webm',{
   body:Buffer.from(isolatedNativeVideoBase64,'base64'),contentType:'video/webm'});
 await testInfo.attach('d04-live-browser-av-evidence.json',{
  body:Buffer.from(JSON.stringify({started,clip,pcm,
   isolated:{videoOnly,nativeVideoOnly,audioOnly},frames:raw.frames,
   trackDelivery:raw.trackDelivery??null,
   assessment,retained,limits:{MAX_CLIP_BYTES,MAX_PCM_BYTES},
   caveat:'Separate real-source encoders diagnose combined failure; no measured A/V sync. No borrowed audio.'},null,2)),
  contentType:'application/json'});
 return assessment;
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
 await page.goto('/dungeon?feedback=d04');
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
 try{
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.visualAccepted??0),
    {timeout:70000}).toBeGreaterThan(0);
 }finally{
  const diagnostic=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  await test.info().attach('d04-real-stream-debug.json',{
   body:Buffer.from(JSON.stringify({seed:real.seed,victims:real.victimIds,
    beforeTick:real.before.tick,damageTick:real.after.tick,
    delivered:cursor,allowed:ceiling,atDamage:atDamage?.physicalFeedback,
    latest:diagnostic?.physicalFeedback,rendered:diagnostic?.renderedState,
    lastPageErrors:errors.slice(-6)},null,2)),contentType:'application/json'
  });
 }
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
  trackDiagnosis:captureAssessment.trackDiagnosis
 }));
 const observed=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
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
 await page.locator('#world').screenshot({path:'artifacts/dungeon-d04-real-combat-world.png'});
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
});