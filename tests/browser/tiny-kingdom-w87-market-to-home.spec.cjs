'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// RED first: existing genuine merchants and home assignments only, no
// authored simulation events. WebGL safety test, not independent visual proof.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W87 original market-to-real-home square and responsive view '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const market=g.getMarketQuarterStats(),street=g.getMarketHomeStreetAudit();
   return {market,street,sameWorld:before===JSON.stringify(g.exportSnapshot()),
    city:g.metrics(),scene:g.renderStats(),geometry:g.getGeometryAudit(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(result.market.stalls).toBe(4);
  expect(result.market.reworkedBooths).toBe(4);
  expect(result.market.tileRoofs).toBe(2);
  expect(result.market.canvasRoofs).toBe(2);
  expect(result.market.timberBraces).toBe(16);
  expect(result.street.connected).toBe(true);
  expect(result.street.waypoints).toBeGreaterThanOrEqual(2);
  expect(result.street.resident).toBeTruthy();
  expect(result.street.sections).toBeGreaterThan(0);
  expect(result.street.totalTriangles).toBeGreaterThan(0);
  expect(result.street.totalTriangles).toBeLessThan(900);
  expect(result.street.unsafeSamples).toBe(0);
  expect(result.street.inventedHomes).toBe(0);
  expect(result.street.inventedDeliveries).toBe(0);
  expect(result.street.authorityModified).toBe(false);
  expect(result.street.stillAssigned).toBe(true);
  expect(result.sameWorld).toBe(true);
  expect(result.city.citizens).toBeGreaterThan(0);
  expect(result.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(result.geometry.static.invalidComponents).toBe(0);
  expect(result.geometry.dynamic.invalidComponents).toBe(0);
  expect(result.gl).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w87',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w87/'+viewport.width+'.json',
   JSON.stringify(result,null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w87/'+viewport.width+'.png'});
 });
}
test('W87 genuine Day-120 growing town retains the market and assigned home',async({page})=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
 const before=await page.evaluate(()=>window.__tinyKingdom.metrics());
 const growth=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  return {snapshot:JSON.stringify(g.exportSnapshot()),frames:g.getFrameProfile().totalFrames};
 });
 await page.waitForFunction(frames=>window.__tinyKingdom.getFrameProfile().totalFrames>frames,
  growth.frames,{timeout:110000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {snapshot:JSON.stringify(g.exportSnapshot()),city:g.metrics(),
   market:g.getMarketQuarterStats(),street:g.getMarketHomeStreetAudit(),
   scene:g.renderStats(),geometry:g.getGeometryAudit(),
   gl:document.getElementById('world').getContext('webgl')?.getError()};
 });
 expect(after.snapshot).toBe(growth.snapshot);
 expect(after.city.citizens).toBeGreaterThanOrEqual(before.citizens);
 expect(after.city.buildings).toBeGreaterThan(before.buildings);
 expect(after.market.reworkedBooths).toBe(4);
 expect(after.street.connected).toBe(true);
 expect(after.street.stillAssigned).toBe(true);
 expect(after.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(after.geometry.static.invalidComponents).toBe(0);
 expect(after.geometry.dynamic.invalidComponents).toBe(0);
 expect(after.gl).toBe(0);
 expect(errors).toEqual([]);
 fs.mkdirSync('artifacts/tiny-kingdom-w87',{recursive:true});
 fs.writeFileSync('artifacts/tiny-kingdom-w87/day120.json',JSON.stringify({before,after},null,2));
 await page.screenshot({path:'artifacts/tiny-kingdom-w87/day120.png'});
});
