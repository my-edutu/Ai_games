'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G144 source-first RED: the older game has no real-household entrance audit.
// This test requires genuine browser execution before any green claim.
test('G144 real homeward footsteps, occupied doorways and bounded software quality',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<Math.ceil(14.07*30);i++)g.step(1/30);
  return {rhythm:g.getDailyRhythmAudit(),quality:g.getSoftwareResolutionAudit(),
   threshold:g.getHouseholdThresholdAudit()};
 });
 expect(first.rhythm.shift).toBe('night-rest');
 expect(first.rhythm.counts.returning).toBeGreaterThan(0);
 expect(first.threshold.count).toBeLessThanOrEqual(first.rhythm.counts.resting);
 expect(first.quality.scale).toBeGreaterThanOrEqual(.45);
 expect(first.quality.scale).toBeLessThanOrEqual(.65);
 expect(first.quality.samples).toBeLessThan(16);
 const walk=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const positions=()=>new Map(g.exportSnapshot().payload.people.map(p=>
   [p.name,{x:p.x,z:p.z,phase:p.phase,activity:p.activity}]));
  const tracks=new Map();
  for(let i=0;i<9;i++){
   const previous=positions();
   g.step(1/30);
   const current=positions();
   for(const [name,p] of previous){
    const q=current.get(name);
    if(p.activity!=='Returning home at dusk'||q?.activity!=='Returning home at dusk')continue;
    if(!tracks.has(name))tracks.set(name,{distance:0,phase:0});
    const row=tracks.get(name);
    row.distance+=Math.hypot(q.x-p.x,q.z-p.z);
    row.phase+=q.phase-p.phase;
   }
  }
  return [...tracks.values()];
 });
 expect(walk.length).toBeGreaterThan(0);
 expect(walk.some(p=>p.distance>0)).toBe(true);
 for(const p of walk)expect(Math.abs(p.phase-p.distance*2.60)).toBeLessThan(.00001);
 const night=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<8*30;i++)g.step(1/30);
  const snapshot=JSON.stringify(g.exportSnapshot());
  const audit=g.getHouseholdThresholdAudit(),rhythm=g.getDailyRhythmAudit(),
   quality=g.getSoftwareResolutionAudit();
  return {audit,rhythm,quality,unchanged:snapshot===JSON.stringify(g.exportSnapshot())};
 });
 expect(night.unchanged).toBe(true);
 expect(night.audit.count).toBeLessThanOrEqual(night.rhythm.counts.resting);
 expect(night.audit.entries.length).toBeGreaterThanOrEqual(night.audit.count);
 expect(night.audit.entries.length).toBeLessThanOrEqual(14);
 for(const home of night.audit.entries){
  expect(home.residents.length).toBeGreaterThan(0);
  expect(home.atDoor).toBe(true);
  if(home.nearCottage)expect(home.atDoor).toBe(true);
 }
 expect(night.quality.scale).toBeGreaterThanOrEqual(.45);
 expect(night.quality.scale).toBeLessThanOrEqual(.65);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(900);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
 expect(errors).toEqual([]);
});
