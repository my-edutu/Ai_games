'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W90 RED: the actual W68 390px WebM resets from a real doorway straight
// to an aerial map at daybreak. Demand a real-time, wall-clock camera return
// from the same real resident without freezing, rewriting, or inventing work.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W90 genuine resident daybreak returns through spatial camera transition '+viewport.width,async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
    null,{timeout:110000});
  const start=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let home=null;
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(i%3)continue;
    if(g.getCottageHomecomingAudit().doors.some(d=>d.swing>.55))break;
   }
   for(let i=0;i<g.metrics().citizens+1;i++){
    home=g.watchHomecoming();
    if(home?.active)break;
   }
   return {home,snapshot:JSON.stringify(g.exportSnapshot())};
  });
  expect(start.home?.active).toBe(true);
  const morning=await page.evaluate(()=>{
   const g=window.__tinyKingdom,original=g.getHomecomingView().citizen;
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    const view=g.getHomecomingView();
    if(view.citizen===original&&!view.active&&!view.arrival)
     return {found:true,snapshot:JSON.stringify(g.exportSnapshot()),citizen:original};
   }
   return {found:false};
  });
  expect(morning.found).toBe(true);
  await page.waitForFunction(()=>window.__tinyKingdom?.getDaybreakReturnAudit().active,
    null,{timeout:110000});
  const entering=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {camera:g.getCamera(),transition:g.getDaybreakReturnAudit(),
    snapshot:JSON.stringify(g.exportSnapshot())};
  });
  expect(entering.transition.mode).toBe('real-daybreak-camera-return');
  expect(entering.transition.authorityChanged).toBe(false);
  expect(entering.transition.durationMs).toBeGreaterThanOrEqual(3500);
  expect(entering.camera.follow).toBe(true);
  expect(entering.transition.citizen).toBe(morning.citizen);
  const physical=entering.transition.physicalShot;
  expect(physical?.source).toBe('real-doorway-world-camera-shared-by-webgl-and-lod');
  for(const point of [physical.startEye,physical.startTarget,physical.endEye,physical.endTarget])
   expect(point.length===3&&point.every(Number.isFinite)).toBe(true);
  expect(Math.hypot(...physical.startEye.map((v,i)=>v-physical.endEye[i]))).toBeGreaterThan(2);
  // The simulation speed remains unchanged by the camera work.
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom,a=g.getDaybreakReturnAudit(),f=g.getPresentedCameraFrame();
   const real=a.active?a.submittedFrames:a.lastCompleted?.samples||[];
   const witnessed=real.some(s=>s.submittedWorldFrame&&s.progress>.38&&s.progress<.97);
   return witnessed&&((a.active&&a.physicalShot?.progress>.38&&f?.target&&
    Math.hypot(...f.eye.map((v,i)=>v-a.physicalShot.eye[i]))<.01)||
    (!a.active&&a.lastCompleted?.finalWorldDrawSubmitted));
  },
    null,{timeout:110000});
  const middle=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {camera:g.getCamera(),transition:g.getDaybreakReturnAudit(),
    frame:g.getPresentedCameraFrame(),snapshot:JSON.stringify(g.exportSnapshot())};
  });
  // The genuine flight can finish between the wait predicate and a slow
  // software-renderer evaluate; require submitted intermediate physical eyes.
  const complete=middle.transition.lastCompleted;
  const frames=middle.transition.active?
   middle.transition.submittedFrames:complete?.samples||[];
  expect(frames.length).toBeGreaterThan(3);
  expect(frames.every(f=>f.submittedWorldFrame)).toBe(true);
  expect(frames.some(f=>f.progress>.38&&f.progress<.97)).toBe(true);
  expect(frames.every(f=>f.eye.every(Number.isFinite)&&
   f.target.every(Number.isFinite))).toBe(true);
  const delta=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  if(middle.transition.active){
   expect(middle.transition.progress).toBeGreaterThan(.38);
   expect(middle.transition.physicalShot).toBeTruthy();
   expect(delta(middle.frame.eye,middle.transition.physicalShot.eye)).toBeLessThan(.01);
   expect(delta(middle.frame.target,middle.transition.physicalShot.target)).toBeLessThan(.01);
   expect(middle.transition.clearanceY).toBeGreaterThan(2);
  }else{
   expect(complete?.progress).toBe(1);
   const last=frames[frames.length-1];
   expect(delta(last.eye,complete.endEye)).toBeLessThan(.01);
   expect(delta(last.target,complete.endTarget)).toBeLessThan(.01);
  }
  expect(middle.transition.progress).toBeLessThanOrEqual(1);
  expect(middle.snapshot).toBe(morning.snapshot);
  await page.waitForFunction(()=>!window.__tinyKingdom.getDaybreakReturnAudit().active &&
    !window.__tinyKingdom.getCamera().follow &&
    document.body.dataset.workday==='off',null,{timeout:110000});
  const ended=await page.evaluate(()=>{
   const g=window.__tinyKingdom;return {camera:g.getCamera(),
    snapshot:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    audit:g.getDaybreakReturnAudit(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(ended.snapshot).toBe(morning.snapshot);
  expect(ended.triangles).toBeLessThan(160000);
  expect(ended.glError).toBe(0);
  expect(ended.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w90',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w90/'+viewport.width+'-real-daybreak.json',
   JSON.stringify({viewport,start,morning,entering,middle,ended},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w90/'+viewport.width+'-after-genuine-daybreak.png'});
 });
}
