'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G118: actual G117 video/screenshots still show outsized toy-like faces
// obscuring meaningful real work. Ensure detailed/compact NPC proportions
// align without changing gameplay authority or vertex-count resource floor.
test('G118 real citizens have coherent smaller head proportions with unchanged autonomous world',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {geometry:g.getCitizenAnatomy(),faces:g.getFaceProfile(),render:g.renderStats()};
 });
 expect(first.geometry).toBeTruthy();
 expect(first.geometry.headVerticalScale).toBeLessThanOrEqual(.74);
 expect(first.geometry.headHorizontalScale).toBeGreaterThanOrEqual(.79);
 expect(first.geometry.headHeightRatio).toBeLessThan(.25);
 expect(first.geometry.compactAndDetailed).toBe(true);
 expect(first.faces.meshTriangles).toBe(156);
 expect(first.render.lastFrameTriangles).toBeLessThan(160000);
 for(let n=0;n<12;n++)await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let tick=0;tick<7200;tick++)g.step(1/30);
 });
 await page.setViewportSize({width:390,height:844});
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {metrics:g.metrics(),geometry:g.getCitizenAnatomy(),stats:g.renderStats(),
   scroll:document.documentElement.scrollWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(grown.metrics.citizens).toBe(28);
 expect(grown.metrics.buildings).toBe(37);
 expect(grown.geometry.headHeightRatio).toBe(first.geometry.headHeightRatio);
 expect(grown.stats.lastFrameTriangles).toBeLessThan(160000);
 expect(grown.gl).toBe(0);
 expect(grown.scroll).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).not.toBe(before);
 expect(errors).toEqual([]);
});
