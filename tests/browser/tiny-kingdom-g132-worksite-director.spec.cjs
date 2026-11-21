'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G132 is a RED-first regression from the real G131 Day-120 recording:
// Edric's back faced the camera (-0.999758) and no clear front view was found.
// A real work encounter must show a readable angle to real work, not simulate
// construction, hide structures, invent workers or alter authority.
test('G132 mature village workday director obtains a physically clear readable worker view',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<86400;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  g.setStreetWalk(true);
  const shot=g.visitStreetWorker();
  const view=g.getStreetWalkState();
  const witness=g.getState().people.find(p=>p.name===shot.citizen);
  const after=JSON.stringify(g.exportSnapshot());
  return {shot,view,witness,readOnly:before===after,counts:g.metrics()};
 });
 expect(proof.readOnly).toBe(true);
 expect(proof.counts.citizens).toBeGreaterThanOrEqual(28);
 expect(proof.counts.buildings).toBeGreaterThanOrEqual(37);
 expect(proof.shot.moved).toBe(true);
 expect(proof.shot.realCitizen).toBe(true);
 expect(proof.witness).toBeTruthy();
 expect(proof.shot.activeWork).toBe(true);
 // Reject the G131 near-perfect rear view and false 'looks at worker' passes.
 expect(proof.shot.facingAlignment).toBeGreaterThan(-.45);
 expect(proof.shot.lineOfSight).toBe(true);
 expect(proof.shot.crowdIntrusions).toBe(0);
 expect(proof.shot.cropBlockedSamples).toBe(0);
 expect(proof.shot.projectedWorksitePosts).toBe(0);
 expect(proof.shot.projectedBystanders).toBe(0);
 expect(proof.shot.perspective).toMatch(/^(street|workday)$/);
 expect(proof.view.perspective).toBe(proof.shot.perspective);
 expect(proof.view.eye[1]).toBeCloseTo(
  proof.shot.eye[1],3);
 expect(proof.shot.eye.every(Number.isFinite)).toBe(true);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {overflow:document.documentElement.scrollWidth>390,
   snapshot:JSON.stringify(g.exportSnapshot()),
   sky:g.getStreetWalkState().visibility.openSky,
   gl:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.overflow).toBe(false);
 expect(mobile.sky).toBe(true);
 expect(mobile.gl).toBe(0);
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().active)).toBe(false);
 expect(errors).toEqual([]);
});