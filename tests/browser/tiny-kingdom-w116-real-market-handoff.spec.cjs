'use strict';
/* W116 end-to-end real WebGL safety floor: an existing farmer's authentic
 * escrowed courier raises the real wrist parcel and places it on the receiving
 * dock, then the original economy credits the receipt. No staged transactions.
 */
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W116 real cart > wrist > receiving shelf, credited '+viewport.width+'px',async({page},info)=>{
  test.setTimeout(260000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:115000});
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   let unloaded=null;
   for(let i=0;i<44000&&!unloaded;i++){
    g.step(1/30);
    if(i%3!==0)continue;
    for(const delivery of g.getActiveDeliveries().filter(d=>
      d.escrowed&&d.stage==='unloading')){
     const old=JSON.stringify(g.exportSnapshot());
     const pose=g.getMarketParcelDeliveryPose(delivery.id);
     if(pose?.parcels?.length){
      unloaded={id:delivery.id,resource:delivery.resource,
       amount:delivery.amount,pose,unmutated:old===JSON.stringify(g.exportSnapshot())};
      break;
     }
    }
   }
   if(!unloaded)return {error:'No authentic escrowed unloading pose was reached'};
   return {unloaded,hand:g.getCourierHandContact(unloaded.pose.citizen),
    hall:g.getMarketReceivingHallAudit(),people:g.metrics().citizens,
    triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(observed.error||'').toBe('');
  const shipment=observed.unloaded;
  expect(shipment.unmutated).toBe(true);
  expect(shipment.pose.escrowed).toBe(true);
  expect(shipment.pose.parcels.length).toBeGreaterThan(0);
  expect(shipment.pose.parcels.every(p=>p.position.every(Number.isFinite)&&
    p.credited===false)).toBe(true);
  expect(shipment.pose.wrist).toEqual(observed.hand.wrist);
  expect(observed.hall.realFreightOnly).toBe(true);
  expect(observed.people).toBeGreaterThan(0);
  expect(observed.triangles).toBeLessThan(160000);
  expect(observed.overflow).toBeLessThanOrEqual(0);
  await page.waitForTimeout(400);
  expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError())).toBe(0);
  await info.attach('W116-original-handoff-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'});
  const credited=await page.evaluate(id=>{
   const g=window.__tinyKingdom;
   let receipt=null;
   for(let i=0;i<22000;i++){
    g.step(1/30);
    if(i%3===0){
     receipt=g.getDeliveryReceipts().find(x=>x.id===id);
     if(receipt)break;
    }
   }
   return {receipt,glError:document.querySelector('#world').getContext('webgl')?.getError()};
  },shipment.id);
  expect(credited.receipt?.creditedAtUnloading).toBe(true);
  expect(credited.receipt?.amount).toBe(shipment.amount);
  expect(credited.glError).toBe(0);
  expect(errors).toEqual([]);
 });
}
