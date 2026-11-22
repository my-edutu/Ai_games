'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// Experience gate, not a polygon or colour claim: each observable work vignette
// must be triggered by an actual completed authoritative work() operation,
// with measured resource/house deltas, not a scripted animation. The player
// can jump to the real worker without changing the snapshot or named RNG.
test('G090 workday camera follows real autonomous labor and shows its outcomes',async({page})=>{
 test.setTimeout(120000);
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 expect(await page.locator('#workday-watch').count()).toBe(1);
 expect(await page.locator('#workday-activity[role="status"]').count()).toBe(1);
 const observation=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  for(let step=0;step<12000&&game.getWorkdayEvents().length<2;step++)
   game.step(1/30);
  return {events:game.getWorkdayEvents(),
   authority:JSON.stringify(game.exportSnapshot()),metrics:game.metrics()};
 });
 expect(observation.events.length).toBeGreaterThan(0);
 expect(observation.events.length).toBeLessThanOrEqual(12);
 for(const event of observation.events){
  expect(event.citizen.length).toBeGreaterThan(0);
  expect(['farmer','forester','builder','merchant','craftsperson','gatherer'])
   .toContain(event.job);
  expect(Number.isFinite(event.time)).toBe(true);
  expect(Number.isFinite(event.x)).toBe(true);
  expect(Number.isFinite(event.z)).toBe(true);
  for(const key of ['food','wood','gold','buildings'])
   expect(Number.isFinite(event.delta[key])).toBe(true);
  expect(event.activity).not.toMatch(/^Traveling to /);
 }
 expect(observation.events.some(e=>Object.values(e.delta).some(v=>Math.abs(v)>0)))
  .toBe(true);
 await page.locator('#workday-watch').click();
 const followed=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {authority:JSON.stringify(g.exportSnapshot()),camera:g.getCamera(),
   current:g.getWorkdayView(),events:g.getWorkdayEvents(),
   status:document.getElementById('workday-activity').textContent,
   glError:gl?.getError()||0};
 });
 expect(followed.authority).toBe(observation.authority);
 expect(followed.camera.follow).toBe(true);
 expect(followed.current.citizen).toBe(observation.events[0].citizen);
 expect(followed.status).toContain(observation.events[0].citizen);
 expect(followed.glError).toBe(0);
 await page.waitForFunction(()=>window.__tinyKingdom.getWorkdayRenderStats().sceneMarkers>0,
  null,{timeout:30000});
 const painted=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {stats:g.getWorkdayRenderStats(),geometry:g.getGeometryAudit(),glError:gl?.getError()||0};
 });
 expect(painted.stats.sceneMarkers).toBeGreaterThan(0);
 expect(painted.geometry.totalTriangles).toBeLessThan(160000);
 expect(painted.geometry.static.invalidComponents).toBe(0);
 expect(painted.geometry.dynamic.invalidComponents).toBe(0);
 expect(painted.glError).toBe(0);
 // Actual 390px interaction: the watch control remains in the horizontal
 // scenic navigation and the accessible label is not lost.
 await page.setViewportSize({width:390,height:844});
 await page.locator('#workday-watch').click();
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>window.innerWidth,
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  watchName:window.__tinyKingdom.getWorkdayView().citizen
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.authority).toBe(observation.authority);
 expect(mobile.watchName).toBeTruthy();
 expect(pageErrors).toEqual([]);
});