'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w126');
test.use({video:'on'});
test('W126 true market pickup, home return, 120 and 160 elapsed days, replay, 390px WebGL',async({page})=>{
 test.setTimeout(900000);fs.mkdirSync(dir,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const start=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {metrics:g.metrics(),ledger:g.getHouseholdProvisionAudit(),saved:g.exportSnapshot()};
 });
 expect(start.metrics.citizens).toBe(12);
 // Browser startup can already simulate an authentic market visit before
 // Pause; reconcile exact real save receipts rather than demand zero visits.
 expect(start.ledger.visits).toBe(start.saved.payload.people.reduce(
  (n,c)=>n+(c.provisionVisits||0),0));
 expect(start.ledger.createdActors).toBe(0);
 await page.screenshot({path:path.join(dir,'day1-desktop.png')});
 // Film only an authentic already-running citizen. Advance the original
 // 30Hz world, never set an activity, location or inventory for the camera.
 const witnessed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  let current=g.getHouseholdProvisionAudit();
  for(let i=0;i<5*24*30&&!current.citizens.length;i++){
   g.step(1/30);current=g.getHouseholdProvisionAudit();
  }
  const before=JSON.stringify(g.exportSnapshot());
  document.getElementById('world-watch-life').click();
  const after=JSON.stringify(g.exportSnapshot());
  return {active:current.citizens.length>0,
   citizen:current.citizens[0]?.name||null,
   selected:g.getSelectedCitizen(),following:g.getCamera().follow,
   cameraOnly:before===after,ledger:current};
 });
 expect(witnessed.active).toBe(true);
 expect(witnessed.selected).toBe(witnessed.citizen);
 expect(witnessed.following).toBe(true);
 expect(witnessed.cameraOnly).toBe(true);
 await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(dir,'real-household-errand-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(dir,'real-household-errand-mobile.png')});
 await page.setViewportSize({width:1024,height:640});
 // Keep an uncut wall-time segment of genuine game animation in the
 // Playwright video. Restore the original saved world afterward to allow
 // fair fixed-step Day-120/160 verification without film-driven authority.
 await page.evaluate(()=>{window.__tinyKingdom.setSpeed(4);document.getElementById('pause').click()});
 await page.waitForTimeout(7000);
 await page.evaluate(()=>{document.getElementById('pause').click();window.__tinyKingdom.setSpeed(0)});
 await page.screenshot({path:path.join(dir,'real-household-errand-after-motion.png')});
 await page.evaluate(save=>{
  const g=window.__tinyKingdom;g.restoreSnapshot(save);
  document.getElementById('camera-home').click();
 },start.saved);
 const five=await page.evaluate(()=>{
  const g=window.__tinyKingdom,receipts=[],lastVisits=new Map(
   g.exportSnapshot().payload.people.map(p=>[p.name,p.provisionVisits||0]));
  let maxCarrying=0,maxDisplacement=0,previous=new Map(),maxNoRoute=0;
  let seenLiveObservation=false;
  const market=g.getHouseholdProvisionAudit().market;
  for(let tick=0;tick<5*24*30;tick++){
   g.step(1/30);
   const ledger=g.getHouseholdProvisionAudit();
   maxCarrying=Math.max(maxCarrying,ledger.carrying);
   if(!seenLiveObservation&&ledger.citizens.length&&!g.getActiveDeliveries().length){
    const before=JSON.stringify(g.exportSnapshot());
    document.getElementById('world-watch-life').click();
    seenLiveObservation=g.getSelectedCitizen()===ledger.citizens[0].name&&
      g.getCamera().follow===true&&JSON.stringify(g.exportSnapshot())===before;
   }
   const people=g.exportSnapshot().payload.people;
   for(const p of people){
    const prior=previous.get(p.name);
    if(prior)maxDisplacement=Math.max(maxDisplacement,
      Math.hypot(p.x-prior[0],p.z-prior[1]));
    previous.set(p.name,[p.x,p.z]);
    const visits=p.provisionVisits||0,earlier=lastVisits.get(p.name)||0;
    if(visits>earlier)receipts.push({name:p.name,dist:Math.hypot(
      p.x-market[0],p.z-market[1]),food:p.provisions,visits,townFood:g.metrics().food});
    lastVisits.set(p.name,visits);
    if(p.activity==='Waiting for a safe route')maxNoRoute++;
   }
  }
  return {receipts,maxCarrying,maxDisplacement,maxNoRoute,seenLiveObservation,ledger:g.getHouseholdProvisionAudit(),
    metrics:g.metrics(),navigation:g.getNavigation()};
 });
 expect(five.seenLiveObservation).toBe(true);
 expect(five.receipts.length).toBeGreaterThan(0);
 // W178 test-first contract: positions sampled AFTER the 30Hz tick can move
 // past the real dock threshold. The authoritative handoff itself must record
 // the exact contact BEFORE the homeward route is activated. Never relax
 // the actual 1.35m pickup legality check or invent a market visit.
 expect(five.receipts.every(r=>r.food>0&&r.townFood>=0)).toBe(true);
 expect(five.ledger.contactHistory?.length).toBeGreaterThan(0);
 expect(five.ledger.contactHistory.every(c=>
  c.distance<=1.35&&c.provisionsAfter>0&&c.townFoodAfter>=0&&
  c.visits>0&&Number.isFinite(c.atHour)&&
  ['verified-farmer-receipt','communal-market-stock'].includes(c.source)&&
  c.position.length===2&&c.market.length===2&&
  Math.abs(Math.hypot(c.position[0]-c.market[0],c.position[1]-c.market[1])-c.distance)<1e-7
 )).toBe(true);
 for(const receipt of five.receipts)expect(five.ledger.contactHistory.some(c=>
  c.citizen===receipt.name&&c.visits===receipt.visits)).toBe(true);
 expect(five.maxDisplacement).toBeLessThan(.24);
 expect(five.maxCarrying).toBeLessThanOrEqual(1);
 expect(five.maxNoRoute).toBeLessThan(5*24*30);
 expect(five.ledger.visits).toBe(start.ledger.visits+five.receipts.length);
 expect(five.navigation.every(r=>Number.isFinite(r.position[0])&&Number.isFinite(r.position[1]))).toBe(true);
 let day120=null,day160=null;
 const advance=async(days)=>{
  for(let chunk=0;chunk<days;chunk+=5){
   await page.evaluate(ticks=>{
    const g=window.__tinyKingdom;
    for(let t=0;t<ticks;t++)g.step(1/30);
   },Math.min(5,days-chunk)*24*30);
  }
  return page.evaluate(()=>{
   const g=window.__tinyKingdom,snapshot=g.exportSnapshot();
   return {metrics:g.metrics(),snapshot,ledger:g.getHouseholdProvisionAudit(),
     invalid:g.getNavigation().filter(p=>!Number.isFinite(p.position[0])||
      !Number.isFinite(p.position[1])||p.remaining>100),
     cache:g.routeCacheMetrics()};
  });
 };
 day120=await advance(115); // exact 120 elapsed days since Day-1
 expect(day120.metrics.citizens).toBe(28);
 expect(day120.metrics.buildings).toBeGreaterThanOrEqual(37);
 expect(day120.invalid).toEqual([]);
 expect(day120.cache.entries).toBeLessThanOrEqual(1800);
 day160=await advance(40);
 expect(day160.metrics.citizens).toBe(28);
 expect(day160.ledger.visits).toBeGreaterThan(day120.ledger.visits);
 expect(day160.invalid).toEqual([]);
 expect(day160.cache.entries).toBeLessThanOrEqual(1800);
 await page.evaluate(save=>window.__tinyKingdom.restoreSnapshot(save),day120.snapshot);
 const replay=await advance(40);
 expect(JSON.stringify(replay.snapshot)).toBe(JSON.stringify(day160.snapshot));
 await page.evaluate(save=>window.__tinyKingdom.restoreSnapshot(save),day120.snapshot);
 await page.evaluate(()=>document.getElementById('camera-home').click());
 await page.waitForTimeout(1000); // render exact restored authority
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const scene=await page.evaluate(()=>window.__tinyKingdom.getGeometryAudit());
 await page.screenshot({path:path.join(dir,'day120-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(900);
 await page.screenshot({path:path.join(dir,'day120-mobile.png')});
 const final=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {saved:JSON.stringify(g.exportSnapshot()),overflow:document.documentElement.scrollWidth,
   error:document.getElementById('world').getContext('webgl')?.getError()??-1,
   frame:g.renderStats()};
 });
 expect(final.saved).toBe(before);
 expect(final.overflow).toBeLessThanOrEqual(390);
 expect(final.error).toBe(0);
 expect(scene.totalTriangles).toBeLessThan(160000);
 expect(errors).toEqual([]);
 fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify({
  initial:start.metrics,firstFive:five,day120:{metrics:day120.metrics,ledger:day120.ledger},
  day160:{metrics:day160.metrics,ledger:day160.ledger},
  replayChecksum:replay.snapshot.checksum,exactReplay:true,sceneTriangles:scene.totalTriangles,
  mobileOverflow:final.overflow,lastFrame:final.frame},null,2));
});
