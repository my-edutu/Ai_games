'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Gauntlet 047 conifers emit authored volumetric branch-and-needle crowns without modifying civilization',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>typeof window.__tinyKingdom?.getForestVisualStats==='function' &&
   window.__tinyKingdom.getForestVisualStats().needleBoughs>0);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const save=JSON.stringify(g.exportSnapshot());
  const visual=g.getForestVisualStats();
  const clearance=g.getFarmTreeClearanceStats();
  const mesh=g.getGeometryAudit();
  const uploads=g.renderStats().staticGpuUploads;
  g.setCamera({focus:[10,-5],yaw:1.5,pitch:.4,zoom:14});
  const after=g.getForestVisualStats();
  return {visual,after,clearance,mesh,uploads,
    noAuthorityChange:save===JSON.stringify(g.exportSnapshot())};
 });
 expect(result.visual.sourceTrees).toBe(result.clearance.forestSourceCount);
 expect(result.visual.renderedTrees).toBe(result.clearance.renderedForestCount);
 expect(result.visual.conifers).toBeGreaterThan(15);
 expect(result.visual.deciduous).toBeGreaterThan(15);
 expect(result.visual.renderedTrees).toBe(result.visual.conifers+result.visual.deciduous);
 expect(result.visual.needleBoughs).toBe(result.visual.conifers*32);
 expect(result.visual.needleFanTriangles).toBe(result.visual.needleBoughs*8);
 expect(result.visual.branchTriangles).toBe(result.visual.needleBoughs*8);
 expect(result.visual.crownColors).toBeGreaterThanOrEqual(4);
 expect(result.after).toEqual(result.visual);
 expect(result.noAuthorityChange).toBe(true);
 expect(result.mesh.totalTriangles).toBeLessThan(160000);
 for(const part of [result.mesh.static,result.mesh.dynamic]){
  expect(part.aligned).toBe(true);
  expect(part.invalidComponents).toBe(0);
  expect(part.invalidNormals).toBe(0);
  expect(part.invalidColors).toBe(0);
  expect(part.outOfBounds).toBe(0);
 }
 expect(errors).toEqual([]);
});
