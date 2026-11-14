'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W84: test the actual immobile grain-store architecture, not a mock render.
// Original granary, genuine workers and inventory authority must be unchanged.
// A source/geometry PASS does NOT establish running visual transformation.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W84 credible physical grain loft and continuous service road '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const loft=g.getGranaryArchitectureAudit();
   const road=g.getFarmMarketStreetAudit();
   const after=JSON.stringify(g.exportSnapshot());
   const scene=g.renderStats(),geometry=g.getGeometryAudit();
   return {loft,road,unchanged:before===after,scene,geometry,
    city:g.metrics(),overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  const a=result.loft;
  expect(a.source).toBe('raised-authentic-granary-loft-and-road');
  expect(a.raisedPiers).toBe(4);
  expect(a.granaries).toBe(1);
  expect(a.roofCourseRows).toBe(8);
  expect(a.newRoofCourseTriangles).toBe(32);
  expect(a.replacedSingleTileTriangles).toBe(252);
  expect(a.ventilatedGableFaces).toBe(2);
  expect(a.louverSlats).toBeGreaterThanOrEqual(10);
  expect(a.structuralDiagonalBraces).toBeGreaterThanOrEqual(8);
  expect(a.groundFloorClearanceMet).toBe(true);
  expect(a.realDoorUnblocked).toBe(true);
  expect(a.addedAuthorityItems).toBe(0);
  expect(a.changesNavigation).toBe(false);
  expect(a.totalTriangles).toBeGreaterThan(100);
  // Ventilated real granary roof has 1,189 triangles; retain local and world caps.
  expect(a.totalTriangles).toBeLessThan(1400);
  expect(result.road.connected).toBe(true);
  expect(result.road.granaryTradeEntranceUnblocked).toBe(true);
  expect(result.city.citizens).toBeGreaterThan(0);
  expect(result.unchanged).toBe(true);
  expect(result.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(result.geometry.static.invalidComponents).toBe(0);
  expect(result.geometry.dynamic.invalidComponents).toBe(0);
  expect(result.gl).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w84',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w84/'+viewport.width+'-granary.json',JSON.stringify({viewport,result},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w84/'+viewport.width+'-granary.png'});
 });
}
