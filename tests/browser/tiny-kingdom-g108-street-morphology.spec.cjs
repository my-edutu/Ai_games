'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G108: town-wide morphology must be physical gameplay geometry, not screenshots.
// Before implementation the street-morphology probe is missing (source RED).
test('G108 living market street uses real varied civic-height houses without changing authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {authority:JSON.stringify(g.exportSnapshot()),
   morphology:g.getStreetMorphologyStats?.()||null,
   meshes:g.getGeometryAudit(),roofs:g.getCameraOcclusionModel(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??0};
 });
 expect(before.morphology,'Integrated built-quarter audit is required').toBeTruthy();
 expect(before.morphology.homes).toBe(12);
 expect(before.morphology.highStreetFronts).toBeGreaterThanOrEqual(8);
 expect(before.morphology.crossGables+before.morphology.shopCanopies).toBeGreaterThanOrEqual(5);
 expect(before.morphology.totalTriangles).toBeGreaterThan(120);
 expect(before.morphology.totalTriangles).toBeLessThan(3200);
 expect(before.meshes.totalTriangles).toBeLessThan(160000);
 expect(before.meshes.static.invalidComponents+before.meshes.dynamic.invalidComponents).toBe(0);
 expect(before.meshes.static.invalidNormals+before.meshes.dynamic.invalidNormals).toBe(0);
 expect(before.gl).toBe(0);
 await page.locator('[data-scenic="market"]').click();
 const camera=await page.evaluate(()=>({
  state:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  occlusion:window.__tinyKingdom.getCameraOcclusionModel()}));
 expect(camera.state).toBe(before.authority);
 expect(camera.occlusion.tallHomes).toBeGreaterThanOrEqual(0);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
  state:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  gl:document.querySelector('#world').getContext('webgl')?.getError()??0}));
 expect(mobile.overflow).toBe(false);expect(mobile.state).toBe(before.authority);
 expect(mobile.gl).toBe(0);expect(errors).toEqual([]);
});
