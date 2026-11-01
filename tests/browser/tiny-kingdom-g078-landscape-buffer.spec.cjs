'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G094: verify the independently cached landscape after G089 reclaimed more
// than 11k distant tree triangles; historic 65k/60k minimums are not invariants.
test('G078 maintains an independent landscape GPU buffer across actual autonomous cottage construction',async({page})=>{
 expect(html).toMatch(/const landscapeBuffer=gl\.createBuffer\(\)/);
 expect(html).toMatch(/drawVisibleStaticChunks\(landscapeBuffer,landscapeChunkRanges,planes\)/);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {metrics:g.metrics(),stats:g.renderStats(),landscape:g.getLandscapeCacheStats(),
   geometry:g.getGeometryAudit(),storage:g.getScenicMeshStorage(),
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(before.stats.landscapeGpuUploads).toBe(1);
 expect(before.landscape.triangles).toBeGreaterThan(
  before.stats.terrainCacheTriangles*4);
 expect(before.landscape.triangles).toBeLessThan(before.geometry.static.triangles);
 expect(before.storage.segments).toBe(2);
 expect(before.geometry.static.floats).toBe(before.storage.floats);
 const built=await page.evaluate(initialBuildings=>{
  const g=window.__tinyKingdom;let steps=0;
  while(g.metrics().buildings<=initialBuildings&&steps<7200){g.step(1/30);steps++}
  return {steps,metrics:g.metrics(),authority:JSON.stringify(g.exportSnapshot())};
 },before.metrics.buildings);
 expect(built.metrics.buildings).toBeGreaterThan(before.metrics.buildings);
 expect(built.steps).toBeLessThan(7200);
 await page.waitForFunction(previous=>window.__tinyKingdom?.renderStats().scenicMeshRebuilds>previous,
  before.stats.scenicMeshRebuilds,{timeout:45000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {stats:g.renderStats(),landscape:g.getLandscapeCacheStats(),
   geometry:g.getGeometryAudit(),storage:g.getScenicMeshStorage(),
   authority:JSON.stringify(g.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()||0};
 });
 expect(after.authority).toBe(built.authority);
 expect(after.stats.landscapeGpuUploads).toBe(before.stats.landscapeGpuUploads);
 expect(after.stats.staticGpuUploads).toBeGreaterThan(before.stats.staticGpuUploads);
 expect(after.landscape.rebuilds).toBe(before.landscape.rebuilds);
 expect(after.landscape.reuses).toBeGreaterThan(before.landscape.reuses);
 expect(after.storage.floats).toBe(after.geometry.static.floats);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 for(const part of ['static','dynamic']){
  expect(after.geometry[part].aligned).toBe(true);
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(after.geometry[part][key]).toBe(0);
 }
 expect(after.glError).toBe(0);
 expect(errors).toEqual([]);
});
