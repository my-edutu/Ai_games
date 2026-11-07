'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W49: no staged carts. Find an ACTUAL completed producer work event with an
// escrowed load, select the original documentary shot and verify physical
// static and moving wooden obstruction volumes on desktop and 390px.
test.use({video:'on'});
test('W49 real producer-to-market film avoids physical freight foreground at desktop and 390px',async({page},info)=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const desktop=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
  if(typeof g.getPhysicalCartSightlineAudit!=='function')
   return {error:'W49 actual freight camera audit missing'};
  let found=null;
  for(let step=0;step<44000;step++){
   g.step(1/30);
   if(step%4===0){
    found=g.getActiveDeliveries().find(d=>d.escrowed&&d.stage==='travel');
    if(found)break;
   }
  }
  if(!found)return {error:'no authentic escrowed delivery'};
  const before=JSON.stringify(g.exportSnapshot());
  const watching=g.watchDelivery(),audit=g.getPhysicalCartSightlineAudit();
  const camera=g.getCitizenCameraPlan();
  const repeated=g.getPhysicalCartSightlineAudit();
  const after=JSON.stringify(g.exportSnapshot());
  return {found,watching,audit,camera,repeated,readOnly:before===after,
   widths:document.documentElement.scrollWidth,
   citizens:g.getCitizenProfiles().length,
   snapshotCitizens:g.getState().people.length};
 });
 expect(desktop.error||'').toBe('');
 expect(desktop.readOnly).toBe(true);
 expect(desktop.audit?.source).toBe('real-loaded-courier-and-market-camera-occlusion');
 expect(desktop.audit?.altersAuthority).toBe(false);
 expect(desktop.audit?.actualLoadedDeliveries).toBeGreaterThan(0);
 expect(desktop.audit?.movingCarts).toBe(desktop.audit?.actualLoadedDeliveries);
 expect(desktop.audit?.fixedCarts).toBe(1);
 expect(desktop.audit?.receivingDocks).toBe(2);
 expect(desktop.audit?.selectedCart?.deliveryId).toBe(desktop.watching?.id);
 expect(desktop.audit?.selectedCart?.rx).toBeGreaterThan(.3);
 expect(desktop.audit?.selectedCart?.rz).toBeGreaterThan(.3);
 expect(desktop.camera?.foregroundCargoCover).toBeGreaterThanOrEqual(0);
 expect(desktop.camera?.foregroundCargoCover).toBeLessThan(.44);
 expect(desktop.audit?.plannedForegroundCargoCover).toBe(desktop.camera?.foregroundCargoCover);
 expect(desktop.repeated?.observedForegroundCargoCover).toBe(desktop.audit?.observedForegroundCargoCover);
 // The first authentic credited courier can occur at the initial twelve
 // founders. Preserve the real population rather than hardcoding Day-120.
 expect(desktop.citizens).toBeGreaterThan(0);
 expect(desktop.citizens).toBe(desktop.snapshotCitizens);
 expect(desktop.widths).toBeLessThanOrEqual(1024);
 await page.waitForTimeout(450);
 fs.mkdirSync('artifacts/tiny-kingdom-w49',{recursive:true});
 await info.attach('W49-actual-credited-cart-desktop',{body:await page.screenshot(),contentType:'image/png'});
 await page.screenshot({path:'artifacts/tiny-kingdom-w49/real-courier-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.watchDelivery();
  return {audit:g.getPhysicalCartSightlineAudit(),
   camera:g.getCitizenCameraPlan(),
   width:document.documentElement.scrollWidth,
   triangles:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.audit.mode).toBe('portrait');
 expect(mobile.audit.selectedCart?.deliveryId).toBe(desktop.audit.selectedCart?.deliveryId);
 expect(mobile.audit.movingCarts).toBeGreaterThan(0);
 expect(mobile.audit.fixedCarts).toBe(1);
 expect(mobile.audit.receivingDocks).toBe(2);
 expect(mobile.audit.plannedForegroundCargoCover).toBe(mobile.camera.foregroundCargoCover);
 expect(mobile.camera.foregroundCargoCover).toBeLessThan(.44);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.waitForTimeout(450);
 await page.screenshot({path:'artifacts/tiny-kingdom-w49/real-courier-390px.png'});
 await info.attach('W49-actual-credited-cart-390px',{body:await page.screenshot(),contentType:'image/png'});
 console.log('W49 actual physical documentary camera',JSON.stringify({
  delivery:desktop.watching?.id,desktopCover:desktop.camera.foregroundCargoCover,
  portraitCover:mobile.camera.foregroundCargoCover,
  realCarts:mobile.audit.movingCarts,citizens:desktop.citizens}));
});
