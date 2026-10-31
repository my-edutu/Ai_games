'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G055 genuine per-vertex soft shadows use weather-coherent turf without changing simulation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getShadowGradientAudit));
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.shadowStats().triangles>1000);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {world:JSON.stringify(g.exportSnapshot()),
   shadow:g.getShadowGradientAudit(),geometry:g.getGeometryAudit(),
   sun:g.shadowStats()};
 });
 expect(before.shadow.triangles).toBeGreaterThan(1000);
 expect(before.shadow.inspected).toBe(before.shadow.triangles);
 expect(before.shadow.gradientTriangles).toBeGreaterThan(before.shadow.triangles*.95);
 expect(before.shadow.wrongMaterials).toBe(0);
 expect(before.geometry.totalTriangles).toBeLessThan(160000);
 for(const m of [before.geometry.static,before.geometry.dynamic]){
  expect(m.aligned).toBe(true);expect(m.invalidComponents).toBe(0);
  expect(m.invalidNormals).toBe(0);expect(m.invalidColors).toBe(0);expect(m.outOfBounds).toBe(0);
 }
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:1.5,pitch:.4,zoom:14,focus:[10,-5]}));
 await page.waitForTimeout(180);
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {world:JSON.stringify(g.exportSnapshot()),shadow:g.getShadowGradientAudit()};
 });
 expect(after.world).toBe(before.world);
 expect(after.shadow).toEqual(before.shadow);
 expect(errors).toEqual([]);
});
