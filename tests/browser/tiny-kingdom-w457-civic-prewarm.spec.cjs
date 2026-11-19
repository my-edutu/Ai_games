'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// These are real, complete running-game WebGL sessions, never screenshot mocks.
// The OFF case is the exact original synchronous source path on the SAME code.
test.use({video:'on'});
test('W457 original complete civic core is frame-sliced without changing authored mesh',async({browser},info)=>{
 test.setTimeout(450000);
 const results=[];
 for(const mode of ['prewarm','original']){
  const page=await browser.newPage({viewport:{width:1024,height:720}});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  const html=mode==='original'?source.replace('<head>',
   '<head><script>window.__TINY_KINGDOM_DISABLE_CIVIC_PREWARM__=true;<\/script>'):source;
  await page.setContent(html);
  // Freeze the authoritative clock BEFORE either loading strategy presents
  // its first scene. W458's false triangle comparison used food 189 vs 186.
  // Same seed alone is not equivalent-world proof.
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
   null,{timeout:150000});
  // Remain paused at the SAME world time; the camera remains interactable.
  const snap=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {prewarm:g.getCivicCorePrewarmAudit(),
    core:g.getCivicCoreResidencyAudit(),
    scene:g.renderStats(),cold:g.getColdSceneryBuildAudit(),
    triangles:g.getGeometryAudit().totalTriangles,
    geometry:g.getGeometryAudit(),farm:g.getFarmFieldResidencyAudit(),worldChecksum:g.exportSnapshot().checksum,
    worldTime:g.getState().state.t,
    people:g.metrics().citizens,buildings:g.metrics().buildings,
    gl:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const label='W457-'+mode+'-1024';
  await info.attach(label+'.png',{body:await page.screenshot(),contentType:'image/png'});
  await info.attach(label+'.json',{body:Buffer.from(JSON.stringify({
   exactHtmlSource:'same commit; original authored meshes',
   hardwareFps:'NOT MEASURED',independentG088Critic:'UNAVAILABLE',
   ...snap},null,2)),contentType:'application/json'});
  expect(pageErrors).toEqual([]);
  expect(snap.gl).toBe(0);
  expect(snap.triangles).toBeLessThan(160000);
  expect(snap.people).toBeGreaterThanOrEqual(12);
  expect(snap.buildings).toBeGreaterThanOrEqual(12);
  expect(snap.overflow).toBeLessThanOrEqual(0);
  expect(snap.core.sourceHash).toMatch(/^[0-9a-f]{8}$/);
  if(mode==='prewarm'){
   expect(snap.prewarm.failures).toBe(0);
   // Software WebGL must stage the authentic CPU vertex fallback.
   expect(snap.prewarm.delivery).toBe(snap.core.gpuResident?'resident-GPU-VBO':'complete-CPU-vertex-cache');
   expect(snap.prewarm.completed).toBe(1);
   expect(snap.prewarm.last.slices).toHaveLength(17);
   expect(snap.prewarm.last.slices.map(s=>s.name)).toEqual([
    'guildhall','near-field-0','near-field-1','near-field-merge',
    'far-field-0','far-field-1','far-field-merge',
    'grain-GPU-residency','granary-and-threshing-yard',
    'windmill-fences-bridge','sanctuary-forge','receiving-market',
    'market-quarter','authentic-high-street','original-streetfronts',
    'village-fixtures','exact-GPU-residency']);
   expect(snap.prewarm.last.residentCoreHash).toBe(snap.core.sourceHash);
   expect(snap.prewarm.last.nearCropHash).toBe(snap.farm.nearSourceHash);
   expect(snap.prewarm.last.farCropHash).toBe(snap.farm.farSourceHash);
   expect(snap.core.reuses).toBeGreaterThanOrEqual(1);
  }else expect(snap.prewarm.completed).toBe(0);
  results.push({mode,...snap});
  await page.close();
 }
 expect(results[0].worldChecksum).toBe(results[1].worldChecksum);
 expect(results[0].worldTime).toBe(results[1].worldTime);
 expect(results[0].core.sourceHash).toBe(results[1].core.sourceHash);
 expect(results[0].farm.nearSourceHash).toBe(results[1].farm.nearSourceHash);
 expect(results[0].farm.farSourceHash).toBe(results[1].farm.farSourceHash);
 expect(results[0].farm.plotRanges).toEqual(results[1].farm.plotRanges);
 expect(results[0].triangles).toBe(results[1].triangles);
 expect(results[0].scene.lastFrameTriangles).toBe(results[1].scene.lastFrameTriangles);
 // Original houses, market and granary remain present on a physical mobile
 // width; this is a separate live scene, not a CSS-only/mobile-mock claim.
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(source);
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {core:g.getCivicCoreResidencyAudit(),prewarm:g.getCivicCorePrewarmAudit(),farm:g.getFarmFieldResidencyAudit(),
   triangles:g.getGeometryAudit().totalTriangles,people:g.metrics().citizens,
   worldChecksum:g.exportSnapshot().checksum,
   overflow:document.documentElement.scrollWidth-innerWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()};
 });
 await info.attach('W457-390-real.png',{body:await page.screenshot(),contentType:'image/png'});
 await info.attach('W457-390-real.json',{body:Buffer.from(JSON.stringify(mobile,null,2)),
  contentType:'application/json'});
 expect(mobile.prewarm.delivery).toBe(mobile.core.gpuResident?'resident-GPU-VBO':'complete-CPU-vertex-cache');
 expect(mobile.prewarm.completed).toBe(1);
 expect(mobile.core.sourceHash).toBe(results[0].core.sourceHash);
 expect(mobile.farm.nearSourceHash).toBe(results[0].farm.nearSourceHash);
 expect(mobile.farm.farSourceHash).toBe(results[0].farm.farSourceHash);
 expect(mobile.worldChecksum).toBe(results[0].worldChecksum);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.close();
});


