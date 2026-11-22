'use strict';
// W135 uncropped original WebGL moving forge shots at 1024px and 390px.
// Software raster validates GL continuity only, never physical hardware FPS.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W135 original forge smoke and authentic live village '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()
   ?.lastFrameTriangles>0,null,{timeout:155000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   g.setCamera({focus:[20,-15],yaw:.55,pitch:.43,zoom:13});
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(x=>window.__tinyKingdom.getFrameProfile()
   .totalFrames>x,first,{timeout:155000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom,
    gl=document.getElementById('world').getContext('webgl');
   return {live:g.getLivingVillageMotionAudit(),geometry:g.getGeometryAudit(),
    glError:gl?.getError()??-1,
    people:g.metrics().citizens,buildings:g.metrics().buildings,
    worldTime:g.getState().state.t,frame:g.getFrameProfile().totalFrames};
  });
  expect(before.live.active).toBe(true);
  expect(before.live.forgeSmokeResident).toBe(true);
  expect(before.live.forgeSmokePuffs).toBe(3);
  expect(before.live.buffers).toBe(1);
  expect(before.geometry.totalTriangles).toBeLessThan(160000);
  expect(before.glError).toBe(0);
  await info.attach('W135-real-forge-before-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  const frame=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let n=0;n<90;n++)g.step(1/30);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(x=>window.__tinyKingdom.getFrameProfile()
   .totalFrames>x,frame,{timeout:155000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom,
    gl=document.getElementById('world').getContext('webgl');
   return {live:g.getLivingVillageMotionAudit(),geometry:g.getGeometryAudit(),
    glError:gl?.getError()??-1,
    people:g.metrics().citizens,buildings:g.metrics().buildings,
    worldTime:g.getState().state.t,frame:g.getFrameProfile().totalFrames,
    viewportOverflow:document.documentElement.scrollWidth-innerWidth,
    frameStats:g.getFrameProfile()};
  });
  expect(after.live.forgeSmokeResident).toBe(true);
  expect(after.live.forgeSmokePuffs).toBe(3);
  expect(after.live.buffers).toBe(1);
  expect(after.live.draws).toBeGreaterThan(before.live.draws);
  // A genuinely built house may legitimately invalidate the civic cache.
  // No false zero-upload requirement while authoritative construction grows.
  expect(after.worldTime).toBeGreaterThan(before.worldTime);
  expect(after.people).toBeGreaterThan(0);
  expect(after.buildings).toBeGreaterThan(0);
  expect(after.geometry.totalTriangles).toBeLessThan(160000);
  expect(after.glError).toBe(0);
  expect(after.viewportOverflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W135-real-forge-after-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W135-original-game-civic-motion-audit-'+viewport.width,
   {body:Buffer.from(JSON.stringify({viewport,before,after,
    noHardwareFPSClaim:true,noIndependentA_BClaim:true},null,2)),
   contentType:'application/json'});
 });
}