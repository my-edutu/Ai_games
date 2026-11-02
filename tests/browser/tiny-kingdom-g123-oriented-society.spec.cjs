'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G123: every real occupational station must be in the worker's local
// forward frame, not a world-axis display disconnected from their actions.
// The audit is read-only; only real work() is permitted to award resources.
test('G123 genuine labor stations follow each actual worker orientation and remain deterministic',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const observations=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<30000&&!g.getActiveWorksites().some(w=>w.job==='builder');i++)g.step(1/30);
  const baseline=JSON.stringify(g.exportSnapshot());
  const work=g.getActiveWorksites();
  const audit=g.getWorksiteAlignmentAudit();
  const repeat=g.getWorksiteAlignmentAudit();
  return {baseline,work,audit,repeat,unchanged:JSON.stringify(g.exportSnapshot())===baseline};
 });
 expect(observations.work.some(w=>w.job==='builder')).toBe(true);
 expect(observations.audit).toHaveLength(observations.work.length);
 expect(observations.unchanged).toBe(true);
 expect(observations.repeat).toEqual(observations.audit);
 for(const station of observations.audit){
  expect(station.source).toBe('actual-autonomous-shift');
  expect(station.realWorker).toBe(true);
  expect(station.forwardAlignment).toBeGreaterThan(.97);
  expect(station.targetDistance).toBeGreaterThan(.35);
  expect(station.targetDistance).toBeLessThan(1.1);
  expect(station.placementDistance).toBeLessThan(.40);
  expect(Number.isFinite(station.groundHeight)).toBe(true);
  expect(station.rotatedFromWorker).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().lastFrameTriangles>0);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {scrollWidth:document.documentElement.scrollWidth,
    unchanged:JSON.stringify(g.exportSnapshot()),
    triangles:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.scrollWidth).toBeLessThanOrEqual(390);
 expect(mobile.unchanged).toBe(observations.baseline);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
