'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('W106 real medieval market exchange, wet paving and receiving dock stay playable at 1024 and 390px',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
  null,{timeout:100000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const market=g.getMarketQuarterStats(),exchange=g.getCentralExchangeAudit();
  return {market,exchange,world:g.metrics(),
   unchanged:JSON.stringify(g.exportSnapshot())===before,
   errors:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(initial.exchange.source).toBe('w106-original-open-timber-weighing-exchange');
 expect(initial.exchange.originalPostPositions).toBe(4);
 expect(initial.exchange.roofPanels).toBe(2);
 expect(initial.exchange.unverifiedStockProps).toBe(0);
 expect(initial.exchange.triangles).toBeGreaterThan(100);
 expect(initial.exchange.triangles).toBeLessThan(900);
 expect(initial.market.surfaceModel).toBe('w208-natural-clay-market-and-freight-wagonway');
 expect(initial.market.pavingStones).toBeGreaterThanOrEqual(90);
 expect(initial.market.pavingStones).toBeLessThanOrEqual(165);
 expect(initial.market.marketWheelPassages).toBe(22);
 expect(initial.market.marketDrainSegments).toBe(22);
 expect(initial.market.receivingDrainSegments).toBe(14);
 expect(initial.market.receivingBays).toBeGreaterThanOrEqual(2);
 expect(initial.world.citizens).toBeGreaterThan(0);
 expect(initial.world.buildings).toBeGreaterThan(0);
 expect(initial.unchanged).toBe(true);
 expect(initial.errors).toBe(0);
 await page.locator('[data-scenic="market"]').click();
 await page.waitForTimeout(300);
 await page.screenshot({path:test.info().outputPath('w106-real-market-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(400);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom,begin=JSON.stringify(g.exportSnapshot());
  return {surface:g.getMarketQuarterStats().surfaceModel,
   exchange:g.getCentralExchangeAudit(),overflow:document.documentElement.scrollWidth-innerWidth,
   changed:JSON.stringify(g.exportSnapshot())!==begin,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.surface).toBe('w208-natural-clay-market-and-freight-wagonway');
 expect(mobile.exchange.roofPanels).toBe(2);
 expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.changed).toBe(false);
 expect(mobile.gl).toBe(0);
 await page.screenshot({path:test.info().outputPath('w106-real-market-mobile.png')});
 expect(errors).toEqual([]);
});
