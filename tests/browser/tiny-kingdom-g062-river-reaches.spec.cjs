'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G062 original river source/outlet continue as tapered geometry without altering autonomous authority',async({page})=>{
 const faults=[];page.on('pageerror',error=>faults.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const actual=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const reach=g.getOuterRiverReachStats();
  const original=g.waterStats(),mesh=g.getGeometryAudit();
  g.setCamera({focus:[-44,23],zoom:22,pitch:.50,yaw:.78});
  const after=JSON.stringify(g.exportSnapshot());
  return {reach,original,mesh,unchanged:before===after};
 });
 expect(actual.reach.sides).toBe(2);
 expect(actual.reach.segmentsPerSide).toBe(8);
 expect(actual.reach.waterTriangles).toBe(2*8*6*2);
 expect(actual.reach.bankTriangles).toBe(2*8*2*2*2);
 expect(actual.reach.totalTriangles).toBe(320);
 expect(actual.reach.westernTip).toBeCloseTo(-46,10);
 expect(actual.reach.easternTip).toBeCloseTo(46,10);
 expect(actual.reach.centerWidth).toBeCloseTo(1.8,10);
 expect(actual.reach.tipWidth).toBeCloseTo(.08,10);
 expect(actual.original.segments).toBe(105);
 expect(actual.original.waterTriangles).toBe(1260);
 expect(actual.original.bankTriangles).toBe(840);
 expect(actual.mesh.totalTriangles).toBeGreaterThanOrEqual(159500);
 expect(actual.mesh.totalTriangles).toBeLessThan(160000);
 for(const mesh of [actual.mesh.static,actual.mesh.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents+mesh.invalidNormals+mesh.invalidColors+mesh.outOfBounds).toBe(0);
 }
 expect(actual.unchanged).toBe(true);
 expect(faults).toEqual([]);
});
