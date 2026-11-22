'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G131: protect real citizen presence while spending detailed animation budget
// on people whose gestures can actually be seen in the chosen camera.
// This contract is intentionally about actual rendered WebGL snapshots, not
// source-only labels or faster CI counts.
test('G131 wide town uses camera-aware detailed-citizen LOD while retaining all autonomous people',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {lod:g.getVillageVisualLod(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.lod.population).toBe(12);
 expect(initial.lod.detailedCitizens).toBe(12);
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  g.setCamera({focus:[0,0],yaw:.85,pitch:.52,zoom:25});
  return {snapshot:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens};
 });
 expect(grown.citizens).toBeGreaterThan(12);
 await page.waitForFunction(()=>window.__tinyKingdom?.getCitizenDetailPolicy()?.mode==='overview',null,{timeout:70000});
 const wide=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {lod:g.getVillageVisualLod(),policy:g.getCitizenDetailPolicy(),
   snapshot:JSON.stringify(g.exportSnapshot()),geometry:g.getGeometryAudit()};
 });
 expect(wide.policy.mode).toBe('overview');
 expect(wide.policy.budget).toBe(3);
 expect(wide.policy.anchorIncluded).toBe(true);
 expect(wide.lod.detailedCitizens).toBeLessThanOrEqual(3);
 expect(wide.lod.detailedCitizens+wide.lod.compactCitizens).toBe(grown.citizens);
 expect(wide.geometry.dynamic.invalidComponents).toBe(0);
 expect(wide.snapshot).toBe(grown.snapshot);
 await page.evaluate(()=>window.__tinyKingdom.setCamera({zoom:9}));
 await page.waitForFunction(()=>window.__tinyKingdom?.getCitizenDetailPolicy()?.mode==='close',null,{timeout:70000});
 const close=await page.evaluate(()=>{
  const g=window.__tinyKingdom;return {lod:g.getVillageVisualLod(),
   policy:g.getCitizenDetailPolicy(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 // W40 retained every genuine citizen in the 390px Day-120 close-up,
 // while five detailed rigs kept the measured scene under 160k triangles.
 expect(close.policy.budget).toBe(5);
 expect(close.lod.detailedCitizens).toBeGreaterThan(wide.lod.detailedCitizens);
 expect(close.lod.detailedCitizens+close.lod.compactCitizens).toBe(grown.citizens);
 expect(close.snapshot).toBe(grown.snapshot);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
