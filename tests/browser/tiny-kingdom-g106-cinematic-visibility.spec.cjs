'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G106: actual workday courier, real scene visibility and byte-identical
// authoritative world before/after player follow and responsive viewport.
test('G106 seeing the real unloading worker does not require hidden economy or excess static draw calls',async({page})=>{
 test.setTimeout(190000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();let courier=null;
  for(let i=0;i<40000;i++){g.step(1/30);courier=g.getMarketHandoffs()[0];if(courier)break;}
  return {courier,snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(staged.courier).toBeTruthy();
 await page.locator('#delivery-follow').click();
 const current=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {shot:g.getCitizenCameraPlan(),camera:g.getCamera(),
   selected:g.getSelectedCitizen(),snapshot:JSON.stringify(g.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(current.snapshot).toBe(staged.snapshot);
 expect(current.selected).toBe(staged.courier.citizen);
 expect(current.shot.blockers).toBe(0);
 expect(current.shot.bodyRays).toBe(7);
 expect(current.shot.bodyVisibleFraction).toBeGreaterThan(.4);
 expect(current.camera.zoom).toBeLessThan(9);
 expect(current.glError).toBe(0);
 const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:30000});
 const draws=await page.evaluate(()=>window.__tinyKingdom.getScenicVisibilityStats());
 expect(draws.totalDrawCalls).toBeGreaterThan(0);
 expect(draws.totalDrawCalls).toBeLessThanOrEqual(draws.landscape.visibleChunks+draws.settlement.visibleChunks);
 expect(draws.totalSubmittedTriangles).toBeGreaterThan(0);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflows:document.documentElement.scrollWidth>document.documentElement.clientWidth,
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  glError:document.getElementById('world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.overflows).toBe(false);
 expect(mobile.snapshot).toBe(staged.snapshot);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
