'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W76 RED contract before implementation. Repartition ONLY already existing
// real cottages: same materials/triangles, same people, seeded snapshot, and
// actual landscape/market. Force partitioning in software WebGL for functional
// correctness, never claim a hardware FPS gain from CI's SwiftShader.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W76 independently resident real-home clusters preserve the scene at '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const base=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {snapshot:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens,
    triangles:g.renderStats().lastFrameTriangles,burgage:g.getBurgageMaterialAudit()};
  });
  await page.evaluate(()=>window.__tinyKingdom.setHomePartitionOverride(true));
  await page.waitForFunction(()=>window.__tinyKingdom.getHomePartitionAudit().activeHomes===
   window.__tinyKingdom.metrics().buildings-2,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom,parts=g.getHomePartitionAudit(),vis=g.renderStats();
   return {snapshot:JSON.stringify(g.exportSnapshot()),parts,
    buildings:g.metrics().buildings,citizens:g.metrics().citizens,
    triangles:vis.lastFrameTriangles,burgage:g.getBurgageMaterialAudit(),
    geometry:g.getGeometryAudit(),
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.parts.enabled).toBe(true);
  expect(result.parts.activeHomes).toBe(result.buildings-2);
  expect(result.parts.activeParts).toBeGreaterThan(1);
  expect(result.parts.triangles).toBeGreaterThan(0);
  expect(result.parts.cachedFloats).toBeLessThanOrEqual(result.parts.floatBudget);
  expect(result.parts.staleDrawn).toBe(0);
  expect(result.snapshot).toBe(base.snapshot);
  expect(result.citizens).toBe(base.citizens);
  expect(result.triangles).toBe(base.triangles);
  expect(result.burgage).toEqual(base.burgage);
  expect(result.geometry.static.invalidComponents).toBe(0);
  expect(result.geometry.dynamic.invalidComponents).toBe(0);
  expect(result.glError).toBe(0);
  expect(result.triangles).toBeLessThan(160000);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  // W76 growth gate: actual fixed-step construction builds the original
  // grown town. Force the alternative renderer to preserve EVERY house,
  // including changed detailed/compact LOD and seasonal VBO eviction.
  const grownSnapshot=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<120*24*30;i++)g.step(1/30);
   return JSON.stringify(g.exportSnapshot());
  });
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   return g.getHomePartitionAudit().activeHomes===g.metrics().buildings-2&&
     g.getHomePartitionAudit().activeParts>1;
  },null,{timeout:110000});
  const grownPartition=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {homes:g.getHomePartitionAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),
    census:g.metrics(),mesh:g.getGeometryAudit(),material:g.getBurgageMaterialAudit()};
  });
  expect(grownPartition.homes.activeHomes).toBe(grownPartition.census.buildings-2);
  expect(grownPartition.census.buildings).toBeGreaterThan(base.burgage.homes+2);
  expect(grownPartition.homes.cachedFloats).toBeLessThanOrEqual(grownPartition.homes.floatBudget);
  expect(grownPartition.mesh.static.invalidComponents).toBe(0);
  expect(grownPartition.homes.staleDrawn).toBe(0);
  expect(grownPartition.triangles).toBeLessThan(160000);
  expect(grownPartition.snapshot).toBe(grownSnapshot);
  fs.mkdirSync('artifacts/tiny-kingdom-w76',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w76/'+viewport.width+'-grown-partition.png'});
  await page.evaluate(()=>window.__tinyKingdom.setHomePartitionOverride(false));
  await page.waitForFunction(()=>window.__tinyKingdom.getHomePartitionAudit().activeParts===0,null,{timeout:110000});
  const grownOriginal=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {triangles:g.renderStats().lastFrameTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),material:g.getBurgageMaterialAudit()};
  });
  expect(grownOriginal.triangles).toBe(grownPartition.triangles);
  expect(grownOriginal.material).toEqual(grownPartition.material);
  expect(grownOriginal.snapshot).toBe(grownSnapshot);
  fs.mkdirSync('artifacts/tiny-kingdom-w76',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w76/'+viewport.width+'-partition-audit.json',
   JSON.stringify({base,result},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w76/'+viewport.width+'-true-homes.png'});
 });
}
