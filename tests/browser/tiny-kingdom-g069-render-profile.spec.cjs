'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G069: measured CPU/submission stage timing, not inferred GPU FPS.
// Profile samples must be bounded and cannot affect the authoritative world.
test('G069 samples bounded actual render-phase CPU times and preserves deterministic authority',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 const exists=await page.evaluate(()=>typeof window.__tinyKingdom.getFrameProfile==='function');
 expect(exists).toBe(true);
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>0);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {profile:g.getFrameProfile(),authority:JSON.stringify(g.exportSnapshot()),
    camera:g.getCamera(),render:g.renderStats()};
 });
 expect(before.profile).toMatchObject({kind:'cpu-wall-submission',units:'ms',sampleLimit:48});
 expect(before.profile.samples).toBeGreaterThanOrEqual(1);
 expect(before.profile.samples).toBeLessThanOrEqual(48);
 const stages=['simulationAndSky','staticGeometry','dynamicGeometry','drawSubmission','total'];
 const verify=profile=>{
  expect(profile.samples).toBeGreaterThanOrEqual(1);
  expect(profile.samples).toBeLessThanOrEqual(profile.sampleLimit);
  for(const name of stages){
   const row=profile.stages[name];
   for(const part of ['p50','p95','p99','worst']){
    expect(Number.isFinite(row[part])).toBe(true);
    expect(row[part]).toBeGreaterThanOrEqual(0);
   }
   expect(row.p50).toBeLessThanOrEqual(row.p95);
   expect(row.p95).toBeLessThanOrEqual(row.p99);
   expect(row.p99).toBeLessThanOrEqual(row.worst);
  }
  const last=profile.latest;
  const sum=stages.slice(0,4).reduce((total,key)=>total+last[key],0);
  expect(Math.abs(sum-last.total)).toBeLessThan(.2);
  expect(last.total).toBeGreaterThanOrEqual(0);
 };
 verify(before.profile);
 await page.evaluate(camera=>window.__tinyKingdom.setCamera({
  yaw:camera.yaw+.21,pitch:camera.pitch,zoom:camera.zoom,focus:camera.focus
 }),before.camera);
 await page.waitForFunction(previous=>window.__tinyKingdom.getFrameProfile().totalFrames>previous,
  before.profile.totalFrames,{timeout:30000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {profile:g.getFrameProfile(),authority:JSON.stringify(g.exportSnapshot()),
   render:g.renderStats(),geometry:g.getGeometryAudit(),
   glError:document.getElementById('world').getContext('webgl')?.getError()||0};
 });
 verify(after.profile);
 expect(after.profile.totalFrames).toBeGreaterThan(before.profile.totalFrames);
 expect(after.authority).toBe(before.authority);
 expect(after.render.staticGpuUploads).toBe(before.render.staticGpuUploads);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 expect(after.glError).toBe(0);
 expect(errors).toEqual([]);
});
