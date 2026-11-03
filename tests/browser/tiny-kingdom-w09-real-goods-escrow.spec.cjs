'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W09 RED-first: the visibly loaded physical cart must actually HOLD its
// produced consignment until its original, safely navigated receiving-yard
// handoff ends. Merely painting an in-transit sack while immediately making
// that same food spendable is not a lived-in farm-to-market economy.
// No synthetic courier, injected stock, fabricated delivery, or fake actor.
test('W09 real harvest/timber output stays in a saved cart until a witnessed market receipt',async({page})=>{
 test.setTimeout(210000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:90000});
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
  if(typeof g.getDeliveryEconomyAudit!=='function')
   return {missing:'actual physical-escrow economy audit'};
  let loaded=null;
  for(let i=0;i<44000;i++){
   g.step(1/30);
   loaded=g.getActiveDeliveries().find(d=>d.stage==='travel'&&d.escrowed);
   if(loaded)break;
  }
  if(!loaded)return {missing:'no truly escrowed original courier'};
  const saved=g.exportSnapshot();
  const market=g.getMarketSupplyView(),escrow=g.getDeliveryEconomyAudit();
  const authority=JSON.stringify(saved);
  g.getDeliveryEconomyAudit();g.getMarketSupplyView();g.getActiveDeliveries();
  const readOnly=authority===JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(saved);
  const restored=g.getActiveDeliveries().find(d=>d.id===loaded.id);
  const restoredStock=g.getDeliveryEconomyAudit();
  const restoredSnapshot=g.exportSnapshot();
  return {loaded,market,escrow,readOnly,restored,restoredStock,
   sameSnapshot:JSON.stringify(saved)===JSON.stringify(restoredSnapshot),saved};
 });
 expect(before.missing||'').toBe('');
 expect(before.loaded.amount).toBeGreaterThan(0);
 expect(before.loaded.escrowed).toBe(true);
 expect(before.escrow.inTransit[before.loaded.resource]).toBeGreaterThanOrEqual(before.loaded.amount);
 expect(before.market.escrowed[before.loaded.resource]).toBeGreaterThanOrEqual(before.loaded.amount);
 expect(before.market.resources[before.loaded.resource]).toBeGreaterThanOrEqual(0);
 expect(before.restored.escrowed).toBe(true);
 expect(before.sameSnapshot&&before.readOnly).toBe(true);
 expect(before.restoredStock.inTransit).toEqual(before.escrow.inTransit);

 // Restore the actual saved source TWICE; a correct handoff must produce
 // byte-identical end state, the same one receipt and no uncredited cargo.
 const playback=await page.evaluate(saved=>{
  const g=window.__tinyKingdom,finish=()=>{
   g.restoreSnapshot(saved);
   const source=g.getActiveDeliveries().find(d=>d.escrowed);
   const id=source?.id;
   let receipt=null;
   for(let i=0;i<12000;i++){
    g.step(1/30);
    receipt=g.getDeliveryReceipts().find(r=>r.id===id);
    if(receipt)break;
   }
   return {receipt,authority:JSON.stringify(g.exportSnapshot()),
    audit:g.getDeliveryEconomyAudit(),remaining:g.getActiveDeliveries()
     .some(d=>d.id===id),receipts:g.getDeliveryReceipts()
     .filter(r=>r.id===id).length};
  };
  return {a:finish(),b:finish()};
 },before.saved);
 expect(playback.a.receipt).toBeTruthy();
 expect(playback.a.receipt.creditedAtUnloading).toBe(true);
 expect(playback.a.receipt.amount).toBe(before.loaded.amount);
 expect(playback.a.remaining).toBe(false);
 expect(playback.a.receipts).toBe(1);
 expect(playback.b).toEqual(playback.a);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(100);
 const mobile=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,
  gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.gl).toBe(0);
 expect(mobile.snapshot).toBe(playback.b.authority);
 expect(errors).toEqual([]);
});
