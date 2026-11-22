'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W68 actual W67 film critic: workday camera cut from true planted harvesting
// into distant nocturnal commuting before a player could observe the job.
// Hold each genuine selected shot for a short REAL spectator interval, not a
// simulated work-time interval. Never pause/extend/redirect the actual work.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W68 original worker documentary dwell on genuine citizen '+viewport.width,async({page})=>{
  test.setTimeout(160000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let count=0;
   while(g.getActiveWorksites().length===0&&count++<7200)g.step(1/30);
   const before=JSON.stringify(g.exportSnapshot());
   const chosen=g.watchLiveWorkday();
   return {chosen,stats:g.getLiveWorkDirectorStats(),
    before,after:JSON.stringify(g.exportSnapshot())};
  });
  expect(first.chosen).toBeTruthy();
  expect(first.before).toBe(first.after);
  expect(first.stats.active).toBe(true);
  expect(first.stats.minDwellMs).toBeGreaterThanOrEqual(3000);
  expect(first.stats.minDwellMs).toBeLessThanOrEqual(6000);
  expect(first.stats.remainingDwellMs).toBeGreaterThan(1000);
  expect(first.stats.citizen).toBe(first.chosen.citizen);
  await page.waitForTimeout(250);
  const frame=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {stats:g.getLiveWorkDirectorStats(),
    state:JSON.stringify(g.exportSnapshot()),width:document.documentElement.scrollWidth,
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(frame.stats.citizen).toBe(first.stats.citizen);
  expect(frame.stats.transitions).toBe(0);
  expect(frame.stats.remainingDwellMs).toBeGreaterThan(0);
  expect(frame.state).toBe(first.after);
  expect(frame.width).toBeLessThanOrEqual(viewport.width);
  expect(frame.glError).toBe(0);
  expect(errors).toEqual([]);
 });
}
