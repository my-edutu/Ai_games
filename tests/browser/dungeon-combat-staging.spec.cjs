'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('real desktop and mobile 3D staging keeps the autonomous party distinct at the shared spawn',async({page,request})=>{
 test.setTimeout(180000);
 const snapshot=DungeonRuntime.create('dungeon-court-contact-staging-m1').publicState();
 expect(snapshot.units.filter(u=>u.faction==='party'&&u.x===1&&u.z===1)).toHaveLength(3);
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:70000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredCharacters),{timeout:60000}).toBeGreaterThanOrEqual(5);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(desktop.combatStaging?.separatedActors).toBeGreaterThanOrEqual(3);
 expect(desktop.combatStaging.maxOffsetMeters).toBeLessThanOrEqual(.28);
 expect(desktop.triangles).toBeGreaterThan(1000);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-contact-stage-m1-desktop-webgl.png',timeout:90000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:20000}).toBeGreaterThan(150);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStaging?.separatedActors)).toBeGreaterThanOrEqual(3);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-contact-stage-m1-mobile-webgl.png',timeout:90000});
 await test.info().attach('real-authority-stage',{body:Buffer.from(JSON.stringify({
  seed:'dungeon-court-contact-staging-m1',tick:snapshot.tick,realWebGL:true,
  desktopCrowdedActors:desktop.combatStaging.separatedActors,source:'DungeonRuntime.create; unchanged replay-safe authority',
  originalBaselineComparison:false,organicCampaignCapture:false,independentCritic:false
 },null,2)),contentType:'application/json'});
});
