'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G115: the street visitor must be able to SEE an actual autonomous person,
// not merely wander past buildings under a large HUD. This is presentation
// only: no new people, jobs, resources, economy, saved schema, or RNG draws.
test('G115 human-height worker encounter has a real visible citizen and world-first mobile HUD',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#street-walk').click();
 expect(await page.locator('#street-meet-worker').count()).toBe(1);
 const encounter=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const outcome=g.visitStreetWorker();
  const state=g.getStreetWalkState();
  return {outcome,state,authorityUnchanged:JSON.stringify(g.exportSnapshot())===before,
   person:g.getState().people.find(p=>p.name===outcome.citizen),
   banner:document.getElementById('street-walk-status').textContent};
 });
 expect(encounter.outcome.moved).toBe(true);
 expect(encounter.outcome.realCitizen).toBe(true);
 expect(encounter.person).toBeTruthy();
 expect(encounter.authorityUnchanged).toBe(true);
 expect(encounter.state.visibility.openSky).toBe(true);
 expect(encounter.state.visibility.obstructionCount).toBe(0);
 expect(encounter.outcome.lineOfSight).toBe(true);
 expect(encounter.outcome.metres).toBeGreaterThanOrEqual(1.5);
 expect(encounter.outcome.metres).toBeLessThan(8);
 expect(encounter.banner).toContain(encounter.outcome.citizen);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const controls=document.getElementById('street-walk-controls');
  const tour=document.querySelector('.world-tour');
  const brand=document.querySelector('.top .brand');
  const ribbon=document.getElementById('world-ribbon');
  const visit=document.getElementById('street-meet-worker');
  const buttons=[...controls.querySelectorAll('button')];
  const withinViewport=node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.width>=32};
  return {scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   controlsVisible:getComputedStyle(controls).display!=='none',
   visitVisible:withinViewport(visit)&&getComputedStyle(visit).display!=='none',
   buttonsVisible:buttons.every(withinViewport),
   compactBrand:getComputedStyle(brand).display==='none',
   compactTour:tour.getBoundingClientRect().width<=innerWidth*.67,
   compactRibbon:ribbon.getBoundingClientRect().width<=innerWidth*.9,
   authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.scroll).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.controlsVisible&&mobile.visitVisible&&mobile.buttonsVisible).toBe(true);
 expect(mobile.compactBrand&&mobile.compactTour&&mobile.compactRibbon).toBe(true);
 expect(mobile.authority).toBe(original);
 expect(mobile.glError).toBe(0);
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().active)).toBe(false);
 expect(errors).toEqual([]);
});
