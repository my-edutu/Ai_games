'use strict';
const {test,expect}=require('@playwright/test');
const {performance}=require('node:perf_hooks');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {classifyD04DynamicRendererPair,SOURCE}=
 require('./dungeon-d04-dynamic-render-pair.cjs');
fs.mkdirSync('artifacts',{recursive:true});

function realDynamicCombatSeries(){
 const seed='visual-room-art-18',game=DungeonRuntime.create(seed);
 const states=[game.publicState()],expected=[{
  stageIndex:0,scene:scene(states[0]),hpLossCount:0
 }];
 let previous=states[0];
 for(let i=0;i<9;i++){
  const next=game.step();
  // Never silently splice together different runs/floors or fake an impact.
  if(next.run!==previous.run||next.floor!==previous.floor||
     next.tick!==previous.tick+1)break;
  const hpLossCount=next.units.filter(unit=>
   previous.units.some(old=>old.id===unit.id&&old.hp>unit.hp)).length;
  states.push(next);
  expected.push({stageIndex:states.length-1,scene:scene(next),hpLossCount});
  previous=next;
 }
 if(expected.length<6||!expected.some(e=>e.hpLossCount>0))
  throw Error('Seeded real DungeonRuntime failed to yield sequential public combat snapshots with true HP loss');
 return {seed,states,expected};
}
function scene(state){
 return {run:state.run,floor:state.floor,tick:state.tick,checksum:state.checksum};
}

async function observeDynamicWebGL(browser,real,mode,viewport){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 const errors=[],stageFailures=[],samples=[];
 page.on('pageerror',error=>errors.push(String(error)));
 let index=0,previousFrame=-1;
 // The server returns genuine immutable Runtime.step() public snapshots.
 // No direct manipulation of authority, animation, render calls or audio.
 await page.route('**/dungeon/state',route=>route.fulfill({json:real.states[index]}));
 try{
  await page.goto(mode==='d04'?'/dungeon?feedback=d04':'/dungeon');
  await expect.poll(()=>page.evaluate(()=>
   Boolean(window.__DUNGEON_RENDER_DIAGNOSTICS__?.d04PreviewEnabled)),
   {timeout:65000}).toBe(mode==='d04');
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum),
   {timeout:65000}).toBe(real.expected[0].scene.checksum);
  await page.locator('#view-toggle').click();
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),
   {timeout:30000}).toBe('tactical');
  if(mode==='d04'){
   const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback);
   expect(d?.audioOptedIn).toBe(false,'No sound without a genuine opt-in gesture');
   expect(d?.visuals?.reservedInstances).toBeLessThanOrEqual(104);
   expect(d?.visuals?.drawCalls).toBeLessThanOrEqual(7);
  }else{
   expect(await page.evaluate(()=>
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback??null)).toBeNull();
  }
  for(let s=0;s<real.expected.length;s++){
   const manifest=real.expected[s],start=performance.now();
   if(s>0)index=s;
   // Receive an actual later WebGL frame from the app, not just a route
   // response or a synthetic canvas frame. Timeouts remain visible failures.
   try{
    await expect.poll(()=>page.evaluate(()=>
      ({checksum:window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum,
       frame:window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame})),
     {timeout:22000,intervals:[100,250,500]}).toEqual(
      expect.objectContaining({checksum:manifest.scene.checksum,
       frame:expect.any(Number)}));
    const observation=await page.evaluate(({stageIndex,source,mode,seed,viewport})=>{
     const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
     const p=d?.physicalFeedback;
     return {source,mode,stageIndex,seed,viewport,
      frameId:d?.frame??null,scene:{...d?.renderedState},
      camera:d?.camera,focusedHeroId:d?.focusedHeroId,
      cameraPosition:{...d?.cameraRig?.actualPosition},
      cameraAim:{...d?.cinematicAim},postFX:d?.postFX,
      softwareWebGL:d?.softwareWebGL,renderMs:d?.directRenderMs,
      drawCalls:d?.drawCalls,
      vfxDrawCalls:Number.isSafeInteger(p?.visuals?.drawCalls)?p.visuals.drawCalls:null,
      vfxReservedInstances:Number.isSafeInteger(p?.visuals?.reservedInstances)?
       p.visuals.reservedInstances:null,
      audioOptedIn:p?.audioOptedIn??false};
    },{stageIndex:s,source:SOURCE,mode,seed:real.seed,viewport});
    observation.stageWallMs=performance.now()-start;
    if(!Number.isSafeInteger(observation.frameId)||observation.frameId<=previousFrame||
       observation.scene?.checksum!==manifest.scene.checksum){
     stageFailures.push({stageIndex:s,kind:'NO_FRESH_POST_WEBGL_FRAME',
      observedFrame:observation.frameId,previousFrame,
      checksum:observation.scene?.checksum??null});
     break;
    }
    previousFrame=observation.frameId;
    if(mode==='d04'&&observation.audioOptedIn===true)
     throw Error('Read-only D04 performance trial unexpectedly opted into audio');
    samples.push(observation);
   }catch(error){
    // Record real failures without inventing a missing rendered frame.
    stageFailures.push({stageIndex:s,kind:'REAL_STAGE_TIMEOUT_OR_ERROR',
     message:String(error).slice(0,240)});
    break;
   }
  }
  const suffix=viewport.width===390?'mobile390':'desktop1440';
  await page.locator('#world').screenshot({
   path:`artifacts/dungeon-d04-dynamic-${mode}-${suffix}.png`,timeout:25000});
  return {mode,viewport,samples,stageFailures,errors,
   acceptedMovingFootage:false,originalSoundAssessed:false,
   timingLimitation:'Stage latency includes route polling, application event loop and WebGL; directRenderMs alone measures the in-app render call. No synchronized audio or GPU fence.'};
 }finally{await page.close()}
}

