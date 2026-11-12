'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {classifyD04CaptureCostPair,SOURCE}=
 require('./dungeon-d04-capture-cost-pair.cjs');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

function realCombatStates(){
 const seed='visual-room-art-18',game=DungeonRuntime.create(seed),states=[game.publicState()];
 const expected=[{stageIndex:0,scene:scene(states[0]),hpLossCount:0}];
 for(let i=0;i<9;i++){
  const prev=states[states.length-1],next=game.step();
  if(next.run!==prev.run||next.floor!==prev.floor||next.tick!==prev.tick+1)break;
  const hpLossCount=next.units.filter(unit=>
   prev.units.some(old=>old.id===unit.id&&old.hp>unit.hp)).length;
  states.push(next);
  expected.push({stageIndex:states.length-1,scene:scene(next),hpLossCount});
 }
 if(expected.length<6||!expected.some(e=>e.hpLossCount>0))
  throw Error('No genuine consecutive DungeonRuntime HP-loss transition; cannot stage synthetic impact');
 return {seed,states,expected};
}
const scene=s=>({run:s.run,floor:s.floor,tick:s.tick,checksum:s.checksum});

// Installed strictly inside a D04 test browser. No production module,
// authority, camera, lighting, legacy renderer or soundstage is modified.
// Capture uses real #world canvas and original user-consented soundstage.
async function startOriginalAVRecorder(page){
 return page.evaluate(()=>{
  const unavailable=reason=>({status:'UNAVAILABLE',reason});
  const canvas=document.querySelector('#world');
  const audio=window.__DUNGEON_CAPTURE_SOUND__?.();
  if(document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')!=='true')
   return unavailable('No genuine user click/audio opt-in');
  if(!canvas?.captureStream||!audio?.getAudioTracks?.().length||
    typeof MediaRecorder==='undefined')
   return unavailable('Original audio bus, canvas capture or MediaRecorder missing');
  const sourceAudio=audio.getAudioTracks();
  let stream=canvas.captureStream(0),video=stream.getVideoTracks()[0];
  let explicit=typeof video?.requestFrame==='function';
  if(!explicit){
   stream.getTracks().forEach(t=>t.stop());
   stream=canvas.captureStream(24);video=stream.getVideoTracks()[0];
  }
  if(!video)return unavailable('No actual canvas video track');
  const types=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'];
  const mimeType=types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!mimeType){video.stop();return unavailable('Original WebM encoder unsupported')}
  const combined=new MediaStream([video,...sourceAudio]);
  let recorder;
  try{recorder=new MediaRecorder(combined,{mimeType})}
  catch(error){video.stop();return unavailable(String(error).slice(0,180))}
  let bytes=0,overflow=false,chunks=[],requestedFrames=0,requestFailures=0;
  const limit=8*1024*1024;
  let active=false,stopped=false,lastReceipt=
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??-1;
  let pump=null;
  const settled=new Promise(resolve=>{
   recorder.ondataavailable=e=>{
    const size=e.data?.size||0;bytes+=size;
    if(bytes>limit){overflow=true;chunks.length=0}
    else if(!overflow&&size)chunks.push(e.data);
   };
   recorder.onerror=e=>{if(active)active=false;
    try{if(recorder.state!=='inactive')recorder.stop()}catch{}
   };
   recorder.onstop=async()=>{
    active=false;clearInterval(pump);video.stop();
    if(overflow||bytes<=1024){
     resolve({status:'UNAVAILABLE',reason:overflow?'Encoded clip exceeds bounded 8MiB budget':'No viable recorded WebM',
      bytes,requestedFrames,requestFailures});
     return;
    }
    try{
     const data=new Uint8Array(await new Blob(chunks,{type:mimeType}).arrayBuffer());
     if(data.length!==bytes)throw Error('Missing actual encoded data chunk');
     const parts=[];
     for(let i=0;i<data.length;i+=16384)
      parts.push(String.fromCharCode(...data.subarray(i,i+16384)));
     resolve({status:'RECORDED',bytes,requestedFrames,requestFailures,
      mimeType,base64:btoa(parts.join(''))});
    }catch(error){
     resolve({status:'UNAVAILABLE',bytes,requestedFrames,requestFailures,
      reason:'Unable to retain encoded genuine video: '+String(error).slice(0,160)});
    }
   };
  });
  try{recorder.start(250);active=true}
  catch(error){video.stop();return unavailable('Cannot start MediaRecorder: '+String(error))}
  pump=setInterval(()=>{
   if(!active||!explicit)return;
   const receipt=window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged;
   if(Number.isSafeInteger(receipt)&&receipt>lastReceipt){
    lastReceipt=receipt;
    try{video.requestFrame();requestedFrames++}catch{requestFailures++}
   }
  },45);
  window.__D04_COST_CAPTURE__={
   isActive:()=>active,
   stop:async()=>{
    if(stopped)return {status:'UNAVAILABLE',reason:'Recorder already stopped'};
    stopped=true;clearInterval(pump);
    if(recorder.state!=='inactive')recorder.stop();
    const outcome=await settled;
    return {...outcome,peakConcurrentRecorders:1,
     videoTracks:1,audioTracks:sourceAudio.length,startedBeforeStages:true,
     stoppedAfterStages:true,captureMethod:explicit?'real-submission-requestFrame':'native-webgl-stream',
     sampleSynchronized:false};
   }
  };
  return {status:'STARTED',videoTracks:1,audioTracks:sourceAudio.length,
   peakConcurrentRecorders:1,method:explicit?'real-submission-requestFrame':'native-webgl-stream'};
 });
}
async function observeCostMode(browser,real,capture,viewport){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 const errors=[],stageFailures=[],samples=[];
 let index=0,previousFrame=-1,recorder={status:'NOT_STARTED',
  peakConcurrentRecorders:0,videoTracks:0,audioTracks:0,activeDuringComparison:false};
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:real.states[index]}));
 try{
  await page.goto('/dungeon?feedback=d04');
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
   {timeout:65000}).toBe('D04-physical-authority-feedback');
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum),
   {timeout:65000}).toBe(real.expected[0].scene.checksum);
  await page.locator('#view-toggle').click();
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),{timeout:30000}).toBe('tactical');
  // Both trial arms opt into the SAME actual original audio via a real click.
  // The only intended observer difference is running the one media recorder.
  await page.locator('#audio-toggle').click();
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:30000}).toBe(true);
  if(capture==='on'){
   const started=await startOriginalAVRecorder(page);
   if(started.status!=='STARTED'){
    recorder={...started,peakConcurrentRecorders:0,videoTracks:0,
     audioTracks:0,startedBeforeStages:false,stoppedAfterStages:false};
   }
  }
  for(let s=0;s<real.expected.length;s++){
   const manifest=real.expected[s];
   if(s>0)index=s;
   try{
    await expect.poll(()=>page.evaluate(({checksum,previousFrame})=>{
     const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
     return d?.renderedState?.checksum===checksum&&
      Number.isSafeInteger(d?.frame)&&d.frame>previousFrame;
    },{checksum:manifest.scene.checksum,previousFrame}),
     {timeout:25000,intervals:[100,250,500]}).toBe(true);
    const observation=await page.evaluate(({source,capture,stageIndex,seed,viewport})=>{
     const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,p=d?.physicalFeedback;
     return {source,capture,stageIndex,seed,viewport,
      scene:{...d?.renderedState},frameId:d?.frame??null,
      camera:d?.camera,focusedHeroId:d?.focusedHeroId,
      cameraPosition:{...d?.cameraRig?.actualPosition},
      cameraAim:{...d?.cinematicAim},
      softwareWebGL:d?.softwareWebGL,postFX:d?.postFX,
      renderMs:d?.directRenderMs,drawCalls:d?.drawCalls,
      vfxDrawCalls:p?.visuals?.drawCalls??null,
      vfxReservedInstances:p?.visuals?.reservedInstances??null,
      consentedSoundstage:p?.audioOptedIn===true&&
       document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')==='true',
      recordingAtSample:window.__D04_COST_CAPTURE__?.isActive?.()===true};
    },{source:SOURCE,capture,stageIndex:s,seed:real.seed,viewport});
    if(observation.frameId<=previousFrame||
       observation.scene?.checksum!==manifest.scene.checksum){
     stageFailures.push({stageIndex:s,kind:'NO_FRESH_MATCHED_RENDERED_STATE'});
     break;
    }
    previousFrame=observation.frameId;samples.push(observation);
   }catch(error){
    stageFailures.push({stageIndex:s,kind:'ACTUAL_FRAME_TIMEOUT',
     message:String(error).slice(0,180)});
    break;
   }
  }
  if(capture==='on'&&await page.evaluate(()=>Boolean(window.__D04_COST_CAPTURE__))){
   const raw=await page.evaluate(()=>window.__D04_COST_CAPTURE__.stop());
   const {base64,...metadata}=raw;
   recorder=metadata;
   if(raw.status==='RECORDED'&&base64){
    const suffix=viewport.width===390?'mobile390':'desktop1440';
    const name='artifacts/dungeon-d04-capture-on-'+suffix+'-original-unaligned.webm';
    fs.writeFileSync(name,Buffer.from(base64,'base64'));
   }
  }
  const suffix=viewport.width===390?'mobile390':'desktop1440';
  await page.locator('#world').screenshot({path:
   'artifacts/dungeon-d04-capture-cost-'+capture+'-'+suffix+'.png',timeout:25000});
  return {capture,viewport,samples,recorder,errors,stageFailures,
   originalMediaSource:'same actual WebGL canvas plus opted-in original soundstage',
   encodedVideoSynchronized:false,impactSampleSynchronized:false,
   limitation:'Recorder presence varies; serial pages and software WebGL are not randomized causal trials.'};
 }finally{
  await page.close();
 }
}

