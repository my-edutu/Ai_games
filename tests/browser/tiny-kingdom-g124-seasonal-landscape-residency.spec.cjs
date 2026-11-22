'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/* G124: construction and seasons must not repeatedly recompile the immutable
 * landscape on their next appearance. This is a CPU/GPU resource regression,
 * not a claim of improved visual quality or physical-device FPS. */
test('G124 bounded seasonal landscape residency preserves state and mobile WebGL',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().landscapeGpuUploads>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const snapshot=JSON.stringify(g.exportSnapshot());
  const stats=g.getLandscapeSeasonCacheStats?.();
  return {stats,key:g.getLandscapeCacheStats().key,
   readOnly:snapshot===JSON.stringify(g.exportSnapshot())};
 });
 expect(first.stats).toBeTruthy();
 expect(first.readOnly).toBe(true);
 expect(first.stats.entries).toBe(1);
 expect(first.stats.activeKey).toBe(first.key);
 expect(first.stats.cachedFloats).toBeGreaterThan(0);
 expect(first.stats.cachedFloats).toBeLessThanOrEqual(first.stats.floatBudget);
 expect(first.stats.cachedEntries).toHaveLength(first.stats.entries);
 // Advance via the SAME actual fixed-step authority, not forged dates or a
 // direct mutation of the climate or saved state.
 await page.evaluate(()=>{
  const g=window.__tinyKingdom,initial=g.getState().state.t;
  for(let i=0;i<8500&&g.getState().state.t<initial+24*10;i++)g.step(1/30);
 });
 await page.waitForFunction(key=>window.__tinyKingdom.getLandscapeCacheStats().key!==key,
  first.key,{timeout:70000});
 const second=await page.evaluate(()=>{
  const g=window.__tinyKingdom,scene=g.getLandscapeSeasonCacheStats();
  return {scene,landscape:g.getLandscapeCacheStats(),quality:g.renderQuality()};
 });
 expect(second.scene.entries).toBeGreaterThanOrEqual(1);
 expect(second.scene.entries).toBeLessThanOrEqual(second.scene.maxEntries);
 expect(second.scene.cachedFloats).toBeLessThanOrEqual(second.scene.floatBudget);
 expect(second.scene.activeKey).toBe(second.landscape.key);
 expect(second.scene.cachedEntries).toContain(second.scene.activeKey);
 expect(second.scene.bufferCreations).toBeGreaterThanOrEqual(second.scene.entries);
 expect(second.scene.bufferDisposals).toBeGreaterThanOrEqual(0);
 expect(second.scene.activeKey).not.toBe(first.key);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(200);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
