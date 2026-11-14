'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W16 Living Valley: make the original farm-to-market ground read as a
// worked-in medieval landscape. A road/market layer is cached ONCE, actual
// household foundations stamp once per real building, and neither layer
// creates an imaginary transaction, agent or structure.
test('W16 lived market lanes retain roads and real house footprints across growth at 390px',async({page})=>{
 test.setTimeout(210000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getGroundSurfaceStats().rebuilds>=1,null,{timeout:90000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {world:g.metrics(),surface:g.getGroundSurfaceStats(),snap:JSON.stringify(g.exportSnapshot())};
 });
 expect(before.surface.renderer).toBe('gpu-2d-albedo');
 expect(before.surface.groundWorkstream).toBe('physically-connected-market-w16');
 expect(before.surface.roadOverlayBuilds).toBe(1);
 expect(before.surface.houseLayerBuilds).toBe(1);
 expect(before.surface.houseStamps).toBe(before.surface.homes);
 expect(before.surface.roadOverlayReuses).toBe(before.surface.rebuilds-1);
 expect(before.surface.roadStoneCount).toBeGreaterThan(35);
 expect(before.surface.marketStoneCount).toBeGreaterThan(45);
 expect(before.surface.baseBuilds).toBe(1);
 expect(before.surface.gpuTextures).toBe(1);
 let after;
 for(let period=0;period<12;period++){
  const old=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>{for(let i=0;i<7200;i++)window.__tinyKingdom.step(1/30)});
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,old,{timeout:90000});
  after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:g.metrics(),surface:g.getGroundSurfaceStats(),
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
    scene:g.getGeometryAudit(),snapshot:JSON.stringify(g.exportSnapshot())};
  });
  if(after.world.buildings>before.world.buildings)break;
 }
 expect(after.world.buildings).toBeGreaterThan(before.world.buildings);
 expect(after.surface.houseStamps).toBe(after.surface.homes);
 expect(after.surface.houseLayerBuilds).toBe(1);
 expect(after.surface.roadOverlayBuilds).toBe(1);
 expect(after.surface.roadOverlayReuses).toBe(after.surface.rebuilds-1);
 expect(after.surface.baseBuilds).toBe(1);
 expect(after.surface.baseReuses).toBe(after.surface.rebuilds-1);
 expect(after.surface.roadStoneCount).toBe(before.surface.roadStoneCount);
 expect(after.surface.marketStoneCount).toBe(before.surface.marketStoneCount);
 expect(after.scene.totalTriangles).toBeLessThan(160000);
 expect(after.gl).toBe(0);
 const old=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,old,{timeout:90000});
 const mobile=await page.evaluate(()=>({
   width:document.documentElement.scrollWidth,screen:document.documentElement.clientWidth,
   snap:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   surface:window.__tinyKingdom.getGroundSurfaceStats(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
 }));
 expect(mobile.width).toBeLessThanOrEqual(mobile.screen);
 expect(mobile.snap).toBe(after.snapshot);
 expect(mobile.surface.roadOverlayBuilds).toBe(1);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
