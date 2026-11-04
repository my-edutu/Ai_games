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
   const after=JSON.stringify(g.exportSnapshot());
   let partial=null,previous=load.visibleBundles,monotone=true,receipt=null;
   for(let n=0;n<12000;n++){
    g.step(1/30);
    const current=g.getCourierLoadPresentation(cargo.citizen);
    if(current?.id===cargo.id&&current.stage==='unloading'){
     if(current.visibleBundles>previous)monotone=false;
     previous=current.visibleBundles;
     if(current.progress>.37&&current.progress<.88&&!partial)
      partial={...current};
    }
    receipt=g.getDeliveryReceipts().find(r=>r.id===cargo.id);
    if(receipt)break;
   }
   const state=JSON.stringify(g.exportSnapshot());
   g.restoreSnapshot(saved);
   const restored=g.getCourierLoadPresentation(cargo.citizen);
   return {cargo,load,partial,receipt,monotone,readOnly:before===after,
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
  expect(journey.partial.stage).toBe('unloading');
  expect(journey.partial.visibleBundles).toBeLessThan(journey.load.visibleBundles);
  expect(journey.partial.visibleBundles).toBeGreaterThanOrEqual(0);
  expect(journey.monotone).toBe(true);
  expect(journey.readOnly&&journey.unchangedLoad).toBe(true);
  expect(journey.receipt?.id).toBe(journey.cargo.id);
  expect(journey.receipt?.amount).toBe(journey.cargo.amount);
  expect(journey.receipt?.creditedAtUnloading).toBe(true);
  expect(journey.viewportWidth).toBeLessThanOrEqual(viewport.width);
  const err=await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1);
  expect(err).toBe(0);expect(errors).toEqual([]);
  await testInfo.attach('W34-authentic-consignment-'+viewport.width,{
   body:await page.screenshot(),contentType:'image/png'});
 });
}