test('D04 compares same real dynamic combat states with and without one genuine original A/V capture',async({browser})=>{
 test.setTimeout(600000);
 const real=realCombatStates(),runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const off=await observeCostMode(browser,real,'off',viewport);
  const on=await observeCostMode(browser,real,'on',viewport);
  const verdict=classifyD04CaptureCostPair({expected:real.expected,off,on});
  runs.push({viewport,off,on,verdict});
  expect(off.errors).toEqual([]);expect(on.errors).toEqual([]);
  expect(off.samples.length).toBeGreaterThan(0);
  expect(on.samples.length).toBeGreaterThan(0);
  expect(verdict.budgetViolations).toEqual([]);
  expect(['MATCHED_CAPTURE_COST_DIAGNOSTIC_ONLY','INSUFFICIENT_CAPTURE_COMBAT_MATCH',
   'CAPTURE_PROVENANCE_UNVERIFIED']).toContain(verdict.status);
 }
 const evidence={source:SOURCE,
  beforeMilestone:'281735d0910c6b2443648af976003d50412ee324',
  seed:real.seed,expected:real.expected,
  genuineHpLossStages:real.expected.filter(e=>e.hpLossCount>0).map(e=>e.stageIndex),
  oneRealOriginalAVRecorderPerCaptureArm:true,
  optIn:'real click in BOTH arms; never auto-unmute',
  noAuthorityOrRendererMutation:true,
  playback:'real Three.js/WebGL browser execution; combined WebM saved when encoded',
  causation:null,sampleSynchronized:false,threeViewpointAcceptance:false,
  caveat:'Serial arms are sensitive to warmup, capture scheduling and audio/encoder overhead. No claim that recorder causes observed stalls, or that packets prove synchronized audible injury.',
  runs};
 fs.writeFileSync('artifacts/dungeon-d04-capture-cost-pair-evidence.json',
  JSON.stringify(evidence,null,2)+'\n');
 await test.info().attach('d04-capture-on-vs-off-actual-webgl.json',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
 console.log('D04 original A/V recorder capture-cost trial:',JSON.stringify(runs.map(x=>({
  viewport:x.viewport,status:x.verdict.status,matched:x.verdict.matchedStages,
  realDamage:x.verdict.hpLossStagesMatched,off:x.verdict.off,on:x.verdict.on,
  paired:x.verdict.paired,recorder:x.on.recorder,
  stageFailures:{off:x.off.stageFailures,on:x.on.stageFailures}
 }))));
});
