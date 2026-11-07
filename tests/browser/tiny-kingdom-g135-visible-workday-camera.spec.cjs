'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G135 is the INHABITED WORKDAY workstream, not a pixel-count quality claim.
// G132 genuine continuous footage showed a rear-facing carpenter behind a
// timber rack; crop-clear centre rays did not reveal the working hands.
// This test binds one camera to a REAL autonomous shift and its real hand
// targets while preserving all authority, workers, structures and resources.
test('G135 active workday is framed from the physical working front with readable hand targets',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  // A real mature settlement, not spawn mocks or a staged faux builder.
  for(let i=0;i<86400;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const view=g.watchLiveWorkday(),shot=g.getWorkdayCompositionAudit();
  const repeat=g.getWorkdayCompositionAudit();
  const camera=g.getCitizenCameraPlan();
  const construction=g.getBuilderStageAudit();
  // G148 RED-first: a real worker now visibly drives facial effort AND the
  // 3D field responds at the exact living farmer's contact point. No fake
  // crop credit, authority changes, forced RNG or extra simulated jobs.
  const farming=g.getHarvestInteractionAudit();
  const farmers=g.getActiveWorksites().filter(w=>w.job==='farmer');
  const actorActing=g.getCitizenActingAudit(view?.citizen);
  const after=JSON.stringify(g.exportSnapshot());
  return {view,shot,repeat,camera,construction,farming,farmers,actorActing,counts:g.metrics(),
   readOnly:before===after,render:g.renderStats(),gl:
    document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(result.readOnly).toBe(true);
 expect(result.farming.source).toBe('real-autonomous-farmer-contact');
 expect(result.farming.active).toBe(result.farmers.length>0);
 if(result.farming.active){
  expect(result.farmers.map(w=>w.citizen)).toContain(result.farming.citizen);
  expect(result.farming.contact).toHaveLength(4);
  expect(result.farming.contact.every(Number.isFinite)).toBe(true);
  expect(result.farming.contact[2]).toBeGreaterThan(0);
  expect(result.farming.contact[2]).toBeLessThanOrEqual(1);
 }
 expect(result.actorActing.source).toBe('real-citizen-occupational-animation');
 expect(result.actorActing.citizen).toBe(result.view.citizen);
 expect(result.actorActing.face).toBeTruthy();
 for(const key of ['effort','blink','squint','mouthOpen']){
  expect(Number.isFinite(result.actorActing.face[key])).toBe(true);
  expect(result.actorActing.face[key]).toBeGreaterThanOrEqual(0);
  expect(result.actorActing.face[key]).toBeLessThanOrEqual(1);
 }
 expect(result.counts.citizens).toBeGreaterThanOrEqual(28);
 expect(result.counts.buildings).toBeGreaterThanOrEqual(37);
 expect(result.view?.active).toBe(true);
 expect(result.shot).toEqual(result.repeat);
 expect(result.shot.actor).toBe(result.view.citizen);
 expect(result.shot.job).toBe(result.view.job);
 expect(result.shot.source).toBe('real-autonomous-workday');
 expect(result.shot.active).toBe(true);
 expect(result.shot.handTargets).toHaveLength(2);
 expect(result.shot.handTargets.every(point=>
  point.length===3&&point.every(Number.isFinite))).toBe(true);
 expect(result.shot.handBlockers).toBeGreaterThanOrEqual(0);
 expect(result.shot.handBlockers).toBeLessThanOrEqual(2);
 expect(result.shot.cameraDistance).toBeGreaterThan(3.6);
 expect(result.shot.cameraDistance).toBeLessThan(11);
 // G147 RED-first: G146 actual 1024px moving footage frames a farmer behind
 // the whole cropfield at 7.15m. His body is too small to explain the job
 // even though front alignment and building rays both pass.
 // Demand an actual perspective-size measure of the AUTHENTIC selected actor,
 // not just a clear empty line from the camera to the distant worker.
 expect(Number.isFinite(result.shot.projectedWorkerHeightFraction)).toBe(true);
 expect(result.shot.projectedWorkerHeightFraction).toBeGreaterThan(.21);
 expect(result.shot.projectedWorkerHeightFraction).toBeLessThan(1);
 // G146: the G145 actual Day-120 desktop film showed Oren nearly fully
 // rear-facing (alignment -1) and .592 projected foreground coverage.
 // A technical hand-ray clearance must NOT certify an unreadable shift.
 expect(result.shot.faceAlignment).toBeGreaterThan(.12);
 expect(result.shot.foregroundSceneCover).toBeLessThan(.20);
 expect(result.shot.workFacingMode).not.toBe('obstructed');
 // A front workday view must not be rejected solely due to the old
 // spectator heading or invisible centre-ray-only "visibility" proxies.
 if(result.shot.clearFrontCandidates>0){
  expect(result.shot.faceAlignment).toBeGreaterThan(.12);
  expect(result.shot.handBlockers).toBeLessThanOrEqual(1);
 }
 expect(result.shot.staticWorldHidden).toBe(false);
 // G138: the carpenter's real continuous work progress builds an observable
 // physically articulated cottage frame, including joined pitched rafters
 // and placed wall panels at the authentic late phase, without affecting
 // rules/save state. It is NOT a pre-rendered unrelated animation.
 if(result.shot.job==='builder'){
  const site=result.construction.find(x=>x.citizen===result.shot.actor);
  expect(site).toBeTruthy();
  expect(site.assembly?.source).toBe('actual-autonomous-shift');
  expect(site.assembly?.frameHeight).toBeGreaterThan(.4);
  if(site.progress>=.55)expect(site.assembly.roofRafters).toBe(2);
  if(site.progress>=.70)expect(site.assembly.infillPanels).toBeGreaterThan(0);
 }
 expect(result.camera).toBeTruthy();
 expect(result.gl).toBe(0);
 // Browser render runs on its NEXT animation frame after 86,400 synchronous
 // simulation ticks. The earlier result.render is still the DAY-1 frame and
 // is not valid grown-town GPU evidence.
 await page.waitForTimeout(950);
 const grown=await page.evaluate(()=>{
  const g=window.__tinyKingdom,geometry=g.getGeometryAudit();
  return {triangles:geometry.totalTriangles,
   rendered:g.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(grown.triangles).toBeGreaterThan(0);
 expect(grown.triangles).toBeLessThan(160000);
 expect(grown.rendered).toBeLessThan(160000);
 expect(grown.gl).toBe(0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(450);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,
   actor:g.getWorkdayCompositionAudit().actor,
   shot:g.getWorkdayCompositionAudit(),
   plan:g.getCitizenCameraPlan(),
   unchanged:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.actor).toBe(result.shot.actor);
 // G136: the ACTUAL portrait camera must re-survey its physical crowd and
 // keep foreground neighbours out of the real worker's face/working hands.
 // No NPC may be moved, hidden or reposed merely to satisfy this readout.
 expect(mobile.plan?.portraitLens).toBe(true);
 expect(mobile.shot.viewportAspect).toBeLessThan(.65);
 // A phone portrait must still contain a recognizably large real worker.
 expect(Number.isFinite(mobile.shot.projectedWorkerHeightFraction)).toBe(true);
 expect(mobile.shot.projectedWorkerHeightFraction).toBeGreaterThan(.18);
 expect(mobile.shot.foregroundCitizenBlockers).toBe(0);
 expect(mobile.shot.plannedForegroundCitizenBlockers).toBe(0);
 // G139 RED-first: real G138 390px footage at Day-120 showed Edric with
 // an almost perfect SIDE view (faceAlignment ~= 0), despite clear hands.
 // A smartphone spectator must be able to see the authentic worker's front
 // and hands together; occupancy counters alone do not prove visibility.
 if(mobile.shot.job==='builder'){
  expect(mobile.shot.faceAlignment).toBeGreaterThan(.24);
  expect(mobile.shot.handBlockers).toBe(0);
  expect(mobile.shot.projectedWorksitePosts).toBe(0);
 }
 // G145 RED-FIRST: the REAL Day-120 portrait capture was almost entirely
 // covered by a timber-and-linen market stall despite 0 reported ray hits.
 // Require the actual current camera (not just its intended plan) to project
 // foreground scenic volumes into the 390px frame before calling it readable.
 // G148 actual frame: native and orchard foliage screened Cador's eyes
 // despite a nominally clear roof/market diagnostic. The viewport audit
 // must include REAL tree crowns, not an invented backdrop or hidden forest.
 expect(Number.isFinite(mobile.shot.foregroundVegetationCover)).toBe(true);
 expect(Number.isFinite(mobile.plan?.foregroundVegetationCover)).toBe(true);
 expect(mobile.shot.foregroundVegetationCover).toBeLessThan(.32);
 expect(Number.isFinite(mobile.shot.foregroundSceneCover)).toBe(true);
 expect(Number.isFinite(mobile.plan?.foregroundSceneCover)).toBe(true);
 expect(mobile.shot.foregroundSceneCover).toBeLessThan(.35);
 if(mobile.shot.foregroundSceneCover>=.14){
  expect(mobile.shot.workFacingMode).toBe('obstructed');
 }
 expect(mobile.gl).toBe(0);
 // Mobile defaults to an uncluttered world. The U shortcut intentionally
 // opens the accessible full command panel before the next-worker control.
 await page.keyboard.press('u');
 await page.locator('#workday-live').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
 // The 390px next-worker control must choose ANOTHER authentic active
 // worker whose visible workplace is not swallowed by a market foreground.
 const next=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {work:g.getLiveWorkdayView(),shot:g.getWorkdayCompositionAudit(),
   real:g.getActiveWorksites().map(w=>w.citizen)};
 });
 expect(next.work.active).toBe(true);
 expect(next.real).toContain(next.work.citizen);
 expect(next.shot.faceAlignment).toBeGreaterThan(.12);
 expect(next.shot.foregroundSceneCover).toBeLessThan(.20);
 expect(next.shot.workFacingMode).not.toBe('obstructed');
 expect(errors).toEqual([]);
});
