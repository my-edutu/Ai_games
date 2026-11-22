'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G114: real G113 uncut street footage (artifact 13108201603) starts INSIDE
// the textile stall canopy at x=4.2,z=7.7 despite previous walkable tests.
// A legitimate street-level experience must have clear human-height headroom
// and a meaningful unobstructed forward approach, not just a valid nav cell.
test('G114 street arrival, walking and 390px camera remain outdoors and playable',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#street-walk').click();
 const start=await page.evaluate(()=>{
  const g=window.__tinyKingdom,s=g.getStreetWalkState();
  return {s,unchanged:JSON.stringify(g.exportSnapshot())};
 });
 expect(start.s.active).toBe(true);
 expect(start.unchanged).toBe(original);
 expect(start.s.visibility.openSky).toBe(true);
 expect(start.s.visibility.forwardMetres).toBeGreaterThanOrEqual(3.0);
 expect(start.s.visibility.obstructionCount).toBe(0);
 expect(Math.hypot(start.s.position[0]-4.3,start.s.position[1]-8.5)).toBeGreaterThan(1.65);
 await page.keyboard.down('w');
 const walk=await page.evaluate(()=>{
  const g=window.__tinyKingdom,positions=[];
  for(let i=0;i<10;i++){
   g.advanceStreetWalk(.12);
   const s=g.getStreetWalkState();
   positions.push({p:s.position,clear:s.visibility.openSky});
  }
  return {positions,s:g.getStreetWalkState(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 await page.keyboard.up('w');
 expect(walk.s.distanceTravelled).toBeGreaterThan(.6);
 expect(walk.positions.every(s=>s.clear)).toBe(true);
 expect(walk.snapshot).toBe(original);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const controls=document.getElementById('street-walk-controls');
  const buttons=[...controls.querySelectorAll('button')];
  return {width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   controlsVisible:getComputedStyle(controls).display!=='none',
   buttonsValid:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=32&&r.left>=0&&r.right<=innerWidth+1}),
   sky:window.__tinyKingdom.getStreetWalkState().visibility.openSky,
   error:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.width).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.controlsVisible&&mobile.buttonsValid&&mobile.sky).toBe(true);
 expect(mobile.error).toBe(0);
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().active)).toBe(false);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(original);
 expect(errors).toEqual([]);
});
