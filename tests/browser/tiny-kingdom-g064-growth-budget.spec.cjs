'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G064 expanded settlement retains detailed playable core, hero characters and sub-160k real mesh',async({page})=>{
 test.setTimeout(120000);
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {snapshot:JSON.stringify(g.exportSnapshot()),cottage:g.getCottageFacadeStats(),mesh:g.getGeometryAudit()};
 });
 expect(initial.cottage.homes).toBe(13);
 expect(initial.mesh.totalTriangles).toBeLessThan(160000);
 const state=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  const saved=g.exportSnapshot(),before=JSON.stringify(saved);
  g.setCamera({focus:[0,0],zoom:22,pitch:.52,yaw:.85});
  return {metrics:g.metrics(),saved,unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(state.metrics.citizens).toBeGreaterThanOrEqual(25);
 expect(state.metrics.buildings).toBeGreaterThanOrEqual(30);
 expect(state.unchanged).toBe(true);
 await page.waitForFunction(()=>window.__tinyKingdom?.getGrowthLodStats?.().compactHomes>10,null,{timeout:35000});
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom,world=JSON.stringify(g.exportSnapshot());
  const out={mesh:g.getGeometryAudit(),lod:g.getGrowthLodStats(),
   authorityUnchanged:JSON.stringify(g.exportSnapshot())===world};
  g.setCamera({focus:[-16,-8],zoom:12,pitch:.42,yaw:.8});
  return out;
 });
 expect(grown.lod.detailedHomes).toBe(13);
 expect(grown.lod.compactHomes).toBeGreaterThanOrEqual(15);
 expect(grown.lod.heroCitizens).toBeGreaterThan(0);
 expect(grown.lod.proxyCitizens).toBeGreaterThan(0);
 expect(grown.lod.heroCitizens+grown.lod.proxyCitizens).toBe(state.metrics.citizens);
 expect(grown.mesh.totalTriangles).toBeLessThan(160000);
 expect(grown.authorityUnchanged).toBe(true);
 for(const mesh of [grown.mesh.static,grown.mesh.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents+mesh.invalidNormals+mesh.invalidColors+mesh.outOfBounds).toBe(0);
 }
 expect(faults).toEqual([]);
});
