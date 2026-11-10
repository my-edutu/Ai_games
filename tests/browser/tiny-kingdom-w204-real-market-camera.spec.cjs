'use strict';
// W204 actual unmodified autonomous farmer -> credited receipt -> physical
// receiving-market view. Genuine production world, no injected actors/goods.
// 1024/390 screenshots are evidence of scene and UI, NOT blind A/B or GPU FPS.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w204');
fs.mkdirSync(OUT,{recursive:true});
test.use({video:'on'});

async function realDraw(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
 await page.waitForTimeout(130);
}

test('W204 one actual credited grain parcel physically holds on the true market on 1024px and 390px',async({page})=>{
 test.setTimeout(580000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 // Start at a real, already loaded food courier. An arbitrary early farmer
 // harvesting is NOT necessarily the named producer of the next credited lot.
 const producer=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.reset();g.setSpeed(0);
  for(let i=0;i<65000;i++){
   g.step(1/30);
   if(i%4)continue;
   const freight=g.getActiveDeliveries().find(d=>d.job==='farmer'&&
    d.resource==='food'&&d.escrowed&&d.amount>0);
   if(!freight)continue;
   const old=JSON.stringify(g.exportSnapshot());
   const trace=g.watchRealGrainJourney();
   if(trace?.producer===freight.citizen&&trace.deliveryId===freight.id)
    return {freight,trace,observedOnly:old===JSON.stringify(g.exportSnapshot())};
   if(trace)g.stopRealGrainJourney();
  }
  return null;
 });
 expect(producer,'No authentic loaded food courier, cannot fabricate shipment').toBeTruthy();
 expect(producer.observedOnly).toBe(true);
 expect(producer.trace?.deliveryId).toBe(producer.freight.id);
 const realReceipt=await page.evaluate(name=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<100000;i++){
   g.step(1/30);
   if(i%9)continue;
   const a=g.getRealGrainJourneyAudit();
   if(a.verifiedReceipt){
    const receipt=g.getDeliveryReceipts().find(r=>r.id===a.deliveryId);
    if(receipt?.citizen===name&&receipt.creditedAtUnloading===true)
     return {receipt,trace:a};
   }
  }
  return null;
 },producer.freight.citizen);
 expect(realReceipt,'Original named farmer never delivered valid grain').toBeTruthy();
 await realDraw(page);
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {audit:g.getRealGrainJourneyAudit(),
   authority:JSON.stringify(g.exportSnapshot()),
   scene:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??0,
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(before.audit.stage).toBe('received');
 expect(before.audit.marketCameraActive).toBe(true);
 expect(before.audit.marketReceiptSightline?.receiptId).toBe(realReceipt.receipt.id);
 expect(before.audit.marketReceiptSightline?.verifiedClearEyes).toBeGreaterThan(0);
 expect(before.audit.marketReceiptSightline?.sceneCover).toBeLessThan(.34);
 expect(before.audit.marketReceiptSightline?.canopyCover).toBeLessThan(.27);
 expect(before.scene).toBeLessThan(160000);
 expect(before.gl).toBe(0);
 expect(before.overflow).toBeLessThanOrEqual(0);
 await page.screenshot({path:path.join(OUT,'actual-credited-grain-market-1024.png')});
 await page.setViewportSize({width:390,height:844});
 await realDraw(page);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {audit:g.getRealGrainJourneyAudit(),
   authority:JSON.stringify(g.exportSnapshot()),
   scene:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??0,
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(mobile.audit.marketCameraActive).toBe(true);
 expect(mobile.audit.marketReceiptSightline?.receiptId).toBe(realReceipt.receipt.id);
 expect(mobile.audit.marketReceiptSightline?.verifiedClearEyes).toBeGreaterThan(0);
 expect(mobile.scene).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.authority).toBe(before.authority,
  'viewport and camera-only receipt shot cannot change food, jobs or replay');
 await page.screenshot({path:path.join(OUT,'actual-credited-grain-market-390.png')});
 fs.writeFileSync(path.join(OUT,'w204-genuine-market-sightline.json'),
  JSON.stringify({source:'original-same-parcel-autonomous-workday',
   producer:producer.freight.citizen,shipment:producer.freight,receipt:realReceipt.receipt,
   originalWorldSource:realReceipt.trace?.source||'grain-chain',
   desktop:{...before,authority:'same checked snapshot'},
   mobile:{...mobile,authority:'identical to desktop'},
   softwareRendererOnly:true,hardwareFPS:'NOT MEASURED',
   baselineMatchedVideo:false,independentCritic:'NOT AVAILABLE',
   errors},null,2));
 expect(errors).toEqual([]);
});
