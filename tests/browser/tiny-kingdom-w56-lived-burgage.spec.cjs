'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W56 RED-first contract: an actual grown settlement must have physically
// three-dimensional, inhabited cottage entries, rather than 25 bare boxes.
// These are render-only props on genuine homes; no phantom homes or workers.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W56 genuine grown burgage fronts and world visibility '+viewport.width+'px',async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const start=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {homes:g.getVillageVisualLod().homes,state:JSON.stringify(g.exportSnapshot())};
  });
  // Real fixed-step growth, not a fabricated test settlement.
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<10*24*30;i++)g.step(1/30);
   return {world:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens,
    buildings:g.metrics().buildings};
  });
  await page.waitForFunction(()=>window.__tinyKingdom.getVillageVisualLod().compactHomes>0,null,{timeout:60000});
  const inspection=await page.evaluate(()=>{
   const g=window.__tinyKingdom,lod=g.getVillageVisualLod();
   return {lod,audit:g.getGeometryAudit(),frame:g.renderStats().lastFrameTriangles,
    sameWorld:JSON.stringify(g.exportSnapshot()),overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(grown.buildings).toBeGreaterThan(start.homes);
  expect(inspection.lod.compactHomes).toBeGreaterThan(0);
  expect(inspection.lod.compactPorchFrames).toBe(inspection.lod.compactHomes);
  expect(inspection.lod.compactWeatheredFootings).toBe(inspection.lod.compactHomes);
  expect(inspection.lod.compactRainCasks).toBe(inspection.lod.compactHomes);
  expect(inspection.lod.compactFrontageTriangles).toBeGreaterThan(inspection.lod.compactHomes*55);
  expect(inspection.lod.compactFrontageTriangles).toBeLessThan(inspection.lod.compactHomes*260);
  expect(inspection.lod.detailedHomes+inspection.lod.compactHomes).toBe(inspection.lod.homes);
  expect(inspection.frame).toBeLessThan(160000);
  expect(inspection.sameWorld).toBe(grown.world);
  expect(inspection.glError).toBe(0);
  expect(inspection.audit.static.invalidComponents).toBe(0);
  expect(inspection.audit.dynamic.invalidComponents).toBe(0);
  expect(inspection.overflow).toBeLessThanOrEqual(0);
  fs.mkdirSync('artifacts/tiny-kingdom-w56',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w56/'+viewport.width+'-real-grown-burgage.png'});
  expect(errors).toEqual([]);
 });
}
