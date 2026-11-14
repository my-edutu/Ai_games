'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W15: a growing authentic settlement must not regenerate 262,144 identical
// noise texels with trigonometry every time a real family builds a cottage.
// The original river, farm parcels, resident houses, roads and market must
// still be painted in their original order on the current authoritative map.
test('W15 real village growth reuses one immutable landscape albedo base, not fake homes',async({page})=>{
 test.setTimeout(210000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getGroundSurfaceStats().rebuilds>=1,null,{timeout:90000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {world:g.metrics(),surface:g.getGroundSurfaceStats(),
   geometry:g.getGeometryAudit(),gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(initial.surface.renderer).toBe('gpu-2d-albedo');
 expect(initial.surface.baseBuilds).toBe(1);
 // The autonomous village may construct genuine homes before the browser
 // catches its first frame. Compare the same real base across all rebuilds.
 expect(initial.surface.baseReuses).toBe(initial.surface.rebuilds-1);
 expect(initial.surface.baseBytes).toBe(512*512*4);
 expect(initial.surface.gpuTextures).toBe(1);
 expect(initial.gl).toBe(0);
 let grown;
 for(let period=0;period<12;period++){
  const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>{for(let i=0;i<7200;i++)window.__tinyKingdom.step(1/30)});
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:90000});
  grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:g.metrics(),surface:g.getGroundSurfaceStats(),
    geometry:g.getGeometryAudit(),gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  });
  if(grown.world.buildings>initial.world.buildings)break;
 }
 expect(grown.world.buildings).toBeGreaterThan(initial.world.buildings);
 expect(grown.surface.homes).toBe(grown.world.buildings-2);
 expect(grown.surface.rebuilds).toBeGreaterThan(initial.surface.rebuilds);
 // Real submitted WebGL workload sample from the same 1024x640 test. This is
 // CPU wall timing (including driver stalls), never a claim of hardware FPS.
 const observed=await page.evaluate(()=>({
  renderer:window.__tinyKingdom.renderQuality().renderer,
  software:window.__tinyKingdom.getSoftwareResolutionAudit().softwareWebGL,
  frames:window.__tinyKingdom.getFrameProfile().totalFrames,
  stages:window.__tinyKingdom.getFrameProfile().stages,
  atlas:window.__tinyKingdom.getGroundSurfaceStats(),
  settlement:window.__tinyKingdom.getSettlementResidentStats(),
  world:window.__tinyKingdom.metrics()
 }));
 console.log('W15 actual representative render sample (CPU wall, not GPU FPS):',JSON.stringify(observed));
 expect(observed.frames).toBeGreaterThan(1);

 expect(grown.surface.baseBuilds).toBe(1);
 expect(grown.surface.baseReuses).toBe(grown.surface.rebuilds-1);
 expect(grown.surface.baseBytes).toBe(512*512*4);
 expect(grown.surface.gpuTextures).toBe(1);
 expect(grown.surface.roadSegments).toBe(initial.surface.roadSegments);
 expect(grown.surface.farmPlots).toBe(initial.surface.farmPlots);
 expect(grown.geometry.totalTriangles).toBeLessThan(160000);
 expect(grown.gl).toBe(0);
 const unchanged=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const prev=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:90000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   snapshot:JSON.stringify(g.exportSnapshot()),surface:g.getGroundSurfaceStats(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.snapshot).toBe(unchanged);
 expect(mobile.surface.baseBuilds).toBe(1);
 expect(mobile.surface.baseReuses).toBe(grown.surface.baseReuses);
 expect(mobile.width).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
