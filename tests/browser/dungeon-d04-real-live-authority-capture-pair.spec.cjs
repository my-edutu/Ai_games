'use strict';
const {test,expect}=require('@playwright/test');
const {performance}=require('node:perf_hooks');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {SOURCE,classifyD04LiveAuthorityPair}=
 require('./dungeon-d04-live-authority-pair.cjs');
const {SOURCE:MODE_SOURCE,classifyD04ContinuousModePair}=
 require('./dungeon-d04-continuous-mode-pair.cjs');
fs.mkdirSync('artifacts',{recursive:true});
const scene=s=>({run:s.run,floor:s.floor,tick:s.tick,checksum:s.checksum});
const STEP_MS=250,ACTIVE_MS=15000;
// Read-only real public-state corpus; server clock progresses even if WebGL
// or the recorder stalls. Never spoof HP, attacker, pose or a combat event.
function realAuthoritySeries(){
 const seed='visual-room-art-18',game=DungeonRuntime.create(seed);
 const states=[game.publicState()],manifest=[{stageIndex:0,scene:scene(states[0]),victimIds:[]}];
 let prev=states[0];
 for(let i=1;i<100;i++){
  const next=game.step();
  const victims=next.run===prev.run&&next.floor===prev.floor&&next.tick===prev.tick+1?
   next.units.filter(u=>prev.units.some(p=>p.id===u.id&&p.hp>u.hp)).map(u=>u.id):[];
  states.push(next);manifest.push({stageIndex:i,scene:scene(next),victimIds:victims});
  prev=next;
 }
 if(!manifest.some(s=>s.victimIds.length))
  throw Error('Real DungeonRuntime seed yielded no genuine HP-loss witness');
 return {seed,states,manifest};
}
async function observeLiveAuthority(browser,real,viewport,capture,feedbackMode='d04',source=SOURCE){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 let beganAt=null,live=false,stopIndex=0;const requestLog=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>{
  const now=performance.now();
  const index=beganAt===null?0:live?
   Math.min(real.states.length-1,Math.floor((now-beganAt)/STEP_MS)):stopIndex;
  const state=real.states[index];
  if(requestLog.length<256)requestLog.push({index,atMs:beganAt===null?null:Math.round(now-beganAt),
   scene:scene(state)});
  return route.fulfill({json:state});
 });
 try{
  await page.goto(feedbackMode==='d04'?'/dungeon?feedback=d04':'/dungeon');
  if(feedbackMode==='d04')await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
   {timeout:90000}).toBe('D04-physical-authority-feedback');
  else await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.d04PreviewEnabled),
   {timeout:90000}).toBe(false);
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum),
   {timeout:65000}).toBe(real.manifest[0].scene.checksum);
  await page.locator('#view-toggle').click();
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),
   {timeout:30000}).toBe('tactical');
  await page.locator('#audio-toggle').click();
  if(feedbackMode==='d04')await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:30000}).toBe(true);
  await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','true');
  const started=await page.evaluate(({capture,source,seed,viewport,feedbackMode})=>{
   const canvas=document.querySelector('#world'),sound=window.__DUNGEON_CAPTURE_SOUND__?.();
   let stopped=false,lastFrame=-1,lastReceipt=-1,track=null,recorder=null,recording=false;
   let samples=[],recordedBytes=0,overflow=false,chunks=[],requestedFrames=0;
   let requestFailures=0,peakConcurrentRecorders=0,error=null,mode='NONE';
   const start=performance.now();
   const sample=()=>{
    const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,p=d?.physicalFeedback;
    if(!d||(feedbackMode==='d04'&&!p)||!Number.isSafeInteger(d.frame))return;
    const receipt=feedbackMode==='d04'?p?.framesAcknowledged:d.frame;
    if(capture==='on'&&recording&&track&&typeof track.requestFrame==='function'&&
       Number.isSafeInteger(receipt)&&receipt>lastReceipt&&requestedFrames<128){
     try{track.requestFrame();requestedFrames++}catch{requestFailures++}
    }
    if(Number.isSafeInteger(receipt)&&receipt>lastReceipt)lastReceipt=receipt;
    if(d.frame<=lastFrame||samples.length>=120)return;
    lastFrame=d.frame;
    samples.push({source,capture,feedbackMode,seed,viewport,frameId:d.frame,
     elapsedMs:Math.max(0,performance.now()-start),scene:{...d.renderedState},
     camera:d.camera,focusedHeroId:d.focusedHeroId,
     cameraPosition:{...d.cameraRig?.actualPosition},
     cameraAim:{...d.cinematicAim},softwareWebGL:d.softwareWebGL,
     postFX:d.postFX,directRenderMs:d.directRenderMs,
     drawCalls:d.drawCalls,triangles:d.triangles,
     raster:{pixelRatio:d.directRenderBudget?.pixelRatio,shadows:d.directRenderBudget?.shadows},
     d04PreviewEnabled:d.d04PreviewEnabled===true,
     vfxDrawCalls:p?.visuals?.drawCalls??0,vfxReservedInstances:p?.visuals?.reservedInstances??0,
     activeVfxInstances:p?.visuals?.active??0,
     activeVfxDrawCalls:p?.visuals?.activeDrawCalls??0,
     previewAudioOptedIn:feedbackMode==='d04'&&p?.audioOptedIn===true,
     consentedSoundstage:(feedbackMode!=='d04'||p?.audioOptedIn===true)&&
      document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')==='true',
     recordingAtSample:capture==='on'&&recording,
     recentDeliveryReceipts:(p?.recentDeliveryReceipts||[]).slice(-16)});
   };
   const sampler=setInterval(sample,80);
   let settled=null;
   if(capture==='on'){
    if(!canvas?.captureStream||!sound?.getAudioTracks?.().length||
       typeof MediaRecorder==='undefined')error='No original canvas/audio capture capability';
    else try{
     let stream=canvas.captureStream(0);track=stream.getVideoTracks()[0];
     const explicit=typeof track?.requestFrame==='function';
     if(!explicit){stream.getTracks().forEach(t=>t.stop());
      stream=canvas.captureStream(24);track=stream.getVideoTracks()[0]}
     const mimeType=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm']
      .find(t=>MediaRecorder.isTypeSupported(t));
     if(!track||!mimeType)throw Error('Original WebGL/Opus encoder unavailable');
     mode=explicit?'real-submitted-frame-request':'native-WebGL-canvas-stream';
     const combined=new MediaStream([track,...sound.getAudioTracks()]);
     recorder=new MediaRecorder(combined,{mimeType});
     settled=new Promise(resolve=>{
      recorder.ondataavailable=e=>{
       recordedBytes+=e.data?.size||0;
       if(recordedBytes>8*1024*1024){overflow=true;chunks.length=0}
       else if(!overflow&&e.data?.size)chunks.push(e.data);
      };
      recorder.onerror=e=>{
       error='MediaRecorder: '+String(e.error||e).slice(0,160);
       try{if(recorder.state!=='inactive')recorder.stop()}catch{}
      };
      recorder.onstop=async()=>{
       recording=false;track?.stop();
       if(overflow||recordedBytes<=1024)return resolve({status:'UNAVAILABLE',
        reason:overflow?'8MiB budget exceeded':'No viable genuine WebM'});
       try{
        const data=new Uint8Array(await new Blob(chunks,{type:mimeType}).arrayBuffer());
        if(data.length!==recordedBytes)throw Error('Lost encoded WebM chunks');
        const parts=[];for(let i=0;i<data.length;i+=16384)
         parts.push(String.fromCharCode(...data.subarray(i,i+16384)));
        resolve({status:'RECORDED',bytes:data.length,base64:btoa(parts.join(''))});
       }catch(e){resolve({status:'UNAVAILABLE',reason:String(e).slice(0,180)})}
      };
     });
     recorder.start(250);recording=true;peakConcurrentRecorders=1;
    }catch(e){error=String(e).slice(0,180);track?.stop()}
   }
   window.__D04_LIVE_AUTHORITY_CAPTURE__={stop:async()=>{
    if(stopped)return {samples,recorder:{status:'UNAVAILABLE',reason:'Already stopped'}};
    stopped=true;clearInterval(sampler);sample();
    if(recording&&recorder?.state!=='inactive')recorder.stop();
    const recorded=settled?await Promise.race([settled,
     new Promise(resolve=>setTimeout(()=>resolve({status:'UNAVAILABLE',
      reason:'MediaRecorder stop timeout'}),8000))]):
     {status:capture==='on'?'UNAVAILABLE':'NOT_STARTED',reason:error};
    return {samples,recorder:{...recorded,
     peakConcurrentRecorders,videoTracks:capture==='on'&&track?1:0,
     audioTracks:capture==='on'&&track?sound.getAudioTracks().length:0,
     requestedFrames,requestFailures,captureMode:mode,
     startedBeforeAuthority:capture==='on'&&peakConcurrentRecorders===1,
     stoppedAfterAuthority:true,error}};
   }};
   return {status:capture==='on'?(recording?'STARTED':'UNAVAILABLE'):'NOT_STARTED',
    reason:error,originalAudioTracks:sound?.getAudioTracks?.().length||0};
  },{capture,source,seed:real.seed,viewport,feedbackMode});
  beganAt=performance.now();live=true;
  await page.waitForTimeout(ACTIVE_MS);
  stopIndex=Math.min(real.states.length-1,Math.floor((performance.now()-beganAt)/STEP_MS));
  live=false;
  let stopped;
  try{stopped=await page.evaluate(()=>window.__D04_LIVE_AUTHORITY_CAPTURE__.stop())}
  catch(e){stopped={samples:[],recorder:{status:'UNAVAILABLE',reason:String(e).slice(0,180)}}}
  const {base64,...recorder}=stopped.recorder||{};
  const suffix=(viewport.width===390?'mobile390':'desktop1440')+
   (source===SOURCE?'':'-'+feedbackMode);
  if(base64&&recorder.status==='RECORDED')
   fs.writeFileSync('artifacts/dungeon-d04-live-authority-'+capture+'-'+suffix+'-unaligned.webm',
    Buffer.from(base64,'base64'));
  const result={capture,feedbackMode,seed:real.seed,viewport,samples:stopped.samples||[],recorder,errors,requestLog,
   start:started,continuousAuthorityMs:Math.round(performance.now()-beganAt),
   authorityTickAtStop:real.manifest[stopIndex].scene.tick,
   highestDeliveredStage:Math.max(-1,...requestLog.map(e=>e.index)),
   sampleSynchronized:false,combinedOriginalAV:capture==='on'};
  await page.locator('#world').screenshot({
   path:'artifacts/dungeon-d04-live-authority-'+capture+'-'+suffix+'.png',timeout:30000});
  return result;
 }finally{live=false;await page.close()}
}
test('D04 compares continuous genuine authority with capture off/on using original sound',async({browser})=>{
 test.setTimeout(650000);
 const real=realAuthoritySeries(),runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const off=await observeLiveAuthority(browser,real,viewport,'off');
  const on=await observeLiveAuthority(browser,real,viewport,'on');
  const verdict=classifyD04LiveAuthorityPair({manifest:real.manifest,off,on});
  runs.push({viewport,off,on,verdict});
  expect(off.errors).toEqual([]);expect(on.errors).toEqual([]);
  expect(off.samples.length).toBeGreaterThan(0);
  expect(on.samples.length).toBeGreaterThan(0);
  expect(verdict.budgetViolations).toEqual([]);
  expect(['MATCHED_LIVE_AUTHORITY_DIAGNOSTIC_ONLY',
   'INSUFFICIENT_MATCHED_LIVE_DAMAGE','CAPTURE_PROVENANCE_UNVERIFIED']).toContain(verdict.status);
 }
 const evidence={source:SOURCE,
  frozenBefore:'281735d0910c6b2443648af976003d50412ee324',
  seed:real.seed,realAuthorityStates:real.manifest,
  authorityCadenceMs:STEP_MS,activeWindowMs:ACTIVE_MS,
  pageRoute:'Node clock chooses real seeded DungeonRuntime.step() state even when browser stalls',
  capture:'Only one original canvas+consented WebAudio recorder per on-arm',
  causation:null,sampleSynchronized:false,movingAVAccepted:false,
  limitation:'Serial software-WebGL runs have separate frame clocks. Missing matched ticks and sparse encoded frames cannot prove recorder causation or synchronized sound.',
  runs};
 fs.writeFileSync('artifacts/dungeon-d04-live-authority-capture-pair-evidence.json',
  JSON.stringify(evidence,null,2)+'\n');
 await test.info().attach('d04-continuous-real-authority-pair.json',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
 console.log('D04 continuous authority on/off:',JSON.stringify(runs.map(r=>({
  viewport:r.viewport,status:r.verdict.status,matched:r.verdict.matchedTicks,
  matchedHpLoss:r.verdict.matchedHpLossTicks,off:r.verdict.off,on:r.verdict.on,
  all:r.verdict.allObserved,recorder:r.on.recorder,
  requests:{off:r.off.requestLog.length,on:r.on.requestLog.length}}))));
});

