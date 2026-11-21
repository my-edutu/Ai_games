'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('G165 Day-120 genuinely delivered resources retain live-cinema subject until receiving',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0)});
 for(let left=120*24*30;left>0;left-=7200)
  await page.evaluate(n=>{for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30)},Math.min(left,7200));
 const courier=await page.evaluate(()=>{
  const g=window.__tinyKingdom;let found=null;
  for(let i=0;i<72*24*30;i++){
   g.step(1/30);
   if(i%15)continue;
   const list=g.getActiveDeliveries();
   if(list.length&&g.getActiveWorksites().length){found=list[0];break}
  }
  return found;
 });
 expect(courier,'real autonomous delivery required').not.toBeNull();
 const initial=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const witness=await page.evaluate(name=>{
  const g=window.__tinyKingdom;g.watchLiveWorkday();
  for(let i=0;i<g.metrics().citizens+1&&g.getSelectedCitizen()!==name;i++)
   document.getElementById('cycleCitizen').click();
  const journey=g.getLiveWorkJourneyAudit(),switchResult=g.advanceLiveWorkdayDirector();
  return {name:g.getSelectedCitizen(),journey,switchResult,snapshot:JSON.stringify(g.exportSnapshot())};
 },courier.citizen);
 expect(witness.name).toBe(courier.citizen);
 expect(witness.journey.source).toBe('real-autonomous-work-to-market');
 expect(['hauling','unloading']).toContain(witness.journey.stage);
 expect(witness.journey.deliveryId).toBe(courier.id);
 expect(witness.switchResult).toBe(false);
 expect(witness.snapshot).toBe(initial);
 const final=await page.evaluate(id=>{
  const g=window.__tinyKingdom;let receipt=null;
  for(let i=0;i<120*30;i++){
   g.step(1/30);
   if(i%10)continue;
   receipt=g.getDeliveryReceipts().find(r=>r.id===id)||null;
   if(receipt)break;
  }
  return {receipt,stage:g.getLiveWorkJourneyAudit().stage,
   name:g.getSelectedCitizen(),width:document.documentElement.scrollWidth,
   gl:document.getElementById('world').getContext('webgl').getError()};
 },courier.id);
 expect(final.receipt,'physical handoff requires genuine receipt').not.toBeNull();
 expect(final.receipt.citizen).toBe(courier.citizen);
 expect(final.receipt.resource).toBe(courier.resource);
 expect(final.name).toBe(courier.citizen);
 expect(final.stage).toBe('received');
 expect(final.width).toBeLessThanOrEqual(390);
 expect(final.gl).toBe(0);expect(errors).toEqual([]);
});