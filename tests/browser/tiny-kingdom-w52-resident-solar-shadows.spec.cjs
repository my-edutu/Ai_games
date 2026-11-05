'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W52 RED-first contract: retain real static solar-shadow triangles in a
// bounded GPU buffer rather than copying thousands of immutable vertices
// back into the animated workday mesh on every frame. Every citizen retains
// their own live contact shadow. This is a PERFORMANCE SAFETY FLOOR only.
test('W52 actual solar shadow VBO is resident while real citizen shadows keep moving at 390px',async({page})=>{
 test.setTimeout(200000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  return {state:JSON.stringify(g.exportSnapshot()),cache:g.getShadowCacheAudit()};
 });
 await page.waitForFunction(()=>{
  const a=window.__tinyKingdom?.getShadowCacheAudit?.();
  return a?.gpuResident===true&&a?.activeResidentTriangles>0&&a?.gpuDrawCalls>0;
 },null,{timeout:60000});
 const desktop=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {cache:g.getShadowCacheAudit(),gradient:g.getShadowGradientAudit(),
   shadow:g.shadowStats(),geometry:g.getGeometryAudit(),
   unchanged:JSON.stringify(g.exportSnapshot())===JSON.stringify(g.exportSnapshot()),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(desktop.cache.gpuResident).toBe(true);
 expect(desktop.cache.activeResidentTriangles).toBeGreaterThan(0);
 expect(desktop.cache.gpuUploads).toBeGreaterThan(0);
 expect(desktop.cache.gpuDrawCalls).toBeGreaterThan(0);
 expect(desktop.cache.dynamicStaticCopies).toBe(0);
 expect(desktop.cache.citizenShadowsLive).toBe(true);
 expect(desktop.cache.floats).toBeLessThanOrEqual(desktop.cache.maxFloats);
 expect(desktop.gradient.triangles).toBe(desktop.shadow.triangles);
 expect(desktop.gradient.wrongMaterials).toBe(0);
 expect(desktop.gradient.gradientTriangles).toBeGreaterThan(0);
 expect(desktop.geometry.totalTriangles).toBeLessThan(160000);
 expect(desktop.gl).toBe(0);
 fs.mkdirSync('artifacts/tiny-kingdom-w52',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w52/desktop-actual-solar-shadows.png'});
 // An actual, read-only camera transition must continue drawing the resident
 // shadows. It cannot require a copy/upload to the dynamic citizen buffer.
 const priorDraws=desktop.cache.gpuDrawCalls,priorUploads=desktop.cache.gpuUploads;
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:1.10,pitch:.60,zoom:22,focus:[0,0]}));
 await page.waitForFunction(n=>window.__tinyKingdom?.getShadowCacheAudit?.().gpuDrawCalls>n,priorDraws,{timeout:60000});
 const after=await page.evaluate(()=>({cache:window.__tinyKingdom.getShadowCacheAudit(),
  shadow:window.__tinyKingdom.shadowStats(),gl:document.getElementById('world').getContext('webgl')?.getError()??-1}));
 expect(after.cache.gpuUploads).toBe(priorUploads);
 expect(after.cache.dynamicStaticCopies).toBe(0);
 expect(after.shadow.triangles).toBe(desktop.shadow.triangles);
 expect(after.gl).toBe(0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom?.getShadowCacheAudit?.().gpuDrawCalls>0,null,{timeout:60000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {cache:g.getShadowCacheAudit(),gradient:g.getShadowGradientAudit(),
   world:JSON.stringify(g.exportSnapshot()),width:document.documentElement.scrollWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.cache.gpuResident).toBe(true);
 expect(mobile.cache.dynamicStaticCopies).toBe(0);
 expect(mobile.cache.activeResidentTriangles).toBeGreaterThan(0);
 expect(mobile.cache.entries).toBeLessThanOrEqual(mobile.cache.maxEntries);
 expect(mobile.cache.floats).toBeLessThanOrEqual(mobile.cache.maxFloats);
 expect(mobile.gradient.wrongMaterials).toBe(0);
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.gl).toBe(0);
 expect(mobile.world).toBe(before.state);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w52/390px-real-solar-shadows.png'});
 console.log('W52 real solar shadow GPU residency',JSON.stringify({desktop:desktop.cache,mobile:mobile.cache}));
});
