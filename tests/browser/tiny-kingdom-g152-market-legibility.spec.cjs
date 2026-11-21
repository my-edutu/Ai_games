'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G152: real G150 1024px/390px footage exposed the merchant's head filling
// the lens, an almost under-the-awning market entrance, and unrounded stocks.
// The visual contract requires safe human-height standoff and sightline checks
// on genuine Day-120 citizens, never staged actors or altered inventory.
test('G152 Day-120 market visitor must show a real stall instead of a foreground building on desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:90000});
 await page.locator('#pause').click();
 await page.evaluate(()=>window.__tinyKingdom.reset());
 for(let remaining=120*24*30+5*30;remaining>0;remaining-=7200)
  await page.evaluate(n=>{
   for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30);
  },Math.min(remaining,7200));
 const authority=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#market-visit').click();
 const noon=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.getMarketVisitAudit(),status:document.getElementById('street-walk-status').textContent,
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(noon.view.active&&noon.view.safe).toBe(true);
 expect(noon.view.stallDistance).toBeGreaterThanOrEqual(4);
 // This failed contract did not exist before G152: prior 6.12m camera had a building filling the frame.
 expect(noon.view.architecture?.nearestWallDistance).toBeGreaterThanOrEqual(2);
 expect(noon.view.architecture?.interveningRoofs).toBe(0);
 expect(noon.view.architecture?.largestForegroundCover).toBeLessThan(.35);
 expect(noon.view.architecture?.portraitSafe).toBe(true);
 expect(noon.view.closestCitizenDistance).toBeGreaterThanOrEqual(2.4);
 expect(noon.view.foregroundCitizenCount).toBe(0);
 expect(noon.view.market.openFraction).toBeGreaterThan(.99);
 expect(noon.status).toMatch(/^Market open · \d+ merchants · \d+ food · \d+ timber$/);
 expect(noon.authority).toBe(authority);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(700);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.getMarketVisitAudit(),status:document.getElementById('street-walk-status').textContent,
   width:document.documentElement.scrollWidth,authority:JSON.stringify(g.exportSnapshot()),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.view.stallDistance).toBeGreaterThanOrEqual(4);
 expect(mobile.view.architecture?.nearestWallDistance).toBeGreaterThanOrEqual(2);
 expect(mobile.view.architecture?.interveningRoofs).toBe(0);
 expect(mobile.view.architecture?.largestForegroundCover).toBeLessThan(.35);
 expect(mobile.view.architecture?.portraitSafe).toBe(true);
 expect(mobile.view.foregroundCitizenCount).toBe(0);
 expect(mobile.status.length).toBeLessThanOrEqual(70);
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.gl).toBe(0);
 expect(mobile.authority).toBe(authority);
 await page.keyboard.press('v'); // existing actual, user-available street shortcut
 expect(await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().active)).toBe(false);
 expect(errors).toEqual([]);
});
