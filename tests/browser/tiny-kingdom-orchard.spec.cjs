'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('Cultivated orchard has original 3D branch anatomy without forest-count or save pollution',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getOrchardVisualStats().trees===9);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {o:g.getOrchardVisualStats(),forest:g.getForestVisualStats(),
   mesh:g.getGeometryAudit(),save:JSON.stringify(g.exportSnapshot())};
 });
 expect(before.o).toEqual({trees:9,forks:27,tipTwigs:27,crownLobes:36,
  fruit:45,season:0,meshTriangles:3726});
 expect(before.forest.renderedTrees).toBe(74);
 expect(before.mesh.totalTriangles).toBeLessThan(160000);
 for(const mesh of [before.mesh.static,before.mesh.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents).toBe(0);
  expect(mesh.invalidNormals).toBe(0);
  expect(mesh.invalidColors).toBe(0);
  expect(mesh.outOfBounds).toBe(0);
 }
 await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[-27,10],yaw:1.08,pitch:.44,zoom:11}));
 await page.waitForTimeout(150);
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {o:g.getOrchardVisualStats(),forest:g.getForestVisualStats(),save:JSON.stringify(g.exportSnapshot())};
 });
 expect(after.o).toEqual(before.o);
 expect(after.forest).toEqual(before.forest);
 expect(after.save).toBe(before.save);
 expect(errors).toEqual([]);
});
