'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W28 RED: source-matched W26/W27 Day-120 moving market footage showed that
// correcting the portrait lens alone still let a real roof fill the view at
// the end of a legal connected street tour. An unobstructed *centre* ray does
// not mean an unobstructed FRAME. Score ORIGINAL roof silhouettes at 390px;
// never hide, move or replace any merchant or building.
test('W28 real market director evaluates full 390px 3D roof field before turning',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const data=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.setStreetWalk(true);g.visitMarket();
  const state=g.getStreetWalkState();
  const camera=g.getStreetFrameOcclusionAudit();
  const lens=g.getMarketTourLensAudit(state.yaw+1.15);
  return {state,camera,lens,after:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
   width:document.documentElement.scrollWidth};
 });
 expect(data.state.active).toBe(true);
 expect(data.camera.samples).toBeGreaterThanOrEqual(12);
 expect(data.camera.mode).toBe('real-original-physical-roofs');
 expect(data.camera.blockedFraction).toBeGreaterThanOrEqual(0);
 expect(data.camera.blockedFraction).toBeLessThanOrEqual(1);
 expect(data.lens.requestedScreenRoofCover).toBeGreaterThanOrEqual(0);
 expect(data.lens.chosenScreenRoofCover).toBeGreaterThanOrEqual(0);
 expect(data.lens.physicalSamples).toBeGreaterThanOrEqual(12);
 expect(data.lens.chosenObstructionScore).toBeLessThanOrEqual(data.lens.requestedObstructionScore+0.01);
 expect(data.after).toBe(before);
 expect(data.gl).toBe(0);expect(data.width).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
});
test('W28 desktop physical roof frame sampler uses real desktop optics',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const x=await page.evaluate(()=>{const g=window.__tinyKingdom;g.setStreetWalk(true);
  const a=g.getStreetFrameOcclusionAudit(),lens=g.getPhysicalProjectionAudit();
  return {a,lens};});
 expect(x.a.samples).toBeGreaterThanOrEqual(12);
 expect(x.a.tanHorizontal).toBeCloseTo(x.lens.tanHorizontal,8);
 expect(x.a.tanVertical).toBeCloseTo(x.lens.tanVertical,8);
 expect(errors).toEqual([]);
});
