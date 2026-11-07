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


// W35 actual-worker parcel handoff — the SAME true courier who delivers the
// inventory must plant their boots and reach through successive real bundles.
// This checks body IK, package continuity and unchanged authoritative replay,
// not a scripted actor, a UI counter, or merely an animation-phase number.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W35 courier arms physically follow sequential escrowed bundles '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   if(typeof g.getCourierTransferMotion!=='function')
    return {error:'Missing W35 physical courier labor interface'};
   let subject=null,early=null,carry=null,credited=null,load=null,readOnly=true;
   for(let tick=0;tick<60000;tick++){
    g.step(1/30);
    if(!subject){
     const active=g.getActiveDeliveries().find(d=>d.escrowed);
     if(active){subject=active.citizen;load=active;}
    }
    if(!subject)continue;
    const before=JSON.stringify(g.exportSnapshot());
    const motion=g.getCourierTransferMotion(subject);
    const p=g.getCitizenProfiles().find(p=>p.name===subject);
    const navigation=g.getNavigation().find(p=>p.name===subject);
    const index=g.getNavigation().findIndex(p=>p.name===subject);
    const rig=index>=0?g.getRigPose(index):null;
    const after=JSON.stringify(g.exportSnapshot());
    if(before!==after)readOnly=false;
    if(motion?.active&&motion.parcelIndex===0&&motion.cycle>.06&&motion.cycle<.30&&!early)
     early={motion,rig,activity:p?.activity,position:navigation?.position,snapshot:g.exportSnapshot()};
    if(motion?.active&&motion.parcelIndex===0&&motion.cycle>.63&&motion.cycle<.91&&!carry)
     carry={motion,rig,activity:p?.activity,position:navigation?.position,snapshot:g.exportSnapshot()};
    const receipt=g.getDeliveryReceipts().find(r=>r.id===load.id);
    if(receipt){credited=receipt;break;}
   }
   return {load,early,carry,credited,readOnly,viewportWidth:document.documentElement.scrollWidth};
  });
  expect(observed.error||'').toBe('');
  expect(observed.load,'A genuine escrowed courier must exist').toBeTruthy();
  expect(observed.early,'Missing source-bundle reach').toBeTruthy();
  expect(observed.carry,'Missing actual parcel carry-through').toBeTruthy();
  const a=observed.early,b=observed.carry;
  expect(a.motion.source).toBe('real-escrowed-courier-embodied-transfer');
  expect(a.motion.stage).toBe('unloading');
  expect(a.motion.bundles).toBeGreaterThanOrEqual(1);
  expect(a.motion.bundles).toBeLessThanOrEqual(3);
  expect(a.motion.bundles).toBe(b.motion.bundles);
  expect(a.motion.parcelIndex).toBe(0);
  expect(b.motion.parcelIndex).toBe(0);
  expect(b.motion.cycle).toBeGreaterThan(a.motion.cycle);
  expect(b.motion.targetRight[2]-a.motion.targetRight[2]).toBeGreaterThan(.30);
  expect(Math.abs(b.motion.targetRight[1]-a.motion.targetRight[1])).toBeGreaterThan(.05);
  const distance=(x,y)=>Math.hypot(...x.map((value,i)=>value-y[i]));
  for(const sample of [a,b]){
   expect(sample.rig.working).toBe(true);
   expect(sample.rig.legs.every(leg=>leg.contact==='stance')).toBe(true);
   expect(distance(sample.rig.arms[1].wrist,sample.motion.targetRight)).toBeLessThan(.04);
   expect(distance(sample.rig.arms[0].wrist,sample.motion.targetLeft)).toBeLessThan(.04);
   expect(sample.motion.altersAuthority).toBe(false);
  }
  expect(observed.credited?.id).toBe(observed.load.id);
  expect(observed.readOnly).toBe(true);
  expect(observed.viewportWidth).toBeLessThanOrEqual(viewport.width);
  // Film the REAL mid-transfer world, including both actual arms and actual
  // loaded cart. No fake snapshot, CSS overlay, or changed world authority.
  await page.evaluate(snapshot=>{
   const g=window.__tinyKingdom;g.restoreSnapshot(snapshot);
   g.setSpeed(0);g.watchDelivery();
  },observed.carry.snapshot);
  await page.waitForTimeout(750);
  expect(await page.evaluate(()=>
   document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
  expect(errors).toEqual([]);
  await testInfo.attach('W35-real-courier-transfer-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'});
 });
}
