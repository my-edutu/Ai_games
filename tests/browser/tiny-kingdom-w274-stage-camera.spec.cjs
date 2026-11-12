'use strict';
// W274: genuine original autonomous grain, physical stage camera, actual DOM
// inputs at desktop and 390px. No fake delivery, event, citizen or snapshot.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w274');
fs.mkdirSync(OUT,{recursive:true});test.use({video:'on'});
test('W274 real grain stage actions use current physical farmer, cart and market on desktop and 390px',async({page})=>{
 test.setTimeout(570000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
  null,{timeout:150000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 await page.locator('#world-trace-toggle').click();
 const unlinked=await page.evaluate(()=>{
  const g=window.__tinyKingdom,s=JSON.stringify(g.exportSnapshot());
  const result=g.inspectRealGrainStage('road');
  return {result,unchanged:s===JSON.stringify(g.exportSnapshot())};
 });
 expect(unlinked.result.observed).toBe(false);
 expect(unlinked.unchanged).toBe(true);
 await page.locator('#grain-chain-road').click();
 const pickup=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.reset();g.setSpeed(0);
  for(let i=0;i<65000;i++){
   g.step(1/30);
   if(i%4)continue;
   const freight=g.getActiveDeliveries().find(d=>d.job==='farmer'&&
    d.resource==='food'&&d.escrowed&&d.amount>0);
   if(!freight)continue;
   const prior=JSON.stringify(g.exportSnapshot());
   const tracked=g.watchRealGrainJourney();
   if(tracked?.producer===freight.citizen&&tracked.deliveryId===freight.id){
    const shot=g.inspectRealGrainStage('road');
    return {freight,shot,unchanged:prior===JSON.stringify(g.exportSnapshot())};
   }
   if(tracked)g.stopRealGrainJourney();
  }
  return null;
 });
 expect(pickup,'No genuine farmer cargo found, do not manufacture one').toBeTruthy();
 expect(pickup.shot.mode).toBe('real-loaded-road');
 expect(pickup.unchanged).toBe(true);
 const receipt=await page.evaluate(name=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<110000;i++){
   g.step(1/30);
   if(i%10)continue;
   const witness=g.getRealGrainJourneyAudit();
   if(witness.stage==='received'&&witness.verifiedReceipt){
    const original=g.getDeliveryReceipts().find(r=>r.id===witness.deliveryId&&
     r.citizen===name&&r.creditedAtUnloading===true);
    if(!original)continue;
    const prior=JSON.stringify(g.exportSnapshot());
    const shot=g.inspectRealGrainStage('market');
    return {receipt:original,shot,unchanged:prior===JSON.stringify(g.exportSnapshot())};
   }
  }
  return null;
 },pickup.freight.citizen);
 expect(receipt,'No genuine credited receipt; cannot stage a market handoff').toBeTruthy();
 expect(receipt.unchanged).toBe(true);
 expect(receipt.shot.mode).toBe('real-receiving-shelves');
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 await page.waitForTimeout(180);
 const desktop=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {camera:g.getRealGrainJourneyAudit(),triangle:g.renderStats().lastFrameTriangles,
   error:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   stock:JSON.stringify(g.exportSnapshot())};
 });
 expect(desktop.camera.marketReceiptSightline?.visibleShelves).toBe(2);
 expect(desktop.triangle).toBeLessThan(160000);
 expect(desktop.error).toBe(0);expect(desktop.overflow).toBeLessThanOrEqual(0);
 await page.screenshot({path:path.join(OUT,'real-market-inspected-desktop-1024.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(240);
 await page.evaluate(()=>window.__tinyKingdom.inspectRealGrainStage('market'));
 // W275: a real 390px touch target must remain visible and actionable even
 // after the original linked delivery changes the real documentary mode.
 // Do not force-click a hidden element or call its onclick from JavaScript.
 const mobileAccess=await page.evaluate(()=>({
  command:document.body.dataset.command,
  supply:document.body.dataset.supply,
  workday:document.body.dataset.workday,
  ribbon:getComputedStyle(document.getElementById('world-ribbon')).display,
  stage:getComputedStyle(document.getElementById('grain-chain-market')).display
 }));
 expect(mobileAccess.command).toBe('world');
 expect(mobileAccess.supply).toBe('open');
 await expect(page.locator('#grain-chain-market'),
  'Real market button must remain visible at 390px: '+JSON.stringify(mobileAccess))
  .toBeVisible({timeout:10000});
 await page.locator('#grain-chain-market').click({timeout:10000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {camera:g.getRealGrainJourneyAudit(),triangle:g.renderStats().lastFrameTriangles,
   error:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   snapshot:JSON.stringify(g.exportSnapshot()),
   inspecting:document.getElementById('grain-chain-market').dataset.inspecting};
 });
 expect(mobile.camera.marketReceiptSightline?.visibleShelves).toBe(2);
 expect(mobile.triangle).toBeLessThan(160000);expect(mobile.error).toBe(0);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.inspecting).toBe('true');
 expect(mobile.snapshot).toBe(desktop.stock,'viewport, stage buttons and camera do not affect authority');
 expect(errors).toEqual([]);
 await page.screenshot({path:path.join(OUT,'real-market-inspected-mobile-390.png')});
 fs.writeFileSync(path.join(OUT,'source-evidence.json'),JSON.stringify({
  source:'real-W274-autonomous-same-parcel-stage-actions',
  loaded:pickup.freight,originalReceipt:receipt.receipt,
  desktop:{...desktop,stock:'checked matching'},
  mobile:{...mobile,snapshot:'checked matching'},
  noFabricatedTransaction:true,physicalHardwareFps:'NOT MEASURED',
  independentQuality:'NOT PROVEN'},null,2));
});
