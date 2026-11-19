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
    geometry:g.getGeometryAudit(),worldChecksum:g.exportSnapshot().checksum,
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
   expect(snap.prewarm.last.slices).toHaveLength(13);
   expect(snap.prewarm.last.slices.map(s=>s.name)).toEqual([
    'guildhall','original-grain-near-tier','original-grain-far-tier',
    'grain-GPU-residency','granary-and-threshing-yard',
    'windmill-fences-bridge','sanctuary-forge','receiving-market',
    'market-quarter','authentic-high-street','original-streetfronts',
    'village-fixtures','exact-GPU-residency']);
   expect(snap.prewarm.last.residentCoreHash).toBe(snap.core.sourceHash);
   expect(snap.core.reuses).toBeGreaterThanOrEqual(1);
  }else expect(snap.prewarm.completed).toBe(0);
  results.push({mode,...snap});
  await page.close();
 }
 expect(results[0].worldChecksum).toBe(results[1].worldChecksum);
 expect(results[0].worldTime).toBe(results[1].worldTime);
 expect(results[0].core.sourceHash).toBe(results[1].core.sourceHash);
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
  return {core:g.getCivicCoreResidencyAudit(),prewarm:g.getCivicCorePrewarmAudit(),
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
 expect(mobile.worldChecksum).toBe(results[0].worldChecksum);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.close();
});
