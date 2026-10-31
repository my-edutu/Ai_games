'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('G053 focus selects an unobstructed citizen camera, tracks named citizens and restores original view without changing civilization',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getState().people.length===12);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {snapshot:JSON.stringify(g.exportSnapshot()),camera:g.getCamera(),subject:g.getState().people[0]};
 });
 await page.locator('#focus').click();
 const observed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {camera:g.getCamera(),plan:g.getCitizenCameraPlan(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(observed.camera.follow).toBe(true);
 expect(observed.camera.zoom).toBeLessThanOrEqual(14);
 expect(observed.camera.pitch).toBeGreaterThan(.65);
 expect(observed.camera.focus).toEqual([before.subject.x,before.subject.z]);
 expect(observed.plan.blockers).toBeLessThanOrEqual(observed.plan.originalBlockers);
 expect(observed.plan.blockers).toBe(0);
 expect(observed.plan.target[1]).toBeGreaterThan(0);
 expect(observed.snapshot).toBe(before.snapshot);
 expect(await page.locator('#focus').getAttribute('aria-pressed')).toBe('true');
 // One browser task exercises every starting name without 12 costly render frames.
 const candidates=await page.evaluate(()=>{
  const results=[];
  for(let i=0;i<12;i++){
   const g=window.__tinyKingdom,p=g.getCitizenCameraPlan();
   results.push({name:g.getSelectedCitizen(),blockers:p.blockers,original:p.originalBlockers,cam:g.getCamera()});
   document.getElementById('cycleCitizen').click();
  }
  return results;
 });
 expect(new Set(candidates.map(x=>x.name)).size).toBe(12);
 for(const row of candidates){
  expect(row.blockers).toBeLessThanOrEqual(row.original);
  expect(row.blockers).toBe(0);
  expect(row.cam.zoom).toBeLessThan(14);
  expect(row.cam.follow).toBe(true);
 }
 await page.locator('#focus').click();
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {camera:g.getCamera(),plan:g.getCitizenCameraPlan(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(after.camera).toEqual(before.camera);
 expect(after.plan).toBeNull();
 expect(after.snapshot).toBe(before.snapshot);
 expect(await page.locator('#focus').getAttribute('aria-pressed')).toBe('false');
 expect(errors).toEqual([]);
});