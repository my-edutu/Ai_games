'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// The food story must occupy the ORIGINAL simulated granary. Visible bags are
// a bounded presentation of real, non-transit village inventory, not fake
// harvests or inventory awarded by a view/camera interaction.
test('W02 supplies make the real granary readable in the running village, including mobile',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const supply=g.getGranarySupplyAudit();
  const empty=g.getGranaryStorePlan(0,12,0);
  const growing=g.getGranaryStorePlan(350,12,0);
  const onRoad=g.getGranaryStorePlan(350,12,350);
  return {before,after:JSON.stringify(g.exportSnapshot()),supply,empty,growing,onRoad,
   metrics:g.metrics(),triangles:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(initial.after).toBe(initial.before);
 expect(initial.supply.source).toBe('real-village-food-inventory');
 expect(initial.supply.granary).toEqual([29,-5]);
 expect(initial.supply.totalFood).toBeCloseTo(initial.metrics.food,2);
 expect(initial.supply.visibleSacks).toBe(initial.supply.stockPlan.sacks);
 expect(initial.supply.approximateUnitsPerSack).toBe(35);
 expect(initial.empty.sacks).toBe(0);
 expect(initial.onRoad.sacks).toBe(0);
 expect(initial.growing.sacks).toBeGreaterThan(initial.empty.sacks);
 expect(initial.growing.sacks).toBeLessThanOrEqual(12);
 expect(initial.supply.lastRenderedSacks).toBe(initial.supply.visibleSacks);
 expect(initial.supply.lastRenderedTriangles).toBeGreaterThanOrEqual(0);
 expect(initial.triangles).toBeLessThan(160000);
 expect(initial.gl).toBe(0);
 await page.locator('[data-scenic="farm"]').click();
 const tour=await page.evaluate(()=>({
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  camera:window.__tinyKingdom.getCamera(),
  label:document.querySelector('[data-scenic="farm"]').getAttribute('aria-label')
 }));
 expect(tour.snapshot).toBe(initial.before);
 expect(tour.camera.focus[0]).toBeGreaterThan(22);
 expect(tour.camera.focus[0]).toBeLessThan(31);
 expect(tour.label).toContain('food stores');
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(300);
 const mobile=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  button:document.querySelector('[data-scenic="farm"]')?.getBoundingClientRect().width,
  supply:window.__tinyKingdom.getGranarySupplyAudit(),
  gl:document.getElementById('world').getContext('webgl')?.getError()??-1
 }));
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.snapshot).toBe(initial.before);
 expect(mobile.button).toBeGreaterThan(0);
 expect(mobile.supply.visibleSacks).toBe(initial.supply.visibleSacks);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
