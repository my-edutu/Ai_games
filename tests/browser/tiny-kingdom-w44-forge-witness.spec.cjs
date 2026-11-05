'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test.use({video:'on'});
test('W44 real smith documentary exposes autonomous forge work at desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:85000});
 await page.locator('#pause').click();
 const stage=await page.evaluate(()=>{
  const game=window.__tinyKingdom;game.reset();
  let smith=null,ticks=0;
  for(;ticks<30000;ticks++){
   game.step(1/30);
   if(ticks%12===0){
    smith=game.getForgeCraftCycleAudit().workers.find(w=>w.phase==='hammering'&&w.reachableAnvil);
    if(smith)break;
   }
  }
  return {smith,ticks,snapshot:JSON.stringify(game.exportSnapshot())};
 });
 expect(stage.smith,'An actual smith must navigate to the real forge').toBeTruthy();
 const control=page.locator('#forge-follow');
 await expect(control).toBeVisible();
 await control.click();
 await expect(control).toHaveAttribute('aria-pressed','true');
 const first=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getForgeWitnessAudit(),
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  cameraFrames:window.__tinyKingdom.getFrameProfile().totalFrames
 }));
 expect(first.snapshot,'Spectator controls may not change authority').toBe(stage.snapshot);
 expect(first.audit.source).toBe('real-forge-witness-camera');
 expect(first.audit.active).toBe(true);
 expect(first.audit.citizen).toBe(stage.smith.citizen);
 expect(first.audit.phase).toBe('hammering');
 expect(first.audit.following).toBe(true);
 expect(first.audit.anvil).toEqual(stage.smith.anvil);
 expect(first.audit.camera.zoom).toBeLessThan(13.5);
 expect(first.audit.realCitizen).toBe(true);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  first.cameraFrames,{timeout:85000});
 fs.mkdirSync('artifacts/tiny-kingdom-w44',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w44/genuine-smith-desktop.png'});
 const mobileBefore=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  mobileBefore,{timeout:85000});
 const mobile=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getForgeWitnessAudit(),
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  overflow:document.documentElement.scrollWidth>390,
  triangles:window.__tinyKingdom.getGeometryAudit().totalTriangles,
  gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
 }));
 expect(mobile.audit.active).toBe(true);
 expect(mobile.audit.citizen).toBe(stage.smith.citizen);
 expect(mobile.snapshot).toBe(stage.snapshot);
 expect(mobile.overflow).toBe(false);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w44/genuine-smith-390px.png'});
 // Verify touch discovery without horizontal swiping: the key workday
 // action must be visible in the first 390px strip, not hidden offscreen.
 await page.evaluate(()=>{document.querySelector('.world-tour').scrollLeft=0});
 const controlBounds=await control.boundingBox();
 expect(controlBounds,'Forge watch control must exist in initial mobile strip').toBeTruthy();
 expect(controlBounds.x).toBeGreaterThanOrEqual(-1);
 expect(controlBounds.x+controlBounds.width).toBeLessThanOrEqual(391);
 // Capture actual resumed WebGL movement and authentic in-game time; a
 // paused screenshot alone is not evidence of a living workday.
 const liveStart=await page.evaluate(()=>({
  time:window.__tinyKingdom.getState().state.t,
  frames:window.__tinyKingdom.getFrameProfile().totalFrames
 }));
 await page.locator('#pause').click();
 await page.waitForFunction(start=>{
  const g=window.__tinyKingdom;
  return g.getState().state.t>start.time+.13 &&
   g.getFrameProfile().totalFrames>start.frames+2;
 },liveStart,{timeout:70000});
 const moving=await page.evaluate(()=>({
  real:window.__tinyKingdom.getForgeWitnessAudit(),
  frames:window.__tinyKingdom.getFrameProfile().totalFrames,
  time:window.__tinyKingdom.getState().state.t
 }));
 expect(moving.real.citizen).toBe(stage.smith.citizen);
 expect(moving.real.following).toBe(true);
 expect(moving.real.realCitizen).toBe(true);
 await page.screenshot({path:'artifacts/tiny-kingdom-w44/genuine-smith-moving-390px.png'});
 console.log('W44 genuine moving forge',JSON.stringify({timeDelta:moving.time-liveStart.time,
  newFrames:moving.frames-liveStart.frames}));
 console.log('W44 actual forge spectator',JSON.stringify({
  actor:mobile.audit.citizen,phase:mobile.audit.phase,
  zoom:mobile.audit.camera.zoom,triangles:mobile.triangles,ticks:stage.ticks
 }));
});
