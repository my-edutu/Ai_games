'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W127: old manual Delivery mode inherited the far spectator lens.
// Actors/consignments are generated ONLY by the original seeded work().
test.use({video:'on'});
test('W127 real cargo courier stays visible and route-framed on desktop and phone',async({page},info)=>{
 test.setTimeout(260000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
 const desktop=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();g.setSpeed(0);let load=null;
  for(let i=0;i<44000;i++){g.step(1/30);if(i%4===0){
   load=g.getActiveDeliveries().find(d=>d.escrowed&&d.stage==='travel');if(load)break;
  }}
  if(!load)return {error:'No genuine loaded courier'};
  const before=JSON.stringify(g.exportSnapshot());
  const watched=g.watchDelivery(load.id),view=g.getCourierDocumentaryCameraAudit();
  return {load,watched,view,unchanged:before===JSON.stringify(g.exportSnapshot()),
   width:document.documentElement.scrollWidth};
 });
 expect(desktop.error||'').toBe('');
 expect(desktop.unchanged).toBe(true);
 expect(desktop.watched?.id).toBe(desktop.load?.id);
 expect(desktop.view?.stage).toBe('travel');
 expect(desktop.view?.camera?.courierRouteCamera).toBe(true);
 expect(Number.isFinite(desktop.view?.camera?.routeHeading)).toBe(true);
 expect(desktop.view?.camera?.zoom).toBeLessThanOrEqual(7.2);
 expect(desktop.view?.camera?.projectedWorkerHeightFraction).toBeGreaterThan(.12);
 expect(desktop.width).toBeLessThanOrEqual(1024);
 await page.waitForTimeout(350);
 await info.attach('W127 actual moving courier desktop',{body:await page.screenshot(),contentType:'image/png'});
 await page.setViewportSize({width:390,height:844});
 const phone=await page.evaluate(id=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const watched=g.watchDelivery(id),view=g.getCourierDocumentaryCameraAudit();
  return {watched,view,unchanged:before===JSON.stringify(g.exportSnapshot()),
   width:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 },desktop.load.id);
 expect(phone.unchanged).toBe(true);
 expect(phone.watched?.id).toBe(desktop.load.id);
 expect(phone.view?.camera?.courierRouteCamera).toBe(true);
 expect(Number.isFinite(phone.view?.camera?.routeHeading)).toBe(true);
 expect(phone.view?.camera?.zoom).toBeLessThanOrEqual(6.5);
 expect(phone.view?.camera?.projectedWorkerHeightFraction).toBeGreaterThan(.10);
 expect(phone.width).toBeLessThanOrEqual(390);
 expect(phone.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.waitForTimeout(350);
 await info.attach('W127 actual moving courier phone',{body:await page.screenshot(),contentType:'image/png'});
 console.log('W127 route camera',JSON.stringify({id:desktop.load.id,desktop:desktop.view.camera,phone:phone.view.camera}));
});
