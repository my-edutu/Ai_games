'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W25 RED-first, followed by measured software fallback. An actual newly built cottage must reuse the complete
// original physically rendered guildhall/forge/farm/market/crossing/high street
// in an independent resident GPU buffer, NOT remove or fake any triangle.
// This is a performance correctness floor, not an experience quality PASS.
test('W25 real civic quarter stays GPU resident during authentic new home growth',async({page})=>{
 test.setTimeout(210000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {civic:g.getCivicSceneryCacheStats(),visibility:g.getScenicVisibilityStats(),
   geometry:g.getGeometryAudit(),reconciliation:g.getSceneTriangleReconciliation(),triangles:g.renderStats().lastFrameTriangles,
   buildings:g.metrics().buildings,snapshot:JSON.stringify(g.exportSnapshot())};
 });
 // The dedicated civic VBO helps actual hardware builders without forcing
 // a third SwiftShader draw which slowed real running software footage.
 // On the original fast software tier, civic architecture remains physically
 // present INSIDE the original settlement VBO, never omitted or hidden.
 const hardware=await page.evaluate(()=>window.__tinyKingdom.renderQuality().architectureTier==='hardware-layered-original');
 expect(before.civic.gpuResident).toBe(hardware);
 if(hardware){
  expect(before.civic.gpuUploads).toBeGreaterThanOrEqual(1);
  expect(before.civic.gpuTriangles).toBeGreaterThan(1000);
  expect(before.visibility.civic.visibleTriangles).toBeGreaterThan(0);
 }else{
  expect(before.civic.gpuUploads).toBe(0);
  expect(before.civic.gpuTriangles).toBe(0);
  expect(before.visibility.civic.visibleTriangles).toBe(0);
  expect(before.visibility.settlement.visibleTriangles).toBeGreaterThan(10000);
 }
 expect(before.reconciliation.unaccountedTriangles).toBe(0);
 expect(before.reconciliation.auditedTriangles + before.reconciliation.weatherTrianglesEstimated).toBe(before.triangles);
 const oldFrames=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 const grown=await page.evaluate(buildings=>{
  const g=window.__tinyKingdom;let ticks=0;
  while(g.metrics().buildings<=buildings&&ticks<7200){g.step(1/30);ticks++;}
  return {ticks,buildings:g.metrics().buildings,authority:JSON.stringify(g.exportSnapshot())};
 },before.buildings);
 expect(grown.buildings).toBeGreaterThan(before.buildings);
 // Sample BEFORE the fixed-step world advance. A frozen frame may already
 // finish before evaluating the new cursor, causing a false 90-second hang.
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,oldFrames,{timeout:90000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {civic:g.getCivicSceneryCacheStats(),visibility:g.getScenicVisibilityStats(),
   geometry:g.getGeometryAudit(),reconciliation:g.getSceneTriangleReconciliation(),triangles:g.renderStats().lastFrameTriangles,
   snapshot:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(after.snapshot).toBe(grown.authority);
 expect(after.civic.activeKey).toBe(before.civic.activeKey);
 expect(after.civic.gpuResident).toBe(hardware);
 expect(after.civic.gpuUploads).toBe(before.civic.gpuUploads);
 expect(after.civic.gpuTriangles).toBe(before.civic.gpuTriangles);
 expect(after.civic.reuses).toBeGreaterThanOrEqual(before.civic.reuses+1);
 if(hardware)expect(after.visibility.civic.visibleTriangles).toBeGreaterThan(0);
 else expect(after.visibility.settlement.visibleTriangles).toBeGreaterThan(10000);
 expect(after.reconciliation.unaccountedTriangles).toBe(0);
 expect(after.reconciliation.auditedTriangles + after.reconciliation.weatherTrianglesEstimated).toBe(after.triangles);
 expect(after.geometry.static.invalidComponents).toBe(0);
 expect(after.gl).toBe(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=390)).toBe(true);
 expect(errors).toEqual([]);
});
