'use strict';
const {test,expect} = require('@playwright/test');
const fs = require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W79: the real G088/W68 moving market video exposed a wall of foreground
// oak posts and repetitive checkerboard paving. The rebuilt, original
// physically modelled entry must remain a genuine arch, open a broad
// human-height sightline, and reduce world triangles without hiding anyone.
// This contract is written before the playable source. No staged actors.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W79 open original market gateway and true courtyard at '+viewport.width+'px',async({page})=>{
  test.setTimeout(250000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:115000});
  const actual=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const worldBefore=JSON.stringify(g.exportSnapshot());
   const gateway=g.getMarketGatewayAudit();
   const street=g.getHighStreetStats();
   const terrain=g.getTerrainHeight;
   const x=gateway.x,z=gateway.z;
   // A physical ray aimed at an actual edge support MUST detect that post;
   // the same ray down the delivery centre should not be blocked by a post.
   const post=g.getMarketStructuralSightline(
    [x+gateway.postOffset,terrain(x+gateway.postOffset,z+2.5)+1.65,z+2.5],
    [x+gateway.postOffset,terrain(x+gateway.postOffset,z-2.5)+1.35,z-2.5]);
   const centre=g.getMarketStructuralSightline(
    [x,terrain(x,z+2.5)+1.65,z+2.5],
    [x,terrain(x,z-2.5)+1.35,z-2.5]);
   return {gateway,street,post,centre,
    realReceivingPosts:g.getTradeCorridorCameraAudit().marketPosts,
    worldIdentical:worldBefore===JSON.stringify(g.exportSnapshot()),
    citizens:g.metrics().citizens,city:g.metrics().buildings,
    triangles:g.renderStats().lastFrameTriangles,
    invalid:g.getGeometryAudit(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(actual.gateway.source).toBe('physical-open-trade-gateway-and-sett-street');
  // W208 true worn-earth receiving court has 131 actual scattered setts.
  expect(actual.gateway.pavingStones).toBeGreaterThanOrEqual(100);
  expect(actual.gateway.pavingStones).toBeLessThanOrEqual(160);
  expect(actual.gateway.postOffset).toBeGreaterThanOrEqual(2.7);
  expect(actual.gateway.postWidth).toBeLessThanOrEqual(.20);
  expect(actual.gateway.postHeight).toBeGreaterThanOrEqual(3.5);
  expect(actual.gateway.openClearWidth).toBeGreaterThan(5);
  expect(actual.gateway.hasRealStonePlinths).toBe(true);
  expect(actual.street.surfacePattern).toBe('original-worn-clay-wheelway-and-stone-margins');
  expect(actual.street.pavingStones).toBeGreaterThanOrEqual(180);
  expect(actual.street.pavingStones).toBeLessThanOrEqual(260);
  expect(actual.gateway.ornamentalOnly).toBe(true);
  // The authentic receiving hall added four supported posts since W79.
  // Camera witness must include all physical objects, not stale constants.
  expect(actual.post.modelledPosts).toBe(actual.gateway.structuralPosts+actual.realReceivingPosts);
  expect(actual.post.postsInFrame).toBeGreaterThan(0);
  expect(actual.post.centerCover).toBeGreaterThan(actual.centre.centerCover);
  expect(actual.centre.centerCover).toBeLessThan(.08);
  expect(actual.worldIdentical).toBe(true);
  expect(actual.citizens).toBeGreaterThan(0);
  expect(actual.triangles).toBeLessThan(160000);
  expect(actual.invalid.static.invalidComponents).toBe(0);
  expect(actual.invalid.dynamic.invalidComponents).toBe(0);
  expect(actual.glError).toBe(0);
  expect(actual.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w79',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w79/'+viewport.width+'-courtyard.json',
   JSON.stringify(actual,null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w79/'+viewport.width+'-courtyard.png'});
 });
}

test('W79 grown original village remains complete and inside safety budget',async({page})=>{
 test.setTimeout(260000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
  null,{timeout:115000});
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  const before=g.metrics();
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  return {before,after:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 // Wait for a REAL drawn grown-world frame, not the already-present Day-1
 // frame. The exact original burgage material audit counts actual city lots.
 await page.waitForFunction(()=>{
  const g=window.__tinyKingdom;
  return g.getMarketGatewayAudit().pavingStones>=100 &&
   g.getMarketGatewayAudit().pavingStones<=160 &&
   g.getBurgageMaterialAudit().homes===g.metrics().buildings-2;
 },null,{timeout:115000});
 const rendered=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {metrics:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot()),
   triangleCount:g.renderStats().lastFrameTriangles,
   gateway:g.getMarketGatewayAudit(),
   glError:document.querySelector('#world').getContext('webgl')?.getError(),
   invalid:g.getGeometryAudit()};
 });
 expect(rendered.metrics.citizens).toBe(result.after.citizens);
 expect(rendered.metrics.buildings).toBe(result.after.buildings);
 expect(rendered.metrics.citizens).toBeGreaterThanOrEqual(result.before.citizens);
 expect(rendered.metrics.buildings).toBeGreaterThan(result.before.buildings);
 expect(rendered.snapshot).toBe(result.snapshot);
 expect(rendered.gateway.pavingStones).toBeLessThanOrEqual(160);
 expect(rendered.triangleCount).toBeLessThan(160000);
 expect(rendered.invalid.static.invalidComponents).toBe(0);
 expect(rendered.invalid.dynamic.invalidComponents).toBe(0);
 expect(rendered.glError).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w79/day120-market.png'});
});
