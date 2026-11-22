'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w180');
test.use({video:'on'});
test('W180 original real-home nourishment restores continuing market visits without fabricated meals',async({page})=>{
 test.setTimeout(480000);fs.mkdirSync(dir,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const milestones=[];
 for(let day=1;day<=40;day++){
  await page.evaluate(()=>{const g=window.__tinyKingdom;for(let i=0;i<720;i++)g.step(1/30)});
  if([10,20,30,40].includes(day))milestones.push(await page.evaluate(()=>{
   const g=window.__tinyKingdom,s=g.exportSnapshot().payload;
   return {worldDay:Math.floor(s.state.t/24),food:s.state.food,visits:g.getHouseholdProvisionAudit().visits,
    residents:s.people.length,homes:s.city.length,
    averageHunger:s.people.reduce((n,p)=>n+p.hunger,0)/s.people.length};
  }));
 }
 const mid=milestones[1],later=milestones[3];
 expect(later.food).toBeGreaterThan(48);
 expect(later.residents).toBeGreaterThanOrEqual(17);
 expect(later.homes).toBeGreaterThanOrEqual(30);
 // W179 original failed to sustain real market visits after hunger trapped
 // citizens in a long abandoned rest trip; prove continued true pickups.
 expect(later.visits-mid.visits).toBeGreaterThanOrEqual(5);
 const measured=await page.evaluate(()=>{
  const g=window.__tinyKingdom,p=g.exportSnapshot().payload,ledger=g.getHouseholdProvisionAudit();
  return {ledger,visits:p.people.reduce((n,c)=>n+(c.provisionVisits||0),0),
   cache:g.routeCacheMetrics(),snapshot:g.exportSnapshot()};
 });
 expect(measured.ledger.visits).toBe(measured.visits);
 expect(measured.ledger.createdActors).toBe(0);
 expect(measured.ledger.createdFood).toBe(0);
 expect(measured.ledger.contactHistory.length).toBeGreaterThan(0);
 expect(measured.ledger.contactHistory.every(c=>c.distance<=1.35&&
  c.provisionsAfter>0&&c.townFoodAfter>=0)).toBe(true);
 expect(measured.cache.entries).toBeLessThanOrEqual(1800);
 // Restoring a genuine current-version world and re-running an entire day
 // must reproduce all citizens, food, shopping and checksum byte-for-byte.
 const advance=()=>page.evaluate(()=>{
  const g=window.__tinyKingdom;for(let i=0;i<720;i++)g.step(1/30);
  return g.exportSnapshot();
 });
 const next=await advance();
 await page.evaluate(saved=>window.__tinyKingdom.restoreSnapshot(saved),measured.snapshot);
 expect(await advance()).toEqual(next);
 await page.evaluate(saved=>window.__tinyKingdom.restoreSnapshot(saved),measured.snapshot);
 await page.waitForTimeout(900);
 await page.screenshot({path:path.join(dir,'true-day40-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(900);
 await page.screenshot({path:path.join(dir,'true-day40-mobile.png')});
 const end=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,
   webgl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   triangles:g.getGeometryAudit().totalTriangles,snapshot:g.exportSnapshot()};
 });
 expect(end.snapshot).toEqual(measured.snapshot);
 expect(end.width).toBeLessThanOrEqual(390);
 expect(end.webgl).toBe(0);
 expect(end.triangles).toBeLessThan(160000);
 expect(errors).toEqual([]);
 fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify({
  stages:milestones,marketContacts:measured.ledger.contactHistory,
  replaySameSource:true,triangles:end.triangles,mobileWidth:end.width,errors
 },null,2));
});
