'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G094: G089 legitimately reclaimed 11,248 actual Day-1 forest triangles.
// Do not falsely fail on an obsolete G070 exact-count fixture. Verify scene
// accounting, static festival ownership, geometry validity and camera invariance.
test('G070 seasonal festival decoration lives in cached static scenery, not per-frame geometry',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getFestivalVisualStats().vertices>0);
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>0);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {festival:g.getFestivalVisualStats(),geometry:g.getGeometryAudit(),
   stats:g.renderStats(),profile:g.getFrameProfile(),authority:JSON.stringify(g.exportSnapshot()),
   population:g.metrics().citizens,camera:g.getCamera(),
   webgl:Boolean(document.getElementById('world').getContext('webgl'))};
 });
 expect(before.festival.vertices).toBeGreaterThan(150000);
 expect(before.festival.staticMeshTriangles).toBe(before.festival.vertices/30);
 expect(before.festival.cachedStage).toBe('static-scenic');
 expect(before.population).toBe(12);
 if(before.webgl){
  expect(before.geometry.totalTriangles).toBeGreaterThan(100000);
  expect(before.geometry.totalTriangles).toBeLessThan(160000);
  expect(before.geometry.static.triangles).toBe(before.stats.scenicMeshTriangles);
  expect(before.geometry.static.triangles).toBeGreaterThan(before.festival.staticMeshTriangles);
  expect(before.geometry.dynamic.triangles).toBe(
    before.geometry.totalTriangles-before.geometry.static.triangles);
 }
 await page.evaluate(camera=>window.__tinyKingdom.setCamera({
  yaw:camera.yaw+.27,pitch:camera.pitch,zoom:camera.zoom,focus:camera.focus
 }),before.camera);
 await page.waitForFunction(previous=>window.__tinyKingdom.getFrameProfile().totalFrames>previous,
  before.profile.totalFrames,{timeout:30000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {festival:g.getFestivalVisualStats(),geometry:g.getGeometryAudit(),
   stats:g.renderStats(),authority:JSON.stringify(g.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()||0};
 });
 expect(after.festival.staticMeshTriangles).toBe(before.festival.staticMeshTriangles);
 expect(after.festival.cacheBuilds).toBe(before.festival.cacheBuilds);
 if(before.webgl){
  expect(after.geometry.totalTriangles).toBe(before.geometry.totalTriangles);
  expect(after.stats.staticGpuUploads).toBe(before.stats.staticGpuUploads);
  expect(after.stats.dynamicGpuUploads).toBeGreaterThan(before.stats.dynamicGpuUploads);
 }
 expect(after.authority).toBe(before.authority);
 expect(after.glError).toBe(0);
 expect(errors).toEqual([]);
});
