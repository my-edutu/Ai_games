'use strict';
// W547: genuine UNPAUSED source-pinned moving game evidence, not a paused
// pixel-equality screenshot or invented hardware benchmark.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:390,height:844},{width:1024,height:720}]){
 const mobile=viewport.width===390;
 test('W547 original continuous 3D workday, real actor and camera at '+viewport.width+'px',async({page},info)=>{
  test.setTimeout(240000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  // W545-style original Canvas2D renderer, not a staged alternate game.
  // WebGL/real hardware evidence is independent; these are software diagnostics.
  await page.evaluate(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    if(['webgl','experimental-webgl','webgl2'].includes(kind))return null;
    return original.call(this,kind,...args);
   };
  });
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.getCanvasFallbackRasterAudit?.().draws>=2,
   null,{timeout:150000});
  const measure=()=>page.evaluate(()=>{
   const g=window.__tinyKingdom,world=g.getState();
   return {simTime:world.state.t,people:world.people,
    metrics:g.metrics(),draw:g.getCanvasFallbackRasterAudit(),
    cadence:g.getDrawCadenceAudit(),cpu:g.getFrameProfile(),
    gpu:g.getGpuFrameTimerAudit(),workday:g.getWorkdayView(),
    village:g.getVillageDocumentaryAudit?.()||null,
    horizontalScroll:document.documentElement.scrollWidth,
    hud:document.body.dataset.command,follow:document.body.dataset.workday,
    canvas:[document.getElementById('world').width,document.getElementById('world').height]};
  });
  const before=await measure();
  const folder='artifacts/tiny-kingdom-w547/'+viewport.width;
  fs.mkdirSync(folder,{recursive:true});
  const startShot=await page.screenshot({fullPage:false});
  fs.writeFileSync(path.join(folder,'unpaused-before-watch.png'),startShot);
  // Invoke the actual accessible existing product button. No test-created
  // worker, synthetic delivery, teleport, saved-state write or fake transaction.
  await page.locator('#world-watch-life').click();
  const chosen=await measure();
  await page.waitForFunction(({draws,time})=>{
   const g=window.__tinyKingdom;
   return g.getCanvasFallbackRasterAudit().draws>=draws+6 &&
    g.getState().state.t>time+.001;
  },{draws:chosen.draw.draws,time:chosen.simTime},{timeout:140000});
  const after=await measure(),endShot=await page.screenshot({fullPage:false});
  fs.writeFileSync(path.join(folder,'unpaused-after-real-motion.png'),endShot);
  const audit={sourceSha:process.env.GITHUB_SHA||'local',
   viewport,device:'GitHub hosted Chromium no-WebGL Canvas2D software raster',
   workload:'unpaused real initial village with player choosing existing Watch Life control',
   notPhysicalHardwareFps:true,notMatchedBaselineG088:true,
   noIndependentBlindCritic:true,notFullDay120:true,
   before,chosen,after,pageErrors:errors};
  fs.writeFileSync(path.join(folder,'moving-game-audit.json'),JSON.stringify(audit,null,2));
  await info.attach('unpaused-after-'+viewport.width+'.png',
   {body:endShot,contentType:'image/png'});
  expect(after.simTime).toBeGreaterThan(chosen.simTime);
  expect(after.draw.draws).toBeGreaterThanOrEqual(chosen.draw.draws+6);
  expect(after.metrics.citizens).toBeGreaterThan(0);
  expect(after.metrics.buildings).toBeGreaterThan(0);
  expect(after.cadence.samples).toBeGreaterThan(1);
  expect(after.cadence.notHardwareGpuTimer).toBe(true);
  expect(after.horizontalScroll).toBeLessThanOrEqual(viewport.width);
  expect(errors).toEqual([]);
  console.log('W547 REAL UNPAUSED SOFTWARE WORKDAY',JSON.stringify({
   sourceSha:audit.sourceSha,viewport,initialDay:before.metrics.day,
   lastDay:after.metrics.day,simHoursAdvanced:after.simTime-chosen.simTime,
   originalCitizens:after.metrics.citizens,originalBuildings:after.metrics.buildings,
   p95CompletedDrawMs:after.cadence.p95Ms,
   p95CpuSubmissionMs:after.cpu.stages?.total?.p95,
   originalFramesDrawn:after.draw.draws-chosen.draw.draws,
   hardware30Fps:'NOT PROVEN',independentCritics:'NOT PROVEN'
  }));
 });
}
