'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G065 preserves complete city population under growth while bounding visual detail and replay',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getState().people.length===12);
 await page.locator('#pause').click();
 const baseline=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {lod:g.getVillageVisualLod(),world:JSON.stringify(g.exportSnapshot())};
 });
 expect(baseline.lod).toMatchObject({detailedHomes:12,compactHomes:0,detailedCitizens:12,compactCitizens:0});
 const future=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return {world:JSON.stringify(g.exportSnapshot()),metrics:g.metrics()};
 });
 await page.waitForFunction(()=>{
  const v=window.__tinyKingdom.getVillageVisualLod(),g=window.__tinyKingdom.metrics();
  return v.homes===g.buildings-2&&v.population===g.citizens&&v.compactHomes>0&&v.compactCitizens>0;
 },null,{timeout:30000});
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom;return {lod:g.getVillageVisualLod(),audit:g.getGeometryAudit(),
   world:JSON.stringify(g.exportSnapshot()),selected:g.getSelectedCitizen()};
 });
 expect(grown.lod.homes).toBeGreaterThan(12);
 expect(grown.lod.population).toBeGreaterThan(12);
 expect(grown.lod.detailedHomes+grown.lod.compactHomes).toBe(grown.lod.homes);
 expect(grown.lod.detailedCitizens+grown.lod.compactCitizens).toBe(grown.lod.population);
 expect(grown.lod.detailedHomes).toBeLessThanOrEqual(8);
 expect(grown.lod.detailedCitizens).toBeLessThanOrEqual(9);
 expect(grown.world).toEqual(future.world);
 expect(grown.audit.static.invalidComponents).toBe(0);
 expect(grown.audit.dynamic.invalidComponents).toBe(0);
 // Actual 120-day moving WebGL budget is enforced by the dedicated soak CI.
 expect(errors).toEqual([]);
});