// W461 test-first: climate-prefetch must reuse EXACT original next-season plots,
// never advance the world, invent a worker, or erase current visible fields.
test('W461 anticipatory original next-season farm scene is bounded and authority-neutral',async({browser},info)=>{
 test.setTimeout(180000);
 const page=await browser.newPage({viewport:{width:1024,height:720}});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setContent(source);
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom,checksum=g.exportSnapshot().checksum;
  const original=g.getFarmFieldResidencyAudit(),
   originalScene=g.getGeometryAudit().totalTriangles,
   originalPeople=g.metrics().citizens,
   originalDay=g.metrics().day;
  const steps=[];
  for(let i=0;i<7;i++)steps.push(g.advanceUpcomingFarmSeasonPrewarmForTesting());
  const planned=g.getUpcomingFarmSeasonPrewarmAudit(),
   after=g.getFarmFieldResidencyAudit();
  return {checksum,afterChecksum:g.exportSnapshot().checksum,original,after,
   originalScene,afterScene:g.getGeometryAudit().totalTriangles,
   originalPeople,afterPeople:g.metrics().citizens,originalDay,afterDay:g.metrics().day,
   steps,planned,gl:document.querySelector('#world').getContext('webgl')?.getError()};
 });
 await info.attach('W461-next-real-season-1024.json',{body:Buffer.from(JSON.stringify(proof,null,2)),
  contentType:'application/json'});
 expect(pageErrors).toEqual([]);
 expect(proof.gl).toBe(0);
 expect(proof.checksum).toBe(proof.afterChecksum);
 expect(proof.originalScene).toBe(proof.afterScene);
 expect(proof.originalPeople).toBe(proof.afterPeople);
 expect(proof.originalDay).toBe(proof.afterDay);
 expect(proof.original.nearSourceHash).toBe(proof.after.nearSourceHash);
 expect(proof.original.farSourceHash).toBe(proof.after.farSourceHash);
 expect(proof.planned.completed).toBe(1);
 expect(proof.planned.failures).toBe(0);
 expect(proof.planned.last.stages.map(s=>s.name)).toEqual([
  'near-field-0','near-field-1','join-near',
  'far-field-0','far-field-1','join-far','cache-complete-original-season']);
 expect(proof.planned.last.nearSourceHash).toMatch(/^[a-f0-9]{8}$/);
 expect(proof.planned.last.farSourceHash).toMatch(/^[a-f0-9]{8}$/);
 expect(proof.planned.last.originalPlots).toBe(2);
 expect(proof.planned.last.originalRows).toBe(22);
 expect(proof.after.seasonCacheKeys).toContain(1);
 expect(proof.after.seasonCacheEntries).toBeLessThanOrEqual(4);
 expect(proof.after.seasonCacheFloats).toBeLessThanOrEqual(proof.after.seasonCacheBudgetFloats);
 expect(proof.after.originalPlotCount).toBe(2);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await info.attach('W461-next-real-season-390.png',{body:await page.screenshot(),
  contentType:'image/png'});
 const mobile=await page.evaluate(()=>({
  checksum:window.__tinyKingdom.exportSnapshot().checksum,
  overflow:document.documentElement.scrollWidth-innerWidth,
  triangles:window.__tinyKingdom.getGeometryAudit().totalTriangles,
  gl:document.querySelector('#world').getContext('webgl')?.getError()}));
 expect(mobile.checksum).toBe(proof.checksum);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 await page.close();
});
