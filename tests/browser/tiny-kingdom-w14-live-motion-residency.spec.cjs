'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W14 is part of the ONE Living Valley production-to-market transformation.
// RED-first: do not regenerate the entire moving-citizen mesh every camera
// frame when authoritative fixed-step time has NOT advanced. It was rebuilt
// repeatedly even with exactly the same real people, tools and cargo.
// Cache is render-only: new fixed ticks, LOD, observer/worksite changes must
// invalidate it. It cannot skip citizen actions or fake goods.
test('W14 live village reuses unchanged true citizen/worksite mesh across camera frames, never authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.setSpeed(0.00001); // LIVE (not frozen or paused), but no fixed-step updates between frames.
  return {snapshot:JSON.stringify(g.exportSnapshot()),
   stats:g.getCameraDynamicCacheStats(),frames:g.renderQuality().framesDrawn};
 });
 await page.waitForFunction(b=>{
  const g=window.__tinyKingdom,s=g.getCameraDynamicCacheStats();
  return g.renderQuality().framesDrawn>=b.frames+3&&s.reuses>=2;
 },before,{timeout:90000,polling:200});
 const steady=await page.evaluate(()=>({
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  stats:window.__tinyKingdom.getCameraDynamicCacheStats(),
  renderer:window.__tinyKingdom.renderer()}));
 expect(steady.stats.reuses).toBeGreaterThanOrEqual(2);
 expect(steady.stats.skippedUploads).toBeGreaterThanOrEqual(2);
 expect(steady.stats.entries).toBe(1);
 expect(steady.snapshot).toBe(before.snapshot);
 expect(steady.renderer).toBe('webgl');
 // Move the camera to another genuine field without fabricating a worker.
 // If all twelve real founders retain the same LOD/worksite membership, the
 // exact physical dynamic mesh should remain cached despite the camera move.
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const b=g.getCameraDynamicCacheStats();
  document.querySelector('[data-scenic="farm"]').click();
  return {before:b,snapshot:JSON.stringify(g.exportSnapshot())};
 });
 await page.waitForFunction(b=>window.__tinyKingdom.getCameraDynamicCacheStats().reuses>b.reuses,
  result.before,{timeout:90000,polling:200});
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot())))
  .toBe(before.snapshot);
 // A TRUE fixed-step move, unlike a spectator orbit, must immediately
 // invalidate a previously resident occupational/actor mesh. This also
 // protects the live cargo and worksite path against stale visual authority.
 const tick=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const b=g.getCameraDynamicCacheStats();
  g.step(1/30);
  return {before:b,snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(tick.snapshot).not.toBe(before.snapshot);
 await page.waitForFunction(b=>window.__tinyKingdom.getCameraDynamicCacheStats().builds>b.builds,
  tick.before,{timeout:90000,polling:200});
 const end=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {stats:g.getCameraDynamicCacheStats(),snap:JSON.stringify(g.exportSnapshot()),
   render:g.renderStats(),gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(end.stats.builds).toBeGreaterThan(tick.before.builds);
 expect(end.snap).toBe(tick.snapshot);
 expect(end.render.lastFrameTriangles).toBeGreaterThan(0);
 expect(end.render.lastFrameTriangles).toBeLessThan(160000);
 expect(end.gl).toBe(0);
 expect(end.overflow).toBeLessThanOrEqual(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:path.resolve(__dirname,'../../test-results/w14-farm-live-motion-residency-390.png')});
});
