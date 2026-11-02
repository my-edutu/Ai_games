'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G116 regression is based on the actual G115 Day-120 WebGL photograph:
// the selected builder was labeled visible, but a different citizen's oversized
// head blocked the work, and the weather pill was behind the scenic tabs.
// Test the physical people IN the shot, not just roofs and a boolean API.
test('G116 Day-120 street worker camera avoids close bystander occlusion and mobile HUD overlap',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 // Exact fixed-step Day-120 populated civilization; do not cheat by drawing
 // staged models or substituting an earlier less crowded Day-1 scene.
 for(let n=0;n<12;n++)await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let tick=0;tick<7200;tick++)g.step(1/30);
 });
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#street-walk').click();
 const encounter=await page.evaluate(originalSnapshot=>{
  const g=window.__tinyKingdom;
  const selected=g.visitStreetWorker();
  const view=g.getStreetWalkState();
  const people=g.getState().people;
  const witness=people.find(p=>p.name===selected.citizen);
  return {selected,view,witness,people,
   same:JSON.stringify(g.exportSnapshot())===originalSnapshot};
 },original);
 expect(encounter.selected.moved).toBe(true);
 expect(encounter.witness).toBeTruthy();
 expect(encounter.selected.lineOfSight).toBe(true);
 expect(encounter.selected.crowdIntrusions).toBe(0);
 expect(encounter.selected.closestBystander).toBeGreaterThanOrEqual(2.4);
 expect(encounter.view.visibility.openSky).toBe(true);
 expect(encounter.same).toBe(true);
 await page.setViewportSize({width:390,height:844});
 const hud=await page.evaluate(()=>{
  const tour=document.querySelector('.world-tour').getBoundingClientRect();
  const time=document.querySelector('.top .pill').getBoundingClientRect();
  const controls=document.getElementById('street-walk-controls');
  const all=[...controls.querySelectorAll('button')];
  return {timeVisible:getComputedStyle(document.querySelector('.top .pill')).display!=='none',
   timeInBounds:time.left>=0&&time.right<=innerWidth,
   tourInBounds:tour.left>=0&&tour.right<=innerWidth,
   topOverlap:Math.min(time.right,tour.right)>Math.max(time.left,tour.left)&&
    Math.min(time.bottom,tour.bottom)>Math.max(time.top,tour.top),
   controlsVisible:all.every(b=>{const r=b.getBoundingClientRect();
    return r.left>=0&&r.right<=innerWidth+1&&r.width>=32}),
   overflow:document.documentElement.scrollWidth>innerWidth,
   glError:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(hud.timeVisible&&hud.timeInBounds&&hud.tourInBounds).toBe(true);
 expect(hud.topOverlap).toBe(false);
 expect(hud.controlsVisible).toBe(true);
 expect(hud.overflow).toBe(false);
 expect(hud.glError).toBe(0);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(original);
 expect(errors).toEqual([]);
});
