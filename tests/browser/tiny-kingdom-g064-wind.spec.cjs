'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('G064 wind displaces foliage vertices only, with deterministic bounded probes and no simulation changes',async({page})=>{
 const shader=html.split('const vs=`')[1]?.split('`;\n// Gauntlet 023')[0]||'';
 expect(shader).toContain('uniform highp float worldTime;');
 const fragment=html.split('const fs=\`')[1]?.split('\`;\nfunction shader')[0]||'';
 expect(fragment).toContain('uniform highp float worldTime;');
 expect(shader).toContain('if(materialId>3.5&&materialId<4.5)');
 expect(shader).toContain('world.x+=');
 expect(shader).toContain('world.z+=');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getState().people.length>=12);
 await page.locator('#pause').click();
 const audit=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const ground=g.getFoliageWindProbe(0,0,0,7);
  const crown=g.getFoliageWindProbe(-26,5,9,7);
  const replay=g.getFoliageWindProbe(-26,5,9,7);
  const later=g.getFoliageWindProbe(-26,5,9,10);
  const geometry=g.getGeometryAudit();
  return {ground,crown,replay,later,geometry,unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(audit.ground.displacement).toBe(0);
 expect(audit.crown).toEqual(audit.replay);
 expect(audit.crown.displacement).toBeGreaterThan(0);
 expect(audit.crown.displacement).toBeLessThan(.065);
 expect(audit.later).not.toEqual(audit.crown);
 expect(audit.geometry.totalTriangles).toBeLessThan(160000);
 for(const item of [audit.geometry.static,audit.geometry.dynamic]){
  expect(item.invalidComponents).toBe(0);expect(item.invalidNormals).toBe(0);
  expect(item.invalidColors).toBe(0);expect(item.outOfBounds).toBe(0);
 }
 expect(audit.unchanged).toBe(true);
 expect(errors).toEqual([]);
});
