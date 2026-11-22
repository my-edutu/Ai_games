'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W449: actual positive farmer harvest, never a synthetic scene. RED before
// source because the original only issued per-frame CPU-grown harvest geometry.
// Force original and retained renderer on the SAME PAUSED world, then
// compare every authored triangle and the exact exported authority snapshot.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W449 credited harvested farm remains identical in retained WebGL '+viewport.width,
  async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const found=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   if(typeof g.getCompletedHarvestResidencyAudit!=='function')
    return {missing:'W449 true farmer aftermath GPU audit'};
   for(let i=0;i<24000;i++){
    g.step(1/30);
    const original=g.getHarvestAftermathAudit().sites[0];
    if(original?.eventId){
     g.setCamera({focus:[original.x,original.z],zoom:13,pitch:.56,yaw:.74});
     return {eventId:original.eventId,earnedFood:original.foodEarned,
      witness:original.provenance,source:original.citizen};
    }
   }
   return {missing:'no authentic paid farmer harvest'};
  });
  expect(found.missing||'').toBe('');
  expect(found.earnedFood).toBeGreaterThan(0);
  expect(found.witness).toBe('completed-authoritative-farm-work');
  const started=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setCompletedHarvestResidencyForTesting(false));
  await page.waitForFunction(n=>{
   const g=window.__tinyKingdom;
   return g.getFrameProfile().totalFrames>n&&
    g.getHarvestAftermathAudit().lastRenderedTriangles>0;
  },started,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.getGeometryAudit().totalTriangles,
    presented:g.renderStats().lastFrameTriangles,
    harvest:g.getHarvestAftermathAudit(),
    reconciliation:g.getSceneTriangleReconciliation(),
    renderer:g.renderer()};
  });
  expect(original.renderer).toBe('webgl');
  expect(original.harvest.lastRenderedSites).toBeGreaterThan(0);
  expect(original.harvest.lastRenderedTriangles).toBeGreaterThan(0);
  // Existing unrelated GPU layers may have a nonzero older reconciliation gap.
  // W449 must preserve its exact signed value across the same real frame.
  await testInfo.attach('W449-original-harvest-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  const previous=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setCompletedHarvestResidencyForTesting(true));
  await page.waitForFunction(n=>{
   const g=window.__tinyKingdom,a=g.getCompletedHarvestResidencyAudit();
   return g.getFrameProfile().totalFrames>n&&a.active&&a.meshFloats>0;
  },previous,{timeout:110000});
  const resident=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
   return {audit:g.getCompletedHarvestResidencyAudit(),
    snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.getGeometryAudit().totalTriangles,
    presented:g.renderStats().lastFrameTriangles,
    harvest:g.getHarvestAftermathAudit(),
    reconciliation:g.getSceneTriangleReconciliation(),
    glError:gl?.getError()||0,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(resident.audit.source).toBe('positive-authoritative-farmer-harvest-retained-GPU');
  expect(resident.audit.buffers).toBe(1);
  expect(resident.audit.meshFloats).toBeLessThanOrEqual(resident.audit.floatBudget);
  expect(resident.audit.capacityFloats).toBeLessThanOrEqual(resident.audit.floatBudget);
  expect(resident.audit.authorityModified).toBe(false);
  expect(resident.audit.exactGeometry).toBe(true);
  expect(resident.harvest.lastRenderedTriangles).toBe(original.harvest.lastRenderedTriangles);
  expect(resident.triangles).toBe(original.triangles);
  expect(resident.presented).toBe(original.presented);
  expect(resident.snapshot).toBe(original.snapshot);
  expect(resident.reconciliation.unaccountedTriangles)
   .toBe(original.reconciliation.unaccountedTriangles);
  expect(resident.glError).toBe(0);
  expect(resident.overflow).toBeLessThanOrEqual(0);
  expect(resident.presented).toBeLessThan(160000);
  expect(errors).toEqual([]);
  await testInfo.attach('W449-resident-harvest-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
