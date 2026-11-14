'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G087: grown compact homes should not become twenty-five near-identical
// pitched boxes. A sparse render-only dormer provides a readable roofline
// and window on alternating home variants, without changing game authority.
test('G087 grown compact roofs have sparse modeled dormer silhouettes inside the 120-day budget',async({page})=>{
 test.setTimeout(90000);
 const source=html.split('function compactHouse(x,z,variant){')[1]?.split('\nfunction cottageDetails(')[0]||'';
 expect(source).toContain('compactDormerTriangles');
 expect(source).toContain('compactDormers');
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>10000);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let tick=0;tick<10*24*30;tick++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>{
  const l=window.__tinyKingdom?.getVillageVisualLod();
  return l&&l.compactHomes>0&&l.compactDormers>0;
 },null,{timeout:30000});
 const audit=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
   after:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()||0};
 });
 expect(audit.after).toBe(before);
 expect(audit.lod.compactHomes).toBeGreaterThan(0);
 expect(audit.lod.compactDormers).toBeGreaterThan(0);
 expect(audit.lod.compactDormers).toBeLessThan(audit.lod.compactHomes);
 expect(audit.lod.compactDormerTriangles).toBeGreaterThanOrEqual(audit.lod.compactDormers*18);
 expect(audit.lod.compactDormerTriangles).toBeLessThanOrEqual(audit.lod.compactDormers*36);
 expect(audit.geometry.totalTriangles).toBeLessThan(160000);
 expect(audit.geometry.static.invalidComponents+audit.geometry.dynamic.invalidComponents).toBe(0);
 expect(audit.geometry.static.invalidNormals+audit.geometry.dynamic.invalidNormals).toBe(0);
 expect(audit.glError).toBe(0);
 expect(errors).toEqual([]);
});
