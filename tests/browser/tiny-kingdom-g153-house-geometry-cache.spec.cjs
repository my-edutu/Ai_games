'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G153 performance workstream: growing ORIGINAL homes keep exactly their
// deterministic 3D geometry. Rebuild only unseen lots/detail tiers instead of
// regenerating every resident's roof, windows and masonry on each new home.
test('G153 grown autonomous town reuses bounded per-lot geometry across seasons and growth',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 // Keep WebGL presenting after each manually advanced 10-day state: the
 // paused renderer intentionally freezes identical frames and cannot be used
 // as a progress signal. Speed zero prevents extra simulation during captures.
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 const base=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getHouseGeometryCacheAudit(),
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 expect(base.audit.entries).toBeGreaterThan(0);
 expect(base.audit.entries).toBeLessThanOrEqual(base.audit.maxEntries);
 expect(base.audit.cachedFloats).toBeLessThanOrEqual(base.audit.floatBudget);
 expect(base.audit.cachedBytes).toBe(base.audit.cachedFloats*4);
 expect(base.audit.freshBuilds).toBeGreaterThanOrEqual(12);
 const observations=[];
 for(let n=0;n<12;n++){
  const prior=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>{for(let i=0;i<7200;i++)window.__tinyKingdom.step(1/30)});
  await page.waitForFunction(p=>window.__tinyKingdom.getFrameProfile().totalFrames>p,prior,{timeout:90000});
  observations.push(await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getHouseGeometryCacheAudit(),world:g.metrics(),
    geometry:g.getGeometryAudit(),gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  }));
 }
 const end=observations.at(-1);
 expect(end.world.day).toBeGreaterThanOrEqual(120);
 expect(end.world.citizens).toBeGreaterThanOrEqual(28);
 expect(end.world.buildings).toBeGreaterThanOrEqual(37);
 expect(end.audit.reuses).toBeGreaterThan(0);
 expect(end.audit.entries).toBeLessThanOrEqual(end.audit.maxEntries);
 expect(end.audit.cachedFloats).toBeLessThanOrEqual(end.audit.floatBudget);
 expect(end.audit.evictions).toBeGreaterThanOrEqual(0);
 expect(end.geometry.totalTriangles).toBeLessThan(160000);
 for(const row of observations)expect(row.gl).toBe(0);
 const truthBeforeRestore=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const lod=g.getVillageVisualLod(),street=g.getStreetMorphologyStats(),
   facade=g.getCottageFacadeStats();
  return {staticTriangles:g.getGeometryAudit().static.triangles,
   citizens:g.metrics().citizens,
   visualCitizens:lod.detailedCitizens+lod.compactCitizens,
   homes:lod.homes,detailedHomes:lod.detailedHomes,compactHomes:lod.compactHomes,
   roofTiles:lod.compactRoofTiles,street,facade};
 });
 console.log('G153 actual growth/cache sample:',JSON.stringify({
  day:end.world.day,citizens:end.world.citizens,homes:end.world.buildings,
  cachedLots:end.audit.entries,reuses:end.audit.reuses,
  freshlyBuiltLots:end.audit.freshBuilds,cachedBytes:end.audit.cachedBytes
 }));
 const state=await page.evaluate(()=>{
  const g=window.__tinyKingdom,save=g.exportSnapshot();
  const before=JSON.stringify(save),restored=g.restoreSnapshot(save);
  return {before,after:JSON.stringify(g.exportSnapshot()),restored,
   empty:g.getHouseGeometryCacheAudit()};
 });
 expect(state.restored).toBe(true);
 expect(state.before).toBe(state.after);
 expect(state.empty.entries).toBe(0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom.getHouseGeometryCacheAudit().entries>0,null,{timeout:90000});
 const truthAfterRestore=await page.evaluate(()=>{
  const g=window.__tinyKingdom,lod=g.getVillageVisualLod();
  return {staticTriangles:g.getGeometryAudit().static.triangles,
   citizens:g.metrics().citizens,
   visualCitizens:lod.detailedCitizens+lod.compactCitizens,
   homes:lod.homes,detailedHomes:lod.detailedHomes,compactHomes:lod.compactHomes,
   roofTiles:lod.compactRoofTiles,street:g.getStreetMorphologyStats(),
   facade:g.getCottageFacadeStats()};
 });
 // Dynamic geometry includes render-tier/viewport-dependent citizen and
 // atmospheric detail: exact triangle totals need NOT match desktop vs 390px.
 // The unchanged real static town, all houses/counters and every authentic
 // displayed citizen MUST survive restore, however.
 expect(truthBeforeRestore.citizens).toBe(28);
 expect(truthAfterRestore.visualCitizens).toBe(truthAfterRestore.citizens);
 expect(truthAfterRestore).toEqual(truthBeforeRestore);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=390)).toBe(true);
 expect(errors).toEqual([]);
});
