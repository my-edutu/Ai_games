'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G111 integrated inhabited valley: the WORKING town and farm should have a
// coordinate-anchored, bounded ground-surface atlas. A source edit or colour
// difference alone does not satisfy the transformation experience gate.
test('G111 inhabited ground connects actual roads, homes and fields without altering civilization authority',async({page})=>{
 test.setTimeout(155000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {authority:JSON.stringify(g.exportSnapshot()),
   surface:g.getGroundSurfaceStats(),geometry:g.getGeometryAudit(),
   glError:gl?.getError()??0};
 });
 expect(first.surface.renderer).toBe('gpu-2d-albedo');
 expect(first.surface.width).toBe(512);
 expect(first.surface.height).toBe(512);
 expect(first.surface.bytes).toBe(512*512*4);
 expect(first.surface.homes).toBeGreaterThanOrEqual(12);
 expect(first.surface.farmPlots).toBe(2);
 expect(first.surface.roadSegments).toBeGreaterThanOrEqual(18);
 expect(first.surface.rebuilds).toBe(1);
 expect(first.surface.gpuTextures).toBe(1);
 const samples=first.surface.samples;
 for(const label of ['road','field','meadow']){
  expect(samples[label]).toHaveLength(3);
  for(const channel of samples[label])expect(channel).toBeGreaterThanOrEqual(0);
 }
 expect(samples.road.join(',')).not.toBe(samples.meadow.join(','));
 expect(samples.field.join(',')).not.toBe(samples.meadow.join(','));
 expect(first.geometry.totalTriangles).toBeLessThan(160000);
 expect(first.glError).toBe(0);
 for(const camera of [
  {focus:[0,0],yaw:.85,pitch:.52,zoom:23},
  {focus:[20,1],yaw:1.1,pitch:.38,zoom:13}
 ]){
  // Sample the completed frame BEFORE changing the camera; otherwise a
  // software-rendered frame can finish between the change and the sample.
  const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(c=>window.__tinyKingdom.setCamera(c),camera);
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:30000});
 }
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {authority:JSON.stringify(g.exportSnapshot()),
   surface:g.getGroundSurfaceStats(),
   glError:document.querySelector('#world').getContext('webgl')?.getError()??0};
 });
 expect(after.authority).toBe(first.authority);
 expect(after.surface.rebuilds).toBe(first.surface.rebuilds);
 expect(after.surface.gpuTextures).toBe(1);
 expect(after.glError).toBe(0);
 // A resize may synchronously finish one expensive frozen frame in SwiftShader.
 // Capture the old counter first, then still require a new completed frame.
 const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:30000});
 const mobile=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,
  viewport:document.documentElement.clientWidth,
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  surface:window.__tinyKingdom.getGroundSurfaceStats(),
  glError:document.querySelector('#world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.width).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.authority).toBe(first.authority);
 expect(mobile.surface.gpuTextures).toBe(1);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
