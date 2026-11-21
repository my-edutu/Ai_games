'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G154 real player-facing regression from the failed G153 continuous 390px
// night walk: AFTER the authentic Day-120 workday, a player must still enter
// the actual market safely, without a wall or another citizen obscuring it.
test('G154 Day-120 dusk market remains physically visitable after a real day-night transition on 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0);});
 for(let remaining=120*24*30;remaining>0;remaining-=7200){
  await page.evaluate(n=>{
   for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30);
  },Math.min(remaining,7200));
 }
 const night=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const now=g.getDailyRhythmAudit().hour;
  const ahead=(23-now+24)%24,steps=Math.max(1,Math.ceil(ahead*30));
  for(let i=0;i<steps;i++)g.step(ahead/steps);
  return {authority:JSON.stringify(g.exportSnapshot()),market:g.getMarketOperatingAudit?.(),
   count:g.metrics().citizens,buildings:g.metrics().buildings};
 });
 expect(night.count).toBe(28);
 expect(night.buildings).toBeGreaterThanOrEqual(37);
 await page.locator('#market-visit').focus();
 await page.keyboard.press('Enter');
 const shot=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {visit:g.getMarketVisitAudit(),planning:g.getMarketVisitPlanningAudit(),
   walk:g.getStreetWalkState(),authority:JSON.stringify(g.exportSnapshot()),
   overflow:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 // Report the genuine failed camera candidate, not a manufactured "safe"
 // pass. The viewer still requires real walkability and true architecture.
 expect(shot.visit.active,JSON.stringify(shot.planning)).toBe(true);
 expect(shot.visit.safe).toBe(true);
 expect(shot.walk.active).toBe(true);
 expect(shot.visit.stallDistance).toBeGreaterThanOrEqual(4);
 expect(shot.visit.stallDistance).toBeLessThanOrEqual(9.8);
 expect(shot.visit.architecture?.portraitSafe).toBe(true);
 expect(shot.visit.foregroundCitizenCount).toBe(0);
 expect(shot.visit.closestCitizenDistance).toBeGreaterThanOrEqual(1.65);
 expect(shot.overflow).toBeLessThanOrEqual(390);
 expect(shot.gl).toBe(0);
 expect(shot.authority).toBe(night.authority);
 await page.keyboard.press('v');
 expect(await page.evaluate(()=>window.__tinyKingdom.getMarketVisitAudit().active)).toBe(false);
 expect(errors).toEqual([]);
});
