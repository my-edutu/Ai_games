'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W27 RED contract: all physically projected mobile camera occlusion and
// worker-size measurements must use the *actual* WebGL perspective. The W24
// viewport lens widened, but several W06/G147 camera planners still measured
// the obsolete narrow desktop lens. These are real roofs/citizens, not sprites.
test('W27 original market and worker optics agree with actual 390px projection without changing authority',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const entered=g.setStreetWalk(true);
  const v=g.visitMarket();
  const projection=g.getPhysicalProjectionAudit();
  const after=JSON.stringify(g.exportSnapshot());
  return {entered,v,projection,after,gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   width:document.documentElement.scrollWidth};
 });
 expect(result.entered.active).toBe(true);
 expect(result.projection.mode).toBe('pedestrian');
 expect(result.projection.viewportWidth).toBe(390);
 expect(result.projection.horizontalDegrees).toBeGreaterThanOrEqual(51.5);
 expect(result.projection.tanVertical).toBeGreaterThan(.9);
 expect(result.projection.tanHorizontal).toBeCloseTo(
  result.projection.tanVertical*result.projection.aspect,8);
 // These values must be the same optics in the roof, timber-post, crowd,
 // foliage and actual worker image-height planners—not legacy 56-degree optics.
 const audited=result.projection.scorers;
 for(const scorer of ['marketCrowd','marketPosts','marketArchitecture','worksiteRoofs',
  'worksiteFoliage','workerScreenHeight']) {
  expect(audited[scorer]?.tanVertical).toBeCloseTo(result.projection.tanVertical,8);
  expect(audited[scorer]?.tanHorizontal).toBeCloseTo(result.projection.tanHorizontal,8);
 }
 expect(result.after).toBe(before);
 expect(result.gl).toBe(0);
 expect(result.width).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
});
test('W27 desktop stays on original projection and has no page/GL errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const p=await page.evaluate(()=>{const g=window.__tinyKingdom;g.setStreetWalk(true);
  return g.getPhysicalProjectionAudit();});
 expect(p.mode).toBe('pedestrian');
 expect(p.responsive).toBe(false);
 expect(p.verticalDegrees).toBeCloseTo(56.25,5);
 expect(p.tanVertical).toBeCloseTo(Math.tan(Math.PI/6.4),8);
 for(const scorer of Object.values(p.scorers))
  expect(scorer.tanVertical).toBeCloseTo(p.tanVertical,8);
 expect(errors).toEqual([]);
});
