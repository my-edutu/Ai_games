'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W26 Living Valley: camera response is measured in elapsed wall seconds,
// not frames rendered. SwiftShader might deliver 3 FPS while a regular device
// draws 60 FPS. Watching a REAL citizen must not slow to a crawl on either.
// This is a necessary FEEL floor, NOT a Manor Lords transformation verdict.
for(const [label,width,height] of [['desktop',1024,640],['390px',390,844]]){
 test('W26 frame-rate-independent real citizen follow and cinematic control '+label,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const original=JSON.stringify(g.exportSnapshot());
   const subframes=Array.from({length:20},()=>g.getCameraMotionAudit(1/60));
   const software=g.getCameraMotionAudit(1/3);
   const normal=g.getCameraMotionAudit(1/60);
   const zero=g.getCameraMotionAudit(0);
   const after=JSON.stringify(g.exportSnapshot());
   return {subframes,software,normal,zero,untouched:original===after,
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
    width:document.documentElement.scrollWidth};
  });
  expect(audit.untouched,'Camera cannot alter fixed-step authority').toBe(true);
  expect(audit.software.source).toBe('real-wall-time-camera');
  expect(audit.software.elapsedSeconds).toBeCloseTo(1/3,5);
  expect(audit.zero.followBlend).toBe(0);
  expect(audit.zero.workdayFocusBlend).toBe(0);
  expect(audit.zero.workdayAimBlend).toBe(0);
  for(const key of ['followBlend','workdayFocusBlend','workdayAimBlend']){
   expect(audit.normal[key]).toBeGreaterThan(0);
   expect(audit.software[key]).toBeGreaterThan(audit.normal[key]);
   expect(audit.software[key]).toBeLessThan(1);
   // Equal elapsed wall time gives nearly equal camera convergence,
   // independent of whether the software renderer presented 1 or 20 frames.
   const compounded=1-(1-audit.normal[key])**20;
   expect(Math.abs(audit.software[key]-compounded)).toBeLessThan(.015);
  }
  expect(audit.software.cinematicYawRadians).toBeCloseTo(audit.normal.cinematicYawRadians*20,7);
  await page.locator('#focus').click();
  const camera=await page.evaluate(()=>window.__tinyKingdom.getCamera());
  expect(camera.follow).toBe(true);
  expect(audit.width).toBeLessThanOrEqual(width);
  expect(audit.gl).toBe(0);
  expect(errors).toEqual([]);
 });
}
