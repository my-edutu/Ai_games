'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G150 — inspect a real physical market from an actual walkable human-scale
// camera. A HUD-only market toggle, fabricated shoppers or static screenshot
// must never satisfy this real-input/browser contract.
test('G150 market visitor sees real dawn/dusk shutter life from a walkable street on desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const base=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await expect(page.locator('#market-visit')).toBeVisible();
 await page.locator('#market-visit').click();
 const first=await page.evaluate(()=>{
  const g=window.__tinyKingdom,visit=g.getMarketVisitAudit(),street=g.getStreetWalkState();
  return {visit,street,authority:JSON.stringify(g.exportSnapshot()),
   safe:g.walkable(street.position),status:document.getElementById('street-walk-status').textContent,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(first.visit.active).toBe(true);
 expect(first.street.active).toBe(true);
 expect(first.street.height).toBeGreaterThan(1.4);
 expect(first.street.height).toBeLessThan(2.0);
 expect(first.street.position).toEqual(first.visit.position);
 expect(first.visit.stall.trade).toBeTruthy();
 expect(first.visit.stallDistance).toBeLessThan(10);
 expect(first.visit.safe).toBe(true);
 expect(first.safe).toBe(true);
 expect(first.visit.market.stalls).toBe(4);
 expect(first.visit.market.doorLeaves).toBe(8);
 expect(first.status.toLowerCase()).toContain('market');
 expect(first.authority).toBe(base);
 expect(first.gl).toBe(0);
 await page.keyboard.down('ArrowLeft');
 const turned=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.advanceStreetWalk(.16);
  return {street:g.getStreetWalkState(),authority:JSON.stringify(g.exportSnapshot())};
 });
 await page.keyboard.up('ArrowLeft');
 expect(turned.street.yaw).not.toBe(first.street.yaw);
 expect(turned.authority).toBe(base);
 const night=await page.evaluate(()=>{
  const g=window.__tinyKingdom,now=g.getDailyRhythmAudit().hour;
  const ahead=(23.5-now+24)%24,steps=Math.max(1,Math.ceil(ahead*30));
  for(let i=0;i<steps;i++)g.step(ahead/steps);
  g.advanceStreetWalk(0);
  const before=JSON.stringify(g.exportSnapshot());
  return {visit:g.getMarketVisitAudit(),status:document.getElementById('street-walk-status').textContent,
   snapshot:before,after:JSON.stringify(g.exportSnapshot())};
 });
 expect(night.visit.market.openFraction).toBeLessThan(.01);
 expect(night.status.toLowerCase()).toContain('closed');
 expect(night.snapshot).toBe(night.after);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(700);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom,entry=document.getElementById('market-visit');
  const street=document.getElementById('street-walk-controls');
  return {market:g.getMarketVisitAudit(),width:document.documentElement.scrollWidth,
   screen:document.documentElement.clientWidth,
   controlVisible:entry.getBoundingClientRect().width>0,
   streetVisible:getComputedStyle(street).display!=='none',
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(mobile.market.active).toBe(true);
 expect(mobile.controlVisible).toBe(true);
 expect(mobile.streetVisible).toBe(true);
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.screen).toBe(390);
 expect(mobile.gl).toBe(0);
 expect(mobile.authority).toBe(night.snapshot);
 await page.keyboard.press('Escape');
 const exit=await page.evaluate(()=>({
  active:window.__tinyKingdom.getMarketVisitAudit().active,
  street:window.__tinyKingdom.getStreetWalkState().active,
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
 expect(exit.active).toBe(false);
 expect(exit.street).toBe(false);
 expect(exit.snapshot).toBe(night.snapshot);
 expect(errors).toEqual([]);
});
