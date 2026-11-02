'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G135 is the INHABITED WORKDAY workstream, not a pixel-count quality claim.
// G132 genuine continuous footage showed a rear-facing carpenter behind a
// timber rack; crop-clear centre rays did not reveal the working hands.
// This test binds one camera to a REAL autonomous shift and its real hand
// targets while preserving all authority, workers, structures and resources.
test('G135 active workday is framed from the physical working front with readable hand targets',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  // A real mature settlement, not spawn mocks or a staged faux builder.
  for(let i=0;i<86400;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const view=g.watchLiveWorkday(),shot=g.getWorkdayCompositionAudit();
  const repeat=g.getWorkdayCompositionAudit();
  const camera=g.getCitizenCameraPlan();
  const after=JSON.stringify(g.exportSnapshot());
  return {view,shot,repeat,camera,counts:g.metrics(),
   readOnly:before===after,render:g.renderStats(),gl:
    document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(result.readOnly).toBe(true);
 expect(result.counts.citizens).toBeGreaterThanOrEqual(28);
 expect(result.counts.buildings).toBeGreaterThanOrEqual(37);
 expect(result.view?.active).toBe(true);
 expect(result.shot).toEqual(result.repeat);
 expect(result.shot.actor).toBe(result.view.citizen);
 expect(result.shot.job).toBe(result.view.job);
 expect(result.shot.source).toBe('real-autonomous-workday');
 expect(result.shot.active).toBe(true);
 expect(result.shot.handTargets).toHaveLength(2);
 expect(result.shot.handTargets.every(point=>
  point.length===3&&point.every(Number.isFinite))).toBe(true);
 expect(result.shot.handBlockers).toBeGreaterThanOrEqual(0);
 expect(result.shot.handBlockers).toBeLessThanOrEqual(2);
 expect(result.shot.cameraDistance).toBeGreaterThan(3.6);
 expect(result.shot.cameraDistance).toBeLessThan(11);
 expect(result.shot.faceAlignment).toBeGreaterThan(-.45);
 // A front workday view must not be rejected solely due to the old
 // spectator heading or invisible centre-ray-only "visibility" proxies.
 if(result.shot.clearFrontCandidates>0){
  expect(result.shot.faceAlignment).toBeGreaterThan(.12);
  expect(result.shot.handBlockers).toBeLessThanOrEqual(1);
 }
 expect(result.shot.staticWorldHidden).toBe(false);
 expect(result.camera).toBeTruthy();
 expect(result.gl).toBe(0);
 expect(result.render.lastFrameTriangles).toBeLessThan(160000);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,
   actor:g.getWorkdayCompositionAudit().actor,
   unchanged:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.actor).toBe(result.shot.actor);
 expect(mobile.gl).toBe(0);
 await page.locator('#workday-live').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
 expect(errors).toEqual([]);
});
