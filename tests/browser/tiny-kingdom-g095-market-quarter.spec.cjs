'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/*
 * G095 transformation workstream: a recognizable, inhabited market district
 * and goods that follow the ACTUAL economy. This tests physical scene/authority
 * invariants, not art parity, reference quality or independent spectator appeal.
 * Intentionally written before the game implementation (RED first).
 */
test('G095 working market is physical, economy-led and usable at 390px',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getMarketQuarterStats!=='function'||
    typeof g.getMarketSupplyView!=='function')
   return {missing:'market economy and spatial experience APIs'};
  const before=JSON.stringify(g.exportSnapshot());
  const market=g.getMarketQuarterStats(),stock=g.getMarketSupplyView(),
    snapshot=g.getState();
  return {market,stock,snapshot,
   authorityStable:before===JSON.stringify(g.exportSnapshot()),
   triangles:g.renderStats().lastFrameTriangles,
   glError:document.querySelector('#world').getContext('webgl')?.getError()||0};
 });
 expect(initial.missing||'').toBe('');
 expect(initial.authorityStable).toBe(true);
 expect(initial.market.stalls).toBeGreaterThanOrEqual(4);
 expect(initial.market.pavingStones).toBeGreaterThanOrEqual(180);
 // Every cobble sits on a continuous earth/grout bed, not bright grass seams.
 expect(initial.market.mortarTriangles).toBeGreaterThanOrEqual(40);
 expect(initial.market.signboards).toBeGreaterThanOrEqual(3);
 expect(initial.market.totalTriangles).toBeGreaterThan(700);
 expect(initial.market.totalTriangles).toBeLessThan(7000);
 expect(initial.market.cached).toBe(true);
 expect(initial.stock.resources.food).toBe(initial.snapshot.state.food);
 expect(initial.stock.resources.wood).toBe(initial.snapshot.state.wood);
 expect(initial.stock.resources.gold).toBe(initial.snapshot.state.gold);
 expect(initial.stock.sacks).toBeGreaterThanOrEqual(0);
 expect(initial.stock.sacks).toBeLessThanOrEqual(6);
 expect(initial.stock.logs).toBeGreaterThanOrEqual(0);
 expect(initial.stock.logs).toBeLessThanOrEqual(5);
 expect(initial.triangles).toBeGreaterThan(100000);
 expect(initial.triangles).toBeLessThan(160000);
 expect(initial.glError).toBe(0);
 await page.locator('[data-scenic="market"]').click();
 const camera=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  return {camera:g.getCamera(),sameAuthority:before===JSON.stringify(g.exportSnapshot()),
   view:g.getMarketSupplyView()};
 });
 expect(camera.camera.zoom).toBeLessThanOrEqual(21);
 expect(camera.camera.follow).toBe(false);
 expect(camera.sameAuthority).toBe(true);
 expect(camera.view.resources).toEqual(initial.stock.resources);
 const progressed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<1600;i++)g.step(1/30);
  const economy=g.getState().state,view=g.getMarketSupplyView();
  return {economy,view,nonnegative:[economy.food,economy.wood,economy.gold].every(x=>x>=0)};
 });
 expect(progressed.view.resources).toEqual({
  food:progressed.economy.food,wood:progressed.economy.wood,
  gold:progressed.economy.gold});
 expect(progressed.nonnegative).toBe(true);
 await page.setViewportSize({width:390,height:844});
 // matchMedia change fires on the resize task; inspect only after responsive layout commits.
 await page.waitForFunction(()=>window.__tinyKingdom.getCommandView()==='world',null,{timeout:10000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {overflow:document.documentElement.scrollWidth>innerWidth,
   marketButton:document.querySelector('[data-scenic="market"]').getBoundingClientRect().width,
   marketCamera:g.getCamera(),command:g.getCommandView(),
   sidebarDisplay:getComputedStyle(document.querySelector('.sidebar')).display,
   atlasDisplay:getComputedStyle(document.querySelector('.atlas')).display,
   worldRibbonDisplay:getComputedStyle(document.querySelector('#world-ribbon')).display,
   glError:document.querySelector('#world').getContext('webgl')?.getError()||0};
 });
 expect(mobile.overflow).toBe(false);
 expect(mobile.marketButton).toBeGreaterThan(20);
 // This 390px screenshot must be a GAME, not a map, two floating dashboards
 // and stories obscuring almost every playable pixel.
 expect(mobile.command).toBe('world');
 expect(mobile.sidebarDisplay).toBe('none');
 expect(mobile.atlasDisplay).toBe('none');
 expect(mobile.worldRibbonDisplay).not.toBe('none');
 await page.locator('#world-open-command').click();
 const manuallyOpened=await page.evaluate(()=>({
  command:window.__tinyKingdom.getCommandView(),
  sidebar:getComputedStyle(document.querySelector('.sidebar')).display
 }));
 expect(manuallyOpened.command).toBe('command');
 expect(manuallyOpened.sidebar).not.toBe('none');
 await page.locator('#command-toggle').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCommandView())).toBe('world');
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
