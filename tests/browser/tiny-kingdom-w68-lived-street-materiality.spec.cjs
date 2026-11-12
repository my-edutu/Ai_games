'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W68 RED first: authentic grown medieval homes must be materially inhabited.
// No fictitious villagers, crops, jobs or stock; wall details are static and
// remain inside the present settlement geometry cache.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W68 inhabited street facades preserve grown town '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  const initial=await page.evaluate(()=>window.__tinyKingdom.getBurgageMaterialAudit());
  expect(initial.source).toBe('original-inhabited-burgage-side-materiality');
  expect(initial.homes).toBeGreaterThan(0);
  // Only a real fixed-step day can expand this settlement; art adds no houses.
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<120*24*30;i++)g.step(1/30);
   return JSON.stringify(g.exportSnapshot());
  });
  // metrics().buildings includes the guildhall and farm; the burgage audit
  // counts only actual cottages in city[]. Require exact housing equality,
  // not an unreachable cottage count inflated by two civic structures.
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   return g.getBurgageMaterialAudit().homes===g.getVillageVisualLod().homes&&
    g.getVillageVisualLod().homes===g.metrics().buildings-2;
  },null,{timeout:95000});
  const actual=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getBurgageMaterialAudit(),lod:g.getVillageVisualLod(),
    snapshot:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    invalid:g.getGeometryAudit(),glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(actual.audit.homes).toBe(actual.lod.homes);
  expect(actual.audit.wallPairs).toBe(actual.audit.homes*2);
  expect(actual.audit.windowGardenBoxes).toBe(actual.audit.homes*4);
  expect(actual.audit.rainSpouts).toBe(actual.audit.homes*2);
  const butt=await page.evaluate(()=>window.__tinyKingdom.getCompactRainCaskAudit());
  expect(butt.actualButts).toBe(actual.lod.compactHomes);
  expect(butt.newPerButtTriangles).toBe(18);
  expect(butt.oldPerButtTriangles).toBe(45);
  expect(butt.reclaimedTriangles).toBe(butt.actualButts*27);
  expect(butt.noInventedWaterStock).toBe(true);
  // W261 proves the real per-home mesh actually lost hidden box faces,
  // while preserving all four outward troughs and both drainpipe silhouettes.
  expect(actual.audit.oldTrianglesPerRealHome).toBe(148);
  expect(actual.audit.currentTrianglesPerRealHome).toBe(68);
  expect(actual.audit.addedTriangles).toBe(actual.audit.homes*68);
  expect(actual.audit.reclaimedTriangles).toBe(actual.audit.homes*80);
  expect(actual.audit.meshBudgetHonest).toBe(true);
  expect(actual.audit.fourVisibleTroughFacesPerExistingWindow).toBe(true);
  expect(actual.audit.foldedCopperDownpipeFaces).toBe(2);
  expect(actual.audit.addedTriangles).toBeGreaterThan(actual.audit.homes*60);
  expect(actual.audit.addedTriangles).toBeLessThan(actual.audit.homes*235);
  expect(actual.audit.noArtificialProduction).toBe(true);
  expect(actual.triangles).toBeLessThan(160000);
  expect(actual.snapshot).toBe(grown);
  expect(actual.invalid.static.invalidComponents).toBe(0);
  expect(actual.invalid.dynamic.invalidComponents).toBe(0);
  expect(actual.glError).toBe(0);
  expect(actual.overflow).toBeLessThanOrEqual(0);
  expect(before).not.toBe(grown);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w68',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w68/'+viewport.width+'-lived-burgage.png'});
 });
}
