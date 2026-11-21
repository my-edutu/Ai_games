'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W10 RED-FIRST: market display must be physically assigned to the correct
// original stalls and derive from spendable inventory, not permanently baked
// fake grain/herbs/tools or the goods still travelling in an actual cart.
// Witness live WebGL on 1024px and 390px without changing world authority.
test('W10 original market stalls show only real available grain and timber, across mobile and saved replay',async({page})=>{
 test.setTimeout(160000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const entry=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  const before=JSON.stringify(g.exportSnapshot());
  return {before,stock:g.getMarketStallStockAudit?.()??null,
   plan:g.getMarketStallStockPlan?.(0,0,0,0,0)??null,
   full:g.getMarketStallStockPlan?.(210,130,80,0,0)??null,
   oldTransit:g.getMarketStallStockPlan?.(210,130,80,210,130)??null,
   supply:g.getMarketSupplyView(),
   after:JSON.stringify(g.exportSnapshot()),
   render:g.renderStats(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(entry.stock,'No credible physical inventory-to-stall bridge').not.toBeNull();
 expect(entry.plan.sacks).toBe(0);
 expect(entry.plan.logs).toBe(0);
 expect(entry.plan.lockedCoffers).toBe(0);
 expect(entry.full.sacks).toBe(6);
 expect(entry.full.logs).toBe(5);
 expect(entry.oldTransit.sacks).toBe(0);
 expect(entry.oldTransit.logs).toBe(0);
 expect(entry.stock.source).toBe('original-stalls-spendable-village-resources');
 expect(entry.stock.perStall.map(row=>row.trade)).toEqual(['grain','smith','textile','herbs']);
 const [grain,wood,textiles,herbs]=entry.stock.perStall;
 expect(grain.resource).toBe('food');
 expect(wood.resource).toBe('wood');
 expect(grain.x).toBeCloseTo(-5.4,2);
 expect(grain.z).toBeCloseTo(2.25,2);
 expect(wood.x).toBeCloseTo(4.45,2);
 expect(wood.z).toBeCloseTo(2.95,2);
 expect(grain.goods).toBe(entry.supply.sacks);
 expect(wood.goods).toBe(entry.supply.logs);
 expect(textiles.goods).toBe(0);
 expect(herbs.goods).toBe(0);
 expect(entry.stock.lastRenderedSacks).toBe(grain.goods);
 expect(entry.stock.lastRenderedLogs).toBe(wood.goods);
 expect(entry.stock.staticInventedFood).toBe(0);
 expect(entry.stock.staticInventedUnsimulatedGoods).toBe(0);
 expect(entry.after).toBe(entry.before);
 expect(entry.render.lastFrameTriangles).toBeGreaterThan(0);
 expect(entry.gl).toBe(0);
 // The two images below depict a REAL open original market with live WebGL,
 // not a source-level counter or a mocked screenshot of the inventory.
 const desktopVisit=await page.evaluate(()=>window.__tinyKingdom.visitMarket());
 expect(desktopVisit.active).toBe(true);
 await page.waitForTimeout(220);
 const out=path.resolve(__dirname,'../../test-results');
 fs.mkdirSync(out,{recursive:true});
 await page.screenshot({path:path.join(out,'w10-truthful-market-stalls-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(400);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,
   stock:g.getMarketStallStockAudit(),after:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.stock.perStall).toEqual(entry.stock.perStall);
 expect(mobile.after).toBe(entry.before);
 expect(mobile.gl).toBe(0);
 // The mobile capture remains at the authentic on-foot market visit,
 // with the same authoritative village and full 390px viewport.
 expect(await page.evaluate(()=>window.__tinyKingdom.getMarketVisitAudit().active)).toBe(true);
 await page.screenshot({path:path.join(out,'w10-truthful-market-stalls-390.png')});
 expect(errors).toEqual([]);
});
