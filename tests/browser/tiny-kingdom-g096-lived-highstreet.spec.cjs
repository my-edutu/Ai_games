'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/*
 * G096 lived-in high street: a whole connected playable precinct, not a
 * roof-pigment or triangle-count victory. Its structural assertions are a
 * safety floor; the experience still needs blinded matched real footage.
 */
test('G096 inhabited high street connects actual homes to market without changing authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const game=window.__tinyKingdom,previous=JSON.stringify(game.exportSnapshot());
  return {
   missing:typeof game.getHighStreetStats!=='function',
   street:game.getHighStreetStats?.(),
   after:JSON.stringify(game.exportSnapshot()),before:previous,
   triangles:game.renderStats().lastFrameTriangles,
   error:document.querySelector('#world').getContext('webgl')?.getError()||0
  };
 });
 expect(initial.missing).toBe(false);
 expect(initial.after).toBe(initial.before);
 expect(initial.street.cached).toBe(true);
 expect(initial.street.connectedLanes).toBeGreaterThanOrEqual(3);
 expect(initial.street.pavingStones).toBeGreaterThanOrEqual(90);
 expect(initial.street.shopfronts).toBeGreaterThanOrEqual(2);
 expect(initial.street.houseYards).toBeGreaterThanOrEqual(6);
 expect(initial.street.washLines).toBeGreaterThanOrEqual(3);
 expect(initial.street.stackedGoods).toBeGreaterThanOrEqual(15);
 expect(initial.street.stallYards).toBeGreaterThanOrEqual(4);
 expect(initial.street.totalTriangles).toBeGreaterThan(450);
 expect(initial.street.totalTriangles).toBeLessThan(6500);
 expect(initial.triangles).toBeLessThan(160000);
 expect(initial.error).toBe(0);
 // Real video review found a worker hidden for seconds by market linen roofs.
 // Camera collision must include the MARKET CANOPIES, newly built shops and
 // arcade, not only the old town houses. These are presentation probes only.
 const director=await page.evaluate(()=>{
  const g=window.__tinyKingdom,snapshot=JSON.stringify(g.exportSnapshot());
  return {missing:typeof g.getCameraOcclusionModel!=='function',
   model:g.getCameraOcclusionModel?.(),
   unchanged:snapshot===JSON.stringify(g.exportSnapshot())};
 });
 expect(director.missing).toBe(false);
 expect(director.unchanged).toBe(true);
 expect(director.model.stalls).toBe(4);
 expect(director.model.streetShops).toBe(2);
 expect(director.model.arcades).toBeGreaterThanOrEqual(1);
 expect(director.model.villageMarketCanopies).toBeGreaterThanOrEqual(1);
 expect(director.model.roofTotal).toBeGreaterThan(15);
 const restored=await page.evaluate(()=>{
  const game=window.__tinyKingdom,snapshot=game.exportSnapshot();
  for(let i=0;i<400;i++)game.step(1/30);
  game.restoreSnapshot(snapshot);
  return {equal:JSON.stringify(game.exportSnapshot())===JSON.stringify(snapshot),
   street:game.getHighStreetStats()};
 });
 expect(restored.equal).toBe(true);
 expect(restored.street.houseYards).toBe(initial.street.houseYards);
 await page.setViewportSize({width:390,height:844});
 // matchMedia change fires on the resize task; inspect only after responsive layout commits.
 await page.waitForFunction(()=>window.__tinyKingdom.getCommandView()==='world',null,{timeout:10000});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>innerWidth,
  command:window.__tinyKingdom.getCommandView(),
  error:document.querySelector('#world').getContext('webgl')?.getError()||0
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.command).toBe('world');
 expect(mobile.error).toBe(0);
 expect(errors).toEqual([]);
});
