'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G089: G088 left only 449 triangles of startup headroom and software rendering
// far below its target. Reclaim meaningful forest geometry WITHOUT deleting a
// tree, collapsing near-town crowns or modifying one authoritative citizen.
// An actual mesh budget assertion complements accounting counters.
test('G089 preserves every rendered forest tree while recovering >6k real scene triangles',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const baseline=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  return {world:JSON.stringify(game.exportSnapshot()),
   forest:game.getForestVisualStats(),lod:game.getForestLodStats(),
   geometry:game.getGeometryAudit(),
   glError:document.querySelector('#world').getContext('webgl')?.getError()||0};
 });
 expect(baseline.lod.renderedTrees).toBe(baseline.forest.renderedTrees);
 expect(baseline.lod.renderedTrees).toBeGreaterThanOrEqual(70);
 expect(baseline.lod.nearTrees).toBeGreaterThan(3);
 expect(baseline.lod.midTrees).toBeGreaterThan(3);
 expect(baseline.lod.farTrees).toBeGreaterThan(20);
 expect(baseline.lod.nearTrees+baseline.lod.midTrees+baseline.lod.farTrees)
  .toBe(baseline.lod.renderedTrees);
 expect(baseline.lod.reclaimedTriangles).toBeGreaterThan(7500);
 // G089 preserved >7.5k actual reclaimed forest triangles. G096 now
 // adds a whole inhabited high-street precinct to that original forest.
 // Measure the combined REAL mesh under the 160k global safety limit
 // with >=1k buffer, rather than freezing a forest-only 153.5k target.
 // Neither count is a frame-rate or experience-quality result.
 expect(baseline.geometry.totalTriangles).toBeLessThan(159000);
 expect(baseline.forest.broadleafSpecies.reduce((a,b)=>a+b,0))
  .toBe(baseline.forest.deciduous);
 expect(baseline.forest.broadleafLobes).toBeGreaterThanOrEqual(baseline.forest.deciduous*4);
 expect(baseline.forest.individualLeaves).toBeGreaterThanOrEqual(baseline.forest.deciduous*15);
 for(const mesh of ['static','dynamic']){
  expect(baseline.geometry[mesh].aligned).toBe(true);
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(baseline.geometry[mesh][key]).toBe(0);
 }
 const after=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  game.setCamera({focus:[-24,15],zoom:28,pitch:.56,yaw:1.17});
  return {world:JSON.stringify(game.exportSnapshot()),lod:game.getForestLodStats()};
 });
 expect(after.world).toBe(baseline.world);
 expect(after.lod).toEqual(baseline.lod);
 expect(baseline.glError).toBe(0);
 expect(errors).toEqual([]);
});
