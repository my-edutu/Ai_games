'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G067 live and camera-only frames reuse bounded GPU dynamic vertex storage without altering civilization',async({page})=>{
 const faults=[];page.on('pageerror',error=>faults.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 const webgl=await page.evaluate(()=>Boolean(document.getElementById('world').getContext('webgl')));
 test.skip(!webgl,'WebGL-only buffer reuse contract; Canvas2D fallback is exercised separately');
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().framesDrawn>=3);
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>0);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {stats:g.renderStats(),geometry:g.getGeometryAudit(),
   authority:JSON.stringify(g.exportSnapshot()),camera:g.getCamera()};
 });
 // Fail immediately on absent counters, rather than polling undefined values.
 expect(before.stats.dynamicGpuAllocations).toBeGreaterThanOrEqual(1);
 expect(before.stats.dynamicGpuUploads).toBeGreaterThanOrEqual(3);
 expect(before.stats.dynamicGpuCapacityFloats).toBeGreaterThanOrEqual(before.geometry.dynamic.floats);
 // Camera rotation must draw a new scene but must not rebuild static geometry.
 await page.evaluate(camera=>window.__tinyKingdom.setCamera({
  yaw:camera.yaw+.28,pitch:camera.pitch,zoom:camera.zoom,focus:camera.focus
 }),before.camera);
 await page.waitForFunction(previous=>
  window.__tinyKingdom.renderStats().dynamicGpuUploads>previous,
  before.stats.dynamicGpuUploads,{timeout:30000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {stats:g.renderStats(),geometry:g.getGeometryAudit(),
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(before.stats.dynamicGpuAllocations).toBeGreaterThanOrEqual(1);
 expect(before.stats.dynamicGpuUploads).toBeGreaterThanOrEqual(3);
 expect(before.stats.dynamicGpuCapacityFloats).toBeGreaterThanOrEqual(before.geometry.dynamic.floats);
 expect(after.stats.dynamicGpuCapacityFloats).toBeGreaterThanOrEqual(after.geometry.dynamic.floats);
 expect(after.stats.dynamicGpuAllocations).toBe(before.stats.dynamicGpuAllocations);
 expect(after.stats.dynamicGpuUploads).toBeGreaterThan(before.stats.dynamicGpuUploads);
 expect(after.stats.staticGpuUploads).toBe(before.stats.staticGpuUploads);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 expect(after.authority).toBe(before.authority);
 expect(faults).toEqual([]);
});
