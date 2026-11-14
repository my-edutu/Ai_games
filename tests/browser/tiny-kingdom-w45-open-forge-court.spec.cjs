'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test.use({video:'on'});
test('W45 a physically open craft courtyard films genuine smith work without inventing economy',async({page})=>{
 test.setTimeout(250000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:85000});
 await page.locator('#pause').click();
 const stage=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  let smith=null,ticks=0;
  for(;ticks<30000;ticks++){
   g.step(1/30);
   if(ticks%12===0){
    smith=g.getForgeCraftCycleAudit().workers.find(w=>w.phase==='hammering'&&w.reachableAnvil);
    if(smith)break;
   }
  }
  return {ticks,smith,snapshot:JSON.stringify(g.exportSnapshot()),
   courtyard:typeof g.getForgeCourtyardAudit==='function'?g.getForgeCourtyardAudit():null};
 });
 expect(stage.smith,'The observed forge shift must belong to an actual autonomous smith').toBeTruthy();
 expect(stage.courtyard,'W45 physically readable craft courtyard was not implemented').toBeTruthy();
 expect(stage.courtyard.source).toBe('original-open-guild-court');
 expect(stage.courtyard.altersAuthority).toBe(false);
 expect(stage.courtyard.shelter.posts.length).toBe(4);
 expect(stage.courtyard.shelter.minimumAnvilPostClearance).toBeGreaterThan(1.65);
 expect(stage.courtyard.shelter.openFront).toBe(true);
 expect(stage.courtyard.shelter.pitchedTimberRoof).toBe(true);
 expect(stage.courtyard.pavingStones).toBeGreaterThanOrEqual(24);
 expect(stage.courtyard.courtDetails).toBeGreaterThanOrEqual(3);
 expect(stage.courtyard.realWorkerNames).toContain(stage.smith.citizen);
 await page.locator('#forge-follow').click();
 const before=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  before,{timeout:85000});
 fs.mkdirSync('artifacts/tiny-kingdom-w45',{recursive:true});
 // W45 same-workstream RED-first: the original anvil and hearth are
 // already present, so a generic second mobile/desk workbox must NOT be
 // generated directly on top of the real smith's physical hands.
 const labor=await page.evaluate(()=>window.__tinyKingdom.getWorkdayRenderStats());
 expect(labor.integratedForgeWorkcells).toBeGreaterThan(0);
 expect(labor.duplicateForgeStations).toBe(0);
 await page.screenshot({path:'artifacts/tiny-kingdom-w45/open-guild-court-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 const previous=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  previous,{timeout:85000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {courtyard:g.getForgeCourtyardAudit(),worker:g.getForgeWitnessAudit(),
   snapshot:JSON.stringify(g.exportSnapshot()),
   triangles:g.getGeometryAudit().totalTriangles,
   overflow:document.documentElement.scrollWidth>390,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.snapshot).toBe(stage.snapshot);
 expect(mobile.worker.citizen).toBe(stage.smith.citizen);
 expect(mobile.worker.realCitizen).toBe(true);
 expect(mobile.courtyard.shelter.minimumAnvilPostClearance).toBeGreaterThan(1.65);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.overflow).toBe(false);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w45/open-guild-court-390px.png'});
 console.log('W45 original open smith courtyard',JSON.stringify({
  smith:stage.smith.citizen,stageTicks:stage.ticks,
  pavers:mobile.courtyard.pavingStones,
  posts:mobile.courtyard.shelter.posts.length,
  clearance:mobile.courtyard.shelter.minimumAnvilPostClearance,
  triangles:mobile.triangles}));
});
