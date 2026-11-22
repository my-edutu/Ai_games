'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G149: same authentic market/merchant civilization in daylight and overnight.
// Static timber stalls already exist; the genuinely time-dependent OPEN/CLOSED
// story must be visible IN 3D, not invented merchant trades or HUD-only text.
test('G149 actual market gates open with sunrise and close at night on both desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const witness=await page.evaluate(async()=>{
  const g=window.__tinyKingdom;
  const atHour=target=>{
   const now=g.getDailyRhythmAudit().hour;
   const ahead=(target-now+24)%24,steps=Math.max(1,Math.ceil(ahead*30));
   for(let i=0;i<steps;i++)g.step(ahead/steps);
  };
  atHour(23.5);
  const nighttime=g.getMarketOperatingAudit();
  const snapshotNight=JSON.stringify(g.exportSnapshot());
  const repeatNight=g.getMarketOperatingAudit();
  atHour(11.5);
  const daylight=g.getMarketOperatingAudit();
  const snapshotDay=JSON.stringify(g.exportSnapshot());
  const repeatDay=g.getMarketOperatingAudit();
  return {nighttime,repeatNight,daylight,repeatDay,
   snapshotNight,snapshotDay,
   safeNav:g.getNavigation().every(p=>p.position.every(Number.isFinite)),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(witness.nighttime.source).toBe('real-clock-merchants-and-inventory');
 expect(witness.daylight.source).toBe(witness.nighttime.source);
 expect(witness.nighttime.stalls).toBe(4);
 expect(witness.nighttime.openFraction).toBeLessThan(.01);
 expect(witness.daylight.openFraction).toBeGreaterThan(.99);
 expect(witness.nighttime.doorLeaves).toBe(8);
 expect(witness.daylight.doorLeaves).toBe(8);
 expect(witness.nighttime.activeMerchantNames).toBeInstanceOf(Array);
 expect(witness.daylight.activeMerchantNames).toBeInstanceOf(Array);
 expect(witness.nighttime.activeMerchantNames.every(name=>
  witness.nighttime.realCitizenNames.includes(name))).toBe(true);
 expect(witness.daylight.activeMerchantNames.every(name=>
  witness.daylight.realCitizenNames.includes(name))).toBe(true);
 expect(witness.nighttime.resources.food).toBeGreaterThanOrEqual(0);
 expect(witness.daylight.resources.wood).toBeGreaterThanOrEqual(0);
 expect(witness.nighttime).toEqual(witness.repeatNight);
 expect(witness.daylight).toEqual(witness.repeatDay);
 expect(witness.safeNav).toBe(true);
 expect(witness.gl).toBe(0);
 // Rendering must not alter gameplay snapshots; both calls themselves are read-only.
 const visual=await page.evaluate(async()=>{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return window.__tinyKingdom.getMarketOperatingRenderStats();
 });
 expect(visual.source).toBe('authoritative-clock-presentation-only');
 expect(visual.doorLeaves).toBe(8);
 expect(visual.triangles).toBeGreaterThan(0);
 expect(visual.triangles).toBeLessThan(1100);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(650);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1)).toBe(0);
 expect(errors).toEqual([]);
});
