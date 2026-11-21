'use strict';
// W511: uncut physical gameplay, never spawned actors or a staged receipt.
// An actual populated Day-121 original courier must preserve ONE animated
// body and its escrowed cart when small enough for the 13-joint GPU tier.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:390,height:844},{width:1024,height:640}]){
 test('W511 original grown-town loaded courier GPU body and live cart '+viewport.width,
 async({page},info)=>{
  test.setTimeout(420000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()
   ?.lastFrameTriangles>0,null,{timeout:125000});
  const loaded=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   // Original fixed-step authority, same Day-120 and seed as the running game.
   for(let i=0;i<120*24*30;i++)g.step(1/30);
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
    await info.attach('w511-actual-gpu-courier-'+viewport.width,
     {body:await page.screenshot(),contentType:'image/png'});
    break;
   }
  }
  const verified=shots.find(x=>x.coverage.frameCurrent&&
   x.skin.compactGpuBodies>0&&x.skin.names.includes(current.citizen)&&
   x.skin.liveCartNames.includes(current.citizen))||null;
  await info.attach('w511-real-source-physical-probes-'+viewport.width,{
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
  // Restore SAME original world, render with CPU IK fallback, and make sure
  // a camera/rendering toggle neither manufactures cargo nor changes authority.
  const original=await page.evaluate(async ({saved,courier,zoom})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(saved);g.setSpeed(0);
   g.setWorkingSkinEnabledForTesting(false);
   g.setCamera({focus:[courier.x,courier.z],yaw:.55,pitch:.82,zoom});
   const before=g.getFrameProfile().totalFrames;
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return {before,after:g.getFrameProfile().totalFrames,
    world:g.exportSnapshot(),skin:g.getOriginalLiveCourierSkinAudit(),
    coverage:g.getActorPresentationCoverageAudit(),
    population:g.metrics().citizens,triangles:g.renderStats().lastFrameTriangles};
  },{saved:loaded.saved,courier:current,zoom:verified.zoom});
  await info.attach('w511-original-cpu-courier-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  expect(JSON.stringify(original.world)).toBe(JSON.stringify(loaded.saved));
  expect(original.population).toBe(loaded.people);
  expect(original.skin.authenticGpuBodies).toBe(0);
  expect(original.triangles).toBeLessThan(160000);
  expect(errors).toEqual([]);
 });
}
