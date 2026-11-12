'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {classifyD04RendererPair,SOURCE}=require('./dungeon-d04-render-cost-pair.cjs');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

function actualAdjacentDamage(){
 const seed='visual-room-art-18',game=DungeonRuntime.create(seed);
 let before=game.publicState();
 for(let i=0;i<140;i++){
  const after=game.step();
  if(after.run===before.run&&after.floor===before.floor&&after.tick===before.tick+1&&
   after.units.some(u=>before.units.some(v=>v.id===u.id&&v.hp>u.hp)))
   return {seed,before,after};
  before=after;
 }
 throw Error('No actual adjacent authoritative HP decrease in seeded Dungeon; cannot fabricate a combat state');
}

// No A/V recorder is attached during timing: competing encoders materially
// bias the software-WebGL benchmark. The existing separate genuine A/V test
// owns original sound, source starts, and its explicitly unverified codec sync.
async function observeRealRender(browser,{mode,viewport,seed,before,after}){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 let release=false;
 await page.route('**/dungeon/state',route=>route.fulfill({json:release?after:before}));
 try{
  await page.goto(mode==='d04'?'/dungeon?feedback=d04':'/dungeon');
  await expect.poll(()=>page.evaluate(()=>
   Boolean(window.__DUNGEON_RENDER_DIAGNOSTICS__?.d04PreviewEnabled)),
   {timeout:65000}).toBe(mode==='d04');
  if(mode==='d04'){
   const baseline=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback);
   expect(baseline?.audioOptedIn).toBe(false,'No audio without a real gesture');
   expect(baseline?.visuals?.reservedInstances).toBeLessThanOrEqual(104);
   expect(baseline?.visuals?.drawCalls).toBeLessThanOrEqual(7);
  }else{
   expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback??null))
    .toBeNull();
  }
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum),
   {timeout:65000}).toBe(before.checksum);
  // Both use the public spectator's existing tactical viewpoint; no camera
  // implementation, authority or lighting is modified by this forensic test.
  await page.locator('#view-toggle').click();
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),
   {timeout:40000}).toBe('tactical');
  release=true;
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum),
   {timeout:65000}).toBe(after.checksum);
  const samples=await page.evaluate(async ({mode,viewport,seed,checksum,source})=>{
   const result=[],started=performance.now();
   let previous=-1;
   // Actual app diagnostics are authored only AFTER WebGL render returns.
   // No draw calls, synthetic frames, audio, or state mutations are injected.
   while(result.length<6&&performance.now()-started<26000){
    const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    if(d&&d.renderedState?.checksum===checksum&&Number.isSafeInteger(d.frame)&&
       d.frame>previous){
     previous=d.frame;
     result.push({source,mode,seed,viewport,frameId:d.frame,
      scene:{...d.renderedState},camera:d.camera,focusedHeroId:d.focusedHeroId,
      cameraPosition:{...d.cameraRig?.actualPosition},
      cameraAim:{...d.cinematicAim},postFX:d.postFX,
      softwareWebGL:d.softwareWebGL,renderMs:d.directRenderMs,
      drawCalls:d.drawCalls,triangles:d.triangles,
      postFXStatus:d.postFXStatus,observedMs:performance.now()-started});
    }
    await new Promise(resolve=>setTimeout(resolve,60));
   }
   return result;
  },{mode,viewport,seed,checksum:after.checksum,source:SOURCE});
  const suffix=viewport.width===390?'mobile390':'desktop1440';
  await page.locator('#world').screenshot({
   path:`artifacts/dungeon-d04-render-pair-${mode}-${suffix}.png`,timeout:25000});
  return {samples,errors,mode,viewport,source:'real-browser-fixed-authentic-HP-snapshot',
   seed,beforeTick:before.tick,afterTick:after.tick,checksum:after.checksum,
   videoSampleSynchronized:false,audioOptedIn:false,
   limitation:'Post-WebGL app directRenderMs sampled in separate serial pages; camera matching and sample sufficiency are classified independently. This is NOT an A/V or moving-combat acceptance test.'};
 }finally{await page.close();}
}

test('D04 measures paired real legacy vs opt-in WebGL cost on authentic unchanged Dungeon HP states',async({browser})=>{
 test.setTimeout(400000);
 const real=actualAdjacentDamage(),runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  // Sequential, not two simultaneous software-WebGL pages heating the same CPU.
  const legacy=await observeRealRender(browser,{...real,mode:'legacy',viewport});
  const d04=await observeRealRender(browser,{...real,mode:'d04',viewport});
  const verdict=classifyD04RendererPair({legacy:legacy.samples,d04:d04.samples});
  runs.push({viewport,legacy,d04,verdict});
  expect(legacy.errors).toEqual([]);
  expect(d04.errors).toEqual([]);
  expect(legacy.samples.length).toBeGreaterThan(0);
  expect(d04.samples.length).toBeGreaterThan(0);
  // Incomparable camera/postFX/viewport/missing samples must remain an honest
  // INSUFFICIENT result, never be transformed into performance improvement.
  expect(['INSUFFICIENT_MATCHED_RENDER_FRAMES','MATCHED_RENDER_DIAGNOSTIC_ONLY'])
   .toContain(verdict.status);
 }
 const evidence={source:'authentic-sequential-legacy-D04-Dungeon-post-WebGL-matched-diagnostic',
  beforeMilestone:'281735d0910c6b2443648af976003d50412ee324',
  runtime:'actual-DungeonRuntime-step public snapshots; no fabricated damage',
  preview:'D04 requires ?feedback=d04; the ordinary route is unchanged',
  audioConsent:'disabled for both timed comparisons; original sound NOT assessed',
  timing:'CPU direct renderer wall times; not GPU fence, encoded presentation or causal attribution',
  runs,causedByD04:null,realMovingAVAccepted:false};
 const file='artifacts/dungeon-d04-matched-legacy-render-cost-evidence.json';
 fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');
 await test.info().attach('d04-real-legacy-vs-preview-render-cost.json',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
 console.log('D04 authentic matched cost (no causation claimed):',JSON.stringify(
  runs.map(r=>({viewport:r.viewport,status:r.verdict.status,matched:r.verdict.matchedFrames,
   legacy:r.verdict.legacy,d04:r.verdict.d04,paired:r.verdict.paired}))));
});
