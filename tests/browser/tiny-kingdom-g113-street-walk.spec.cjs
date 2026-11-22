'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G113 inhabitable street-level camera navigates actual safe routes without changing civilization',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const baseline=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#street-walk').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom,s=g.getStreetWalkState();
  return {s,authority:JSON.stringify(g.exportSnapshot()),valid:g.walkable(s.position),camera:g.getCamera()};
 });
 expect(initial.s.active).toBe(true);
 expect(initial.s.height).toBeGreaterThan(1.4);
 expect(initial.s.height).toBeLessThan(2.0);
 expect(initial.valid).toBe(true);
 expect(initial.authority).toBe(baseline);
 expect(initial.camera.follow).toBe(false);
 await page.keyboard.down('w');
 const walking=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<9;i++)g.advanceStreetWalk(0.12);
  const s=g.getStreetWalkState();
  return {s,valid:g.walkable(s.position),authority:JSON.stringify(g.exportSnapshot())};
 });
 await page.keyboard.up('w');
 expect(walking.s.distanceTravelled).toBeGreaterThan(0.05);
 expect(walking.valid).toBe(true);
 expect(walking.authority).toBe(baseline);
 await page.keyboard.down('ArrowLeft');
 const turning=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.advanceStreetWalk(.18);
  return {s:g.getStreetWalkState(),authority:JSON.stringify(g.exportSnapshot())};
 });
 await page.keyboard.up('ArrowLeft');
 expect(turning.s.yaw).not.toBe(walking.s.yaw);
 expect(turning.authority).toBe(baseline);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const controls=document.getElementById('street-walk-controls');
  return {visible:getComputedStyle(controls).display!=='none',
   width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   buttons:[...controls.querySelectorAll('button')].every(b=>{
    const r=b.getBoundingClientRect();return r.width>=32&&r.left>=0&&r.right<=innerWidth+1;
   }),authority:JSON.stringify(g.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.visible).toBe(true);
 expect(mobile.buttons).toBe(true);
 expect(mobile.width).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.authority).toBe(baseline);
 expect(mobile.glError).toBe(0);
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().active)).toBe(false);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(baseline);
 expect(errors).toEqual([]);
});
