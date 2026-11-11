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
  const canvasStream=canvas.captureStream(24),videoTracks=canvasStream.getVideoTracks();
  if(videoTracks.length!==1)return unavailable('No actual WebGL canvas video track');
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
  let finishClip;
  const clipDone=new Promise(resolve=>{
   let settled=false;
   const finish=clip=>{if(settled)return;settled=true;clearTimeout(watchdog);
    videoTracks.forEach(t=>t.stop());resolve(clip)};
   const chunks=[];
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   recorder.onerror=e=>finish({status:'UNAVAILABLE',reason:'Real MediaRecorder error: '+String(e.error??e)});
   recorder.onstop=async()=>{
    try{
     const data=new Uint8Array(await new Blob(chunks,{type}).arrayBuffer());
     const bounded=data.length>1024&&data.length<=20*1024*1024;
     finish({source:'real-canvas-plus-opted-in-soundstage',status:bounded?'RECORDED':'UNAVAILABLE',
      reason:bounded?null:'Empty or oversized real WebM',
      mimeType:type,bytes:data.length,videoTracks:videoTracks.length,
      audioTracks:soundTracks.length,recordingMs:performance.now()-began,
      base64:bounded?toBase64(data):null});
    }catch(e){finish({status:'UNAVAILABLE',reason:'Failed reading real WebM: '+String(e)})}
   };
   const watchdog=setTimeout(()=>{try{if(recorder.state!=='inactive')recorder.stop()}catch{}
     finish({status:'UNAVAILABLE',reason:'WebM recording exceeded 9-second budget'})},9000);
  });
  try{recorder.start(250)}
  catch(e){videoTracks.forEach(t=>t.stop());return unavailable('Recorder start: '+String(e))}
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
  window.__D04_REAL_AV_CAPTURE__=Promise.all([clipDone,livePcm]).then(([clip,pcm])=>({
   clip,pcm,frames:{before,after:window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1}
  }));
  return {status:'STARTED',videoTracks:videoTracks.length,audioTracks:soundTracks.length,
   evidence:'Actual canvas + opted-in sound bus; independent live PCM; no sample-sync assertion'};
 });
}

async function attachD04LiveAVCapture(page,started,testInfo){
 let raw={clip:{status:'UNAVAILABLE',reason:started?.reason??'No capture attempted'},
  pcm:{status:'UNAVAILABLE'},frames:{before:-1,after:-1}};
 if(started?.status==='STARTED')try{
  raw=await page.evaluate(()=>window.__D04_REAL_AV_CAPTURE__);
 }catch(e){raw.clip={status:'UNAVAILABLE',reason:'Live browser retrieval: '+String(e)}}
 const assessment=assessD04Capture({optedIn:started?.status==='STARTED',...raw});
 const {base64,...clip}=raw.clip||{};
 const {wavBase64,...pcm}=raw.pcm||{};
 const retained=persistD04CaptureEvidence({directory:'artifacts',raw,started,assessment});
 if(base64)await testInfo.attach('d04-real-canvas-and-opted-in-original-audio.webm',{
  body:Buffer.from(base64,'base64'),contentType:'video/webm'});
 if(wavBase64)await testInfo.attach('d04-live-original-soundstage-pcm.wav',{
  body:Buffer.from(wavBase64,'base64'),contentType:'audio/wav'});
 await testInfo.attach('d04-live-browser-av-evidence.json',{
  body:Buffer.from(JSON.stringify({started,clip,pcm,frames:raw.frames,
   assessment,retained,limits:{MAX_CLIP_BYTES,MAX_PCM_BYTES},
   caveat:'Overlapping genuine browser streams; no measured sample-accurate A/V sync. No borrowed audio.'},null,2)),
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