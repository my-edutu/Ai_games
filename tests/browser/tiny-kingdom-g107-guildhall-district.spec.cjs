'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G107 integrated town-square architecture, not a LOOK/FEEL/PLAY victory.
// Authored RED against G106: this API and real physical guildhall did not exist.
test('G107 inhabited civic centre has physical medieval hierarchy and preserves living-world authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom,authority=JSON.stringify(g.exportSnapshot());
  const civic=typeof g.getGuildhallVisualStats==='function'?g.getGuildhallVisualStats():null;
  return {civic,authority,meshes:g.getGeometryAudit(),camera:g.getCamera(),
   cameraRoofs:g.getCameraOcclusionModel(),
   glError:document.querySelector('#world').getContext('webgl')?.getError()??0};
 });
 expect(before.civic,'Physical guildhall staging probe missing').toBeTruthy();
 expect(before.civic.kind).toBe('timber-framed-civic-quarter');
 expect(before.civic.roofShingles).toBeGreaterThanOrEqual(64);
 expect(before.civic.timberBays).toBeGreaterThanOrEqual(16);
 expect(before.civic.glazedBays).toBeGreaterThanOrEqual(8);
 expect(before.civic.belfries).toBe(1);
 expect(before.civic.porchPosts).toBeGreaterThanOrEqual(2);
 expect(before.civic.frontSteps).toBeGreaterThanOrEqual(4);
 expect(before.cameraRoofs.belfries).toBe(1);
 expect(before.cameraRoofs.hall).toBe(1);
 expect(before.civic.triangles).toBeGreaterThan(350);
 expect(before.civic.triangles).toBeLessThan(2200);
 expect(before.meshes.totalTriangles).toBeLessThan(160000);
 expect(before.meshes.static.invalidComponents+before.meshes.dynamic.invalidComponents).toBe(0);
 expect(before.meshes.static.invalidNormals+before.meshes.dynamic.invalidNormals).toBe(0);
 expect(before.glError).toBe(0);
 await page.locator('[data-scenic="market"]').click();
 const afterCamera=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {authority:JSON.stringify(g.exportSnapshot()),camera:g.getCamera(),
    civic:g.getGuildhallVisualStats()};
 });
 expect(afterCamera.authority).toBe(before.authority);
 expect(afterCamera.camera.follow).toBe(false);
 expect(afterCamera.civic.triangles).toBe(before.civic.triangles);
 const evolved=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<3600;i++)g.step(1/30);
  const state=g.getState().state,saved=g.exportSnapshot();
  return {saved:JSON.stringify(saved),resources:[state.food,state.wood,state.gold],
   citizens:g.metrics().citizens,buildings:g.metrics().buildings};
 });
 expect(evolved.resources.every(v=>v>=0)).toBe(true);
 expect(evolved.citizens).toBeGreaterThanOrEqual(12);
 expect(evolved.buildings).toBeGreaterThanOrEqual(9);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  glError:document.querySelector('#world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.authority).toBe(evolved.saved);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
