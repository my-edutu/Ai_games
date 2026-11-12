'use strict';
// W212: genuine scene A/B for the SAME saved autonomous inhabitants.
// Verify passive full-body WebGL rig truly appears without inventing a
// resident or changing harvest, shipment, receipt, home or simulation state.
// SwiftShader screenshot ≠ hardware FPS, and this is not a visual milestone.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W212 same authentic resting inhabitants GPU and CPU '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const residents=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let steps=0,rhythm=g.getDailyRhythmAudit();
   while(steps<3600&&!rhythm.citizens.some(c=>c.activity==='Resting at home')){
    for(let j=0;j<30;j++)g.step(1/30);
    steps+=30;rhythm=g.getDailyRhythmAudit();
   }
   return {steps,resting:rhythm.citizens.filter(c=>c.activity==='Resting at home'),
    checksum:g.exportSnapshot().checksum,
    metrics:g.metrics()};
  });
  expect(residents.resting.length,'Only real citizens returned home').toBeGreaterThan(0);
  // The viewer must physically encounter one true, SMALL idle body on its
  // own original camera route. Record every failed camera/LOD attempt rather
  // than silently interpreting a missing near-screen actor as a broken GPU.
  // Desktop and phone use different optics: try wide enough to meet the
  // 11.5% apparent-height limit but not so wide that all citizens are offscreen.
  let view=null;
  const probes=[],realTargets=residents.resting.slice(0,9);
  await page.evaluate(()=>window.__tinyKingdom
   .setWorkingSkinEnabledForTesting(true));
  for(const citizen of realTargets){
   for(const zoom of [18,23,28,32,38,44,52]){
    const frame=await page.evaluate(({citizen,zoom})=>{
     const g=window.__tinyKingdom;
     g.setCamera({focus:citizen.position,yaw:.58,pitch:.86,zoom});
     return g.getFrameProfile().totalFrames;
    },{citizen,zoom});
    await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
     .totalFrames>n,frame,{timeout:125000});
    const r=await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     return {skin:g.getForegroundSkinAudit(),
      resident:g.getForegroundResidentAudit(),
      resting:g.getRestingActorResidencyAudit(),
      policy:g.getCitizenDetailProjectionAudit(),
      camera:g.getCamera()};
    });
    probes.push({citizen:citizen.name,zoom,
     skinned:r.resident.physicallySkinnedPassiveResidents,
     visible:r.resident.visiblePeople,
     storedResting:r.resting.actualCitizens,
     residentNames:r.resident.originalNames,
     detail:r.policy.fullDetailCount,
     detailVisible:r.policy.visibleCandidates,
     fullSkinNames:r.skin.names,
     camera:r.camera});
    if(r.resident.physicallySkinnedPassiveResidents>0&&
       r.skin.names.includes(citizen.name)&&r.resident.originalNames.includes(citizen.name)){
     view={citizen:citizen.name,position:citizen.position,
      camera:{focus:citizen.position,yaw:.58,pitch:.86,zoom},
      initial:r.skin};
     break;
    }
   }
   if(view)break;
  }
  await info.attach('w212-real-citizen-camera-eligibility-'+viewport.width,{
   body:Buffer.from(JSON.stringify({realCitizenCount:residents.resting.length,
    actualSubjects:realTargets,probes,selected:view},null,2)),
   contentType:'application/json'});
  expect(view,'An actual small idle citizen should enter the bounded GPU pose')
   .not.toBeNull();
  const source=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  const run=async enabled=>{
   const f=await page.evaluate(({source,enabled,view})=>{
    const g=window.__tinyKingdom;g.setSpeed(0);
    g.restoreSnapshot(source);g.setCamera(view.camera);
    g.setWorkingSkinEnabledForTesting(enabled);
    return g.getFrameProfile().totalFrames;
   },{source,enabled,view});
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
    .totalFrames>n,f,{timeout:125000});
   const series=[];
   for(let i=0;i<4;i++){
    const previous=await page.evaluate(()=>{
     const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
     g.step(1/30);return n;
    });
    await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
     .totalFrames>n,previous,{timeout:125000});
    series.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom,
      gl=document.getElementById('world').getContext('webgl');
     return {checksum:g.exportSnapshot().checksum,
      citizens:g.metrics().citizens,
      buildings:g.metrics().buildings,
      originalNames:g.getState().people.map(p=>p.name),
      idle:g.getDailyRhythmAudit().counts.resting,
      geometry:g.getGeometryAudit().totalTriangles,
      lastFrame:g.renderStats().lastFrameTriangles,
      passive:g.getForegroundResidentAudit().physicallySkinnedPassiveResidents,
      full:g.getForegroundResidentAudit(),
      // W272: retain scene-component evidence BEFORE the strict equal-mesh
      // assertion: a 42-triangle deficit is an actual GPU/CPU parity blocker.
      // Do not hide it behind a tolerance, or mistake it for hardware FPS.
      scene:g.getSceneTriangleReconciliation(),
      working:g.getWorkingResidentAudit(),
      commuter:g.getResidentCommuterAudit(),
      resting:g.getRestingActorResidencyAudit(),
      actor:g.getActorResidencyAudit(),
      detail:g.getCitizenDetailProjectionAudit(),
      cloth:g.getVillageClothAudit(),
      glError:gl?.getError()??-1,
      overflow:document.documentElement.scrollWidth-innerWidth};
    }));
   }
   await info.attach('w212-'+(enabled?'gpu':'cpu')+'-real-rest-'+viewport.width,
    {body:await page.screenshot(),contentType:'image/png'});
   return {snapshot:await page.evaluate(()=>window.__tinyKingdom.exportSnapshot()),
    series};
  };
  const cpu=await run(false),gpu=await run(true);
  // Preserve the complete authentic component-by-component A/B even on
  // failure; subsequent work may only claim a correction with real parity.
  await info.attach('w272-strict-unchanged-worker-gpu-cpu-parity-'+viewport.width,{
   body:Buffer.from(JSON.stringify({viewport,view,
    source:'same-true-world-no-fake-actors',cpu:cpu.series,gpu:gpu.series},null,2)),
   contentType:'application/json'});
  expect(gpu.snapshot).toEqual(cpu.snapshot);
  expect(gpu.series.map(r=>r.checksum)).toEqual(cpu.series.map(r=>r.checksum));
  expect(gpu.series.map(r=>r.originalNames)).toEqual(cpu.series.map(r=>r.originalNames));
  for(let i=0;i<gpu.series.length;i++){
   const c=cpu.series[i],g=gpu.series[i];
   expect(g.citizens).toBe(c.citizens);expect(g.buildings).toBe(c.buildings);
   expect(g.geometry).toBe(c.geometry);expect(g.lastFrame).toBe(c.lastFrame);
   expect(g.geometry).toBeLessThan(160000);
   expect(g.passive).toBeGreaterThan(0);expect(c.passive).toBe(0);
   expect(g.glError).toBe(0);expect(g.overflow).toBeLessThanOrEqual(0);
  }
  await info.attach('w212-original-full-body-passive-motion-'+viewport.width,
   {body:Buffer.from(JSON.stringify({viewport,view,
    residentsBefore:residents,cpu:cpu.series,gpu:gpu.series,
    source:'authentic-autonomous-save-restored',
    physicalGpu:false,independentCritic:false},null,2)),
    contentType:'application/json'});
  // W215 rendering spine: an unchanged, genuinely resting citizen should
  // retain an identical thirteen-joint pose during camera-only redraws.
  // No simulation tick, invented movement, prop or authoring state is allowed.
  const memoBefore=await page.evaluate(()=>window.__tinyKingdom.getWorkSkinPaletteAudit());
  const frozenChecksum=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum);
  for(let j=0;j<3;j++){
   const prior=await page.evaluate(({view,j})=>{
    const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
    g.setCamera({...view.camera,yaw:view.camera.y+.014*(j+1)});
    return n;
   },{view,j});
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
    .totalFrames>n,prior,{timeout:125000});
  }
  const memoAfter=await page.evaluate(()=>window.__tinyKingdom.getWorkSkinPaletteAudit());
  expect(memoAfter.sameStateFrameHits,
   'Camera-only redrawing the SAME real resident should reuse bounded GPU rig pose')
   .toBeGreaterThan(memoBefore.sameStateFrameHits);
  expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum))
   .toBe(frozenChecksum);
  await info.attach('w215-unchanged-original-rig-cache-'+viewport.width,{
   body:Buffer.from(JSON.stringify({memoBefore,memoAfter,frozenChecksum},null,2)),
   contentType:'application/json'});
  expect(errors).toEqual([]);
 });
}
