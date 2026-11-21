'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G105: RED on G104 because the renderer sends every static triangle even
// when the entire chunk is outside the camera; this is not a pixel-delta test.
test('G105 scene visibility saves actual static WebGL triangles without hiding the simulation',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>({
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  visibility:window.__tinyKingdom.getScenicVisibilityStats(),
  geometry:window.__tinyKingdom.getGeometryAudit()
 }));
 expect(initial.visibility.settlement.totalChunks).toBeGreaterThan(8);
 expect(initial.visibility.landscape.totalChunks).toBeGreaterThan(8);
 expect(initial.visibility.settlement.visibleTriangles).toBeGreaterThan(0);
 expect(initial.visibility.landscape.visibleTriangles).toBeGreaterThan(0);
 expect(initial.visibility.totalCulledTriangles).toBeGreaterThan(0);
 expect(initial.visibility.totalSubmittedTriangles).toBeLessThan(initial.geometry.static.triangles);
 expect(initial.geometry.totalTriangles).toBeLessThan(160000);
 const views=[
  {yaw:.85,pitch:.52,zoom:23,focus:[0,0]},
  {yaw:2.40,pitch:.40,zoom:12,focus:[14,11]},
  {yaw:-.75,pitch:.38,zoom:10,focus:[-18,-14]}
 ];
 for(const camera of views){
  const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(view=>window.__tinyKingdom.setCamera(view),camera);
  await page.waitForFunction(before=>window.__tinyKingdom.getFrameProfile().totalFrames>before,prev,{timeout:30000});
  const check=await page.evaluate(()=>({
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   chunks:window.__tinyKingdom.getScenicVisibilityStats(),
   glError:document.getElementById('world').getContext('webgl').getError()
  }));
  expect(check.snapshot).toBe(initial.snapshot);
  expect(check.chunks.totalSubmittedTriangles).toBeGreaterThan(0);
  expect(check.chunks.totalSubmittedTriangles).toBeLessThan(initial.geometry.static.triangles);
  expect(check.glError).toBe(0);
 }
 // The previous order sampled the frame counter AFTER resize, allowing
 // a legitimately completed frozen mobile frame to be mistaken for "no render".
 // Watch the count before resizing so the test proves the real resize draw.
 const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(before=>window.__tinyKingdom.getFrameProfile().totalFrames>before,prev,{timeout:30000});
 const mobile=await page.evaluate(()=>({
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
  visibility:window.__tinyKingdom.getScenicVisibilityStats(),
  glError:document.getElementById('world').getContext('webgl').getError()
 }));
 expect(mobile.snapshot).toBe(initial.snapshot);
 expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
 expect(mobile.visibility.totalSubmittedTriangles).toBeGreaterThan(0);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
