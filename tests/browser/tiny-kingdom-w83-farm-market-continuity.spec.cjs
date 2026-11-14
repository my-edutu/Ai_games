'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W83 RED-first behavior+visual safety contract. This observes the ACTUAL
// walkable granary-to-market route, not a fabricated cinematic/cart route.
// The contiguous static farm service lane, drainage and receiving ramp are
// road geometry only: all real houses, workers, economic transactions,
// routing decisions and seeded save/replay must remain unchanged.
// Source-level coverage is never equivalent to independent LOOK/FEEL/PLAY.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]) {
 test('W83 real navigable farm–market service street at '+viewport.width+'px',async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const audit=g.getFarmMarketStreetAudit();
   const after=JSON.stringify(g.exportSnapshot());
   return {audit,authoritativeWorldUnchanged:before===after,
    geometry:g.getGeometryAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    city:g.metrics(),overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  const a=result.audit;
  expect(a.source).toBe('walkable-granary-to-real-receiving-market-street');
  expect(a.connected).toBe(true);
  expect(a.waypoints).toBeGreaterThanOrEqual(2);
  expect(a.sections).toBeGreaterThan(25);
  expect(a.trackLength).toBeGreaterThan(20);
  expect(a.trackLength).toBeLessThan(95);
  expect(a.rutBands).toBe(a.sections*2);
  expect(a.mudBaseStrips).toBe(a.sections);
  expect(a.totalTriangles).toBeGreaterThan(200);
  expect(a.granaryPorchPosts).toBe(2);
  expect(a.granaryRoofPanels).toBe(8);
  expect(a.granaryPorchClearWidth).toBeGreaterThan(2.6);
  expect(a.granaryTradeEntranceUnblocked).toBe(true);
  expect(a.totalTriangles).toBeLessThan(2500);
  expect(a.unsafeSamples).toBe(0);
  expect(a.realOrigin).toEqual([29,-7.6]);
  expect(a.realDestination).toEqual([-1,10.2]);
  expect(a.inventedDeliveries).toBe(0);
  expect(a.changesNavigation).toBe(false);
  expect(a.authorityModified).toBe(false);
  expect(result.authoritativeWorldUnchanged).toBe(true);
  expect(result.city.citizens).toBeGreaterThan(0);
  expect(result.triangles).toBeLessThan(160000);
  expect(result.geometry.static.invalidComponents).toBe(0);
  expect(result.geometry.dynamic.invalidComponents).toBe(0);
  expect(result.gl).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w83',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w83/'+viewport.width+'-street-audit.json',
    JSON.stringify({viewport,result},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w83/'+viewport.width+'-granary-market.png'});
 });
}
test('W83 authentic 120-day growth retains seeded economy and full population',async({page})=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
 const before=await page.evaluate(()=>window.__tinyKingdom.metrics());
 const growth=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<120*24*30;i++)g.step(1/30);
   return {snapshot:JSON.stringify(g.exportSnapshot()),
     frames:g.getFrameProfile().totalFrames};
 });
 await page.waitForFunction(frames=>
   window.__tinyKingdom.getFrameProfile().totalFrames>frames,
   growth.frames,{timeout:110000});
 const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),city:g.metrics(),
     geometry:g.getGeometryAudit(),scene:g.renderStats(),
     gl:document.getElementById('world').getContext('webgl')?.getError(),
     street:g.getFarmMarketStreetAudit()};
 });
 expect(after.snapshot).toBe(growth.snapshot);
 expect(after.city.citizens).toBeGreaterThanOrEqual(before.citizens);
 expect(after.city.buildings).toBeGreaterThan(before.buildings);
 expect(after.street.inventedDeliveries).toBe(0);
 expect(after.street.authorityModified).toBe(false);
 expect(after.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 expect(after.geometry.static.invalidComponents).toBe(0);
 expect(after.geometry.dynamic.invalidComponents).toBe(0);
 expect(after.gl).toBe(0);expect(errors).toEqual([]);
 fs.mkdirSync('artifacts/tiny-kingdom-w83',{recursive:true});
 fs.writeFileSync('artifacts/tiny-kingdom-w83/day120-audit.json',
   JSON.stringify({before,after},null,2));
 await page.screenshot({path:'artifacts/tiny-kingdom-w83/day120.png'});
});
