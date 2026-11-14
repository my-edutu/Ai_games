'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W92 RED-first: one genuine farm/craft/market shift's fixed workbench
// should live in a bounded VBO, while actual human pose, impacts and
// authoritative deliveries remain dynamic. Compare identical paused scene
// with and without this renderer-only residency, on desktop and 390px.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W92 real worksite fixture residency retains complete workday '+viewport.width,async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const found=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<12000;i++){
    const worker=g.getActiveWorksites().find(w=>
     ['farmer','forester','builder','merchant','gatherer'].includes(w.job));
    if(worker){g.setCamera({focus:[worker.x,worker.z],zoom:15,yaw:.65,pitch:.49});return true;}
    g.step(1/30);
   }
   return false;
  });
  expect(found).toBe(true);
  const initialFrames=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setWorksiteFixtureResidencyForTesting(false));
  await page.waitForFunction(previous=>window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   initialFrames,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snap:JSON.stringify(g.exportSnapshot()),
    tri:g.getGeometryAudit().totalTriangles,
    citizens:g.renderStats().lastFrameTriangles,
    works:g.getActiveWorksites().length};
  });
  expect(original.works).toBeGreaterThan(0);
  const previous=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setWorksiteFixtureResidencyForTesting(true));
  await page.waitForFunction(prev=>{
   const g=window.__tinyKingdom,a=g.getWorksiteFixtureResidencyAudit();
   return g.getFrameProfile().totalFrames>prev&&a.active&&a.meshFloats>0;
  },previous,{timeout:110000});
  const resident=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getWorksiteFixtureResidencyAudit(),
    snap:JSON.stringify(g.exportSnapshot()),
    tri:g.getGeometryAudit().totalTriangles,
    presented:g.renderStats().lastFrameTriangles,
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(resident.audit.buffers).toBe(1);
  expect(resident.audit.meshFloats).toBeLessThanOrEqual(resident.audit.floatBudget);
  expect(resident.audit.capacityFloats).toBeLessThanOrEqual(resident.audit.floatBudget);
  expect(resident.audit.authorityModified).toBe(false);
  expect(resident.audit.active).toBe(true);
  expect(resident.tri).toBe(original.tri);
  expect(resident.presented).toBe(original.citizens);
  expect(resident.snap).toBe(original.snap);
  expect(resident.glError).toBe(0);
  expect(resident.overflow).toBeLessThanOrEqual(0);
  expect(resident.presented).toBeLessThan(160000);
  expect(errors).toEqual([]);
  await testInfo.attach('W92-genuine-occupied-worksite-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
