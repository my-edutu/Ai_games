'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W41 Living Valley continuation: the original craft guildhall and its actual
// outdoor forge must be inhabited by the game's REAL autonomous craftsperson.
// No stand-in smith, instant teleport, invented stock or non-deterministic VFX.
// This contract intentionally runs the original rules and watches a whole
// shift, not just a static render screenshot or a textual activity label.
test.use({video:'on'});
test('W41 autonomous smith reaches the physical outdoor forge and works on desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const witnessed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.reset();
  const starting=g.getState();
  const crafts=starting.people.filter(p=>p.job==='craftsperson').map(p=>p.name);
  if(typeof g.getForgeWorkdayAudit!=='function')return {error:'Missing forge workday presentation/route audit',crafts};
  let arrived=null,commute=null,ticks=0;
  for(;ticks<24000;ticks++){
   g.step(1/30);
   if(ticks%8!==0)continue;
   const navigation=g.getNavigation().filter(p=>crafts.includes(p.name));
   const audit=g.getForgeWorkdayAudit();
   const walking=navigation.find(p=>p.activity.startsWith('Traveling to craftsperson'));
   if(walking&&!commute)commute={target:walking.target,
    valid:g.walkable(walking.target),
    nearYard:Math.hypot(walking.target[0]-audit.yard[0],walking.target[1]-audit.yard[1])};
   const real=audit.activeWorkers.find(w=>crafts.includes(w.citizen));
   if(real){
    arrived={...real,audit,workers:g.getActiveWorksites(),
     nav:navigation.find(p=>p.name===real.citizen),
     snapshot:JSON.stringify(g.exportSnapshot()),
     same:JSON.stringify(g.exportSnapshot())===JSON.stringify(g.exportSnapshot()),
     city:g.metrics()};
    break;
   }
  }
  return {crafts,commute,arrived,ticks};
 });
 expect(witnessed.error).toBeUndefined();
 expect(witnessed.crafts.length).toBeGreaterThan(0);
 expect(witnessed.commute?.valid).toBe(true);
 expect(witnessed.commute?.nearYard).toBeLessThan(2.2);
 expect(witnessed.arrived,'An actual non-teleported smith must reach the yard during a normal shift').toBeTruthy();
 expect(witnessed.arrived.nav.path.length).toBe(0);
 expect(witnessed.arrived.nav.activity).toBe('Making household goods');
 expect(witnessed.arrived.distanceToForge).toBeLessThan(4.7);
 expect(witnessed.arrived.audit.authoritativeChanges).toBe(false);
 expect(witnessed.arrived.audit.provenance).toBe('genuine-craftsperson-forge-yard');
 expect(witnessed.arrived.same).toBe(true);
 expect(witnessed.arrived.workers.some(w=>w.citizen===witnessed.arrived.citizen)).toBe(true);
 // W42 test-first: the visible metalworking sequence must be driven by the
 // same real arrived citizen, with a reachable anvil and physical progress.
 // Until the scene implements this read-only contract, RED is expected.
 const craft=await page.evaluate(()=>window.__tinyKingdom.getForgeCraftCycleAudit?.()||null);
 expect(craft?.source).toBe('actual-smith-shift-physical-forge-cycle');
 expect(craft?.workers.some(w=>w.citizen===witnessed.arrived.citizen&&
  w.reachableAnvil&&w.distanceToAnvil<1.2&&
  ['stoking','hammering','quenching'].includes(w.phase))).toBe(true);
 expect(craft?.altersAuthority).toBe(false);
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 // W41 test harness repair: a paused, unchanged game intentionally reuses
 // the frozen frame. Resize the real viewport to request a new actual draw;
 // do not require an impossible extra animation on a frozen scene.
 const frames=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:1023,height:640});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,frames,{timeout:85000});
 // A single deliberate viewport invalidation is the verified redraw.
 // A second immediate 1px resize may be coalesced by the browser and is
 // not a distinct presentation request; do not wait for a fictitious frame.
 fs.mkdirSync('artifacts/tiny-kingdom-w41',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w41/genuine-forge-workday-desktop.png'});
 const before=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,before,{timeout:85000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {scrollWidth:document.documentElement.scrollWidth,
   current:g.getForgeWorkdayAudit(),triangles:g.getGeometryAudit().totalTriangles,
   snapshot:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.scrollWidth).toBeLessThanOrEqual(390);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(mobile.current.activeWorkers.some(w=>w.citizen===witnessed.arrived.citizen)).toBe(true);
 expect(mobile.snapshot).toBe(original);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w41/genuine-forge-workday-390px.png'});
 // W42 test-first: the working craft yard needs an intentional, accessible
 // world-camera entry point, not an unfindable distant ornamental landmark.
 const forgeTour=page.locator('.world-tour [data-scenic="forge"]');
 await expect(forgeTour).toHaveCount(1);
 await forgeTour.click();
 await expect(forgeTour).toHaveAttribute('aria-pressed','true');
 const forgeFocus=await page.evaluate(()=>window.__tinyKingdom.getCamera().focus);
 const yard=await page.evaluate(()=>window.__tinyKingdom.getForgeCraftCycleAudit().anvil);
 expect(Math.hypot(forgeFocus[0]-yard[0],forgeFocus[1]-yard[1])).toBeLessThan(3.5);
 await expect(page.locator('.world-tour')).toBeVisible();
 await page.screenshot({path:'artifacts/tiny-kingdom-w41/genuine-forge-scenic-390px.png'});
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(original);
 console.log('W41 genuine forge workday',JSON.stringify({commute:witnessed.commute,
  tick:witnessed.ticks,worker:witnessed.arrived.citizen,day:witnessed.arrived.city.day,
  desktop:witnessed.arrived.audit,mobile:mobile.current,triangles:mobile.triangles}));
});
