'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W72 RED: the actual W68 390px WebM resets from a real doorway straight
// to an aerial map at daybreak. Demand a real-time, wall-clock camera return
// from the same real resident without freezing, rewriting, or inventing work.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W72 genuine resident daybreak returns through spatial camera transition '+viewport.width,async({page})=>{
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
  // W176 RED on prior exact source: actual wall-clock stalls could jump from
  // the authentic cottage door directly to finished overview with no frame-
  // acknowledged intermediate world-camera eye/target being rendered.
  expect(entering.transition.maxPresentedStep).toBeLessThanOrEqual(.12);
  expect(entering.transition.renderedFrames).toBeGreaterThanOrEqual(0);
  expect(entering.transition.progress).toBeLessThanOrEqual(entering.transition.wallProgress);
  // The simulation speed remains unchanged by the camera work.
  // Real software-renderer stalls may finish between polling and evaluation.
  // Require an actual submitted in-flight physical frame, not a fake fraction.
  await page.waitForFunction(()=>{
   const a=window.__tinyKingdom.getDaybreakReturnAudit();
   return a.progress>.38||Boolean(a.lastCompleted?.finalWorldDrawSubmitted&&
    a.lastCompleted.samples.some(s=>s.progress>.38&&s.progress<.97));
  },null,{timeout:110000});
  const middle=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {camera:g.getCamera(),transition:g.getDaybreakReturnAudit(),
    snapshot:JSON.stringify(g.exportSnapshot())};
  });
  const active=middle.transition.active;
  const samples=active?middle.transition.submittedFrames:
   middle.transition.lastCompleted?.samples||[];
  expect(samples.length).toBeGreaterThanOrEqual(4);
  expect(samples.some(s=>s.progress>.38&&s.progress<.97)).toBe(true);
  expect(samples.every(s=>s.eye.every(Number.isFinite)&&
   s.target.every(Number.isFinite))).toBe(true);
  if(active){
   expect(middle.transition.progress).toBeGreaterThan(.38);
   expect(middle.transition.progress).toBeLessThanOrEqual(1);
   expect(middle.transition.progress).toBeLessThanOrEqual(middle.transition.wallProgress);
   expect(middle.transition.physicalShot?.progress)
    .toBeCloseTo(middle.transition.progress,5);
  }else{
   expect(middle.transition.lastCompleted?.progress).toBe(1);
   expect(middle.transition.lastCompleted?.finalWorldDrawSubmitted).toBe(true);
  }
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
  fs.mkdirSync('artifacts/tiny-kingdom-w72',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w72/'+viewport.width+'-real-daybreak.json',
   JSON.stringify({viewport,start,morning,entering,middle,ended},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w72/'+viewport.width+'-after-genuine-daybreak.png'});
 });
}
