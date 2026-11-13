'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
const sample=()=>{const game=DungeonRuntime.create('dungeon-ui-round17');for(let i=0;i<18;i++)game.step();return game.publicState()};
test('genuine 3D expedition has continuous multi-cell stone and readable party',async({page,request})=>{
 test.setTimeout(120000);
 for(const path of ['/dungeon/expedition-stonework-plan.js','/dungeon/expedition-stonework.js'])
  expect((await request.get(path)).status()).toBe(200);
 const s=sample();await page.route('**/dungeon/state',route=>route.fulfill({json:s}));
 const errors=[];page.on('pageerror',err=>errors.push(err.message));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.expeditionStonework?.slabs??0),{timeout:35000}).toBeGreaterThan(20);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.expeditionStonework.coveredCells).toBe(diag.expeditionStonework.walkableCells);
 expect(diag.expeditionStonework.routeLength).toBeGreaterThan(5);
 expect(diag.expeditionStonework.largestSpan).toBeGreaterThanOrEqual(2);
 expect(diag.expeditionStonework.drawCalls).toBeLessThanOrEqual(3);
 if(diag.softwareWebGL){
  expect(diag.expeditionStonework.rasterTier).toBe('cpu-physical-chamfer');
  expect(diag.expeditionStonework.trianglesPerSlab).toBe(28);
  expect(diag.expeditionStonework.totalStoneTriangles).toBe(diag.expeditionStonework.slabs*28);
 }else expect(diag.expeditionStonework.rasterTier).toBe('original-full-bevel');
 expect(diag.expeditionStonework.maxElevation).toBeLessThan(.08);
 expect(diag.expeditionStonework.collisionEffects).toBe(0);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(diag.drawCalls).toBeLessThan(1600);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-expedition-stonework-desktop.png',timeout:45000});
 await test.info().attach('authentic-stonework-diagnostics',{body:Buffer.from(JSON.stringify({seed:'dungeon-ui-round17',tick:s.tick,stone:diag.expeditionStonework,composition:diag.composition,visibility:diag.visibility,drawCalls:diag.drawCalls},null,2)),contentType:'application/json'});
});
test('genuine mobile route surface and heroes fit without horizontal overflow',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844});
 const s=sample();await page.route('**/dungeon/state',route=>route.fulfill({json:s}));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.expeditionStonework?.slabs??0),{timeout:35000}).toBeGreaterThan(20);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:30000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'artifacts/dungeon-expedition-stonework-mobile.png',timeout:45000});
});
