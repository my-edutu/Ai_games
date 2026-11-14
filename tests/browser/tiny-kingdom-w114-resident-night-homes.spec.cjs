'use strict';
// Source-matched 1024px + 390px genuine-night test. Screenshots only count
// as real evidence AFTER this Playwright test completes; not a hardware FPS test.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W114 genuine reached-household lighting survives one resident VBO '+viewport.width,
 async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const found=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   // Advance the ACTUAL deterministic world; never synthesize households.
   let ticks=0;
   while(ticks++<24*30*5){
    if(g.getOccupiedHouseholds().length&&
      g.skyConditions(g.getState().state.t).daylight<.48)break;
    g.step(1/30);
   }
   const occupied=g.getOccupiedHouseholds();
   if(occupied.length){
    const lot=occupied[0].lot;
    g.setCamera({focus:[lot[0],lot[1]],yaw:.65,pitch:.45,zoom:12});
   }
   g.setNightHomesResidencyForTesting(false);
   return {occupied:occupied.length,ticks,
    day:g.getState().state.t,frame:g.getFrameProfile().totalFrames};
  });
  expect(found.occupied).toBeGreaterThan(0);
  await page.waitForFunction(previous=>
   window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   found.frame,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    light:g.getHouseholdLightAudit(),threshold:g.getHouseholdThresholdRenderStats?.()};
  });
  expect(original.light.litHomes).toBeGreaterThan(0);
  const previous=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
   g.setNightHomesResidencyForTesting(true);return frame;
  });
  await page.waitForFunction(previous=>{
   const g=window.__tinyKingdom;
   return g.getFrameProfile().totalFrames>previous&&
    g.getNightHomesResidencyAudit().active;
  },previous,{timeout:110000});
  const resident=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {snapshot:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    light:g.getHouseholdLightAudit(),audit:g.getNightHomesResidencyAudit(),
    errors:gl?.getError()??0,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(resident.snapshot).toBe(original.snapshot);
  expect(resident.triangles).toBe(original.triangles);
  expect(resident.light).toEqual(original.light);
  expect(resident.audit.homes).toBe(original.light.litHomes);
  expect(resident.audit.buffers).toBe(1);
  expect(resident.audit.maxBuffers).toBe(1);
  expect(resident.audit.meshFloats).toBeGreaterThan(0);
  expect(resident.audit.meshFloats).toBeLessThanOrEqual(resident.audit.budgetFloats);
  expect(resident.audit.authorityModified).toBe(false);
  expect(resident.errors).toBe(0);
  expect(resident.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w114',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w114/night-home-'+viewport.width+'.png'});
 });
}
