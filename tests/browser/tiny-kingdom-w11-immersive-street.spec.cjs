'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W11 test authored before the camera/UI implementation. No RED runtime was
// observed locally because the worker browser service was unavailable.
test('W11 actual market pedestrian camera stays readable and controllable without obscuring the world on desktop and 390px',async({page})=>{
 test.setTimeout(170000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const start=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);
  const before=JSON.stringify(g.exportSnapshot()),street=g.setStreetWalk(true);
  return {before,after:JSON.stringify(g.exportSnapshot()),
   street,entrance:g.getStreetEntranceAudit(),
   renderer:g.renderer()};
 });
 expect(start.street.active).toBe(true);
 expect(start.street.visibility.openSky).toBe(true);
 expect(start.entrance.source).toBe('real-market-upright-and-walkable-street-audit');
 expect(start.entrance.candidates).toBeGreaterThan(0);
 expect(start.entrance.selected.score).toEqual(expect.any(Number));
 expect(start.before).toBe(start.after);
 expect(start.renderer).toBe('webgl');
 await expect(page.locator('#street-walk-controls')).toBeVisible();
 await expect(page.locator('#world-ribbon')).toBeHidden();
 await expect(page.locator('.bottom')).toBeHidden();
 await expect(page.locator('#street-command-desk')).toBeVisible();
 await expect(page.locator('#street-pause')).toBeVisible();
 // A visitor can inspect the OPEN, actual market; there are no fake citizens.
 expect((await page.evaluate(()=>window.__tinyKingdom.visitMarket())).active).toBe(true);
 const output=path.resolve(__dirname,'../../test-results');
 fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,'w11-immersive-market-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(450);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const ids=['street-pause','street-meet-worker','street-command-desk','street-walk-exit'];
  return {width:document.documentElement.scrollWidth,market:g.getMarketVisitAudit(),
   controls:ids.map(id=>{
    const n=document.getElementById(id),r=n.getBoundingClientRect();
    return {id,visible:r.width>=40&&r.height>=39,left:r.left,right:r.right,bottom:r.bottom};
   }),before:JSON.stringify(g.exportSnapshot()),
   gl:document.getElementById('world').getContext('webgl')?.getError()};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.market.active).toBe(true);
 expect(mobile.controls.every(x=>x.visible&&x.left>=0&&x.right<=390&&x.bottom<=844)).toBe(true);
 expect(mobile.before).toBe(start.before);
 expect(mobile.gl).toBe(0);
 await expect(page.locator('#world-ribbon')).toBeHidden();
 await expect(page.locator('.bottom')).toBeHidden();
 await page.screenshot({path:path.join(output,'w11-immersive-market-390.png')});
 // World-first controls must not sacrifice paused state or access to the full desk.
 await page.locator('#street-pause').click();
 await expect(page.locator('#pause')).toHaveText('▶ Resume');
 await page.locator('#street-pause').click();
 await expect(page.locator('#pause')).toHaveText('Ⅱ Pause');
 await page.locator('#street-command-desk').click();
 await expect(page.locator('.bottom')).toBeVisible();
 await expect(page.locator('#command-toggle')).toBeVisible();
 await page.locator('#command-toggle').click();
 await expect(page.locator('.bottom')).toBeHidden();
 await expect(page.locator('#street-walk-controls')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(start.before);
 expect(errors).toEqual([]);
});
