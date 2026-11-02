'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G140: the same lived-in 120-day town must not rebuild and reupload its
// entire settlement whenever a season comes round again. This is render-only
// residency; citizens, jobs, house truth and replay never come from this cache.
test('G140 seasoned growing town reuses bounded physical settlement VBOs without changing actual authority',async({page})=>{
 test.setTimeout(240000);
 expect(html).toMatch(/function recallSettlementSeason\(/);
 expect(html).toMatch(/function retainSettlementSeason\(/);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {resident:g.getSettlementResidentStats(),authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(first.resident.entries).toBe(1);
 expect(first.resident.hits).toBe(0);
 const rows=[];
 // Through Day 120 the legitimate builders are still constructing houses;
 // the original game caps the town at 35 homes. Exercise another six genuine
 // ten-day seasons AFTER that cap, so a season/topology key really can recur.
 // Do not fake a climate, freeze a citizen, or patch any saved-world state.
 for(let chunk=0;chunk<18;chunk++){
  const frame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<7200;i++)g.step(1/30);
  });
  await page.waitForFunction(old=>window.__tinyKingdom.getFrameProfile().totalFrames>old,
   frame,{timeout:60000});
  rows.push(await page.evaluate(()=>{
   const g=window.__tinyKingdom,s=g.getSettlementResidentStats();
   return {day:g.metrics().day,buildings:g.metrics().buildings,
    ...s,gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  }));
 }
 expect(rows.at(-1).day).toBeGreaterThanOrEqual(180);
 for(const row of rows){
  expect(row.entries).toBeGreaterThanOrEqual(1);
  expect(row.entries).toBeLessThanOrEqual(row.maxEntries);
  expect(row.cachedFloats).toBeLessThanOrEqual(row.floatBudget);
  expect(row.cachedBytes).toBe(row.cachedFloats*4);
  expect(row.cachedKeys).toContain(row.activeKey);
  expect(row.gl).toBe(0);
 }
 expect(rows.at(-1).hits).toBeGreaterThan(0);
 const validated=await page.evaluate(()=>{
  const g=window.__tinyKingdom,snapshot=g.exportSnapshot();
  const before=JSON.stringify(snapshot),geometry=g.getGeometryAudit();
  const resident=g.getSettlementResidentStats(),metrics=g.metrics();
  const restored=g.restoreSnapshot(snapshot);
  const after=JSON.stringify(g.exportSnapshot());
  return {before,after,resident,cleared:g.getSettlementResidentStats(),
   geometry,metrics,restored};
 });
 expect(validated.before).toBe(validated.after);
 expect(validated.restored).toBe(true);
 expect(validated.cleared.entries).toBe(0);
 expect(validated.geometry.totalTriangles).toBeLessThan(160000);
 expect(validated.metrics.citizens).toBeGreaterThanOrEqual(28);
 expect(validated.metrics.buildings).toBeGreaterThanOrEqual(37);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom.getSettlementResidentStats().entries===1,null,{timeout:50000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=390)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??-1)).toBe(0);
 expect(errors).toEqual([]);
});
