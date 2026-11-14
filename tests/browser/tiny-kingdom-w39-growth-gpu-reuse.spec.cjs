'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W39 is a performance architecture safety floor inside the same Living Valley
// workstream. No extra cottages, reduced jobs, fake visual LOD or world edits.
// A growing town must not retain WebGL buffers of obsolete *smaller* towns.
test('W39 growing town retires obsolete GPU generations and reuses bounded buffers',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getSettlementResidentStats().entries>=1,null,{timeout:90000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 const g0=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 const observations=[];
 for(let n=0;n<12;n++){
  const before=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>{for(let j=0;j<7200;j++)window.__tinyKingdom.step(1/30)});
  await page.waitForFunction(b=>window.__tinyKingdom.getFrameProfile().totalFrames>b,before,{timeout:90000});
  const row=await page.evaluate(()=>{
   const g=window.__tinyKingdom,r=g.getSettlementResidentStats();
   return {day:g.metrics().day,buildings:g.metrics().buildings,r,
    geom:g.getGeometryAudit(),gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    snapshot:JSON.stringify(g.exportSnapshot())};
  });
  expect(row.gl).toBe(0);
  expect(row.geom.totalTriangles).toBeLessThan(160000);
  expect(row.r.cachedFloats).toBeLessThanOrEqual(row.r.floatBudget);
  expect(row.r.cachedGpuFloats).toBeLessThanOrEqual(row.r.floatBudget);
  expect(row.r.staleTopologyEntries).toBe(0);
  // W172: with independently growing homes, civic resident topologies track
  // the immutable founding lots, not the new total house count. Still reject
  // truly stale founding-town geometry; populated homes use separate VBOs.
  expect(row.r.cachedKeys.every(key=>key.split(':').at(-1)===row.r.activeKey.split(':').at(-1))).toBe(true);
  observations.push(row);
 }
 const end=observations.at(-1);
 expect(end.buildings).toBeGreaterThan(35);
 expect(end.r.bufferReuses).toBeGreaterThan(0);
 expect(end.r.staleTopologyDisposals+end.r.bufferReuses).toBeGreaterThan(0);
 expect(end.r.entries).toBeLessThanOrEqual(end.r.maxEntries);
 expect(end.snapshot).toBe(JSON.stringify(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())));
 await page.setViewportSize({width:390,height:844});
 const cursor=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.85,pitch:.52,zoom:23,focus:[0,0]}));
 await page.waitForFunction(b=>window.__tinyKingdom.getFrameProfile().totalFrames>b,cursor,{timeout:90000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
 const authority=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 expect(JSON.stringify(authority)).toBe(end.snapshot);
 // Clear-and-inspect in ONE browser task. An intervening animation frame
 // legitimately repopulates the render-only GPU cache after restore.
 const restored=await page.evaluate(snapshot=>{
  const g=window.__tinyKingdom,done=g.restoreSnapshot(snapshot);
  return {done,entries:g.getSettlementResidentStats().entries,
   authority:JSON.stringify(g.exportSnapshot())};
 },authority);
 expect(restored.done).toBe(true);
 expect(restored.entries).toBe(0);
 expect(restored.authority).toBe(end.snapshot);
 expect(errors).toEqual([]);
 console.log('W39 GROWTH GPU-LIFETIME AUDIT',JSON.stringify(observations.map(row=>({
  day:row.day,buildings:row.buildings,entries:row.r.entries,
  cpuFloats:row.r.cachedFloats,gpuFloats:row.r.cachedGpuFloats,
  reused:row.r.bufferReuses,staleDisposed:row.r.staleTopologyDisposals
 }))));
});