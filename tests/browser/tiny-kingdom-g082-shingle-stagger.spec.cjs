'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G082 RED-before: the real compact roof uses three longitudinal courses,
// but all four cross-roof tile edges currently line up in a rigid grid.
// Alternating stagger must preserve four tightly joined tiles per course,
// both slopes, 24 shingles/compact home and the strict grown scene budget.
test('G082 staggered compact roof shingles break aligned seams without new geometry or authority changes',async({page})=>{
 test.setTimeout(90000);
 const house=html.split('function compactHouse(')[1]?.split('function cottageDetails(')[0]||'';
 expect(house).toContain('const oddCourseShift=course%2');
 expect(house).toContain('col===0?0:col/4+oddCourseShift');
 expect(house).toContain('col===3?1:(col+1)/4+oddCourseShift');
 const faults=[];page.on('pageerror',error=>faults.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderStats().lastFrameTriangles>10000));
 await page.locator('#pause').click();
 const original=await page.evaluate(()=>({
  saved:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  lod:window.__tinyKingdom.getVillageVisualLod()
 }));
 expect(original.lod.compactHomes).toBe(0);
 expect(original.lod.compactStaggeredCourses).toBe(0);
 const grown=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)game.step(1/30);
  return JSON.stringify(game.exportSnapshot());
 });
 await page.waitForFunction(()=>window.__tinyKingdom.getVillageVisualLod().compactHomes>0,
  null,{timeout:30000});
 const proof=await page.evaluate(()=>{
  const game=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {saved:JSON.stringify(game.exportSnapshot()),lod:game.getVillageVisualLod(),
   geometry:game.getGeometryAudit(),glError:gl?.getError()||0,metrics:game.metrics()};
 });
 expect(proof.saved).toBe(grown);
 expect(proof.lod.compactStaggeredCourses).toBe(2*proof.lod.compactHomes);
 expect(proof.lod.compactRoofTiles).toBe(24*proof.lod.compactHomes);
 expect(proof.lod.detailedHomes+proof.lod.compactHomes).toBe(proof.lod.homes);
 expect(proof.geometry.totalTriangles).toBeLessThan(160000);
 expect(proof.geometry.static.invalidComponents).toBe(0);
 expect(proof.geometry.static.invalidNormals).toBe(0);
 expect(proof.geometry.dynamic.invalidComponents).toBe(0);
 expect(proof.glError).toBe(0);
 expect(proof.metrics.citizens).toBeGreaterThanOrEqual(12);
 expect(faults).toEqual([]);
});
