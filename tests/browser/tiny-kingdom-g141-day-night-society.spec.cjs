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
  const g=window.__tinyKingdom,stepHours=n=>{for(let i=0;i<n*30;i++)g.step(1/30)};
  const dawn=g.getDailyRhythmAudit(),dawnCounts=g.metrics();
  stepHours(15); // from 07:00 to 22:00, a true physical dusk crossing
  const dusk=g.getDailyRhythmAudit(),duskNav=g.getNavigation();
  stepHours(6);  // 04:00, after actual bounded route-following overnight
  const night=g.getDailyRhythmAudit(),nightNav=g.getNavigation();
  const sleepState=g.exportSnapshot(),sleepJson=JSON.stringify(sleepState);
  stepHours(8); // genuine next-morning work, not an actor spawned for display
  const morning=g.getDailyRhythmAudit(),morningNav=g.getNavigation();
  const morningJson=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(sleepState);stepHours(8);
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
