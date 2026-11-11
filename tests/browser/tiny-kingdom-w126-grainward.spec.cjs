'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const DIR='artifacts/tiny-kingdom-w126-grainward';
fs.mkdirSync(DIR,{recursive:true});
const cameras={
 overview:{focus:[8,1],yaw:.85,pitch:.53,zoom:24},
 workday:{focus:[19,0],yaw:.72,pitch:.58,zoom:15},
 market:{focus:[-.7,5.3],yaw:.62,pitch:.52,zoom:18}
};
async function ready(page,width,height){
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.message)));
 await page.setViewportSize({width,height});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
  null,{timeout:120000});
 const renderer=await page.evaluate(()=>window.__tinyKingdom.renderer());
 expect(renderer,'actual software WebGL, not a mocked static scene').toBe('webgl');
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0)});
 return errors;
}
async function assertAndCapture(page,label,cam){
 const first=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.evaluate(c=>{
  const g=window.__tinyKingdom;
  g.setCamera(c);g.setHudMode('cinema');g.setReferenceCapture(true);
 },cam);
 await page.waitForTimeout(1350);
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {city:g.metrics(),world:g.getGrainwardDistrictAudit(),
   street:g.getFarmMarketStreetAudit(),grain:g.getGranaryArchitectureAudit(),footway:g.getInhabitedFootwayAudit(),
   hall:g.getGuildhallVisualStats(),market:g.getMarketQuarterStats(),
   scene:g.renderStats(),geometry:g.getGeometryAudit(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(result.snapshot,'visual pass must never advance authority').toBe(first);
 expect(result.world.connected).toBe(true);
 expect(result.world.sourceStreetOrigin).toEqual([29,-7.6]);
 expect(result.world.trueMarketDestination).toEqual([-1,10.2]);
 expect(result.world.marketStalls).toBe(4);
 expect(result.world.marketRoofFrames).toBe(16);
 // W131: the same true buildings frame one connected, original open market.
 expect(result.world.stoneFrontageHomes).toBe(result.world.architecturalHomes);
 expect(result.world.stoneFacingTriangles).toBeGreaterThan(350);
 expect(result.world.authenticDoorThresholds).toBe(result.world.stoneFrontageHomes*2);
 expect(result.world.marketArcadeSpans).toBe(2);
 expect(result.world.marketArcadeTriangles).toBeGreaterThanOrEqual(70);
 expect(result.world.marketArcadeTriangles).toBeLessThan(240);
 expect(result.world.marketArcadeNoPosts).toBe(true);
 expect(result.world.atticBays).toBeLessThan(result.world.stoneFrontageHomes);
 expect(result.world.grainLoftBays).toBe(2);
 expect(result.world.civicHallBays).toBe(2);
 expect(result.world.actualHomesOnly).toBe(true);
 expect(result.world.architecturalHomes).toBeGreaterThanOrEqual(9);
 expect(result.world.atticBays).toBeGreaterThanOrEqual(5);
 expect(result.world.frontAndRearGableVents).toBeGreaterThanOrEqual(18);
 expect(result.world.homeTriangles).toBeGreaterThan(350);
 expect(result.world.changedNavigation).toBe(false);
 expect(result.world.changedEconomy).toBe(false);
 expect(result.world.createdCitizens).toBe(0);
 expect(result.world.createdDeliveries).toBe(0);
 expect(result.street.unsafeSamples).toBe(0);
 expect(result.street.granaryTradeEntranceUnblocked).toBe(true);
 expect(result.grain.windowFacadePanels).toBe(18);
 expect(result.grain.ventRecessPanels).toBe(2);
 // W237: existing W231 drying/porch roof construction raised this genuine component
 // to 1,259 triangles. Guard its complete real geometry without hiding it.
 expect(result.grain.totalTriangles).toBeGreaterThan(1250);
 expect(result.grain.totalTriangles).toBeLessThan(1500);
 // Only original inhabited house doorways may receive a path, and every
 // paver must join an EXISTING high-street lane, not invent a navigation edge.
 expect(result.footway.originalHousesOnly).toBe(true);
 expect(result.footway.navigationChanged).toBe(false);
 expect(result.footway.inventedGoods).toBe(0);
 expect(result.footway.reachedRealLane).toBeGreaterThanOrEqual(2);
 expect(result.footway.stoneCourseTriangles).toBeGreaterThan(25);
 expect(result.footway.stoneCourseTriangles).toBeLessThan(2400);
 expect(result.footway.stoneCourseTriangles % 2).toBe(0);
 expect(result.geometry.static.invalidComponents).toBe(0);
 expect(result.geometry.dynamic.invalidComponents).toBe(0);
 expect(result.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(result.gl).toBe(0);
 expect(result.overflow).toBeLessThanOrEqual(0);
 const {snapshot,...audit}=result;
 fs.writeFileSync(DIR+'/'+label+'.json',JSON.stringify(audit,null,2));
 await page.screenshot({path:DIR+'/'+label+'.png'});
 return audit;
}
for(const size of [{width:1024,height:640},{width:390,height:844}]){
 test('W126 authentic grainward full WebGL geometry, market, workday, town at '+size.width,async({page})=>{
  test.setTimeout(300000);
  const errors=await ready(page,size.width,size.height);
  await page.evaluate(()=>window.__tinyKingdom.reset());
  const records={};
  for(const [view,cam] of Object.entries(cameras))
   records[view]=await assertAndCapture(page,size.width+'-'+view,cam);
  expect(errors).toEqual([]);
  expect(records.overview.world.architecturalHomes).toBe(
   records.market.world.architecturalHomes);
 });
}
test('W126 real 120-day inhabited growth, valid street and replay round-trip',async({page})=>{
 test.setTimeout(360000);
 const errors=await ready(page,1024,640);
 await page.evaluate(()=>window.__tinyKingdom.reset());
 const start=await page.evaluate(()=>window.__tinyKingdom.metrics());
 for(let part=0;part<12;part++)await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<7200;i++)g.step(1/30);
 });
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {snapshot:g.exportSnapshot(),metrics:g.metrics()};
 });
 const audit=await assertAndCapture(page,'1024-day120',cameras.overview);
 // Inspect the SAME advanced, actual world at 390px; do not advance it again.
 await page.setViewportSize({width:390,height:844});
 const portrait=await assertAndCapture(page,'390-day120',cameras.market);
 expect(portrait.city.buildings).toBe(audit.city.buildings);
 expect(portrait.city.citizens).toBe(audit.city.citizens);
 expect(portrait.world.stoneFrontageHomes).toBe(audit.world.stoneFrontageHomes);
 expect(audit.city.citizens).toBeGreaterThanOrEqual(start.citizens);
 expect(audit.city.buildings).toBeGreaterThan(start.buildings);
 expect(audit.world.architecturalHomes).toBeGreaterThanOrEqual(9);
 const roundtrip=await page.evaluate(snapshot=>{
  const g=window.__tinyKingdom;
  const was=g.exportSnapshot();
  g.restoreSnapshot(snapshot);
  const after=g.exportSnapshot();
  return {identical:JSON.stringify(was)===JSON.stringify(after),
   buildings:g.metrics().buildings,citizens:g.metrics().citizens};
 },first.snapshot);
 expect(roundtrip.identical).toBe(true);
 expect(roundtrip.buildings).toBe(first.metrics.buildings);
 expect(roundtrip.citizens).toBe(first.metrics.citizens);
 expect(errors).toEqual([]);
});