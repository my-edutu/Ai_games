'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// A visitor must SEE the actual settlement first, then inspect an ORIGINAL
// autonomous producer or loaded courier with ONE keyboard-accessible action.
// No invented jobs, deliveries, resource gains, world writes or teleportation.
test('W03 real village-first experience and documentary observation on desktop and mobile',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:768});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const first=await page.evaluate(()=>({
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  mode:window.__tinyKingdom.getCommandView(),
  ribbon:document.querySelector('#world-ribbon')?.getBoundingClientRect().toJSON(),
  scene:document.querySelector('#world')?.getBoundingClientRect().toJSON()
 }));
 expect(first.mode).toBe('world');
 await expect(page.locator('#world-ribbon')).toBeVisible();
 await expect(page.locator('#world-watch-life')).toBeVisible();
 await expect(page.locator('#world-watch-life')).toHaveAccessibleName(/real worker|courier/i);
 // The original WebGL canvas remains in view and commands can still be opened.
 expect(first.scene.width).toBeGreaterThan(900);
 await page.locator('#world-watch-life').click();
 const documentary=await page.evaluate(()=>({
  mode:document.body.dataset.workday,camera:window.__tinyKingdom.getCamera(),
  selected:window.__tinyKingdom.getSelectedCitizen(),
  people:window.__tinyKingdom.getCitizenProfiles().map(p=>p.name),
  after:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  deliveries:window.__tinyKingdom.getActiveDeliveries().length,
  recorded:window.__tinyKingdom.getLiveWorkdayView().citizen
 }));
 expect(['live','delivery']).toContain(documentary.mode);
 expect(documentary.camera.follow).toBe(true);
 expect(documentary.people).toContain(documentary.selected);
 expect(documentary.after).toBe(first.snapshot);
 // Leaving the documentary must restore normal scenic interaction.
 await page.locator('[data-scenic="valley"]').click();
 await expect(page.locator('#world-open-command')).toBeVisible();
 await page.locator('#world-open-command').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCommandView())).toBe('command');
 await page.locator('#command-toggle').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCommandView())).toBe('world');
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(400);
 const mobile=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,
  mode:window.__tinyKingdom.getCommandView(),
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  button:document.getElementById('world-watch-life').getBoundingClientRect().toJSON(),
  gl:document.getElementById('world').getContext('webgl')?.getError()??-1
 }));
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.mode).toBe('world');
 expect(mobile.button.width).toBeGreaterThan(50);
 expect(mobile.snapshot).toBe(first.snapshot);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
