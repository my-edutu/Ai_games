'use strict';
// W519: genuine Day-21 roof-over-camera failure witnessed in W518
// desktop/390px captured playback. No fake house or manipulated saved world.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W519 actual growing homes must not swallow the playable village camera '+viewport.width,
 async({page},info)=>{
  test.setTimeout(420000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>
   window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  // W532 RED-before: the W531 growth recording explicitly forces a close
  // farm camera BEFORE its first screenshot. That footage cannot prove the
  // unmodified opening settlement is legible. Capture the untouched scene
  // first, preserving the SAME genuine WebGL pixels, original people and state.
  const openingDirectory=path.resolve('artifacts/tiny-kingdom-w520-court-camera',
   String(viewport.width));
  fs.mkdirSync(openingDirectory,{recursive:true});
  const opening=await page.evaluate(()=>{
   const g=window.__tinyKingdom,c=document.querySelector('#world');
   return {view:g.getCamera(),physical:g.getFreeCameraCollisionAudit(),
    lived:g.getLivedTownOverviewAudit(),checksum:g.exportSnapshot().checksum,
    population:g.metrics().citizens,
    glError:c.getContext('webgl').getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const openingFrame=await page.screenshot();
  fs.writeFileSync(path.join(openingDirectory,'untouched-opening.png'),openingFrame);
  fs.writeFileSync(path.join(openingDirectory,'untouched-opening.json'),
   JSON.stringify({source:process.env.GITHUB_SHA||'local',
    viewport,originalWorld:true,...opening,
    physicalHardwareFPS:'NOT MEASURED',independentAB:'NOT PROVEN'},null,2));
  await info.attach('untouched-opening-'+viewport.width,
   {body:openingFrame,contentType:'image/png'});
  expect(opening.lived.attempted).toBe(true);
  expect(opening.lived.selected).toBeGreaterThan(0);
  expect(opening.lived.last?.story?.market?.visible).toBe(true);
  expect(opening.lived.last?.story?.visibleDistricts).toBeGreaterThanOrEqual(2);
  expect(opening.physical.viewClear).toBe(true);
  expect(opening.view.pitch).toBeLessThan(.9);
  expect(opening.population).toBeGreaterThan(0);
  expect(opening.glError).toBe(0);
  expect(opening.overflow).toBeLessThanOrEqual(0);
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.reset();g.setSpeed(0);
   g.setCamera({focus:[23.0,1.0],yaw:.82,pitch:.59,zoom:12.8});
  });
  // W520 RED-before contract: W519 physical checks falsely passed actual
  // Day1→Day121 roof-filled desktop and 390px recordings. A clear camera EYE
  // is insufficient when a real home occupies the complete screen.
  const evidenceDirectory=path.resolve('artifacts/tiny-kingdom-w520-court-camera',String(viewport.width));
  fs.mkdirSync(evidenceDirectory,{recursive:true});
  const stages=[],initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:g.exportSnapshot(),people:g.metrics().citizens,
    homes:g.metrics().buildings};
  });
  let prevDay=0;
  for(const day of [1,21,41,81,121]){
   const delta=day===1?0:(day-prevDay)*24*30;
   for(let remaining=delta;remaining>0;remaining-=7200)
    await page.evaluate(n=>{
     const g=window.__tinyKingdom;
     for(let i=0;i<n;i++)g.step(1/30);
    },Math.min(7200,remaining));
   prevDay=day;
   const lastFrame=await page.evaluate(()=>
    window.__tinyKingdom.renderQuality().framesDrawn);
   await page.waitForFunction(before=>
    window.__tinyKingdom.renderQuality().framesDrawn>before,
    lastFrame,{timeout:125000});
   const observed=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const canvas=document.querySelector('#world');
    const before=g.exportSnapshot().checksum;
    const physical=g.getFreeCameraCollisionAudit();
    const physicalSite=g.getCameraOcclusionModel();
    const grown=g.getGrowingTownCameraAudit();
    const after=g.exportSnapshot().checksum;
    return {day:g.metrics().day,people:g.metrics().citizens,
     homes:g.metrics().buildings,physical,physicalSite,grown,
     scene:g.renderStats().lastFrameTriangles,
     originalFullSource:g.getSceneTriangleReconciliation(),
     forest:g.getForestLodStats(),
     forestArt:g.getForestVisualStats(),
     camera:g.getCamera(),
     realAuthorityUntouchedByCamera:before===after,
     checksum:after,webglError:canvas.getContext('webgl').getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   stages.push(observed);
   // Preserve the original live audit even if a strict physical framing
   // assertion fails on this day. CI must not upload only terminal green clips.
   const actualFrame=await page.screenshot();
   // Independent raster-level gate from genuine WebGL footage. W520's
   // 2/2 green browser test filmed 99.99% neutral grey roof/plaster pixels
   // in its desktop scene crop; valid W518 Day1 overview showed real green.
   // Never substitute synthetic images, camera audit flags or 3D sketches.
   const actualPixels=await page.evaluate(async base64=>{
    const bytes=Uint8Array.from(atob(base64),ch=>ch.charCodeAt(0));
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    const scratch=document.createElement('canvas');
    scratch.width=bitmap.width;scratch.height=bitmap.height;
    const ctx=scratch.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bitmap,0,0);
    const left=Math.floor(bitmap.width*.14),top=Math.floor(bitmap.height*.2);
    const width=Math.floor(bitmap.width*.72),height=Math.floor(bitmap.height*.63);
    const data=ctx.getImageData(left,top,width,height).data;
    let total=0,green=0,neutral=0;
    for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5){
     const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
     total++;
     if(g>r*1.06&&g>b*1.045&&g>35&&g<220)green++;
     if(Math.max(r,g,b)-Math.min(r,g,b)<25)neutral++;
    }
    bitmap.close();
    return {sampled:total,greenFraction:green/total,
     neutralFraction:neutral/total};
   },actualFrame.toString('base64'));
   observed.actualScreenPixels=actualPixels;

   // Preserve the genuine PNG and raster audit before any failure can stop
   // Playwright. Never leave a red experience test without downloadable film.
   fs.writeFileSync(path.join(evidenceDirectory,'day-'+day+'.json'),
    JSON.stringify({source:process.env.GITHUB_SHA||'local',viewport,
     seed:initial.snapshot.checksum,...observed,
     hardwareFps:'NOT MEASURED'},null,2));
   fs.writeFileSync(path.join(evidenceDirectory,'day-'+day+'.png'),actualFrame);
   await info.attach('real-day-'+day+'-'+viewport.width,{
    body:actualFrame,contentType:'image/png'});
   if(day===1){
    expect(actualPixels.greenFraction).toBeGreaterThan(.12);
    expect(actualPixels.neutralFraction).toBeLessThan(.90);
   }
   expect(observed.realAuthorityUntouchedByCamera).toBe(true);
   expect(observed.camera.follow).toBe(false);
   expect(observed.physicalSite.sanctuaryNaves).toBe(1);
   expect(observed.physicalSite.sanctuaryBellTowers).toBe(1);
   expect(observed.physical.eyeClear).toBe(true);
   expect(observed.physical.viewClear).toBe(true);
   // Independent visual-composition contract: reject the genuine W519
   // roof-filled frames that still passed eyeClear and viewClear. Only a
   // physically unobstructed ray to the town court counts as a free overview.
   expect(observed.physical.centralTownRayClear).toBe(true);
   expect(observed.physical.centralTownBlockers).toBe(0);
   expect(observed.physical.nearRoofDominance).toBeLessThan(.78);
   expect(observed.physical.screenDominantBuilding).toBeLessThan(.40);
   // W526: real W525 film returned a 1.21-radian bird's-eye view: workers
   // became tiny even though the geometric camera tests were green.
   // Demand actual lower-angle sightlines when a real construction recovery
   // happened; do not assert a scripted shot or fake a worker.
   if(day>=21&&observed.grown.actualObstructions>0){
    expect(observed.grown.groundedSelections).toBeGreaterThan(0);
    expect(observed.grown.lastGroundedPitch).toBeLessThan(.92);
    expect(observed.camera.pitch).toBeLessThan(.92);
   }
   expect(observed.scene).toBeGreaterThan(0);
   expect(observed.scene).toBeLessThan(160000);
   // W523 actual forest tri-budget safety: all seeded trees still rendered,
   // near working boughs retain the original eight-triangle double-sided
   // silhouette; only mid/far subpixel underside panels are folded away.
   expect(observed.forest.renderedTrees).toBeGreaterThan(0);
   expect(observed.forest.foldedNeedleBoughs).toBeGreaterThan(0);
   expect(observed.forest.foldedNeedleTriangles)
    .toBe(observed.forest.foldedNeedleBoughs*4);
   expect(observed.forestArt.renderedTrees).toBe(observed.forest.renderedTrees);
   expect(observed.forestArt.needleFanTriangles)
    .toBe(observed.forestArt.needleBoughs*8-
     observed.forest.foldedNeedleTriangles);
   // Day-121 complete ORIGINAL source must pass, not only frustum-submitted
   // triangles. A prior real run failed 162,086/160,000 despite a valid view.
   if(day===121)
    expect(observed.originalFullSource.auditedTriangles).toBeLessThan(160000);
   expect(observed.webglError).toBe(0);
   expect(observed.overflow).toBeLessThanOrEqual(0);
   expect(observed.people).toBeGreaterThanOrEqual(initial.people);
   expect(observed.grown.hiddenStructures).toBe(0);
   expect(observed.grown.hiddenCitizens).toBe(0);
  }
  // W526 second running-camera witness: real touchscreen/mouse-visible
  // Farm view button must expose the genuine district, not the prior steep
  // W525 1.21-radian view. Preserve the same Day121 world and record pixels.
  const beforeFarm=await page.evaluate(()=>
   window.__tinyKingdom.exportSnapshot().checksum);
  await page.locator('#camera-disclosure').click();
  await page.locator('#camera-farm').click();
  const previousFrame=await page.evaluate(()=>
   window.__tinyKingdom.renderQuality().framesDrawn);
  await page.waitForFunction(before=>
   window.__tinyKingdom.renderQuality().framesDrawn>before,
   previousFrame,{timeout:125000});
  const farmWitness=await page.evaluate(()=>{
   const g=window.__tinyKingdom,c=document.querySelector('#world');
   return {camera:g.getCamera(),physical:g.getFreeCameraCollisionAudit(),
    farm:g.getPhysicalFarmCameraAudit(),
    checksum:g.exportSnapshot().checksum,
    sourceTriangles:g.getSceneTriangleReconciliation().auditedTriangles,
    webglError:c.getContext('webgl').getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const farmPng=await page.screenshot();
  fs.writeFileSync(path.join(evidenceDirectory,'day-121-physical-farm-view.png'),farmPng);
  fs.writeFileSync(path.join(evidenceDirectory,'day-121-physical-farm-view.json'),
   JSON.stringify({source:process.env.GITHUB_SHA||'local',
    viewport,day121ActualOriginalWorksite:true,...farmWitness,
    hardwareFps:'NOT MEASURED',independentBlindCritic:'NOT PROVEN'},null,2));
  await info.attach('actual-physical-farm-'+viewport.width,{
   body:farmPng,contentType:'image/png'});
  expect(farmWitness.farm.last?.accepted).toBe(true);
  expect(farmWitness.camera.pitch).toBeLessThan(.92);
  expect(farmWitness.camera.zoom).toBeLessThanOrEqual(35);
  expect(farmWitness.physical.viewClear).toBe(true);
  expect(farmWitness.sourceTriangles).toBeLessThan(160000);
  expect(farmWitness.checksum).toBe(beforeFarm);
  expect(farmWitness.webglError).toBe(0);
  expect(farmWitness.overflow).toBeLessThanOrEqual(0);
  // W527 integrated SAME WORLD tour: actual user interactions with farm,
  // receiving market and occupied homes, each with original physical solids.
  // A green source contract alone cannot establish what the player sees.
  const tourWorldChecksum=await page.evaluate(()=>
   window.__tinyKingdom.exportSnapshot().checksum);
  const tourDirectory=path.join(evidenceDirectory,'real-supply-tour');
  fs.mkdirSync(tourDirectory,{recursive:true});
  for(const stage of ['farm','market','homes']){
   const expanded=await page.locator('#camera-disclosure')
    .getAttribute('aria-expanded');
   if(expanded!=='true')await page.locator('#camera-disclosure').click();
   const frameCount=await page.evaluate(()=>
    window.__tinyKingdom.renderQuality().framesDrawn);
   await page.locator('#camera-survey').click();
   // Do not publish only a midway free-camera tween as final gameplay.
   // The actual original camera can require multiple costly SwiftShader frames.
   await page.waitForFunction(()=>
    !window.__tinyKingdom.getCameraNavigationAudit().transitionActive,
    null,{timeout:125000});
   await page.waitForFunction(before=>
    window.__tinyKingdom.renderQuality().framesDrawn>before,
    frameCount,{timeout:125000});
   const tour=await page.evaluate(()=>{
    const g=window.__tinyKingdom,c=document.querySelector('#world');
    return {survey:g.getRealEconomicSurveyAudit(),
     camera:g.getCamera(),physical:g.getFreeCameraCollisionAudit(),
     checksum:g.exportSnapshot().checksum,
     triangles:g.getSceneTriangleReconciliation().auditedTriangles,
     webglError:c.getContext('webgl').getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   const shot=await page.screenshot();
   fs.writeFileSync(path.join(tourDirectory,stage+'.png'),shot);
   fs.writeFileSync(path.join(tourDirectory,stage+'.json'),
    JSON.stringify({source:process.env.GITHUB_SHA||'local',viewport,
     genuineDay121:true,stage,...tour,physicalHardwareFps:'NOT MEASURED',
     independentBlindAB:'NOT PROVEN'},null,2));
   await info.attach('actual-day121-'+stage+'-'+viewport.width,{
    body:shot,contentType:'image/png'});
   expect(tour.survey.stage).toBe(stage);
   expect(tour.survey.groundedLens.last?.accepted).toBe(true);
   if(stage==='farm'){
    // Foreground must be the original harvest parcel, not the nearby
    // sanctuary wall. Previously 390px film showed only a crop sliver.
    expect(tour.camera.focus[0]).toBeCloseTo(20.55,2);
    expect(tour.camera.focus[1]).toBeCloseTo(1.01,2);
   }
   expect(tour.camera.pitch).toBeLessThan(.88);
   expect(tour.physical.viewClear).toBe(true);
   expect(tour.checksum).toBe(tourWorldChecksum);
   expect(tour.triangles).toBeLessThan(160000);
   expect(tour.webglError).toBe(0);
   expect(tour.overflow).toBeLessThanOrEqual(0);
  }
  // W532 genuine player return: a manually clicked Village control must
  // reframe real market + lived farm/home instead of the old vertical roof.
  const verifiedBefore=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum);
  const oldCount=await page.evaluate(()=>window.__tinyKingdom.renderQuality().framesDrawn);
  await page.locator('[data-scenic="valley"]').click();
  await page.waitForFunction(before=>window.__tinyKingdom.renderQuality().framesDrawn>before,
   oldCount,{timeout:125000});
  const village=await page.evaluate(()=>{
   const g=window.__tinyKingdom,c=document.querySelector('#world');
   return {audit:g.getLivedTownOverviewAudit(),view:g.getCamera(),
    physical:g.getFreeCameraCollisionAudit(),checksum:g.exportSnapshot().checksum,
    glError:c.getContext('webgl').getError()};
  });
  const realVillage=await page.screenshot();
  fs.writeFileSync(path.join(evidenceDirectory,'day-121-player-village.png'),realVillage);
  fs.writeFileSync(path.join(evidenceDirectory,'day-121-player-village.json'),
   JSON.stringify({source:process.env.GITHUB_SHA||'local',viewport,
    ...village,hardwareFPS:'NOT MEASURED'},null,2));
  await info.attach('real-player-village-'+viewport.width,
   {body:realVillage,contentType:'image/png'});
  expect(village.audit.manualVisits).toBeGreaterThan(0);
  expect(village.audit.manualLast?.story?.market?.visible).toBe(true);
  expect(village.audit.manualLast?.story?.visibleDistricts).toBeGreaterThanOrEqual(2);
  expect(village.view.pitch).toBeLessThan(.9);
  expect(village.physical.viewClear).toBe(true);
  expect(village.checksum).toBe(verifiedBefore);
  expect(village.glError).toBe(0);
  expect(stages.at(-1).homes).toBeGreaterThan(initial.homes);
  expect(stages.at(-1).day).toBeGreaterThanOrEqual(120);
  fs.writeFileSync(path.join(evidenceDirectory,'real-world-audit.json'),
   JSON.stringify({source:process.env.GITHUB_SHA||'local',
    seedChecksum:initial.snapshot.checksum,viewport,stages,
    hardwareFps:'NOT MEASURED',independentBlindCritic:'NOT PROVEN'},null,2));
  expect(errors).toEqual([]);
  await info.attach('actual-growing-camera-audit-'+viewport.width,{
   body:Buffer.from(JSON.stringify({source:process.env.GITHUB_SHA||'local',
    seedChecksum:initial.snapshot.checksum,viewport,stages,
    nativeHardwareFps:'NOT MEASURED',independentBlindCritic:'NOT PROVEN',
    scorecardA:'NOT PROVEN',scorecardB:'FAIL'},null,2)),
   contentType:'application/json'});
 });
}