test('D04 records real dynamic combat-transition renderer costs against unchanged legacy',async({browser})=>{
 test.setTimeout(550000);
 const real=realDynamicCombatSeries(),runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  // Browser contexts are serial so two software-WebGL pages do not compete.
  const legacy=await observeDynamicWebGL(browser,real,'legacy',viewport);
  const d04=await observeDynamicWebGL(browser,real,'d04',viewport);
  const verdict=classifyD04DynamicRendererPair({
   expected:real.expected,legacy:legacy.samples,d04:d04.samples
  });
  runs.push({viewport,legacy,d04,verdict});
  expect(legacy.errors).toEqual([]);
  expect(d04.errors).toEqual([]);
  expect(legacy.samples.length).toBeGreaterThan(0);
  expect(d04.samples.length).toBeGreaterThan(0);
  expect(verdict.budgetViolations).toEqual([]);
  expect(['MATCHED_DYNAMIC_RENDER_DIAGNOSTIC_ONLY',
   'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES']).toContain(verdict.status);
 }
 const evidence={source:'authentic-real-DungeonRuntime-dynamic-legacy-vs-D04-WebGL',
  frozenBefore:'281735d0910c6b2443648af976003d50412ee324',
  seed:real.seed,expected:real.expected,
  realDamageStages:real.expected.filter(e=>e.hpLossCount>0).map(e=>e.stageIndex),
  observation:'sequential real public states, actual post-WebGL frame diagnostics',
  preview:'D04 only via ?feedback=d04; legacy unchanged',
  audio:'disabled in timed modes; actual original A/V separately unverified',
  causation:null,matchedAV:false,movingEncodedVideoAccepted:false,
  limitations:'Serial software-WebGL runs may have warmup and camera settling differences. Poll latency is not a GPU timer. Missing stages and incomparable cameras remain explicit; not a causal performance claim.',
  runs};
 fs.writeFileSync('artifacts/dungeon-d04-dynamic-render-pair-evidence.json',
  JSON.stringify(evidence,null,2)+'\n');
 await test.info().attach('d04-dynamic-real-render-pair-evidence.json',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
 console.log('D04 real moving combat state-transition comparison:',JSON.stringify(
  runs.map(r=>({viewport:r.viewport,status:r.verdict.status,
   matched:r.verdict.matchedStages,damage:r.verdict.hpLossStagesMatched,
   excluded:r.verdict.excludedStages,
   legacy:r.verdict.legacy,d04:r.verdict.d04,paired:r.verdict.paired,
   stageFailures:{legacy:r.legacy.stageFailures,d04:r.d04.stageFailures}}))));
});
