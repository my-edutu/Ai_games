'use strict';
// W512: uncut physical gameplay, never spawned actors or a staged receipt.
// An actual populated Day-121 original courier must preserve ONE animated
// body and its escrowed cart when small enough for the 13-joint GPU tier.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:390,height:844},{width:1024,height:640}]){
 test('W512 original grown-town loaded courier GPU body and live cart '+viewport.width,
 async({page},info)=>{
  test.setTimeout(420000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()
   ?.lastFrameTriangles>0,null,{timeout:125000});
  await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0)});
  // Chunk real Day-120 fixed-step autonomy so the browser event loop remains
  // responsive. No headless alternate game, snapshot edit, or staged worker.
  for(let remaining=120*24*30;remaining>0;remaining-=7200)
   await page.evaluate(n=>{for(let i=0;i<n;i++)
    window.__tinyKingdom.step(1/30)},Math.min(7200,remaining));
  const loaded=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   let courier=g.getActiveDeliveries().find(d=>d.escrowed&&d.stage==='travel')||null;
   for(let i=0;!courier&&i<72*24*30;i++){
    g.step(1/30);
    if(i%6===0)courier=g.getActiveDeliveries()
     .find(d=>d.escrowed&&d.stage==='travel')||null;
   }
   return {courier,day:g.metrics().day,people:g.metrics().citizens,
    saved:g.exportSnapshot(),camera:g.getCamera()};
  });
  expect(loaded.courier,'must actually observe earned, original on-road escrow')
   .not.toBeNull();
  expect(loaded.day).toBeGreaterThanOrEqual(120);
  expect(loaded.people).toBeGreaterThanOrEqual(12);
  const current=loaded.courier;
  const shots=[];
  for(const zoom of [15,18,22,27]){
   const before=await page.evaluate(({courier,zoom})=>{
    const g=window.__tinyKingdom;
    g.setSpeed(0);g.setWorkingSkinEnabledForTesting(true);
    g.setCamera({focus:[courier.x,courier.z],yaw:.55,pitch:.82,zoom});
    return g.getFrameProfile().totalFrames;
   },{courier:current,zoom});
   await page.waitForFunction(n=>window.__tinyKingdom
    .getFrameProfile().totalFrames>n,before,{timeout:125000});
   const shot=await page.evaluate(name=>{
    const g=window.__tinyKingdom;
    return {zoom:g.getCamera().zoom,skin:g.getOriginalLiveCourierSkinAudit(),
     coverage:g.getActorPresentationCoverageAudit(),
     geometry:g.getGeometryAudit(),triangles:g.renderStats().lastFrameTriangles,
     profile:g.getFrameProfile().stages,
     glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
     courier:g.getActiveDeliveries().find(d=>d.citizen===name)||null,
     width:document.documentElement.scrollWidth};
   },current.citizen);
   shots.push(shot);
   if(shot.coverage.frameCurrent&&shot.skin.compactGpuBodies>0&&
      shot.skin.names.includes(current.citizen)&&
      shot.skin.liveCartNames.includes(current.citizen)){
    await info.attach('w512-actual-gpu-courier-'+viewport.width,
     {body:await page.screenshot(),contentType:'image/png'});
    break;
   }
  }
  const verified=shots.find(x=>x.coverage.frameCurrent&&
   x.skin.compactGpuBodies>0&&x.skin.names.includes(current.citizen)&&
   x.skin.liveCartNames.includes(current.citizen))||null;
  await info.attach('w512-real-source-physical-probes-'+viewport.width,{
   body:Buffer.from(JSON.stringify({viewport,source:'real-Day121-authority',
    person:current,checks:shots,physicalHardwareFps:'NOT MEASURED'},null,2)),
   contentType:'application/json'});
  expect(verified,'genuinely travelling small courier must draw one GPU body and live cart')
   .not.toBeNull();
  expect(verified.coverage.exactlyOneBodyPathPerCitizen).toBe(true);
  expect(verified.coverage.missingNames).toEqual([]);
  expect(verified.skin.authenticGpuBodies).toBe(verified.skin.liveCartNames.length);
  expect(verified.triangles).toBeLessThan(160000);
  expect(verified.glError).toBe(0);
  if(viewport.width===390)expect(verified.width).toBeLessThanOrEqual(390);
  // W512 real-game A/B: same authoritative courier, original stock, route,
  // view and material. Only the temporary cart-mesh retention policy changes.
  const cacheBefore=await page.evaluate(()=>window.__tinyKingdom
   .getOriginalCourierCartTemplateAudit());
  expect(cacheBefore.enabled).toBe(true);
  expect(cacheBefore.builds).toBeGreaterThan(0);
  expect(cacheBefore.entries).toBeGreaterThan(0);
  expect(cacheBefore.floats).toBeLessThanOrEqual(cacheBefore.maxFloats);
  expect(cacheBefore.entries).toBeLessThanOrEqual(cacheBefore.maxEntries);
  expect(cacheBefore.economyMutated).toBe(false);
  await info.attach('w512-real-courier-template-on-'+viewport.width,{
   body:await page.screenshot(),contentType:'image/png'});
  const beforeLegacyFrame=await page.evaluate(({saved,courier,zoom})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(saved);g.setSpeed(0);
   g.setWorkingSkinEnabledForTesting(true);
   g.setOriginalCourierCartTemplateForTesting(false);
   g.setCamera({focus:[courier.x,courier.z],yaw:.55,pitch:.82,zoom});
   return g.getFrameProfile().totalFrames;
  },{saved:loaded.saved,courier:current,zoom:verified.zoom});
  await page.waitForFunction(n=>window.__tinyKingdom
   .getFrameProfile().totalFrames>n,beforeLegacyFrame,{timeout:125000});
  const legacy=await page.evaluate(name=>{
   const g=window.__tinyKingdom;
   return {world:g.exportSnapshot(),
    cart:g.getOriginalLiveCourierSkinAudit(),
    cache:g.getOriginalCourierCartTemplateAudit(),
    actors:g.getActorPresentationCoverageAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    stages:g.getFrameProfile().stages,
    glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
    width:document.documentElement.scrollWidth,
    delivery:g.getActiveDeliveries().find(d=>d.citizen===name)||null};
  },current.citizen);
  await info.attach('w512-same-world-live-original-cart-'+viewport.width,{
   body:await page.screenshot(),contentType:'image/png'});
  await info.attach('w512-original-courier-template-evidence-'+viewport.width,{
   body:Buffer.from(JSON.stringify({sourceCommit:process.env.GITHUB_SHA||'local',
    viewport,day:loaded.day,courier:current,template:cacheBefore,
    afterFallback:legacy,selectedCandidate:verified,
    hardwareFps:'NOT MEASURED',independentVisualGate:'NOT PROVEN'},null,2)),
   contentType:'application/json'});
  expect(JSON.stringify(legacy.world)).toBe(JSON.stringify(loaded.saved));
  expect(legacy.cache.enabled).toBe(false);
  expect(legacy.actors.exactlyOneBodyPathPerCitizen).toBe(true);
  expect(legacy.actors.missingNames).toEqual([]);
  expect(legacy.triangles).toBe(verified.triangles);
  expect(legacy.cart.liveCartNames).toContain(current.citizen);
  expect(legacy.glError).toBe(0);
  if(viewport.width===390)expect(legacy.width).toBeLessThanOrEqual(390);
  // Restore the original static template on the same actual transaction for
  // an additional frame: retained cart topology must not invent a receipt.
  const beforeAgain=await page.evaluate(({saved,courier,zoom})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(saved);g.setSpeed(0);
   g.setOriginalCourierCartTemplateForTesting(true);
   g.setCamera({focus:[courier.x,courier.z],yaw:.55,pitch:.82,zoom});
   return g.getFrameProfile().totalFrames;
  },{saved:loaded.saved,courier:current,zoom:verified.zoom});
  await page.waitForFunction(n=>window.__tinyKingdom
   .getFrameProfile().totalFrames>n,beforeAgain,{timeout:125000});
  const refreshed=await page.evaluate(()=>({
   cache:window.__tinyKingdom.getOriginalCourierCartTemplateAudit(),
   world:window.__tinyKingdom.exportSnapshot(),
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles
  }));
  expect(refreshed.cache.builds).toBeGreaterThan(cacheBefore.builds);
  expect(refreshed.triangles).toBe(verified.triangles);
  expect(JSON.stringify(refreshed.world)).toBe(JSON.stringify(loaded.saved));
  // Restore SAME original world, render with CPU IK fallback, and make sure
  // a camera/rendering toggle neither manufactures cargo nor changes authority.
  const beforeCpuFrame=await page.evaluate(({saved,courier,zoom})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(saved);g.setSpeed(0);
   g.setWorkingSkinEnabledForTesting(false);
   g.setCamera({focus:[courier.x,courier.z],yaw:.55,pitch:.82,zoom});
   return g.getFrameProfile().totalFrames;
  },{saved:loaded.saved,courier:current,zoom:verified.zoom});
  await page.waitForFunction(n=>window.__tinyKingdom
   .getFrameProfile().totalFrames>n,beforeCpuFrame,{timeout:125000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:g.exportSnapshot(),skin:g.getOriginalLiveCourierSkinAudit(),
    coverage:g.getActorPresentationCoverageAudit(),
    population:g.metrics().citizens,triangles:g.renderStats().lastFrameTriangles};
  });
  await info.attach('w512-original-cpu-courier-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  expect(JSON.stringify(original.world)).toBe(JSON.stringify(loaded.saved));
  expect(original.population).toBe(loaded.people);
  expect(original.skin.authenticGpuBodies).toBe(0);
  expect(original.triangles).toBeLessThan(160000);
  expect(errors).toEqual([]);
 });
}
