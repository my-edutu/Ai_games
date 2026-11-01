'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G099 acceptance, written ahead of implementation: a real courier must
// physically STOP to unload at the receiving platform. The cargo remains
// in-transit throughout the shift and becomes a single recorded receipt only
// once the real citizen has completed the hand-off. No extra production.
test('G099 delivered goods are physically handed off once, with deterministic restoration and a truthful mobile scene',async({page})=>{
 test.setTimeout(190000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const evidence=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getMarketHandoffs!=='function')return {missing:'market handoff API'};
  g.reset();
  let unloading=null;
  for(let i=0;i<40000;i++){
   g.step(1/30);
   unloading=g.getMarketHandoffs()[0];
   if(unloading)break;
  }
  if(!unloading)return {missing:'no physical unloading state'};
  const initial=g.exportSnapshot(),before=JSON.stringify(initial);
  const all=g.getActiveDeliveries(),market=g.getMarketSupplyView();
  const stillInTransit=market.inTransit[unloading.resource];
  g.getMarketHandoffs();g.getDeliveryReceipts();
  const readOnly=JSON.stringify(g.exportSnapshot())===before;
  const existingReceipt=g.getDeliveryReceipts().some(r=>r.id===unloading.id);
  g.restoreSnapshot(initial);
  const restored=g.getMarketHandoffs().find(v=>v.id===unloading.id);
  const restoredChecksum=g.exportSnapshot().checksum;
  let ticks=0,receipt=null,afterUnload=null;
  for(;ticks<2000;ticks++){
   g.step(1/30);
   receipt=g.getDeliveryReceipts().find(r=>r.id===unloading.id);
   if(receipt){afterUnload=g.exportSnapshot();break}
  }
  if(!receipt)return {missing:'no physical receipt within bounded unloading duration'};
  const once=g.getDeliveryReceipts().filter(r=>r.id===unloading.id).length;
  const carriedAfter=g.getActiveDeliveries().some(v=>v.id===unloading.id);
  const resources=market.resources;
  g.restoreSnapshot(initial);
  for(let i=0;i<=ticks;i++)g.step(1/30);
  const replay=g.exportSnapshot();
  const replayMatch=JSON.stringify(replay)===JSON.stringify(afterUnload);
  const cameraBefore=JSON.stringify(g.exportSnapshot());
  g.setCamera({focus:[-1,10.2],yaw:.62,pitch:.36,zoom:10});
  const cameraReadOnly=JSON.stringify(g.exportSnapshot())===cameraBefore;
  return {unloading,all,stillInTransit,resources,readOnly,existingReceipt,
   restored,restoredChecksum,expectedChecksum:initial.checksum,
   receipt,once,carriedAfter,replayMatch,cameraReadOnly,ticks};
 });
 expect(evidence.missing||'').toBe('');
 expect(evidence.unloading.stage).toBe('unloading');
 expect(evidence.unloading.remainingHours).toBeGreaterThan(0);
 expect(evidence.unloading.progress).toBeGreaterThanOrEqual(0);
 expect(evidence.unloading.progress).toBeLessThan(1);
 expect(evidence.unloading.destination).toHaveLength(2);
 expect(evidence.all.some(x=>x.id===evidence.unloading.id)).toBe(true);
 expect(evidence.stillInTransit).toBeGreaterThan(0);
 expect(evidence.existingReceipt).toBe(false);
 expect(evidence.readOnly).toBe(true);
 expect(evidence.restored).toMatchObject({id:evidence.unloading.id,stage:'unloading'});
 expect(evidence.restoredChecksum).toBe(evidence.expectedChecksum);
 expect(evidence.receipt.id).toBe(evidence.unloading.id);
 expect(evidence.once).toBe(1);
 expect(evidence.carriedAfter).toBe(false);
 expect(evidence.replayMatch).toBe(true);
 expect(evidence.cameraReadOnly).toBe(true);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(100);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()||0)).toBe(0);
 expect(errors).toEqual([]);
});

// G100 RED-FIRST: a real courier unloading at the market must be the
// unobstructed protagonist when the player chooses Delivery. A nominal
// 'follow' flag and a status message with the worker off-screen are failures.
test('G100 real market courier receives a readable close camera and an uncluttered 390px documentary HUD',async({page})=>{
 test.setTimeout(190000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  let courier=null;
  for(let i=0;i<40000;i++){g.step(1/30);courier=g.getMarketHandoffs()[0];if(courier)break}
  return {courier,snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(staged.courier).toBeTruthy();
 await page.locator('#delivery-follow').click();
 const focus=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {mode:document.body.dataset.workday,selected:g.getSelectedCitizen(),
   camera:g.getCamera(),plan:g.getCitizenCameraPlan(),
   delivery:g.getActiveDeliveries(),hud:document.getElementById('workday-activity').textContent,
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(focus.authority).toBe(staged.snapshot);
 expect(focus.mode).toBe('delivery');
 expect(focus.selected).toBe(staged.courier.citizen);
 expect(focus.camera.follow).toBe(true);
 expect(focus.camera.pitch).toBeLessThan(.55);
 expect(focus.camera.zoom).toBeLessThan(9);
 expect(focus.plan.blockers).toBe(0);
 expect(focus.hud).toMatch(/unloading.*market/i);
 expect(focus.delivery.some(d=>d.citizen===focus.selected&&d.stage==='unloading')).toBe(true);
 // G101 RED-FIRST: real player mouse-wheel input must not teleport a 6m
 // documentary camera back to the 16m town-survey minimum. It must retain
 // a close, player-adjustable view of the actual unloading citizen.
 await page.mouse.move(480,310);
 await page.mouse.wheel(0,-65);
 await page.waitForTimeout(180);
 const interacted=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {camera:g.getCamera(),authority:JSON.stringify(g.exportSnapshot()),
   selected:g.getSelectedCitizen(),mode:document.body.dataset.workday};
 });
 expect(interacted.camera.follow).toBe(true);
 expect(interacted.camera.zoom).toBeGreaterThan(4.1);
 expect(interacted.camera.zoom).toBeLessThan(9);
 expect(interacted.selected).toBe(staged.courier.citizen);
 expect(interacted.mode).toBe('delivery');
 expect(interacted.authority).toBe(staged.snapshot);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const visibleScenic=[...document.querySelectorAll('.world-tour [data-scenic]')]
   .filter(el=>getComputedStyle(el).display!=='none');
  const status=document.querySelector('#workday-activity').getBoundingClientRect();
  const ribbon=document.querySelector('#world-ribbon').getBoundingClientRect();
  const nav=document.querySelector('.world-tour').getBoundingClientRect();
  return {scrollWidth:document.documentElement.scrollWidth,visibleScenic:visibleScenic.length,
   statusTop:status.top,ribbonBottom:ribbon.bottom,navTop:nav.top,navBottom:nav.bottom,
   progressVisible:getComputedStyle(document.getElementById('workday-progress')).display!=='none',
   glError:document.querySelector('#world').getContext('webgl')?.getError()??0,
   authority:JSON.stringify(window.__tinyKingdom.exportSnapshot())};
 });
 expect(mobile.scrollWidth).toBeLessThanOrEqual(390);
 expect(mobile.visibleScenic).toBeLessThanOrEqual(1);
 expect(mobile.navBottom).toBeLessThan(135);
 expect(mobile.ribbonBottom+8).toBeLessThan(mobile.statusTop);
 expect(mobile.progressVisible).toBe(true);
 expect(mobile.authority).toBe(staged.snapshot);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
