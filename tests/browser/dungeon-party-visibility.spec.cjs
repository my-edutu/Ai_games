'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function snapshot(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let step=0;step<18;step++)game.step();
 return game.publicState();
}
test('real seeded Chromium WebGL reveals near-party masonry but retains distant dungeon walls',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/party-visibility-plan.js')).status()).toBe(200);
 const state=snapshot(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cutawayNearbyWalls??0),{timeout:20000}).toBeGreaterThan(0);
 // Use the real seeded authority snapshot and actual WebGL frame loop. Once
 // the camera/party are steady, a repeated image must not reupload unchanged
 // instanced masonry buffers each rendered frame.
 await expect.poll(()=>page.evaluate(()=>{
  const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
  return Boolean(d&&d.wallMatrixWrites===0&&d.parapetMatrixWrites===0&&
   d.dressing?.matrixWrites?.facade===0&&d.dressing?.matrixWrites?.weathered===0);
 }),{timeout:40000}).toBe(true);
 const diagnostics=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diagnostics.cutawayNearbyWalls).toBeGreaterThan(0);
 expect(diagnostics.cutawayNearbyWalls).toBeLessThan(diagnostics.wallProfiles.totalWalls);
 expect(diagnostics.visibility.unoccludedHeroes).toBeGreaterThanOrEqual(2);
 expect(diagnostics.composition.visibleHeroes).toBeGreaterThanOrEqual(2);
 expect(diagnostics.drawCalls).toBeLessThan(1600);
 expect(diagnostics.authored3D.missingAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-party-clearance-round35-world-only.png',timeout:45000});
 await test.info().attach('actual-seeded-party-cutaway',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:state.tick,frame:diagnostics.frame,
  cutawayWalls:diagnostics.cutawayWalls,nearbyWalls:diagnostics.cutawayNearbyWalls,
  wallMatrixWrites:diagnostics.wallMatrixWrites,parapetMatrixWrites:diagnostics.parapetMatrixWrites,
  dressingMatrixWrites:diagnostics.dressing?.matrixWrites,
  composition:diagnostics.composition,visibility:diagnostics.visibility,
  render: {drawCalls:diagnostics.drawCalls,triangles:diagnostics.triangles}
 },null,2)),contentType:'application/json'});
});
