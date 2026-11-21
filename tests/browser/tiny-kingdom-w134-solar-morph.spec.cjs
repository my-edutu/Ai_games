'use strict';
// W134 real Chromium/WebGL acceptance probe; software raster is diagnostic,
// NEVER physical hardware FPS. Uses only the actual game and its real clock.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W134 live original shadows interpolate across real solar stage '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:160000});
  const setup=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   // The authentic new-world clock begins at 07:00. Advance with the
   // real authoritative step, not a fake sun scene or altered renderer.
   for(let i=0;i<14;i++)g.step(1/30);
   return {beforeFrame:g.getFrameProfile().totalFrames,
    state:g.getState().state.t,people:g.getState().people.map(p=>p.name)};
  });
  await page.waitForFunction(frame=>{
   const g=window.__tinyKingdom;
   return g.getFrameProfile().totalFrames>frame&&
    g.getShadowCacheAudit().gpuResident&&
    g.getShadowCacheAudit().activeBucket===14;
  },setup.beforeFrame,{timeout:155000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {shadow:g.getShadowCacheAudit(),geo:g.getGeometryAudit(),
    frame:g.getFrameProfile().totalFrames};
  });
  expect(before.shadow.gpuResident).toBe(true);
  expect(before.shadow.activeBucket).toBe(14);
  expect(before.geo.totalTriangles).toBeLessThan(160000);
  const crossed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.step(.05); // 07:28 to 07:31; cross the 07:30 boundary via a genuine step
   return {state:g.getState().state.t,frame:g.getFrameProfile().totalFrames};
  });
  await page.waitForFunction(({frame})=>{
   const g=window.__tinyKingdom;
   const audit=g.getShadowCacheAudit();
   return g.getFrameProfile().totalFrames>frame&&audit.activeBucket===15;
  },{frame:crossed.frame},{timeout:155000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {shadow:g.getShadowCacheAudit(),geometry:g.getGeometryAudit(),
    state:g.getState().state.t,people:g.getState().people.map(p=>p.name),
    glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  // With active preserved stage buffers the real GPU interpolates the full
  // original shadow mesh in ONE draw. If residency is insufficient, FAIL
  // rather than claiming motion quality without any GPU transition.
  expect(after.shadow.gpuResident).toBe(true);
  expect(after.shadow.activeBucket).toBe(15);
  expect(after.shadow.blendedFrames).toBeGreaterThan(0);
  expect(after.shadow.currentMorphWeight).toBeGreaterThan(0);
  expect(after.shadow.priorResidentTriangles).toBeGreaterThan(0);
  expect(after.shadow.activeResidentTriangles).toBe(
   after.shadow.priorResidentTriangles);
  expect(after.people).toEqual(setup.people);
  expect(after.geometry.totalTriangles).toBeLessThan(160000);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W134-live-solar-motion-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W134-honest-clock-gpu-audit-'+viewport.width,
   {body:Buffer.from(JSON.stringify({setup,before,crossed,after},null,2)),
    contentType:'application/json'});
 });
}
