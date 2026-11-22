'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W94 RED-FIRST startup regression from actual failed G091 moving-gameplay
// artifact: "Cannot access 'courierPostRepairCount' before initialization".
// Demand authentic first scene on BOTH user viewports, not a syntax-only PASS.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W94 real 3D world starts and camera works '+viewport.width,
  async({page},testInfo)=>{
   test.setTimeout(170000);
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   await page.setViewportSize(viewport);
   await page.setContent(html,{waitUntil:'load'});
   await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:135000});
   const first=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    g.setSpeed(0);
    return {seededState:JSON.stringify(g.exportSnapshot()),
     metrics:g.metrics(),geometry:g.renderStats(),
     street:g.getFarmMarketStreetAudit(),renderer:g.renderer()};
   });
   expect(first.renderer).toBe('webgl');
   expect(first.metrics.citizens).toBeGreaterThanOrEqual(12);
   expect(first.metrics.buildings).toBeGreaterThanOrEqual(14);
   expect(first.street.connected).toBe(true);
   expect(first.street.inventedDeliveries).toBe(0);
   const frame=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const last=g.getFrameProfile().totalFrames;
    g.setCamera({focus:[-1,10.2],yaw:.62,pitch:.52,zoom:17});
    return last;
   });
   await page.waitForFunction(last=>window.__tinyKingdom.getFrameProfile().totalFrames>last,
    frame,{timeout:135000});
   const after=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {seededState:JSON.stringify(g.exportSnapshot()),
     geometry:g.renderStats(),glError:document.querySelector('#world')
     .getContext('webgl')?.getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   expect(after.seededState).toBe(first.seededState);
   expect(after.geometry.lastFrameTriangles).toBeGreaterThan(0);
   expect(after.glError).toBe(0);
   expect(after.overflow).toBeLessThanOrEqual(0);
   expect(pageErrors).toEqual([]);
   await testInfo.attach('W94-real-market-boot-'+viewport.width,
    {body:await page.screenshot(),contentType:'image/png'});
 });
}