'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G088: identical clay shingles across the grown settlement erase the
// age/material differences needed to read a living medieval village.
// World-space house coordinates, not authority RNG or frame time, pick one
// of four bounded roof palettes; the old triangle geometry must remain.
test('G088 grown compact cottages carry stable diverse roof families at zero geometry or authority cost',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>window.__tinyKingdom?.getVillageVisualLod().compactHomes>0);
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
    authority:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()||0};
 });
 expect(result.authority).toBe(initial);
 expect(result.lod.compactHomes).toBeGreaterThan(0);
 expect(result.lod.compactRoofPaletteCounts).toHaveLength(4);
 expect(result.lod.compactRoofPaletteCounts.reduce((a,b)=>a+b,0)).toBe(result.lod.compactHomes);
 expect(result.lod.compactRoofPaletteCounts.filter(n=>n>0).length).toBeGreaterThanOrEqual(3);
 expect(result.lod.compactRoofTiles).toBe(result.lod.compactHomes*24);
 expect(result.geometry.totalTriangles).toBeLessThan(160000);
 for(const group of ['static','dynamic']){
  expect(result.geometry[group].aligned).toBe(true);
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(result.geometry[group][key]).toBe(0);
 }
 expect(result.glError).toBe(0);
 expect(errors).toEqual([]);
});
