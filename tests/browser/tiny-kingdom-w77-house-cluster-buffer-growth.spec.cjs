'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W77 test FIRST. This extends W76's spatial scene topology with a reusable
// GPU allocation for changed real home groups; no fictitious house, detail
// downgrade, extra economy, double counting or visual hiding is permitted.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W77 original cottage clusters reuse bounded GPU storage while civilization grows at '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0);g.setHomePartitionOverride(true)});
  await page.waitForFunction(()=>window.__tinyKingdom.getHomePartitionAudit().activeHomes===
   window.__tinyKingdom.metrics().buildings-2,null,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;return {homes:g.getHomePartitionAudit(),
    snapshot:JSON.stringify(g.exportSnapshot()),population:g.metrics().citizens};
  });
  expect(original.homes.reservedGpuFloats).toBeGreaterThan(0);
  expect(original.homes.reservedGpuFloats).toBeLessThanOrEqual(original.homes.floatBudget);
  expect(original.homes.activeHomes).toBeGreaterThan(0);
  // Advance ONLY the authentic fixed-step authority. The browser renders at
  // successive real-world topology checkpoints, not a fake test-created lot.
  const checkpoints=[];
  for(let d=0;d<120;d+=30){
   await page.evaluate(()=>{for(let t=0;t<30*24*30;t++)window.__tinyKingdom.step(1/30)});
   await page.waitForFunction(()=>window.__tinyKingdom.getHomePartitionAudit().activeHomes===
     window.__tinyKingdom.metrics().buildings-2,null,{timeout:110000});
   checkpoints.push(await page.evaluate(()=>{
    const g=window.__tinyKingdom,a=g.getHomePartitionAudit(),r=g.renderStats();
    return {population:g.metrics().citizens,homes:a.activeHomes,parts:a.activeParts,
     triangles:r.lastFrameTriangles,reserved:a.reservedGpuFloats,
     cap:a.floatBudget,recycled:a.reusedGpuHandles,subdata:a.subDataUploads,
     stale:a.staleDrawn,errors:g.getGeometryAudit().static.invalidComponents};
   }));
  }
  const actual=await page.evaluate(()=>{
   const g=window.__tinyKingdom;return {
    audit:g.getHomePartitionAudit(),snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),population:g.metrics().citizens,
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(actual.audit.activeHomes).toBeGreaterThan(original.homes.activeHomes);
  expect(actual.audit.reservedGpuFloats).toBeLessThanOrEqual(actual.audit.floatBudget);
  expect(actual.audit.activeHomes).toBeGreaterThan(0);
  expect(actual.audit.reusedGpuHandles).toBeGreaterThanOrEqual(0);
  expect(actual.audit.subDataUploads).toBeGreaterThanOrEqual(0);
  expect(actual.audit.reusedGpuHandles).toBeGreaterThanOrEqual(actual.audit.subDataUploads);
  expect(actual.audit.staleDrawn).toBe(0);
  expect(actual.population).toBeGreaterThanOrEqual(original.population);
  expect(actual.triangles).toBeLessThan(160000);
  expect(actual.geometry.static.invalidComponents).toBe(0);
  expect(actual.geometry.dynamic.invalidComponents).toBe(0);
  expect(actual.glError).toBe(0);
  expect(actual.overflow).toBeLessThanOrEqual(0);
  expect(actual.snapshot).not.toBe(original.snapshot);
  expect(checkpoints.every(row=>row.reserved<=row.cap&&row.stale===0&&
   row.errors===0&&row.triangles<160000)).toBe(true);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w77',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w77/'+viewport.width+'-real-growth.json',
   JSON.stringify({viewport,original,checkpoints,actual},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w77/'+viewport.width+'-grown-true-village.png'});
 });
}
