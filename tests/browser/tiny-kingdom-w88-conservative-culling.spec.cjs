'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W88 RED-FIRST: a conservative resident-scene acceleration hierarchy must
// NEVER drop original geometry. Compare every real source chunk against the
// legacy positive-AABB frustum test at the SAME actual WebGL camera matrix.
// Independent performance and visual acceptance require recordings/hardware.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W88 real village scene hierarchy exactly matches naive frustum '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   return {reference:g.getScenicCullReferenceAudit(),hierarchy:g.getScenicCullHierarchyAudit(),
    market:g.getMarketQuarterStats(),sameWorld:before===JSON.stringify(g.exportSnapshot()),
    metrics:g.metrics(),scene:g.renderStats(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    error:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(initial.reference.missingChunks).toBe(0);
  expect(initial.reference.falseVisibleChunks).toBe(0);
  expect(initial.reference.checkedChunks).toBeGreaterThan(0);
  expect(initial.hierarchy.groupsBuilt).toBeGreaterThan(0);
  expect(initial.hierarchy.groupEdge).toBe(16);
  expect(initial.hierarchy.authorityChanged).toBe(false);
  expect(initial.hierarchy.drawsAltered).toBe(false);
  // W87 must initialize newly added market statistics before incrementing.
  expect(initial.market.reworkedBooths).toBe(4);
  expect(initial.market.tileRoofs).toBe(2);
  expect(initial.market.canvasRoofs).toBe(2);
  expect(initial.market.timberBraces).toBe(16);
  expect(initial.sameWorld).toBe(true);
  expect(initial.metrics.citizens).toBeGreaterThan(0);
  expect(initial.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(initial.error).toBe(0);
  expect(initial.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.evaluate(()=>window.__tinyKingdom.visitMarket());
  await page.waitForTimeout(400);
  const changed=await page.evaluate(()=>window.__tinyKingdom.getScenicCullReferenceAudit());
  expect(changed.missingChunks).toBe(0);
  expect(changed.falseVisibleChunks).toBe(0);
  expect(changed.checkedChunks).toBeGreaterThan(0);
  fs.mkdirSync('artifacts/tiny-kingdom-w88',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w88/'+viewport.width+'.json',
    JSON.stringify({initial,changed},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w88/'+viewport.width+'.png'});
 });
}
