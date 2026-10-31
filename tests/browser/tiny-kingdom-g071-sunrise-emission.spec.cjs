'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G071 RED contract: the first sunrise must not rebuild/upload ~132k scenic
// triangles solely to change window and lantern illumination. Dawn lighting
// must be shader-owned and the authoritative replay must stay byte-identical.
test('G071 sunrise changes emissive glass without scenic VBO churn or changed authority',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>0);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {time:g.getState().state.t,lighting:g.getLightingProfile(g.getState().state.t),
    cache:g.renderStats(),geometry:g.getGeometryAudit(),profile:g.getFrameProfile(),
    snapshot:g.exportSnapshot(),materials:g.getMaterialSystem().materials,
    renderer:g.renderer(),gl:Boolean(document.querySelector('#world').getContext('webgl'))};
 });
 expect(before.time).toBeGreaterThanOrEqual(7);
 expect(before.time).toBeLessThan(8);
 expect(before.lighting.solar).toBeLessThan(.4375);
 expect(before.materials).toContain('WINDOW_GLOW');
 expect(before.materials).toContain('LANTERN_GLOW');
 // 50 canonical fixed steps (1h40m), enough to cross the daybreak threshold,
 // but too early in Day 1 for new homes or seasonal content to be necessary.
 await page.evaluate(()=>{for(let i=0;i<50;i++)window.__tinyKingdom.step(1/30);});
 await page.waitForFunction(prev=>window.__tinyKingdom.getFrameProfile().totalFrames>prev,
   before.profile.totalFrames,{timeout:30000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {time:g.getState().state.t,lighting:g.getLightingProfile(g.getState().state.t),
    cache:g.renderStats(),geometry:g.getGeometryAudit(),snapshot:g.exportSnapshot(),
    glError:gl?.getError()??0};
 });
 expect(after.time-before.time).toBeCloseTo(50/30,6);
 expect(after.lighting.solar).toBeGreaterThan(.4375);
 expect(after.cache.scenicMeshKey).toBe(before.cache.scenicMeshKey);
 expect(after.cache.scenicMeshRebuilds).toBe(before.cache.scenicMeshRebuilds);
 if(before.gl)expect(after.cache.staticGpuUploads).toBe(before.cache.staticGpuUploads);
 expect(after.geometry.totalTriangles).toBe(before.geometry.totalTriangles);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 expect(after.glError).toBe(0);
 // Repeat the precise same canonical steps after a validated restore: camera,
 // dawn transition and GPU material selection must not change simulation truth.
 await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),before.snapshot);
 await page.evaluate(()=>{for(let i=0;i<50;i++)window.__tinyKingdom.step(1/30);});
 const replay=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 expect(JSON.stringify(replay)).toBe(JSON.stringify(after.snapshot));
 expect(errors).toEqual([]);
});
