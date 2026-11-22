'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W36 Living Valley: the camera must stay with the ONE genuine escrowed
// courier through travel, physical unloading, and the authoritative receipt.
// This is a real WebGL/browser test, not a mocked production timeline.
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W36 real courier documentary persists across escrow/unload/receipt '+viewport.width+'px',async({page},info)=>{
  test.setTimeout(240000);
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const sample=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   if(typeof g.getCourierDocumentaryCameraAudit!=='function')
    return {error:'Missing read-only W36 courier documentary camera audit'};
   let loaded=null;
   for(let i=0;i<44000;i++){
    g.step(1/30);
    if(i%4===0){
     loaded=g.getActiveDeliveries().find(d=>d.escrowed&&d.stage==='travel');
     if(loaded)break;
    }
   }
   if(!loaded)return {error:'No authentic escrowed producer'};
   const cameraBefore=JSON.stringify(g.exportSnapshot());
   const selected=g.watchDelivery();
   // Multiple real deliveries can overlap; select the actual watched cart,
   // not an earlier unselected courier's inventory.
   loaded=g.getActiveDeliveries().find(d=>d.id===selected?.id)||null;
   const travelA=g.getCourierDocumentaryCameraAudit();
   const travelB=g.getCourierDocumentaryCameraAudit();
   const cameraAfter=JSON.stringify(g.exportSnapshot());
   let unload=null,receipt=null,unloadAudit=null,receivedAudit=null;
   let unloadSnapshot=null,receivedSnapshot=null;
   for(let i=0;i<44000;i++){
    g.step(1/30);
    const active=g.getActiveDeliveries().find(d=>d.id===selected?.id);
    if(active?.stage==='unloading'&&!unload){
     unload=active;unloadAudit=g.getCourierDocumentaryCameraAudit();
     unloadSnapshot=g.exportSnapshot();
    }
    receipt=g.getDeliveryReceipts().find(r=>r.id===selected?.id);
    if(receipt){
     receivedAudit=g.getCourierDocumentaryCameraAudit();
     receivedSnapshot=g.exportSnapshot();
     break;
    }
   }
   return {loaded,selected,travelA,travelB,unload,unloadAudit,
    physicalPosts:g.getMarketGatewayAudit().structuralPosts+
     g.getTradeCorridorCameraAudit().marketPosts,
    receipt,receivedAudit,unloadSnapshot,receivedSnapshot,
    readOnly:cameraBefore===cameraAfter,
    width:document.documentElement.scrollWidth};
  });
  expect(sample.error||'').toBe('');
  expect(sample.readOnly).toBe(true);
  expect(sample.selected?.id).toBe(sample.loaded?.id);
  expect(sample.travelA?.source).toBe('real-authoritative-delivery-documentary');
  expect(sample.travelA?.stage).toBe('travel');
  expect(sample.travelA?.active).toBe(true);
  expect(sample.travelA?.deliveryId).toBe(sample.loaded.id);
  expect(sample.travelB?.builds).toBe(sample.travelA?.builds);
  expect(sample.travelB?.reuses).toBeGreaterThan(sample.travelA?.reuses);
  expect(sample.travelB?.camera?.blockers).toBeGreaterThanOrEqual(0);
  expect(sample.unload?.stage).toBe('unloading');
  expect(sample.unloadAudit?.stage).toBe('unloading');
  expect(sample.unloadAudit?.deliveryId).toBe(sample.loaded.id);
  expect(sample.unloadAudit?.camera?.zoom).toBeLessThanOrEqual(7.2);
  // W37 RED contract: no winning courier shot may place the physical original
  // market stall columns/lamps across the central work-and-receipt view.
  // The actual 16 stalls, two gateway posts and four real receiving-hall posts
  // must all be surveyed. The W100 hall was not present in W36's old count.
  expect(sample.unloadAudit?.camera?.marketPostSightline?.source)
   .toBe('original-stalls-gateway-and-real-receiving-hall-posts');
  expect(sample.unloadAudit?.camera?.marketPostSightline?.modelledPosts)
   .toBe(sample.physicalPosts);
  expect(sample.unloadAudit?.camera?.marketPostSightline?.modelledLanterns)
   .toBe(2);
  expect(sample.unloadAudit?.camera?.marketPostSightline?.centerCover)
   .toBeLessThan(0.16);

  expect(sample.receipt?.creditedAtUnloading).toBe(true);
  expect(sample.receipt?.amount).toBe(sample.loaded.amount);
  expect(sample.receivedAudit?.stage).toBe('received');
  expect(sample.receivedAudit?.deliveryId).toBe(sample.receipt?.id);
  expect(sample.receivedAudit?.camera?.zoom).toBeLessThanOrEqual(7.2);
  expect(sample.receivedAudit?.camera?.blockers).toBeGreaterThanOrEqual(0);
  expect(sample.width).toBeLessThanOrEqual(viewport.width);
  // The authoritative receipt is held in a bounded presentation log and is
  // deliberately NOT inside saved worlds. Film it in the actual live state
  // BEFORE restoring a saved unloading checkpoint (which clears receipts).
  await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.__tinyKingdom.getDeliveryReceipts()
   .some(r=>r.id===window.__tinyKingdom.getCourierDocumentaryCameraAudit().deliveryId))).toBe(true);
  expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
  await info.attach('W36-real-credited-receipt-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'});
  await page.evaluate(s=>{
   const g=window.__tinyKingdom;g.restoreSnapshot(s);g.setSpeed(0);
   g.watchDelivery();
  },sample.unloadSnapshot);
  await page.waitForTimeout(350);
  expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
  await info.attach('W36-real-unloading-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'});
  expect(errors).toEqual([]);
 });
}
