'use strict';
// W141: only real autonomous production and parcels in the LIVE playable game.
// Film the uninterrupted 3D worker and market, then an independent 390px
// interactive view. Browser video is not a physical GPU performance result.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
async function renderOriginal(page){
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(done)));
 await page.waitForTimeout(85);
}
async function findRealHarvest(page){
 return page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.setSpeed(0);
  for(let i=0;i<30000;i++){
   g.step(1/30);
   if(i%9)continue;
   const harvest=g.getHarvestInteractionAudit();
   if(harvest.active&&harvest.progress>.12&&harvest.progress<.70){
    const pre=JSON.stringify(g.exportSnapshot());
    const subject=g.watchRealGrainJourney();
    return {harvest,subject,worldUnchanged:pre===JSON.stringify(g.exportSnapshot())};
   }
  }
  return null;
 });
}
test('W141 actual farmer shipment remains one tracked receipt: film original desktop game',
 async({page},info)=>{
 test.setTimeout(570000);
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 const initial=await findRealHarvest(page);
 expect(initial,'No real farmer harvesting; do not synthesize a harvest').toBeTruthy();
 expect(initial.worldUnchanged).toBe(true);
 expect(initial.subject?.producer).toBe(initial.harvest.citizen);
 await renderOriginal(page);
 await info.attach('w141-real-harvest.png',{body:await page.screenshot(),contentType:'image/png'});
 const citizen=initial.harvest.citizen;
 const freight=await page.evaluate(name=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<100000;i++){
   g.step(1/30);
   if(i%9)continue;
   const d=g.getActiveDeliveries().find(x=>x.citizen===name&&x.job==='farmer'&&
    x.resource==='food'&&x.escrowed);
   if(d)return d;
  }
  return null;
 },citizen);
 expect(freight,'Tracked farmer did not actually produce a food shipment').toBeTruthy();
 await renderOriginal(page);
 let audit=await page.evaluate(()=>window.__tinyKingdom.getRealGrainJourneyAudit());
 expect(audit.deliveryId).toBe(freight.id);
 expect(['hauling','unloading','received']).toContain(audit.stage);
 await info.attach('w141-real-loaded-worker.png',{body:await page.screenshot(),contentType:'image/png'});
 const receipt=await page.evaluate(id=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<70000;i++){
   g.step(1/30);
   if(i%7)continue;
   const found=g.getDeliveryReceipts().find(r=>r.id===id);
   if(found)return found;
  }
  return null;
 },freight.id);
 expect(receipt,'The tracked, originally loaded farmer must genuinely unload').toBeTruthy();
 expect(receipt.id).toBe(freight.id);
 expect(receipt.creditedAtUnloading).toBe(true);
 await renderOriginal(page);
 audit=await page.evaluate(()=>window.__tinyKingdom.getRealGrainJourneyAudit());
 expect(audit.deliveryId).toBe(freight.id);
 expect(audit.verifiedReceipt).toBe(true);
 expect(audit.noCreatedActors).toBe(true);
 expect(audit.noCreatedTransactions).toBe(true);
 const glError=await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??0);
 expect(glError).toBe(0);
 await info.attach('w141-real-market-receipt.png',{body:await page.screenshot(),contentType:'image/png'});
 await info.attach('w141-original-journey.json',{
  body:Buffer.from(JSON.stringify({harvest:initial.harvest,freight,receipt,audit,
    hardwareGPU:'NOT MEASURED',realHouseholdMeal:'NOT AUTOMATICALLY PROVEN',
    independentCritics:'NOT AVAILABLE',actualPageErrors:errors},null,2)),
  contentType:'application/json'});
 expect(errors).toEqual([]);
});
test('W141 real 390px worker follow, toggle, no authority mutation or hidden controls',
 async({page},info)=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 const initial=await findRealHarvest(page);
 expect(initial,'No real farmer; cannot film a synthetic 390px worker').toBeTruthy();
 expect(initial.worldUnchanged).toBe(true);
 await renderOriginal(page);
 const live=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {audit:g.getRealGrainJourneyAudit(),triangles:g.getGeometryAudit().totalTriangles,
   overflow:document.documentElement.scrollWidth-innerWidth,
   pressed:document.getElementById('world-trace-follow').getAttribute('aria-pressed')};
 });
 expect(live.audit.active).toBe(true);
 expect(live.audit.actor).toBe(initial.harvest.citizen);
 expect(live.pressed).toBe('true');
 expect(live.triangles).toBeLessThan(160000);
 expect(live.overflow).toBeLessThanOrEqual(0);
 await info.attach('w141-real-mobile-worker.png',{body:await page.screenshot(),contentType:'image/png'});
 const stopped=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const result=g.stopRealGrainJourney();
  return {result,after:g.getRealGrainJourneyAudit(),
   sameState:before===JSON.stringify(g.exportSnapshot()),
   pressed:document.getElementById('world-trace-follow').getAttribute('aria-pressed')};
 });
 expect(stopped.result).toBe(true);
 expect(stopped.after.active).toBe(false);
 expect(stopped.sameState).toBe(true);
 expect(stopped.pressed).toBe('false');
 expect(errors).toEqual([]);
});
