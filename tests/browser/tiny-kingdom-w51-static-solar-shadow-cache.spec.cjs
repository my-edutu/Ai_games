'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// Living Valley W51: static solar shadows reuse ONLY exact rendered static
// geometry within a bounded, short sun phase. Citizens always cast real
// moving footprints; a cached silhouette may never survive changed town
// topology or a restored world with different house coordinates.
// This test is written BEFORE its matching renderer implementation.
test('W51 bounded static sun-shadow residency preserves genuine work and replay on 390px',async({page})=>{
 test.setTimeout(210000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  return {shadow:g.getShadowCacheAudit(),world:JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.shadow.kind).toBe('static-mesh-solar-buckets');
 expect(initial.shadow.maxEntries).toBeLessThanOrEqual(6);
 expect(initial.shadow.maxFloats).toBeLessThanOrEqual(600000);
 for(let tick=0;tick<16;tick++){
  await page.evaluate(()=>window.__tinyKingdom.step(1/30));
  await page.waitForTimeout(190);
 }
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {cache:g.getShadowCacheAudit(),shadow:g.shadowStats(),
    grad:g.getShadowGradientAudit(),render:g.renderStats(),
    cpu:g.getFrameProfile(),citizens:g.getCitizenProfiles().length,
    buildings:g.metrics().buildings,
    viewport:document.documentElement.scrollWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()||0};
 });
 expect(result.cache.entries).toBeGreaterThan(0);
 expect(result.cache.entries).toBeLessThanOrEqual(result.cache.maxEntries);
 expect(result.cache.floats).toBeLessThanOrEqual(result.cache.maxFloats);
 expect(result.cache.hits).toBeGreaterThan(0);
 expect(result.cache.builds).toBeGreaterThan(0);
 expect(result.cache.citizenShadowsLive).toBe(true);
 expect(result.cache.sceneAuthorityUnchanged).toBe(true);
 expect(result.citizens).toBeGreaterThan(0);
 expect(result.grad.wrongMaterials).toBe(0);
 expect(result.grad.triangles).toBe(result.shadow.triangles);
 expect(result.render.lastFrameTriangles).toBeLessThan(160000);
 expect(result.viewport).toBeLessThanOrEqual(390);
 expect(result.gl).toBe(0);
 expect(errors).toEqual([]);
 console.log('W51 actual SwiftShader bounded sun-shadow residency',JSON.stringify(result.cache));
});

test('W51 static shadow cache invalidates across genuine world reset and restore',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const sample=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.setSpeed(0);const before=JSON.stringify(g.exportSnapshot());
  const old=g.getShadowCacheAudit();
  const snapshot=g.exportSnapshot();g.restoreSnapshot(snapshot);
  const restored=JSON.stringify(g.exportSnapshot());
  const after=g.getShadowCacheAudit();
  return {old,after,identical:before===restored,
    gl:document.querySelector('#world').getContext('webgl')?.getError()||0};
 });
 expect(sample.identical).toBe(true);
 expect(sample.after.entries).toBe(0);
 expect(sample.after.floats).toBe(0);
 expect(sample.after.invalidations).toBeGreaterThan(sample.old.invalidations);
 expect(sample.gl).toBe(0);
});
