'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G081: after growth, lightweight cottages should not present blank long
// facades to the settlement camera. Four paired, framed side windows per
// compact home preserve the same population and deterministic world.
test('G081 grown compact houses have visible paired windows on both long facades within budget',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderStats().lastFrameTriangles>10000));
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {world:JSON.stringify(g.exportSnapshot()),lod:g.getVillageVisualLod()};
 });
 expect(before.lod.compactHomes).toBe(0);
 expect(before.lod.compactSideWindows).toBe(0);
 const grownSnapshot=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>{
  const g=window.__tinyKingdom;
  return g.getVillageVisualLod().compactHomes>0;
 },null,{timeout:30000});
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
   saved:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()||0,
   activeCitizens:g.metrics().citizens,structures:g.metrics().buildings};
 });
 expect(proof.saved).toBe(grownSnapshot);
 expect(proof.lod.compactSideWindows).toBe(4*proof.lod.compactHomes);
 expect(proof.lod.compactSideWindows).toBeGreaterThan(0);
 expect(proof.lod.detailedHomes+proof.lod.compactHomes).toBe(proof.lod.homes);
 expect(proof.geometry.totalTriangles).toBeLessThan(160000);
 expect(proof.geometry.static.aligned).toBe(true);
 expect(proof.geometry.static.invalidComponents).toBe(0);
 expect(proof.geometry.dynamic.invalidComponents).toBe(0);
 expect(proof.glError).toBe(0);
 expect(proof.activeCitizens).toBeGreaterThanOrEqual(12);
 expect(proof.structures).toBeGreaterThanOrEqual(14);
 expect(errors).toEqual([]);
});
