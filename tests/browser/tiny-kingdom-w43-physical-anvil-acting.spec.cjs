'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W43 RED-first: the live craftsperson must visibly face the original
// physical anvil, and the hammer-hand target must correspond to that station.
// This is an observational test of true simulated work, never a staged actor.
test.use({video:'on'});
test('W43 genuine smith aligns hand and gaze to existing anvil on desktop and mobile',async({page})=>{
 test.setTimeout(220000);
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:80000});
 await page.locator('#pause').click();
 const witnessed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  let smith=null,cycle=null,ticks=0;
  for(;ticks<28000;ticks++){
   g.step(1/30);
   if(ticks%12)continue;
   cycle=g.getForgeCraftCycleAudit();
   smith=cycle.workers.find(w=>w.phase==='hammering'&&w.reachableAnvil);
   if(smith)break;
  }
  const before=JSON.stringify(g.exportSnapshot());
  const pose=typeof g.getForgeEmbodimentAudit==='function'?
   g.getForgeEmbodimentAudit():null;
  return {ticks,smith,cycle,pose,before,
   unchanged:JSON.stringify(g.exportSnapshot())===before};
 });
 expect(witnessed.smith,'An actual hammering craftsperson must reach the guild courtyard').toBeTruthy();
 expect(witnessed.pose,'W43 physical smith embodiment contract is missing').toBeTruthy();
 expect(witnessed.unchanged).toBe(true);
 expect(witnessed.pose.source).toBe('actual-forge-citizen-anvil-alignment');
 expect(witnessed.pose.authoritativeChanges).toBe(false);
 const subject=witnessed.pose.workers.find(w=>w.citizen===witnessed.smith.citizen);
 expect(subject).toBeTruthy();
 expect(subject.phase).toBe('hammering');
 expect(subject.faceAlignment).toBeGreaterThan(.97);
 expect(subject.anvilDistance).toBeLessThan(1.2);
 expect(subject.hammerSurfaceError).toBeLessThan(.46);
 expect(subject.footPlanted).toBe(true);
 expect(subject.physicalTarget).toBe(true);
 const forge=page.locator('.world-tour [data-scenic="forge"]');
 const desktopFrame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await forge.click();
 await expect(forge).toHaveAttribute('aria-pressed','true');
 // Frozen WebGL must render the ACTUAL requested camera, not screenshot the
 // previous frame while awaiting an unrelated historical frame count.
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  desktopFrame,{timeout:85000});
 fs.mkdirSync('artifacts/tiny-kingdom-w43',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w43/forge-hammering-desktop.png'});
 const portraitFrame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
  portraitFrame,{timeout:85000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {overflow:document.documentElement.scrollWidth>390,
   pose:g.getForgeEmbodimentAudit(),
   triangles:g.getGeometryAudit().totalTriangles,
   snapshot:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.overflow).toBe(false);
 expect(mobile.pose.workers.some(w=>w.citizen===subject.citizen&&w.faceAlignment>.97)).toBe(true);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(mobile.snapshot).toBe(witnessed.before);
 await page.screenshot({path:'artifacts/tiny-kingdom-w43/forge-hammering-390px.png'});
 expect(pageErrors).toEqual([]);
 console.log('W43 real anvil-directed smith',JSON.stringify({ticks:witnessed.ticks,
  citizen:subject.citizen,phase:subject.phase,face:subject.faceAlignment,
  surfaceError:subject.hammerSurfaceError,triangles:mobile.triangles}));
});