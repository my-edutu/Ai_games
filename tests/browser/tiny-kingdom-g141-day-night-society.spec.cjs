'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G141 — city life must be visibly inhabited after sunset, rather than
// carpenters, farmers and children of the valley working through 02:00.
// This examines REAL citizens and their navigation; no mocked clock/NPCs.
test('G141 genuine workday gives way to navigable household homecoming, rest and morning labor',async({page})=>{
 test.setTimeout(240000);
 expect(html).toMatch(/function dailyRhythmAudit\(/);
 expect(html).toMatch(/function citizenHomeDestination\(/);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const inspection=await page.evaluate(()=>{
  const g=window.__tinyKingdom,advanceToHour=hour=>{
   const start=g.getDailyRhythmAudit().hour,remaining=(hour-start+24)%24;
   const steps=Math.max(1,Math.ceil(remaining*30));
   for(let i=0;i<steps;i++)g.step(remaining/steps);
  };
  const dawn=g.getDailyRhythmAudit(),dawnCounts=g.metrics();
  advanceToHour(22); // exact local hour, independent of slow browser startup
  const dusk=g.getDailyRhythmAudit(),duskNav=g.getNavigation();
  advanceToHour(4); // 04:00, after actual bounded route-following overnight
  const night=g.getDailyRhythmAudit(),nightNav=g.getNavigation();
  const sleepState=g.exportSnapshot(),sleepJson=JSON.stringify(sleepState);
  advanceToHour(12); // next genuine midday shift, not scripted workers
  const morning=g.getDailyRhythmAudit(),morningNav=g.getNavigation();
  const morningJson=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(sleepState);advanceToHour(12);
  return {dawn,dusk,night,morning,dawnCounts,duskNav,nightNav,morningNav,
   sleepJson,morningJson,replayJson:JSON.stringify(g.exportSnapshot()),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(inspection.dawn.shift).toBe('day-work');
 expect(inspection.dusk.shift).toBe('night-rest');
 expect(inspection.night.shift).toBe('night-rest');
 expect(inspection.morning.shift).toBe('day-work');
 expect(inspection.dawnCounts.citizens).toBe(12);
 expect(inspection.dusk.counts.returning+inspection.dusk.counts.resting)
  .toBeGreaterThanOrEqual(10);
 expect(inspection.night.counts.resting).toBeGreaterThanOrEqual(8);
 expect(inspection.night.counts.working).toBe(0);
 expect(inspection.nightNav.every(p=>gSafe(p))).toBe(true);
 expect(inspection.morning.counts.resting).toBeLessThan(inspection.night.counts.resting);
 expect(inspection.morningJson).toBe(inspection.replayJson);
 expect(inspection.gl).toBe(0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().lastFrameTriangles>0,null,{timeout:60000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
});
function gSafe(p){return Number.isFinite(p.position[0])&&Number.isFinite(p.position[1]);}
