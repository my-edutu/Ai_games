'use strict';
// Real Day-121 original society, four authentic resident tiers, same
// source/snapshot/camera across 1024px and 390px software WebGL only.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('Phase 1 same physical citizen projections preserve growing-world people and GPU geometry',async({page},info)=>{
 test.setTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:160000});
 await page.locator('#pause').click();
 await page.evaluate(()=>window.__tinyKingdom.reset());
 for(let block=0;block<12;block++)await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let tick=0;tick<7200;tick++)g.step(1/30);
 });
 const initial=await page.evaluate(()=>({
  world:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  names:window.__tinyKingdom.getState().people.map(p=>p.name),
  day:window.__tinyKingdom.metrics().day
 }));
 expect(initial.day).toBeGreaterThanOrEqual(120);
 const camera={focus:[0,3],yaw:.85,pitch:.52,zoom:23};
 async function scene(width,height,enabled){
  await page.setViewportSize({width,height});
  const before=await page.evaluate(({camera,enabled})=>{
   const g=window.__tinyKingdom;
   g.setCitizenFrameProjectionMemoForTesting(enabled);
   g.setCamera(camera);
   return g.getFrameProfile().totalFrames;
  },{camera,enabled});
  await page.waitForFunction(old=>window.__tinyKingdom.getFrameProfile().totalFrames>old,
   before,{timeout:150000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:JSON.stringify(g.exportSnapshot()),
    names:g.getState().people.map(p=>p.name),
    geo:g.getGeometryAudit(),
    visibility:g.getScenicVisibilityStats(),
    actor:g.getCitizenDetailPolicy(),
    lod:g.getVillageVisualLod(),
    optics:g.getCitizenProjectionCacheAudit(),
    glError:document.querySelector('#world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await info.attach('actual-Day121-'+width+'-'+(enabled?'memo':'original')+'.png',
    {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('actual-Day121-'+width+'-'+(enabled?'memo':'original')+'.json',
    {body:Buffer.from(JSON.stringify({result,physicalHardwareFps:'NOT MEASURED',
     G088Quality:'NOT PROVEN',blindedCritic:'UNAVAILABLE'},null,2)),
     contentType:'application/json'});
  expect(result.world).toBe(initial.world);
  expect(result.names).toEqual(initial.names);
  expect(result.optics.frameProjectionMemo.enabled).toBe(enabled);
  expect(result.geo.totalTriangles).toBeLessThan(160000);
  expect(result.glError).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  return result;
 }
 for(const [w,h] of [[1024,640],[390,844]]){
  const original=await scene(w,h,false);
  const memo=await scene(w,h,true);
  expect(memo.geo.totalTriangles).toBe(original.geo.totalTriangles);
  expect(memo.visibility.totalIssuedTriangles).toBe(original.visibility.totalIssuedTriangles);
  expect(memo.visibility.totalSubmittedTriangles).toBe(original.visibility.totalSubmittedTriangles);
  expect(memo.actor.shown).toBe(original.actor.shown);
  expect(memo.actor.middle).toBe(original.actor.middle);
  expect(memo.lod.detailedCitizens).toBe(original.lod.detailedCitizens);
  expect(memo.lod.compactCitizens).toBe(original.lod.compactCitizens);
  expect(memo.optics.frameProjectionMemo.builds).toBeGreaterThan(0);
 }
 expect(errors).toEqual([]);
});