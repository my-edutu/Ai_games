'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W82 RED-first contract. Packages may only leave a REAL escrowed handcart;
// their intermediate parcel position must contact the real worker's arm
// and settle on the existing 3D market dock, without awarding stock early.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W82 real courier physically places actual escrowed bundles on receiving shelf '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   if(typeof g.getMarketParcelDeliveryPose!=='function')return {error:'Missing original physical parcel trajectory'};
   let delivery=null,placed=null,snapshot=null,earlier=null,readOnly=true;
   for(let tick=0;tick<60000;tick++){
    g.step(1/30);
    if(!delivery){
     const found=g.getActiveDeliveries().find(row=>row.escrowed);
     if(found)delivery=found;
    }
    if(!delivery)continue;
    const before=JSON.stringify(g.exportSnapshot());
    const plan=g.getMarketParcelDeliveryPose(delivery.id);
    if(JSON.stringify(g.exportSnapshot())!==before)readOnly=false;
    if(plan?.active&&plan.parcels.some(row=>row.phase<.24))earlier=plan;
    if(plan?.active&&plan.parcels.some(row=>row.contact==='receiving-shelf')){
     placed=plan;snapshot=g.exportSnapshot();break;
    }
   }
   return {error:!delivery?'No genuine courier':!placed?'No physical receiving shelf placement':null,
    delivery,placed,earlier,snapshot,readOnly,
    parcelAudit:delivery?g.getPhysicalMarketParcelAudit(delivery.id):null,
    width:document.documentElement.scrollWidth};
  });
  expect(result.error).toBeNull();
  expect(result.delivery.amount).toBeGreaterThan(0);
  expect(result.readOnly).toBe(true);
  expect(result.width).toBeLessThanOrEqual(viewport.width);
  expect(result.placed.source).toBe('real-courier-cart-hand-receiving-dock');
  expect(result.placed.id).toBe(result.delivery.id);
  expect(result.placed.escrowed).toBe(true);
  expect(result.placed.bundleCount).toBeGreaterThanOrEqual(1);
  expect(result.placed.bundleCount).toBeLessThanOrEqual(3);
  expect(result.placed.visibleOnCart+result.placed.parcels.length).toBe(result.placed.bundleCount);
  expect(result.placed.parcels.every(row=>row.id===result.delivery.id&&
   row.position.every(Number.isFinite)&&row.dock.every(Number.isFinite))).toBe(true);
  for(const row of result.placed.parcels){
   expect(row.phase).toBeGreaterThanOrEqual(0);
   expect(row.phase).toBeLessThanOrEqual(1);
   if(row.contact==='receiving-shelf'){
    expect(Math.hypot(row.position[0]-row.dock[0],row.position[2]-row.dock[2])).toBeLessThan(.001);
    expect(Math.abs(row.position[1]-row.dock[1])).toBeLessThan(.001);
   }
  }
  expect(result.earlier?.parcels.some(row=>row.contact==='cart-to-hand')).toBe(true);
  await page.evaluate(snapshot=>{
   const g=window.__tinyKingdom;g.restoreSnapshot(snapshot);g.setSpeed(0);g.watchDelivery();
  },result.snapshot);
  await page.waitForTimeout(750);
  expect(await page.evaluate(()=>
   document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
  expect(errors).toEqual([]);
  await testInfo.attach('W82-real-cart-to-dock-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'});
 });
}