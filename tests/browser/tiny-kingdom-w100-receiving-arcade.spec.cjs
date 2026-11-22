'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W100: evidence from an ACTUAL loaded economy and WebGL frame, never a fake set.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W100 real roofed freight hall and uninterrupted original market authority at '+viewport.width+'px',async ({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const hall=g.getMarketReceivingHallAudit();
   const supply=g.getDeliveryEconomyAudit();
   const citizens=g.metrics().citizens;
   const buildings=g.metrics().buildings;
   g.setCamera({yaw:.35,pitch:.54,zoom:18,focus:[-.1,10.3]});
   return {before,hall,supply,citizens,buildings};
  });
  await page.waitForTimeout(400);
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens,
    buildings:g.metrics().buildings,geometry:g.getGeometryAudit(),
    frame:g.renderStats(),gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.hall.originalBays).toBe(2);
  expect(result.hall.roofPanels).toBe(18);
  expect(result.hall.loadBearingPosts).toBe(4);
  expect(result.hall.rearShopGables).toBe(4);
  expect(result.hall.unobstructedCourierAisle).toBeGreaterThan(4);
  expect(result.hall.lowerRoofClearance).toBeGreaterThan(2.2);
  expect(result.hall.openWorkerApproachMeters).toBeGreaterThan(.5);
  // The W254 physical aisle opened the actual two receipt shelves to the sky.\n  // Never require the old obstructing roof over true human hands.\n  expect(result.hall.originalShelfUnderRoof).toBe(false);\n  expect(result.hall.realReceiptShelvesUnderSky).toBe(true);\n  expect(result.hall.openSkyReceivingAisleMetres).toBeGreaterThan(2);
  expect(result.hall.realFreightOnly).toBe(true);
  expect(result.hall.changesNavigation).toBe(false);
  expect(result.hall.fabricatedShipments).toBe(0);
  expect(after.snapshot).toBe(result.before);
  expect(after.citizens).toBe(result.citizens);
  expect(after.buildings).toBe(result.buildings);
  expect(after.frame.lastFrameTriangles).toBeLessThan(160000);
  expect(after.geometry.static.invalidComponents).toBe(0);
  expect(after.geometry.dynamic.invalidComponents).toBe(0);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const dest='artifacts/tiny-kingdom-w100';fs.mkdirSync(dest,{recursive:true});
  fs.writeFileSync(dest+'/'+viewport.width+'-real-receiving-hall.json',
   JSON.stringify({viewport,hall:result.hall,supply:result.supply,after},null,2));
  await page.screenshot({path:dest+'/'+viewport.width+'-market-arcade.png'});
 });
}
