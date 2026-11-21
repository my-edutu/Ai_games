'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W48 real village life: the camera must witness a reachable farmer actually
// harvesting while their real workTimer drives the crop parting and sickle.
// Temporary presentation does not count harvested stock before work completes.
test('W48 active human-height farmer parts standing wheat and carries a real work sickle, desktop and 390px',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const sample=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  if(typeof g.getHarvestVisibilityAudit!=='function')return {error:'W48 genuine crop visibility audit missing'};
  let audit=null;
  for(let i=0;i<24000;i++){
   g.step(1/30);
   if(i%15!==0)continue;
   const check=g.getHarvestVisibilityAudit();
   if(check.active&&check.progress>.12&&check.progress<.86){audit=check;break;}
  }
  if(!audit)return {error:'no genuine active farmer with incomplete harvest'};
  const before=JSON.stringify(g.exportSnapshot());
  for(let i=0;i<8;i++)g.getHarvestVisibilityAudit();
  const unchanged=JSON.stringify(g.exportSnapshot())===before;
  if(typeof g.watchHarvestShift!=='function')
   return {error:'W48 real farmer documentary camera absent'};
  const view=g.watchHarvestShift(),camera=g.getCitizenCameraPlan();
  const composition=g.getWorkdayCompositionAudit();
  return {audit,view,camera,composition,unchanged,citizens:g.getCitizenProfiles().length,
   realFarmers:g.getCitizenProfiles().filter(p=>p.job==='farmer').length};
 });
 expect(sample.error||'').toBe('');
 expect(sample.unchanged).toBe(true);
 expect(sample.audit.source).toBe('real-authoritative-farmer-grain-parting');
 expect(sample.audit.active).toBe(true);
 expect(sample.audit.job).toBe('farmer');
 expect(sample.audit.hasSickle).toBe(true);
 expect(sample.audit.authorityMutated).toBe(false);
 expect(sample.audit.centerHeightRatio).toBeGreaterThan(0);
 expect(sample.audit.centerHeightRatio).toBeLessThan(.68);
 expect(sample.audit.radiusMetres).toBeGreaterThan(.8);
 expect(sample.audit.radiusMetres).toBeLessThan(2.1);
 expect(sample.audit.progress).toBeGreaterThan(.12);
 expect(sample.citizens).toBeGreaterThan(0);
 expect(sample.realFarmers).toBeGreaterThan(0);
 expect(sample.view.active).toBe(true);
 expect(sample.view.job).toBe('farmer');
 expect(sample.view.citizen).toBe(sample.audit.citizen);
 expect(sample.camera).toBeTruthy();
 expect(sample.camera.blockers).toBe(0);
 expect(sample.camera.foregroundSceneCover).toBeLessThan(.20);
 expect(sample.composition.active).toBe(true);
 expect(sample.composition.projectedWorkerHeightFraction).toBeGreaterThan(.17);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 const desktop=await page.evaluate(()=>({
  triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
  gl:document.getElementById('world').getContext('webgl')?.getError()??-1
 }));
 expect(desktop.gl).toBe(0);
 expect(desktop.triangles).toBeLessThan(160000);
 fs.mkdirSync('artifacts/tiny-kingdom-w48',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w48/real-farmer-parted-wheat-wide.png'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await expect(page.locator('#pause')).toBeVisible();
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const view=g.watchHarvestShift(),camera=g.getCitizenCameraPlan();
  return {view,camera,audit:g.getHarvestVisibilityAudit(),
   composition:g.getWorkdayCompositionAudit(),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.audit.active).toBe(true);
 expect(mobile.view?.active).toBe(true);
 expect(mobile.view?.job).toBe('farmer');
 expect(mobile.camera?.blockers).toBe(0);
 expect(mobile.camera?.foregroundSceneCover).toBeLessThan(.20);
 expect(mobile.composition?.projectedWorkerHeightFraction).toBeGreaterThan(.17);
 expect(mobile.audit.citizen).toBe(sample.audit.citizen);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w48/real-farmer-parted-wheat-390px.png'});
 console.log('W48 actual active farmer visibility',JSON.stringify({
  citizen:sample.audit.citizen,progress:sample.audit.progress,
  centerHeightRatio:sample.audit.centerHeightRatio,
  triangles:desktop.triangles,citizens:sample.citizens,mobileWidth:390}));
});