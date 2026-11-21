'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W73 source/test-first contract: conservatively combine contiguous visible
// scenic groups separated by only tiny 100%-outside-frustum cells. No fake
// villagers, hidden architecture, simulation changes or inaccurate draw counts.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W73 original visible town remains complete with bounded scenic draw batching '+viewport.width,async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:120000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   g.setCamera({yaw:2.35,pitch:.86,zoom:31,focus:[1,5]});
   g.setStaticBatchBridgingForTesting(false);
   return JSON.stringify(g.exportSnapshot());
  });
  await page.waitForFunction(()=>
   window.__tinyKingdom.getScenicVisibilityStats().batchMode==='strict',
   null,{timeout:120000});
  const strict=await page.evaluate(()=>window.__tinyKingdom.getScenicVisibilityStats());
  await page.evaluate(()=>window.__tinyKingdom.setStaticBatchBridgingForTesting(true));
  await page.waitForFunction(()=>
   window.__tinyKingdom.getScenicVisibilityStats().batchMode==='conservative',
   null,{timeout:120000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {batch:g.getScenicVisibilityStats(),triangle:g.renderStats().lastFrameTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),errors:g.getGeometryAudit(),
    physicalActorCount:g.metrics().citizens,
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const batch=after.batch;
  expect(batch.totalDrawCalls).toBeLessThanOrEqual(strict.totalDrawCalls);
  expect(batch.totalIssuedTriangles).toBeGreaterThanOrEqual(batch.totalSubmittedTriangles);
  expect(batch.totalIssuedTriangles-batch.totalSubmittedTriangles)
   .toBe(batch.totalBridgedTriangles);
  expect(batch.totalBridgedTriangles).toBeLessThanOrEqual(batch.totalCulledTriangles);
  expect(batch.totalSavedDrawCalls).toBe(strict.totalDrawCalls-batch.totalDrawCalls);
  for(const part of [batch.landscape,batch.settlement,batch.civic]){
   expect(part.issuedTriangles).toBe(part.visibleTriangles+part.bridgedTriangles);
   expect(part.issuedTriangles).toBeLessThanOrEqual(part.visibleTriangles+part.culledTriangles);
   expect(part.drawCalls).toBeLessThanOrEqual(part.strictDrawCalls);
   expect(part.maxBridgeTriangles).toBe(384);
   expect(part.invalidRanges).toBe(0);
  }
  expect(after.triangle).toBeGreaterThan(0);
  expect(after.triangle).toBeLessThan(160000);
  expect(after.physicalActorCount).toBeGreaterThan(0);
  expect(after.snapshot).toBe(initial);
  expect(after.errors.static.invalidComponents).toBe(0);
  expect(after.errors.dynamic.invalidComponents).toBe(0);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w73',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w73/'+viewport.width+'-static-batch.json',
   JSON.stringify({viewport,source:'real-webgl',strict,batch,triangle:after.triangle},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w73/'+viewport.width+'-batched-town.png'});
 });
}
