'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G066: visible facades and shingle courses must survive the strict growth LOD.
// The dedicated 120-day SwiftShader workflow remains the actual long-run budget gate.
test('G066 compact homes keep roof courses, framed openings and gable timber without changing authority',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.metrics().citizens===12);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {lod:g.getVillageVisualLod(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.lod.compactHomes).toBe(0);
 expect(initial.lod.compactRoofTiles).toBe(0);
 expect(initial.lod.compactFramedWindows).toBe(0);
 expect(initial.lod.compactGableBraces).toBe(0);
 const growth=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>{
  const g=window.__tinyKingdom,l=g.getVillageVisualLod();
  return l.compactHomes>0&&l.homes===g.metrics().buildings-2;
 },null,{timeout:30000});
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
   snapshot:JSON.stringify(g.exportSnapshot()),stats:g.renderStats()};
 });
 expect(grown.snapshot).toBe(growth);
 expect(grown.lod.compactRoofTiles).toBe(24*grown.lod.compactHomes);
 expect(grown.lod.compactFramedWindows).toBe(4*grown.lod.compactHomes);
 expect(grown.lod.compactGableBraces).toBe(4*grown.lod.compactHomes);
 expect(grown.lod.detailedHomes+grown.lod.compactHomes).toBe(grown.lod.homes);
 expect(grown.geometry.totalTriangles).toBeLessThan(160000);
 expect(grown.geometry.static.invalidComponents).toBe(0);
 expect(grown.geometry.static.invalidNormals).toBe(0);
 expect(grown.geometry.static.outOfBounds).toBe(0);
 // Camera changes cannot cause re-upload of the static town or alter rules.
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.35,pitch:.66,zoom:29,focus:[0,0]}));
 await page.waitForTimeout(300);
 const camera=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {snapshot:JSON.stringify(g.exportSnapshot()),stats:g.renderStats()};
 });
 expect(camera.snapshot).toBe(grown.snapshot);
 expect(camera.stats.staticGpuUploads).toBe(grown.stats.staticGpuUploads);
 expect(errors).toEqual([]);
});
