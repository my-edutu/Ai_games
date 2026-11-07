'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/* G134: the grown settlement was still regenerating the complete guildhall,
 * forge, market, high street, river crossing and farm on each new home. The
 * same static civic landmark geometry may be reused across construction,
 * but may NOT be copied into snapshots, RNG, citizen paths or resource output.
 * Seasonal and day/night keys must invalidate the right visual resources.
 * This is a performance foundation, not Manor Lords visual approval. */
test('G134 real autonomous construction reuses bounded civic landmark meshes without changing authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().scenicMeshRebuilds>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom,snap=JSON.stringify(g.exportSnapshot());
  return {cache:g.getCivicSceneryCacheStats(),stats:g.renderStats(),
   metrics:g.metrics(),geometry:g.getGeometryAudit(),
   authority:snap,readOnly:snap===JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.readOnly).toBe(true);
 expect(initial.cache.builds).toBeGreaterThanOrEqual(1);
 expect(initial.cache.entries).toBe(1);
 expect(initial.cache.activeKey).toBeTruthy();
 expect(initial.cache.cachedFloats).toBeGreaterThan(10000);
 expect(initial.cache.cachedFloats).toBeLessThanOrEqual(initial.cache.floatBudget);
 // First-frame warmup may already recall this same unchanged civic scene.
 expect(initial.cache.reuses).toBeGreaterThanOrEqual(0);
 const grown=await page.evaluate(initialBuildings=>{
  const g=window.__tinyKingdom;let steps=0;
  while(g.metrics().buildings<=initialBuildings&&steps<7200){g.step(1/30);steps++;}
  return {steps,metrics:g.metrics(),authority:JSON.stringify(g.exportSnapshot())};
 },initial.metrics.buildings);
 expect(grown.metrics.buildings).toBeGreaterThan(initial.metrics.buildings);
 expect(grown.steps).toBeLessThan(7200);
 await page.waitForFunction(previous=>
  window.__tinyKingdom?.renderStats().scenicMeshRebuilds>previous,
  initial.stats.scenicMeshRebuilds,{timeout:75000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {cache:g.getCivicSceneryCacheStats(),stats:g.renderStats(),
   geometry:g.getGeometryAudit(),guild:g.getGuildhallVisualStats?.(),
   market:g.getMarketQuarterStats?.(),authority:JSON.stringify(g.exportSnapshot()),
   glError:gl?.getError()??0};
 });
 expect(after.authority).toBe(grown.authority);
 expect(after.cache.activeKey).toBe(initial.cache.activeKey);
 expect(after.cache.builds).toBe(initial.cache.builds);
 expect(after.cache.reuses).toBeGreaterThan(initial.cache.reuses);
 expect(after.cache.entries).toBeLessThanOrEqual(2);
 expect(after.cache.cachedFloats).toBeLessThanOrEqual(after.cache.floatBudget);
 expect(after.stats.staticGpuUploads).toBeGreaterThan(initial.stats.staticGpuUploads);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 expect(after.geometry.static.aligned).toBe(true);
 expect(after.geometry.dynamic.aligned).toBe(true);
 for(const area of ['static','dynamic']){
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(after.geometry[area][key]).toBe(0);
 }
 expect(after.glError).toBe(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
