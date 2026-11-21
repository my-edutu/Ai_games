'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W89 RED-before: the same REAL worker's rendered right-hand and cart
// orientation must drive every carried bundle at the actual receiving market.
// A fixed world-Z parcel or an unrotated local IK wrist is not physical contact.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W89 real courier body/cart and market handoff share one world frame '+viewport.width,async({page},testInfo)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   if(typeof g.getCourierHandContact!=='function')
    return {error:'Missing physical courier world-space hand/contact contract'};
   let sample=null,receipt=null,unchanged=true,realDelivery=null;
   for(let tick=0;tick<60000;tick++){
    g.step(1/30);
    const active=g.getMarketHandoffs();
    if(!active.length)continue;
    const h=active[0],pose=g.getMarketParcelDeliveryPose(h.id);
    if(!pose?.parcels?.length)continue;
    const before=JSON.stringify(g.exportSnapshot());
    const contact=g.getCourierHandContact(h.citizen);
    const secondPose=g.getMarketParcelDeliveryPose(h.id);
    unchanged=unchanged&&(before===JSON.stringify(g.exportSnapshot()));
    if(!contact||!secondPose)continue;
    sample={contact,pose:secondPose,market:h,world:g.metrics(),
      source:pose.source,unchanged};
    realDelivery=h.id;
    break;
   }
   if(sample&&realDelivery){
    for(let tick=0;tick<1000;tick++){
     g.step(1/30);
     receipt=g.getDeliveryReceipts().find(r=>r.id===realDelivery);
     if(receipt)break;
    }
   }
   return {error:!sample?'No genuine physical market handoff observed':null,
    ...sample,receipt,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.error).toBeNull();
  expect(result.unchanged).toBe(true);
  expect(result.receipt?.id).toBe(result.market.id);
  expect(result.receipt?.creditedAtUnloading).toBe(true);
  expect(result.contact.id).toBe(result.market.id);
  expect(result.contact.citizen).toBe(result.market.citizen);
  expect(result.contact.workerFocus).toEqual(expect.any(Array));
  expect(result.contact.lod).toMatch(/^(compact|detailed)$/);
  expect(result.contact.wrist.every(Number.isFinite)).toBe(true);
  expect(result.contact.cartPoint.every(Number.isFinite)).toBe(true);
  expect(result.pose.wrist.every(Number.isFinite)).toBe(true);
  expect(result.pose.cartOrigin.every(Number.isFinite)).toBe(true);
  expect(Math.hypot(...result.contact.wrist.map((v,i)=>v-result.pose.wrist[i]))).toBeLessThan(.015);
  expect(Math.hypot(...result.contact.cartPoint.map((v,i)=>v-result.pose.cartOrigin[i]))).toBeLessThan(.015);
  expect(result.pose.parcels.every(row=>row.position.every(Number.isFinite))).toBe(true);
  expect(result.pose.escrowed).toBe(true);
  expect(result.pose.visibleOnCart+result.pose.parcels.length).toBe(result.pose.bundleCount);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError())).toBe(0);
  await testInfo.attach('W89-real-courier-contact-'+viewport.width+'px',
    {body:await page.screenshot(),contentType:'image/png'});
 });
}
