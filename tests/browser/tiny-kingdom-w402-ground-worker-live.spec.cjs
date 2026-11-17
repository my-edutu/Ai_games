'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// The software renderer is diagnostic only. This verifies an ORIGINAL WebGL
// world is drawn with the EXACT new worker path at real desktop + 390px sizes.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W402 exact original valley worker actually feeds live renderer '+viewport.width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:100000});
  const evidence=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const worker=g.getGroundBaseWorkerAudit();
   const render=g.renderStats();
   const atlas=typeof g.getGroundAtlasDirtyAudit==='function'?
    g.getGroundAtlasDirtyAudit():null;
   return {worker,render:{lastFrameTriangles:render.lastFrameTriangles,
    renderer:typeof g.renderer==='function'?g.renderer():null},
    atlas:atlas?{textureCount:atlas.textureCount,fullUploads:atlas.fullUploads,
     partialUploads:atlas.partialUploads}:null,
    authoritativeSnapshotLength:JSON.stringify(g.exportSnapshot()).length};
  });
  fs.mkdirSync('artifacts/tiny-kingdom-w402',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w402/'+viewport.width+'-worker-audit.json',
   JSON.stringify({viewport,evidence,softwareRenderer:true,hardwareFpsMeasured:false},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w402/'+viewport.width+'-actual-original-world.png'});
  expect(evidence.render.lastFrameTriangles).toBeGreaterThan(0);
  expect(evidence.worker.authoritativeStateModified).toBe(false);
  expect(evidence.worker.workerActive).toBe(false);
  expect(evidence.worker.used+evidence.worker.synchronousFallbacks).toBe(1);
  expect(evidence.worker.pendingPixelBytes).toBe(0);
  // GitHub Chromium has Worker/Blob support. If it silently takes a fallback,
  // fail instead of calling the mere presence of asynchronous source a gain.
  const supportsWorker=await page.evaluate(()=>typeof Worker==='function'&&
   typeof Blob==='function'&&typeof URL.createObjectURL==='function');
  if(supportsWorker){
   expect(evidence.worker.status).toBe('ready');
   expect(evidence.worker.used).toBe(1);
   expect(evidence.worker.synchronousFallbacks).toBe(0);
  }
  expect(evidence.authoritativeSnapshotLength).toBeGreaterThan(100);
  expect(errors).toEqual([]);
 });
}
