'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G056 paused world reuses its last frame, but camera and restored state invalidate it',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderQuality));
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>=3,null,{timeout:45000});
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.renderQuality(),snapshot:g.exportSnapshot()};
 });
 await page.waitForTimeout(350);
 const idle=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.renderQuality(),snapshot:g.exportSnapshot()};
 });
 expect(idle.view.framesDrawn-first.view.framesDrawn).toBeLessThanOrEqual(1);
 expect(idle.view.idleFrames).toBeGreaterThan(first.view.idleFrames);
 expect(idle.snapshot).toEqual(first.snapshot);
 await page.locator('[data-scenic="orchard"]').click();
 await page.waitForFunction(previous=>window.__tinyKingdom.renderQuality().framesDrawn>previous,idle.view.framesDrawn,{timeout:45000});
 const moved=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.renderQuality(),camera:g.getCamera(),snapshot:g.exportSnapshot()};
 });
 expect(moved.camera.focus).toEqual([-26,9]);
 expect(moved.snapshot).toEqual(first.snapshot);
 await page.evaluate(()=>window.__tinyKingdom.step(1/30));
 await page.waitForFunction(previous=>window.__tinyKingdom.renderQuality().framesDrawn>previous,moved.view.framesDrawn,{timeout:45000});
 const afterTick=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 expect(afterTick).not.toEqual(first.snapshot);
 const beforeRestore=await page.evaluate(()=>window.__tinyKingdom.renderQuality().framesDrawn);
 await page.evaluate(snapshot=>window.__tinyKingdom.restoreSnapshot(snapshot),first.snapshot);
 await page.waitForFunction(previous=>window.__tinyKingdom.renderQuality().framesDrawn>previous,beforeRestore,{timeout:45000});
 expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())).toEqual(first.snapshot);
 expect(errors).toEqual([]);
});