test('D04 compares continuous legacy default against opt-in preview without any recorders',async({browser})=>{
 test.setTimeout(650000);
 const real=realAuthoritySeries(),runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  // Real gameplay advances on independent Node time regardless of renderer stall.
  const legacy=await observeLiveAuthority(browser,real,viewport,'off','legacy',MODE_SOURCE);
  const preview=await observeLiveAuthority(browser,real,viewport,'off','d04',MODE_SOURCE);
  const verdict=classifyD04ContinuousModePair({manifest:real.manifest,legacy,preview});
  runs.push({viewport,legacy,preview,verdict});
  expect(legacy.errors).toEqual([]);expect(preview.errors).toEqual([]);
  expect(legacy.samples.length).toBeGreaterThan(0);
  expect(preview.samples.length).toBeGreaterThan(0);
  expect(verdict.status).not.toBe('INVALID_REAL_AUTHORITY');
  expect(verdict.status).not.toBe('INVALID_MODE_PROVENANCE');
  expect(verdict.budgetViolations).toEqual([]);
  expect(['MATCHED_CONTINUOUS_MODE_DIAGNOSTIC_ONLY',
   'INSUFFICIENT_MATCHED_LIVE_DAMAGE']).toContain(verdict.status);
  expect(verdict.impactAVAccepted).toBe(false);
  expect(verdict.causedByD04).toBe(null);
 }
 const evidence={source:MODE_SOURCE,
  frozenBefore:'281735d0910c6b2443648af976003d50412ee324',
  seed:real.seed,realAuthorityStates:real.manifest,authorityCadenceMs:STEP_MS,
  activeWindowMs:ACTIVE_MS,legacyRoute:'/dungeon',previewRoute:'/dungeon?feedback=d04',
  audio:'Real opt-in click in both browser arms; no MediaRecorder started',
  impactAVAccepted:false,causedByD04:null,sampleSynchronized:false,
  limitation:'Serial real-WebGL observations, not frame-locked A/B, decoded moving clips or synchronized original audio.',
  runs};
 fs.writeFileSync('artifacts/dungeon-d04-continuous-legacy-preview-evidence.json',
  JSON.stringify(evidence,null,2)+'\n');
 await test.info().attach('d04-continuous-legacy-preview.json',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
 console.log('D04 real continuous legacy vs preview:',JSON.stringify(runs.map(r=>({
  viewport:r.viewport,status:r.verdict.status,matched:r.verdict.matchedTicks,
  matchedHpLoss:r.verdict.matchedHpLossTicks,legacy:r.verdict.legacy,
  preview:r.verdict.preview,all:r.verdict.allObserved,
  excluded:r.verdict.excludedStages.length}))));
});
