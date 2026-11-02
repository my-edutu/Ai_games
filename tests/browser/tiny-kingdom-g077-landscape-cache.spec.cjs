'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G077 climate-scoped landscape prefix is reused when an autonomous cottage appears',async({page})=>{
 // Contract must fail before the source fix, not merely pass when a city never grows.
 expect(html).toMatch(/let landscapeMeshCache=null/);
 expect(html).toMatch(/landscapeMeshKey===nextTerrainKey/);
 expect(html).toMatch(/getLandscapeCacheStats:/);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().scenicMeshRebuilds>=1);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {buildings:g.metrics().buildings,scenery:g.renderStats().scenicMeshRebuilds,
   landscape:g.getLandscapeCacheStats(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(before.landscape.rebuilds).toBe(1);
 expect(before.landscape.reuses).toBe(0);
 const grown=await page.evaluate((initialBuildings)=>{
  const g=window.__tinyKingdom;
  let steps=0;
  while(g.metrics().buildings<=initialBuildings&&steps<7200){g.step(1/30);steps++}
  return {steps,buildings:g.metrics().buildings,after:JSON.stringify(g.exportSnapshot())};
 },before.buildings);
 expect(grown.buildings).toBeGreaterThan(before.buildings);
 expect(grown.steps).toBeLessThan(7200);
 await page.waitForFunction(initial=>window.__tinyKingdom?.renderStats().scenicMeshRebuilds>initial,before.scenery,{timeout:45000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const gl=document.getElementById('world').getContext('webgl');
  return {landscape:g.getLandscapeCacheStats(),scenery:g.renderStats().scenicMeshRebuilds,
   geometry:g.getGeometryAudit(),snapshot:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()||0};
 });
 expect(after.landscape.reuses).toBeGreaterThanOrEqual(1);
 expect(after.landscape.rebuilds).toBeLessThan(after.scenery);
 expect(after.landscape.triangles).toBeGreaterThan(25000);
 expect(after.snapshot).toBe(grown.after);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 for(const key of ['static','dynamic'])for(const field of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
  expect(after.geometry[key][field]).toBe(0);
 expect(after.glError).toBe(0);
 expect(errors).toEqual([]);
});
