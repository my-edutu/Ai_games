'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Gauntlet 050 layered broadleaf micro-crowns are real, bounded and render-only',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getForestVisualStats().broadleafLobes>0);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {forest:g.getForestVisualStats(),mesh:g.getGeometryAudit(),save:JSON.stringify(g.exportSnapshot())};
 });
 const f=before.forest;
 expect(f.deciduous).toBeGreaterThan(25);
 expect(f.microCrownLobes).toBeGreaterThanOrEqual(f.deciduous*6);
 expect(f.rimLeafSprays).toBeGreaterThanOrEqual(f.deciduous*3);
 expect(f.individualLeaves).toBeGreaterThanOrEqual(f.deciduous*35);
 expect(f.broadleafLobes).toBeGreaterThan(f.microCrownLobes);
 const effectiveTriangles=before.mesh.dynamic.triangles>before.mesh.static.triangles?
   before.mesh.dynamic.triangles:before.mesh.totalTriangles;
 expect(effectiveTriangles).toBeLessThan(160000);
 for(const group of [before.mesh.static,before.mesh.dynamic]){
  expect(group.aligned).toBe(true);
  expect(group.invalidComponents).toBe(0);
  expect(group.invalidNormals).toBe(0);
  expect(group.invalidColors).toBe(0);
  expect(group.outOfBounds).toBe(0);
 }
 await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[-29,4],yaw:.95,pitch:.49,zoom:19}));
 const after=await page.evaluate(()=>({forest:window.__tinyKingdom.getForestVisualStats(),save:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
 expect(after.forest).toEqual(f);
 expect(after.save).toBe(before.save);
 expect(errors).toEqual([]);
});
