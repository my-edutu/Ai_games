'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G119: examine TRUE current tasks, not decorative fake NPCs. The visible
// construction frame, harvest bundles and forge rhythm are presentation only.
// Camera/viewport changes cannot alter simulation or resource accounting.
test('G119 genuine occupational worksite choreography is bounded and read-only',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  // Allow autonomous citizens to decide which jobs are active.
  for(let i=0;i<6000&&g.getActiveWorksites().length<2;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const works=g.getActiveWorksites();
  const choreography=g.getWorksiteChoreography();
  const unchanged=before===JSON.stringify(g.exportSnapshot());
  return {before,works,choreography,unchanged};
 });
 expect(result.works.length).toBeGreaterThan(0);
 expect(result.choreography.length).toBe(result.works.length);
 expect(result.unchanged).toBe(true);
 for(const site of result.choreography){
  const source=result.works.find(w=>w.citizen===site.citizen);
  expect(source).toBeTruthy();
  expect(site.job).toBe(source.job);
  expect(site.progress).toBeGreaterThanOrEqual(0);
  expect(site.progress).toBeLessThanOrEqual(1);
  expect(site.phase).toBeGreaterThanOrEqual(0);
  expect(site.phase).toBeLessThanOrEqual(1);
  expect(site.frameRise).toBeGreaterThanOrEqual(.45);
  expect(site.frameRise).toBeLessThanOrEqual(1.55);
  // G120: a real builder must stand IN FRONT of the raising timber, not
  // disappear behind a beam at face height. The reachable joinery bench
  // stays below the worker's chest, with the taller assembly behind them.
  if(site.job==='builder'){
   expect(site.staging).toBeTruthy();
   expect(site.staging.frameRear).toBeLessThan(-0.55);
   expect(site.staging.benchFront).toBeGreaterThan(0.25);
   expect(site.staging.benchHeight).toBeGreaterThan(0.50);
   expect(site.staging.benchHeight).toBeLessThan(0.95);
  }
 }
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,live:g.getLiveWorkdayView(),
   triangles:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(result.before);
 expect(errors).toEqual([]);
});
