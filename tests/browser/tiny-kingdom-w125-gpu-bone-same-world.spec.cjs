'use strict';
// W125 source-identical real-worker WebGL GPU bone-vs-original renderer check.
// This is a technical safety gate, NOT independent experience certification.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'}); // Genuine moving browser recording, never a static mock.
const scenes=[{width:1024,height:640},{width:390,height:844}];
for(const viewport of scenes){
 test('W125 same genuine worksite with original/GPU joints '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const setup=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   let workers=g.getActiveWorksites();
   let advanced=0;
   // No fabricated worker state: advance the real fixed-step simulation
   // until its own authoritative job scheduler activates an actual shift.
   while(!workers.length&&advanced<5000){
    g.step(1/30);advanced++;
    if(advanced%6===0)workers=g.getActiveWorksites();
   }
   g.setCamera({focus:[0,0],yaw:.45,pitch:.86,zoom:80});
   g.setWorkingSkinEnabledForTesting(false);
   return {workers:workers.map(w=>({citizen:w.citizen,job:w.job})),
    advanced,frame:g.getFrameProfile().totalFrames,
    initialPeople:g.metrics().citizens,
    supported:g.getWorkingSkinAudit().active};
  });
  expect(setup.workers.length,'At least one genuine worker required').toBeGreaterThan(0);
  expect(setup.supported,'A/B baseline disables joint palette').toBe(false);
  await page.waitForFunction(frame=>
   window.__tinyKingdom.getFrameProfile().totalFrames>frame,
   setup.frame,{timeout:125000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {authority:JSON.stringify(g.exportSnapshot()),
    count:g.metrics().citizens,
    triangle:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),
    viewport:g.getPresentedCameraFrame(),
    skin:g.getWorkingSkinAudit()};
  });
  await info.attach('w125-original-worker-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  const frame=await page.evaluate(()=>{
   const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
   g.setWorkingSkinEnabledForTesting(true);return n;
  });
  await page.waitForFunction(n=>
   window.__tinyKingdom.getFrameProfile().totalFrames>n,
   frame,{timeout:125000});
  const candidate=await page.evaluate(()=>{
   const g=window.__tinyKingdom,
    gl=document.getElementById('world').getContext('webgl');
   return {authority:JSON.stringify(g.exportSnapshot()),
    count:g.metrics().citizens,
    triangle:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),
    viewport:g.getPresentedCameraFrame(),
    skin:g.getWorkingSkinAudit(),worker:g.getWorkingResidentAudit(),
    glError:gl?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth,
    names:g.getState().people.map(p=>p.name)};
  });
  await info.attach('w125-real-gpu-joint-worker-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('w125-authority-and-bone-audit-'+viewport.width,
   {body:Buffer.from(JSON.stringify({source:info.project.name,
    viewport,setup,original:{
     count:original.count,triangle:original.triangle,skin:original.skin,
     view:original.viewport},candidate:{
      count:candidate.count,triangle:candidate.triangle,
      skin:candidate.skin,worker:candidate.worker,view:candidate.viewport,
      glError:candidate.glError,overflow:candidate.overflow}},
    null,2)),contentType:'application/json'});
  expect(candidate.authority).toBe(original.authority);
  expect(candidate.count).toBe(original.count);
  expect(candidate.count).toBe(setup.initialPeople);
  expect(candidate.triangle).toBe(original.triangle);
  expect(candidate.triangle).toBeLessThan(160000);
  expect(candidate.geometry).toEqual(original.geometry);
  expect(candidate.skin.active).toBe(true);
  expect(candidate.skin.jointBuffers).toBeLessThanOrEqual(1);
  expect(candidate.skin.jointFloats).toBeLessThanOrEqual(candidate.skin.maxJointFloats);
  // A green screenshot with NO real worker on the GPU proves nothing:
  // demand an actual authoritative worksite and at least one rig draw.
  expect(candidate.worker.authenticWorkers).toBeGreaterThan(0);
  expect(candidate.skin.realWorkers).toBe(candidate.worker.authenticWorkers);
  expect(candidate.skin.gpuRigDraws).toBeGreaterThan(0);
  expect(candidate.skin.paletteUpdates).toBeGreaterThanOrEqual(
   candidate.skin.gpuRigDraws);
  expect(candidate.skin.cachedActors).toBeLessThanOrEqual(24);
  expect(candidate.worker.foregroundProfessionHandsLive).toBe(true);
  expect(candidate.worker.deliveryCartAndUnloadLive).toBe(true);
  expect(candidate.worker.realWorkerNames.every(n=>candidate.names.includes(n)))
   .toBe(true);
  expect(candidate.glError).toBe(0);
  expect(candidate.overflow).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
  // W125 moving acceptance: replay exactly the SAME authoritative saved
  // worker shift in original CPU and articulated GPU modes. Each snapshot
  // is advanced by the same real deterministic ticks. The recorded video
  // contains actual changing worker frames, no fake actor/film transaction.
  const anchor=JSON.parse(original.authority);
  const motion=async skinned=>{
   await page.evaluate(({snapshot,mode})=>{
    const g=window.__tinyKingdom;g.setSpeed(0);
    g.restoreSnapshot(snapshot);
    g.setCamera({focus:[0,0],yaw:.45,pitch:.86,zoom:80});
    g.setWorkingSkinEnabledForTesting(mode);
   },{snapshot:anchor,mode:skinned});
   const trace=[];
   for(let k=0;k<6;k++){
    const prior=await page.evaluate(()=>{
     const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
     g.step(1/30);return n;
    });
    await page.waitForFunction(n=>
     window.__tinyKingdom.getFrameProfile().totalFrames>n,
     prior,{timeout:125000});
    if(k===0||k===5)
     await info.attach('w125-'+(skinned?'gpu':'original')+
      '-genuine-moving-frame-'+k+'-'+viewport.width,
      {body:await page.screenshot(),contentType:'image/png'});
    trace.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     return {checksum:g.exportSnapshot().checksum,
      citizens:g.metrics().citizens,
      workers:g.getActiveWorksites().length,
      triangles:g.renderStats().lastFrameTriangles,
      glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
      skin:g.getWorkingSkinAudit(),
      cpuStages:g.getFrameProfile().stages,
      gpuTimer:g.getGpuFrameTimerAudit()};
    }));
   }
   return {snapshot:await page.evaluate(()=>
    JSON.stringify(window.__tinyKingdom.exportSnapshot())),trace};
  };
  const originalMotion=await motion(false),gpuMotion=await motion(true);
  expect(gpuMotion.snapshot).toBe(originalMotion.snapshot);
  expect(gpuMotion.trace.map(x=>x.checksum)).toEqual(
   originalMotion.trace.map(x=>x.checksum));
  expect(gpuMotion.trace.map(x=>x.citizens)).toEqual(
   originalMotion.trace.map(x=>x.citizens));
  for(const frameEvidence of gpuMotion.trace){
   expect(frameEvidence.triangles).toBeLessThan(160000);
   expect(frameEvidence.glError).toBe(0);
  }
  await info.attach('w125-identical-true-autonomous-motion-'+viewport.width,
   {body:Buffer.from(JSON.stringify({viewport,
    original:originalMotion.trace,candidate:gpuMotion.trace},null,2)),
    contentType:'application/json'});
 });
}
