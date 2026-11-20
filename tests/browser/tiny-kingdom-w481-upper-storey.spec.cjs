'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const width of [1024,390]){
 test('W481 physical living upper room and uncropped recording '+width,async({browser})=>{
  test.setTimeout(180000);
  const height=width===390?844:640;
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w481');
  fs.mkdirSync(root,{recursive:true});
  // The viewport MUST be fixed BEFORE video capture starts. Changing a
  // Playwright test page's size after record starts yielded false 800x450
  // "mobile" recordings in the previous 390px evidence.
  const context=await browser.newContext({
   viewport:{width,height},
   recordVideo:{dir:root,size:{width,height}}
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.setContent(html);
  await page.waitForFunction(()=>
   window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:120000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  const before=await page.evaluate(()=>{
   const api=window.__tinyKingdom;
   const home=api.getInhabitedSkylineAudit().lots.filter(h=>!h.compact)
    .sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))[0];
   if(!home)throw Error('No genuinely inhabited detailed upper room');
   api.setCamera({yaw:Math.PI,pitch:.31,zoom:6.5,focus:[home.x,home.z]});
   return {home,rooms:api.getOriginalOccupiedUpperStoreyAudit(),
    originalLowerRoom:api.getOriginalOccupiedRoomAudit(),metrics:api.metrics()};
  });
  expect(before.rooms.builtInstances).toBeGreaterThanOrEqual(1);
  expect(before.rooms.triangles).toBe(before.rooms.builtInstances*56);
  expect(before.rooms.sideWindowOpenings).toBe(before.rooms.builtInstances*2);
  expect(before.metrics.citizens).toBeGreaterThanOrEqual(12);
  await page.waitForTimeout(1400);
  await page.screenshot({path:path.join(root,width+'-real-front.png')});
  await page.evaluate(home=>window.__tinyKingdom.setCamera({
   yaw:Math.PI/2,pitch:.27,zoom:6.1,focus:[home.x,home.z]
  }),before.home);
  await page.waitForTimeout(2200);
  await page.screenshot({path:path.join(root,width+'-real-hollow-side-casement.png')});
  const after=await page.evaluate(()=>({
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   overflow:document.documentElement.scrollWidth-innerWidth,
   camera:window.__tinyKingdom.getCameraNavigationAudit()
  }));
  expect(after.snapshot).toBe(original);
  expect(after.triangles).toBeGreaterThan(0);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const video=page.video();
  await page.close();
  if(!video)throw Error('Real captured game video missing');
  const movie=path.join(root,width+'-full-viewport-real-camera.webm');
  await video.saveAs(movie);
  await context.close();
  const resolution=execFileSync('ffprobe',[
   '-v','error','-select_streams','v:0',
   '-show_entries','stream=width,height','-of','csv=p=0',movie
  ],{encoding:'utf8'}).trim();
  expect(resolution).toBe(width+','+height);
  fs.writeFileSync(path.join(root,width+'-proof.json'),JSON.stringify({
   source:'original-live-playing-village-no-authority-staging',
   viewport:{width,height},videoStream:resolution,
   actualLot:before.home,upperRoom:before.rooms,lowerRoom:before.originalLowerRoom,
   originalCitizens:before.metrics.citizens,
   unchangedSnapshot:true,submittedTriangles:after.triangles,
   glErrors:after.gl,pageErrors:errors,
   camera:after.camera,hardwareFps:'NOT MEASURED',
   continuousWorkerShift:'NOT PROVEN',independentReview:'NOT PROVEN',
   experienceTransformation:'NOT PROVEN'
  },null,2));
 });
}
