'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G084: grown compact village households must not become blank plaster
// boxes on the long facades. Eight single-sided timber quads per home
// (four per wall) are a bounded 16-triangle addition per compact home.
// Presentation only: all authoritative citizens/snapshots remain untouched.
test('G084 compact long-side timber framing stays visible, bounded and replay-neutral',async({page})=>{
 test.setTimeout(90000);
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>10000);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const saved=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>window.__tinyKingdom.getVillageVisualLod().compactHomes>0,
  null,{timeout:30000});
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {saved:JSON.stringify(g.exportSnapshot()),lod:g.getVillageVisualLod(),
   mesh:g.getGeometryAudit(),glError:gl?.getError()||0,metrics:g.metrics()};
 });
 expect(proof.saved).toBe(saved);
 expect(initial).not.toBe(saved);
 expect(proof.lod.compactHomes).toBeGreaterThan(0);
 expect(proof.lod.compactSideTimberQuads).toBe(8*proof.lod.compactHomes);
 expect(proof.lod.compactSideWindows).toBe(4*proof.lod.compactHomes);
 expect(proof.lod.detailedHomes+proof.lod.compactHomes).toBe(proof.lod.homes);
 expect(proof.mesh.totalTriangles).toBeLessThan(160000);
 expect(proof.mesh.static.aligned).toBe(true);
 expect(proof.mesh.static.invalidComponents).toBe(0);
 expect(proof.mesh.static.invalidNormals).toBe(0);
 expect(proof.mesh.dynamic.invalidComponents).toBe(0);
 expect(proof.glError).toBe(0);
 expect(proof.metrics.citizens).toBeGreaterThanOrEqual(12);
 expect(faults).toEqual([]);
});
