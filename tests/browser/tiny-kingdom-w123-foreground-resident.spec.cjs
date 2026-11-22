'use strict';
// W123 original actual 3D actors, real desktop and 390px WebGL scene.
// Test baseline versus GPU residency on an unchanged seeded source/snapshot.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W123 genuine off-duty full detailed geometry parity '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const setup=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let original=null;
   for(let i=0;i<9000;i++){
    const idx=g.getCitizenProfiles().findIndex(p=>p.activity==='Resting at home');
    if(idx>=0){const p=g.getState().people[idx];original={name:p.name,x:p.x,z:p.z};break}
    g.step(1/30);
   }
   if(original)g.setCamera({focus:[original.x,original.z],yaw:.5,pitch:.45,zoom:8});
   g.setForegroundResidentEnabledForTesting(false);
   return {original,frame:g.getFrameProfile().totalFrames};
  });
  expect(setup.original).not.toBeNull();
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   setup.frame,{timeout:125000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),population:g.metrics().citizens,
    policy:g.getCitizenDetailPolicy()};
  });
  const earlier=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
   g.setForegroundResidentEnabledForTesting(true);return frame;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   earlier,{timeout:125000});
  const candidate=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    triangles:g.renderStats().lastFrameTriangles,geometry:g.getGeometryAudit(),
    population:g.metrics().citizens,policy:g.getCitizenDetailPolicy(),
    audit:g.getForegroundResidentAudit(),glError:gl?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth,
    names:g.getState().people.map(p=>p.name)};
  });
  expect(candidate.snapshot).toBe(original.snapshot);
  expect(candidate.population).toBe(original.population);
  expect(candidate.policy.population).toBe(original.policy.population);
  expect(candidate.policy.shown).toBe(original.policy.shown);
  expect(candidate.triangles).toBe(original.triangles);
  expect(candidate.geometry).toEqual(original.geometry);
  expect(candidate.audit.enabled).toBe(true);
  expect(candidate.audit.visiblePeople).toBeGreaterThan(0);
  expect(candidate.audit.visiblePeople).toBeLessThanOrEqual(8);
  expect(candidate.audit.gpuBuffers).toBeLessThanOrEqual(1);
  expect(candidate.audit.fullOriginalTriangles).toBeGreaterThan(0);
  expect(candidate.audit.floats).toBeLessThanOrEqual(candidate.audit.maxFloats);
  expect(candidate.audit.originalNames.every(name=>candidate.names.includes(name))).toBe(true);
  expect(candidate.audit.activeWorkHandsLive).toBe(true);
  expect(candidate.audit.loadedCargoLive).toBe(true);
  expect(candidate.audit.unloadingLive).toBe(true);
  expect(candidate.audit.authorityModified).toBe(false);
  expect(candidate.glError).toBe(0);
  expect(candidate.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W123-source-identical-live-home-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
