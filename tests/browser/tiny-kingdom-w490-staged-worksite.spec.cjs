'use strict';
// W490 actual browser check: authentic autonomous field stage, same
// snapshot, same submitted triangles and moving worker, with old/new VBO.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W490 genuine crop/gather worksite staged residency '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const found=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<12000;i++){
    const w=g.getActiveWorksites().find(w=>w.job==='farmer'||w.job==='gatherer');
    if(w){g.setCamera({focus:[w.x,w.z],yaw:.7,pitch:.57,zoom:17});
     return {name:w.citizen,job:w.job,advanced:i,progress:w.progress};}
    g.step(1/30);
   }
   return null;
  });
  expect(found,'must observe a true farmer or gatherer, not a staged actor').not.toBeNull();
  await page.evaluate(()=>window.__tinyKingdom.setWorksiteFixtureResidencyForTesting(false));
  let n=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.waitForFunction(v=>window.__tinyKingdom.getFrameProfile().totalFrames>v,
   n,{timeout:125000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.getGeometryAudit().totalTriangles,
    submitted:g.renderStats().lastFrameTriangles,
    actors:g.metrics().citizens};
  });
  await info.attach('w490-original-field-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  n=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setWorksiteFixtureResidencyForTesting(true));
  await page.waitForFunction(v=>{
   const g=window.__tinyKingdom,a=g.getWorksiteFixtureResidencyAudit();
   return g.getFrameProfile().totalFrames>v&&a.active&&a.stagedOriginalFields>0;
  },n,{timeout:125000});
  const candidate=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.getGeometryAudit().totalTriangles,
    submitted:g.renderStats().lastFrameTriangles,
    actors:g.metrics().citizens,audit:g.getWorksiteFixtureResidencyAudit(),
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await info.attach('w490-resident-field-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('w490-authoritative-field-proof-'+viewport.width,
   {body:Buffer.from(JSON.stringify({found,original,candidate},null,2)),
    contentType:'application/json'});
  expect(candidate.snapshot).toBe(original.snapshot);
  expect(candidate.actors).toBe(original.actors);
  expect(candidate.triangles).toBe(original.triangles);
  expect(candidate.submitted).toBe(original.submitted);
  expect(candidate.submitted).toBeLessThan(160000);
  expect(candidate.audit.buffers).toBeLessThanOrEqual(1);
  expect(candidate.audit.capacityFloats).toBeLessThanOrEqual(candidate.audit.floatBudget);
  expect(candidate.audit.stagedOriginalFields).toBeGreaterThan(0);
  expect(candidate.glError).toBe(0);
  expect(candidate.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
 });
}
