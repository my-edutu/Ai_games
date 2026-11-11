'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// Record the genuine continuous observed market handoff when CI reaches it.
// World fast-forward stays the original deterministic autonomous simulation.
// Match the REAL 390px portrait viewport in the recorded file, never an
// 800x450 letterboxed default Playwright screen.
test.use({video:{mode:'on',size:{width:390,height:844}}});

// W13 RED-FIRST: the player sees one REAL producer -> loaded journey ->
// physically unloaded stock, not a stage-scripted cutscene or made-up economy.
// The director observes but never advances authority or edits a snapshot.
test('W13 a real courier becomes a continuous camera-followed production-to-market story at 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0)});
 for(let remaining=120*24*30;remaining>0;remaining-=7200)
  await page.evaluate(n=>{for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30)},Math.min(7200,remaining));
 const courier=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<72*24*30;i++){
   g.step(1/30);
   if(i%8===0&&g.getActiveDeliveries().length)
    return g.getActiveDeliveries()[0];
  }
  return null;
 });
 expect(courier,'No real credited loaded transport in the seeded settlement').not.toBeNull();
 const entry=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  document.querySelector('#world-watch-life').click();
  g.advanceVillageDocumentary();
  return {before,after:JSON.stringify(g.exportSnapshot()),
   camera:g.getCamera(),audit:g.getVillageDocumentaryAudit(),
   width:document.documentElement.scrollWidth};
 });
 expect(entry.after).toBe(entry.before);
 expect(entry.camera.follow).toBe(true);
 expect(entry.audit.active).toBe(true);
 expect(entry.audit.source).toBe('observed-authoritative-production-and-market-receipts');
 expect(entry.audit.citizen).toBeTruthy();
 expect(entry.audit.deliveryId).toBeTruthy();
 // When two real loads coexist the existing director deliberately prioritizes
 // a courier already unloading; never assume array position is its identity.
 expect(await page.evaluate(id=>window.__tinyKingdom.getActiveDeliveries().some(d=>d.id===id),entry.audit.deliveryId)).toBe(true);
 expect(['hauling','unloading']).toContain(entry.audit.stage);
 expect(entry.width).toBeLessThanOrEqual(390);
 const end=await page.evaluate(async id=>{
  const g=window.__tinyKingdom;let handoff=false,receipt=null;
  const trueMotion=[];
  for(let i=0;i<120*30;i++){
   g.step(1/30);
   // All progression comes from original authority ticks. Yield periodically
   // so real WebGL/camera can present the MOVING worker to the recording;
   // the old synchronous loop only recorded static pre/post screenshots.
   if(i%180===0){
    const actor=g.getActiveDeliveries().find(d=>d.id===id);
    if(actor)trueMotion.push({t:g.getState().state.t,x:actor.x,z:actor.z,stage:actor.stage});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   }
   if(i%5)continue;
   const before=JSON.stringify(g.exportSnapshot());
   g.advanceVillageDocumentary();
   if(JSON.stringify(g.exportSnapshot())!==before)
    throw Error('Documentary camera changed simulation authority');
   const audit=g.getVillageDocumentaryAudit();
   if(audit.stage==='unloading')handoff=true;
   receipt=g.getDeliveryReceipts().find(row=>row.id===id)||null;
   if(receipt)break;
  }
  g.advanceVillageDocumentary();
  return {receipt,handoff,trueMotion,audit:g.getVillageDocumentaryAudit(),
   camera:g.getCamera(),width:document.documentElement.scrollWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 },entry.audit.deliveryId);
 expect(end.receipt,'Receipt must arise from authentic physical unloading').not.toBeNull();
 expect(end.handoff,'Real staged unloading must be visible while observed').toBe(true);
 expect(end.trueMotion.length,'authentic camera must have sampled an advancing world').toBeGreaterThan(0);
 fs.writeFileSync(path.resolve(__dirname,'../../test-results/w226-real-freight-motion-390.json'),
  JSON.stringify({source:'real-authority-positions-and-stage',receipt:end.receipt,
   samples:end.trueMotion,simulated:true,realHardwareFPS:'NOT MEASURED'},null,2));
 expect(end.receipt.citizen).toBe(entry.audit.citizen);
 expect(end.audit.citizen).toBe(entry.audit.citizen);
 expect(end.audit.stage).toBe('received');
 expect(end.audit.receipt?.id).toBe(entry.audit.deliveryId);
 expect(end.audit.stagesSeen).toContain('unloading');
 expect(end.audit.stagesSeen).toContain('received');
 expect(end.width).toBeLessThanOrEqual(390);
 expect(end.gl).toBe(0);
 await page.screenshot({path:path.resolve(__dirname,'../../test-results/w13-real-market-receipt-390.png')});
 await page.locator('[data-scenic="valley"]').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getVillageDocumentaryAudit().active)).toBe(false);
 expect(errors).toEqual([]);
});