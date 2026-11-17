'use strict';
// D04 opt-in real-server endurance: NOT synchronized contact, Warden acceptance,
// codec proof, or a substitute for the strict first authenticated HP injury.
const {test,expect}=require('@playwright/test');
const {performance}=require('node:perf_hooks');
const fs=require('node:fs');
const {auditD04SampledSceneCleanup}=require('./dungeon-d04-scene-transition-soak-audit.cjs');
const SOAK_MS=20*60*1000;
const INTERVAL_MS=5000;
const artifact='artifacts/dungeon-d04-real-20min-soak-evidence.json';
fs.mkdirSync('artifacts',{recursive:true});

test('D04 20-minute real-runtime resource and mute/reload cleanup soak',async({page,request})=>{
 test.setTimeout(30*60*1000);
 const errors=[],crashes=[],health=[];
 page.on('pageerror',e=>{if(errors.length<20)errors.push(String(e))});
 page.on('crash',()=>crashes.push('browser page crashed'));
 await page.goto('/dungeon?feedback=d04');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
  {timeout:90000}).toBe('D04-physical-authority-feedback');
 const before=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(before.d04PreviewEnabled).toBe(true);
 expect(before.physicalFeedback.audioOptedIn).toBe(false,'no sound without gesture');
 await page.locator('#audio-toggle').click();
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
  {timeout:30000}).toBe(true);
 // Browser sample callbacks are best effort. WebGL stalls can suppress them;
 // timestamps and gaps are preserved, never backfilled as fictitious frames.
 await page.evaluate(period=>{
  const audit={startedAt:performance.now(),samples:[],missing:0,overflows:0};
  const collect=()=>{
   const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,p=d?.physicalFeedback;
   if(!p){audit.missing++;return}
   const sample={atMs:Math.round(performance.now()-audit.startedAt),
    scene:p.scene,run:d.renderedState?.run??null,
    floor:d.renderedState?.floor??null,tick:d.renderedState?.tick??null,
    checksum:d.renderedState?.checksum??null,
    submittedFrame:p.lastPresentedFrameId??null,
    framesAcknowledged:p.framesAcknowledged??0,
    emitted:p.emitted??0,sceneResets:p.sceneResets??0,
    pending:p.pending??null,awaitingPresentation:p.awaitingPresentation??null,
    awaitingAudioFrame:p.awaitingAudioFrame??null,
    receiptCount:p.recentDeliveryReceipts?.length??null,
    vfxActive:p.visuals?.active??null,
    vfxReserved:p.visuals?.reservedInstances??null,
    vfxDrawCalls:p.visuals?.drawCalls??null,
    vfxActiveDrawCalls:p.visuals?.activeDrawCalls??null,
    liveVoices:p.audio?.activeVoices??null,
    peakVoices:p.audio?.peakVoices??null,
    noiseSamples:p.audio?.noiseSamples??null,
    droppedStale:p.staleAudioDropped??0,
    adapterFailures:p.adapterFailures??0};
   audit.samples.push(sample);
   if(audit.samples.length>256){audit.samples.shift();audit.overflows++}
  };
  window.__D04_REAL_SOAK__=audit;
  collect();
  audit.timer=window.setInterval(collect,period);
 },INTERVAL_MS);
 const started=performance.now();
 // This is the REAL autonomous server: no /dungeon/state route override,
 // no replayed ticks and no synthetic/fake HP injection.
 while(performance.now()-started<SOAK_MS){
  const remaining=SOAK_MS-(performance.now()-started);
  await new Promise(resolve=>setTimeout(resolve,Math.min(30000,Math.max(1,remaining))));
  try{
   const response=await request.get('/dungeon/health',{timeout:12000});
   const state=response.ok()?await response.json():null;
   health.push({atMs:Math.round(performance.now()-started),
    httpStatus:response.status(),status:state?.status??null,
    serverSteps:state?.steps??null,reason:state?.reason??null});
  }catch(e){
   health.push({atMs:Math.round(performance.now()-started),
    httpStatus:null,error:String(e).slice(0,200)});
  }
 }
 const elapsedNodeMs=Math.round(performance.now()-started);
 let browser=null;
 try{
  browser=await page.evaluate(()=>{
   const a=window.__D04_REAL_SOAK__;
   if(!a)return null;
   clearInterval(a.timer);
   return {elapsedBrowserMs:Math.round(performance.now()-a.startedAt),
    samples:a.samples,missing:a.missing,overflows:a.overflows};
  });
 }catch(e){errors.push('Final browser readback: '+String(e))}
 const samples=browser?.samples??[];
 const sceneCleanup=auditD04SampledSceneCleanup(samples);
 const maxGapMs=samples.reduce((max,s,i)=>i===0?max:
  Math.max(max,s.atMs-samples[i-1].atMs),0);
 const violations=[];
 for(const s of samples){
  if(s.pending===null||s.awaitingPresentation===null||s.liveVoices===null||
    s.vfxActive===null||s.receiptCount===null){
   violations.push({atMs:s.atMs,reason:'MISSING_RESOURCE_COUNTER'});continue;
  }
  if(s.pending>32||s.awaitingPresentation>32||s.awaitingAudioFrame>32||
   s.receiptCount>64||s.vfxActive>104||s.vfxReserved>104||
   s.vfxDrawCalls>7||s.vfxActiveDrawCalls>7||s.liveVoices>8||
   s.peakVoices>8||s.noiseSamples>19200||s.adapterFailures>0)
   violations.push({atMs:s.atMs,reason:'BOUNDED_RESOURCE_CONTRACT_BREACH',sample:s});
 }
 const steps=health.filter(h=>Number.isSafeInteger(h.serverSteps));
 const stepProgress=steps.length>1?steps.at(-1).serverSteps-steps[0].serverSteps:0;
 const uniquePublicStates=new Set(samples.filter(s=>s.checksum).map(s=>
  String(s.run)+':'+String(s.floor)+':'+String(s.tick)+':'+s.checksum)).size;
 const sceneResets=samples.length?samples.at(-1).sceneResets-samples[0].sceneResets:0;
 const frameProgress=samples.length?
  samples.at(-1).framesAcknowledged-samples[0].framesAcknowledged:0;
 const cleanup={muted:false,voicesZero:false,pendingAudioZero:false,
  persistedMutedAfterReload:false,autoplayStillOff:false,error:null};
 try{
  await page.locator('#audio-toggle').click();
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:30000}).toBe(false);
  cleanup.muted=true;
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audio?.activeVoices),
   {timeout:30000}).toBe(0);
  cleanup.voicesZero=true;
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.awaitingAudioFrame),
   {timeout:30000}).toBe(0);
  cleanup.pendingAudioZero=true;
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
   {timeout:90000}).toBe('D04-physical-authority-feedback');
  const p=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback);
  cleanup.persistedMutedAfterReload=p?.preferredMuted===true;
  cleanup.autoplayStillOff=p?.audioOptedIn===false;
 }catch(e){cleanup.error=String(e).slice(0,450)}
 const report={source:'unaltered server DungeonRuntime step loop plus real opt-in Chrome D04 WebGL',
  recordedAt:new Date().toISOString(),expectedMinimumWallMs:SOAK_MS,
  elapsedNodeMs,elapsedBrowserMs:browser?.elapsedBrowserMs??null,
  classification:'REAL_RUNTIME_RESOURCE_SOAK_ONLY_NOT_AV_OR_CONTACT_ACCEPTANCE',
  sampleIntervalMs:INTERVAL_MS,observedSamples:samples.length,
  maxObservedSampleGapMs:maxGapMs,missingBrowserSamples:browser?.missing??null,
  overflowedBrowserSamples:browser?.overflows??null,
  serverStepProgress:stepProgress,uniquePublicStates,frameProgress,
  sceneResets,sceneCleanup,health,violations:violations.slice(0,30),violationCount:violations.length,
  errors,crashes,cleanup,samples,
  limitations:['Sampled D04 receipts are not decoded GPU pixels or PCM.',
   'Browser stalls are recorded as gaps and never interpolated.',
   'No six-view Warden or impact contact timing is asserted.',
   'No explicit WebGL-loss or full actor-reset scenario is inferred.']};
 fs.writeFileSync(artifact,JSON.stringify(report,null,2)+'\n');
 await test.info().attach('d04-real-20min-resource-soak.json',{
  body:Buffer.from(JSON.stringify(report,null,2)),contentType:'application/json'});
 console.log('D04 real 20-minute resource soak:',JSON.stringify({
  elapsedNodeMs,observedSamples:samples.length,maxGapMs,
  stepProgress,uniquePublicStates,frameProgress,sceneResets,
  observedSceneTransitions:sceneCleanup.transitionCount,
  cleanSampledSceneTransitions:sceneCleanup.cleanupSampleCount,
  sceneCleanupClassification:sceneCleanup.classification,
  violationCount:violations.length,cleanup,errors,crashes}));
 expect(elapsedNodeMs).toBeGreaterThanOrEqual(SOAK_MS);
 expect(browser?.elapsedBrowserMs??0).toBeGreaterThanOrEqual(SOAK_MS-20000);
 expect(steps.every(h=>h.status==='healthy')).toBe(true);
 expect(stepProgress).toBeGreaterThan(500);
 expect(samples.length).toBeGreaterThanOrEqual(100);
 expect(uniquePublicStates).toBeGreaterThan(10);
 expect(frameProgress).toBeGreaterThan(50);
 expect(sceneCleanup.classification).toBe('SAMPLED_SCENE_CHANGE_WITH_EMPTY_RESOURCES');
 expect(sceneCleanup.transitionCount).toBeGreaterThan(0);
 expect(sceneCleanup.cleanupSampleCount).toBeGreaterThan(0);
 expect(violations).toEqual([]);
 expect(errors).toEqual([]);
 expect(crashes).toEqual([]);
 expect(cleanup).toMatchObject({muted:true,voicesZero:true,
  pendingAudioZero:true,persistedMutedAfterReload:true,autoplayStillOff:true,error:null});
});
