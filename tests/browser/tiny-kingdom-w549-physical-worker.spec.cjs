'use strict';
// W549: direct source RED first, then original running citizen with camera.
// Test never injects employees, deliveries, posts, state or simulated labour.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('W549 real moving workday post-aware source contract',()=>{
 expect(html).toContain('const nearActualMarket=portraitLens&&(working||journeyCamera)');
 expect(html).toContain('const realPost=(unloading||marketBarter||nearActualMarket)?');
 expect(html).toContain('const blockedByRealMarketPost=Boolean(');
 expect(html).toContain('isPortraitWorkWitness&&Math.hypot(citizen.x,citizen.z-5)<17');
 expect(html).toContain('plannedMarketPostSightline:lastFollowShot?.marketPostSightline??null');
 expect(html).toContain('marketPostSightline:marketPost');
});
test.use({video:'on'});
for(const width of [390,1024]){
 test('W549 running original medieval citizen under real posts at '+width+'px',async({page},info)=>{
  test.setTimeout(240000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize({width,height:width===390?844:720});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:155000});
  const before=await page.evaluate(()=>({time:window.__tinyKingdom.getState().state.t,
   count:window.__tinyKingdom.metrics().citizens,
   checksum:window.__tinyKingdom.exportSnapshot().checksum}));
  await page.locator('#world-watch-life').click();
  await page.waitForFunction(()=>window.__tinyKingdom?.getCamera?.().follow&&
   window.__tinyKingdom?.getCitizenCameraPlan?.(),null,{timeout:110000});
  const start=await page.evaluate(()=>window.__tinyKingdom.getState().state.t);
  await page.waitForFunction(t=>window.__tinyKingdom.getState().state.t>t+.001,
   start,{timeout:100000});
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom,p=g.getCitizenCameraPlan(),
    c=g.getWorkdayCompositionAudit(),present=g.getPresentedCameraFrame();
   return {time:g.getState().state.t,citizens:g.metrics().citizens,
    structures:g.metrics().buildings,
    snapshotChecksum:g.exportSnapshot().checksum,
    camera:g.getCamera(),frame:present,
    worker:p?{yaw:p.yaw,pitch:p.pitch,zoom:p.zoom,post:p.marketPostSightline,
     coreCover:p.foregroundActorCoreCover,height:p.projectedWorkerHeightFraction,
     blocked:p.blockers}:null,
    actualWorker:c?.active?{actor:c.actor,job:c.job,
     currentPost:c.marketPostSightline,plannedPost:c.plannedMarketPostSightline,
     coreCover:c.actorCoreCover,visibleHeight:c.projectedWorkerHeightFraction}:c,
    triangles:g.renderStats().lastFrameTriangles,
    horizontalScroll:document.documentElement.scrollWidth,
    drawCadence:g.getDrawCadenceAudit?.(),gpuTimer:g.getGpuFrameTimerAudit?.()};
  });
  const folder='artifacts/tiny-kingdom-w549/'+width;
  fs.mkdirSync(folder,{recursive:true});
  const screenshot=await page.screenshot({fullPage:false});
  fs.writeFileSync(path.join(folder,'original-unpaused-worker.png'),screenshot);
  fs.writeFileSync(path.join(folder,'physical-camera-audit.json'),JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',viewport:{width,height:width===390?844:720},
   workload:'Real unpaused original Watch Life actor. No injected world or camera fake',
   backend:'CI Chromium, GPU and physical-hardware measurements NOT VERIFIED',
   pinnedG088:'2f6deb43feb1a1557848d44def53a6109deb1ab1',
   matchedG088Video:false,experience:'NOT PROVEN',commercialQuality:'FAIL',
   independentBlindedReview:'NOT AVAILABLE',before,followStart:start,audit,errors
  },null,2));
  await info.attach('original-workday-'+width+'.png',{body:screenshot,contentType:'image/png'});
  expect(audit.camera.follow).toBe(true);
  expect(audit.worker).toBeTruthy();
  expect(audit.time).toBeGreaterThan(start);
  expect(audit.citizens).toBeGreaterThan(0);
  expect(audit.structures).toBeGreaterThan(0);
  expect(audit.triangles).toBeGreaterThan(0);
  expect(audit.triangles).toBeLessThan(160000);
  expect(audit.horizontalScroll).toBeLessThanOrEqual(width);
  expect(errors).toEqual([]);
  console.log('W549 real physical worker follow',JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',width,
   workerPostCover:audit.worker.post?.centerCover??null,
   currentPostCover:audit.actualWorker?.currentPost?.centerCover??null,
   simulationHours:audit.time-start,triangles:audit.triangles,
   hardwareFps:'NOT PROVEN',independentReview:'NOT PROVEN'}));
 });
}
