'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W262 phase-1 workstream: the SAME authoritative market/granary inventory
// must survive renderer-only caching. This cannot invent receipts or residents.
test('W262 real economy software mesh cache is finite and authority-neutral',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  const before=JSON.stringify(g.exportSnapshot());
  g.setEconomyResidencyForTesting(false);
  g.setEconomyCpuCacheForTesting(true);
  return {before,after:JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.after).toBe(initial.before);
 await page.waitForFunction(()=>window.__tinyKingdom?.getEconomyCpuCacheAudit()?.builds>0,null,{timeout:110000});
 // Force two real authoritative presentation updates without changing inventory
 // artificially; the cache should reuse real goods, not forge transactions.
 await page.evaluate(()=>window.__tinyKingdom.step(1/30));
 await page.waitForFunction(()=>window.__tinyKingdom.getEconomyCpuCacheAudit().reuses>0,null,{timeout:110000});
 const sample=await page.evaluate(()=>{
  const g=window.__tinyKingdom,c=g.getEconomyCpuCacheAudit();
  const before=JSON.stringify(g.exportSnapshot());
  g.setEconomyCpuCacheForTesting(false);
  return {c,before,after:JSON.stringify(g.exportSnapshot()),
   market:g.getMarketStallStockAudit(),granary:g.getGranarySupplyAudit(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
   scrollWidth:document.documentElement.scrollWidth};
 });
 expect(sample.before).toBe(sample.after);
 expect(sample.c.source).toBe('original-authentic-economy-software-mesh-cache');
 expect(sample.c.builds).toBeGreaterThan(0);
 expect(sample.c.reuses).toBeGreaterThan(0);
 expect(sample.c.floats).toBeLessThanOrEqual(sample.c.budgetFloats);
 expect(sample.c.floats%30).toBe(0);
 expect(sample.c.authorityChanged).toBe(false);
 expect(sample.market.staticInventedFood).toBe(0);
 expect(sample.market.staticInventedUnsimulatedGoods).toBe(0);
 expect(sample.gl).toBe(0);
 expect(sample.scrollWidth).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
 fs.mkdirSync('artifacts/tiny-kingdom-w262',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w262/original-market-mobile.png'});
 fs.writeFileSync('artifacts/tiny-kingdom-w262/renderer.json',JSON.stringify(sample,null,2));
});

// Physical camera contract; passing this is NOT proof of a visually readable
// escrowed handoff. Real uninterrupted desktop/mobile footage remains required.
test('W262 physically surveyed receiving portrait exists and cannot fake stock',()=>{
 expect(html).toMatch(/const portraitLens=Boolean\(\(\(working&&realWork\)\|\|journeyCamera\|\|unloading\)/);
 expect(html).toMatch(/unloading\?\(portraitLens\?\[2\.45,2\.85,3\.35,4\.4,5\.7\]/);
 expect(html).toContain('isReadableMarketHandoffShot');
 expect(html).toContain('realReceiptCameraFocus(citizen)');
});
