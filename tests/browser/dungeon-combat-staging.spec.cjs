'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('real wide-entrance and true body-contact fallback render consistently on desktop and mobile',async({page,request})=>{
 test.setTimeout(180000);
 const game=DungeonRuntime.create('dungeon-court-contact-staging-m1');
 const original=game.publicState();
 const heroes=original.units.filter(u=>u.faction==='party');
 expect(new Set(heroes.map(u=>u.x+','+u.z)).size).toBe(3);
 let snapshot=original;
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:70000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredCharacters),{timeout:60000}).toBeGreaterThanOrEqual(5);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(desktop.combatStaging?.separatedActors).toBe(0);
 expect(desktop.composition.visibleHeroes).toBe(3);
 expect(desktop.triangles).toBeGreaterThan(1000);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-wide-entrance-m1-desktop-real-WebGL.png',timeout:90000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:20000}).toBeGreaterThan(150);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-wide-entrance-m1-mobile-real-WebGL.png',timeout:90000});
 // The pure visual de-clumping path must still work for a legitimately legal
 // same-cell party snapshot. Explicitly staged authority: not an organic run.
 const modified=DungeonRuntime.restore(game.save());
 for(const hero of modified.state.units.filter(u=>u.faction==='party')){hero.x=1;hero.z=1;}
 snapshot=modified.publicState();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStaging?.separatedActors),{timeout:40000}).toBeGreaterThanOrEqual(3);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-crowd-fallback-m1-mobile-real-WebGL.png',timeout:90000});
 await test.info().attach('true-authority-combat-staging-provenance',{body:Buffer.from(JSON.stringify({
  seed:'dungeon-court-contact-staging-m1',organicNewAtrium:true,
  stagedCrowdFallback:true,mutation:'legally co-located three real authority units for fallback-only test',
  baselineMatched:false,organicFullCampaignCapture:false,independentCritic:false
 },null,2)),contentType:'application/json'});
});
