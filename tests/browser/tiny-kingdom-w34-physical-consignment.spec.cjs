'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W34: a genuine escrowed worker must visibly unload the SAME packages
// that made the journey, without inventing a trade or changing authority.
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W34 authentic consignment visibly empties at market '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const journey=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   let cargo=null;
   for(let n=0;n<44000;n++){
    g.step(1/30);
    if(n%4===0){
     cargo=g.getActiveDeliveries().find(d=>d.escrowed&&d.stage==='travel');
     if(cargo)break;
    }
   }
   if(!cargo)return {error:'No physically escrowed courier from original work'};
   if(typeof g.getCourierLoadPresentation!=='function')
    return {error:'Missing genuine progressive cargo presentation'};
   const saved=g.exportSnapshot(),before=JSON.stringify(saved);
   const load=g.getCourierLoadPresentation(cargo.citizen);
   const economy=g.getDeliveryEconomyAudit();
   const sourceAudit=typeof g.getPhysicalMarketParcelAudit==='function'?
    g.getPhysicalMarketParcelAudit(cargo.id):null;
   const after=JSON.stringify(g.exportSnapshot());
   let partial=null,partialSnapshot=null,partialParcelAudit=null,
    previous=load.visibleBundles,monotone=true,receipt=null;
   for(let n=0;n<12000;n++){
    g.step(1/30);
    const current=g.getCourierLoadPresentation(cargo.citizen);
    if(current?.id===cargo.id&&current.stage==='unloading'){
     if(current.visibleBundles>previous)monotone=false;
     previous=current.visibleBundles;
     if(current.progress>.62&&current.progress<.88&&!partial){
      partial={...current};partialSnapshot=g.exportSnapshot();
      partialParcelAudit=g.getPhysicalMarketParcelAudit?.(cargo.id)||null;
     }
    }
    receipt=g.getDeliveryReceipts().find(r=>r.id===cargo.id);
    if(receipt)break;
   }
   const state=JSON.stringify(g.exportSnapshot());
   const receiptParcelAudit=g.getPhysicalMarketParcelAudit?.(cargo.id)||null;
   g.restoreSnapshot(saved);
   const restored=g.getCourierLoadPresentation(cargo.citizen);
   return {cargo,load,partial,receipt,
    sourceAudit,partialParcelAudit,receiptParcelAudit,realLoadedSnapshot:saved,
    realUnloadingSnapshot:partialSnapshot,realReceivedSnapshot:JSON.parse(state),
    monotone,readOnly:before===after,
    restored,unchangedLoad:JSON.stringify(restored)===JSON.stringify(load),
    economy,authorityAfter:state,viewportWidth:document.documentElement.scrollWidth};
  });
  expect(journey.error||'').toBe('');
  expect(journey.cargo.amount).toBeGreaterThan(0);
  expect(journey.load.source).toBe('actual-escrowed-courier-load');
  expect(journey.load.id).toBe(journey.cargo.id);
  expect(journey.load.amount).toBe(journey.cargo.amount);
  expect(journey.load.resource).toBe(journey.cargo.resource);
  expect(journey.load.escrowed).toBe(true);
  expect(journey.load.stage).toBe('travel');
  expect(journey.load.visibleBundles).toBe(journey.load.bundles);
  expect(journey.load.bundles).toBeGreaterThanOrEqual(1);
  expect(journey.load.bundles).toBeLessThanOrEqual(3);
  expect(journey.partial,'Authentic actor never reached mid-unload').toBeTruthy();
  expect(journey.sourceAudit?.source).toBe('real-escrow-to-receipt-parcel-continuity');
  expect(journey.sourceAudit.bundleCount).toBe(journey.load.bundles);
  expect(journey.sourceAudit.visibleOnCart).toBe(journey.load.bundles);
  expect(journey.sourceAudit.transferredButEscrowed).toBe(0);
  expect(journey.partialParcelAudit?.stage).toBe('unloading');
  expect(journey.partialParcelAudit.bundleCount).toBe(journey.load.bundles);
  expect(journey.partialParcelAudit.visibleOnCart).toBe(journey.partial.visibleBundles);
  expect(journey.partialParcelAudit.transferredButEscrowed).toBeGreaterThan(0);
  expect(journey.partialParcelAudit.visibleOnCart+
    journey.partialParcelAudit.transferredButEscrowed).toBe(journey.load.bundles);
  expect(journey.receiptParcelAudit?.stage).toBe('received');
  expect(journey.receiptParcelAudit.bundleCount).toBe(journey.load.bundles);
  expect(journey.receiptParcelAudit.visibleOnCart).toBe(0);
  expect(journey.receiptParcelAudit.transferredButEscrowed).toBe(0);
  expect(journey.partial.stage).toBe('unloading');
  expect(journey.partial.visibleBundles).toBeLessThan(journey.load.visibleBundles);
  expect(journey.partial.visibleBundles).toBeGreaterThanOrEqual(0);
  expect(journey.monotone).toBe(true);
  expect(journey.readOnly&&journey.unchangedLoad).toBe(true);
  expect(journey.receipt?.id).toBe(journey.cargo.id);
  expect(journey.receipt?.amount).toBe(journey.cargo.amount);
  expect(journey.receipt?.creditedAtUnloading).toBe(true);
  expect(journey.viewportWidth).toBeLessThanOrEqual(viewport.width);
  // These are three real autonomous-world states, not fabricated progress
  // stages or CSS visualizations. Request actual WebGL presentation after
  // snapshot restore; film the already-real actor, cart, and receiving yard.
  for(const [name,snapshot] of [
   ['loaded',journey.realLoadedSnapshot],
   ['unloading',journey.realUnloadingSnapshot],
   ['received',journey.realReceivedSnapshot]
  ]){
   await page.evaluate(({snapshot,name,citizen})=>{
    const g=window.__tinyKingdom;g.restoreSnapshot(snapshot);g.setSpeed(0);
    const carrier=g.getActiveDeliveries().find(d=>d.citizen===citizen);
    const dest=carrier?[carrier.x,carrier.z]:[0,10.2];
    g.setCamera({focus:dest,zoom:8,yaw:.64,pitch:.34});
   },{snapshot,name,citizen:journey.cargo.citizen});
   await page.waitForTimeout(700);
   const glErrors=await page.evaluate(()=>
    document.getElementById('world').getContext('webgl')?.getError()??-1);
   expect(glErrors).toBe(0);
   await testInfo.attach('W34-'+name+'-real-WebGL-'+viewport.width+'px',{
    body:await page.screenshot(),contentType:'image/png'});
  }
  const err=await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1);
  expect(err).toBe(0);expect(errors).toEqual([]);
  await testInfo.attach('W34-authentic-consignment-'+viewport.width,{
   body:await page.screenshot(),contentType:'image/png'});
 });
}
