'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G143 INHABITED VILLAGE continuation. Actual night travellers, not spawned
// spectacle actors, must be seen striding with a hand-carried lamp. The lamp
// is presentation-only: neither observing it nor rendering can buy resources,
// change routes, rest status, named random draws, or the saved world.
test('G143 physical homecoming shows striding real villagers carrying bounded hand lanterns',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const dusk=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  // Seeded real village at 07:00; cross into its true 21:00 night shift.
  for(let i=0;i<Math.ceil(14.07*30);i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const rhythm=g.getDailyRhythmAudit(),lanterns=g.getHomecomingLanternAudit();
  const poses=rhythm.citizens.map((p,i)=>({
   name:p.name,activity:p.activity,pose:g.getRigPose(i)
  })).filter(p=>p.activity==='Returning home at dusk');
  const home=g.watchHomecoming();
  return {rhythm,lanterns,poses,before,after:JSON.stringify(g.exportSnapshot()),
   home,light:g.getObservedWorkLightProfile(),camera:g.getCamera(),
   shot:g.getCitizenCameraPlan()};
 });
 expect(dusk.rhythm.shift).toBe('night-rest');
 expect(dusk.rhythm.counts.returning).toBeGreaterThan(0);
 expect(dusk.before).toBe(dusk.after);
 expect(dusk.lanterns.source).toBe('real-commuting-citizen-wrist');
 expect(dusk.lanterns.count).toBe(dusk.rhythm.counts.returning);
 expect(dusk.lanterns.carriers).toHaveLength(dusk.lanterns.count);
 expect(dusk.poses).toHaveLength(dusk.lanterns.count);
 for(const pose of dusk.poses){
  expect(pose.pose.traveling).toBe(true);
  expect(Math.abs(pose.pose.stride)).toBeLessThanOrEqual(.73);
  expect(dusk.lanterns.carriers.some(c=>c.citizen===pose.name)).toBe(true);
 }
 for(const c of dusk.lanterns.carriers){
  expect(c.activity).toBe('Returning home at dusk');
  expect(c.lightPoint).toHaveLength(3);
  expect(c.lightPoint.every(Number.isFinite)).toBe(true);
  expect(c.homeIndex).toBeGreaterThanOrEqual(0);
  expect(c.homeIndex).toBeLessThan(dusk.rhythm.householdCount);
 }
 expect(dusk.home?.inWorld).toBe(true);
 const observed=dusk.lanterns.carriers.find(c=>c.citizen===dusk.home.citizen);
 expect(observed).toBeTruthy();
 expect(dusk.light.provenance).toBe('real-commuting-citizen-wrist');
 expect(dusk.light.active).toBe(true);
 expect(Math.hypot(dusk.light.x-observed.lightPoint[0],
  dusk.light.y-observed.lightPoint[1],dusk.light.z-observed.lightPoint[2])).toBeLessThan(.00001);
 expect(dusk.shot?.walkingFacingAlignment).not.toBeNull();
 await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingLanternRenderStats().carriers>0,
  null,{timeout:60000});
 const drawn=await page.evaluate(()=>{
  const g=window.__tinyKingdom;return {a:g.getHomecomingLanternRenderStats(),
   snapshot:JSON.stringify(g.exportSnapshot()),gl:
   document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(drawn.snapshot).toBe(dusk.after);
 expect(drawn.a.carriers).toBeGreaterThan(0);
 expect(drawn.a.carriers).toBeLessThanOrEqual(dusk.rhythm.counts.returning);
 expect(drawn.a.triangles).toBeGreaterThan(drawn.a.carriers*12);
 expect(drawn.a.triangles).toBeLessThan(2800);
 expect(drawn.gl).toBe(0);
 // The same traveling citizen remains present on an actual 390px camera.
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(900);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>window.__tinyKingdom.getHomecomingView().inWorld)).toBe(true);
 // Night lamps stop automatically when the real day shift resumes.
 const morning=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<9*30;i++)g.step(1/30);
  return {rhythm:g.getDailyRhythmAudit(),lamps:g.getHomecomingLanternAudit(),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(morning.rhythm.shift).toBe('day-work');
 expect(morning.lamps.count).toBe(0);
 expect(morning.gl).toBe(0);
 expect(errors).toEqual([]);
});
