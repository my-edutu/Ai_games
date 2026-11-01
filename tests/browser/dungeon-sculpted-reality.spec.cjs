'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
test('real 3D dungeon sculpting and anatomical gear render from an unchanged autonomous snapshot',async({page,request})=>{
 test.setTimeout(120000);
 for(const src of ['/dungeon/fractured-wall-plan.js','/dungeon/anatomical-kit-plan.js'])expect((await request.get(src)).status()).toBe(200);
 const game=DungeonRuntime.create('visual-room-art-18');for(let tick=0;tick<18;tick++)game.step();
 const snapshot=game.publicState(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.anatomicalDetailActors??0),{timeout:30000}).toBeGreaterThanOrEqual(3);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.webgl).toBe(true);
 expect(diag.wallSculpture).toMatchObject({sculpted:true,variants:4});
 expect(diag.wallSculpture.wallCount).toBeGreaterThan(40);
 expect(diag.dressing?.cutawayFloorBackings).toBeGreaterThan(0);
 expect(diag.dressing?.cutawayFloorBackings).toBeLessThanOrEqual(4096);
 expect(diag.authored3D.anatomicalDetailParts).toBeGreaterThanOrEqual(30);
 expect(diag.authored3D.anatomicalDetailParts).toBeLessThanOrEqual(144);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(diag.drawCalls).toBeLessThan(1600);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-cutaway-infill-round51-world-only.png',timeout:60000});
 await test.info().attach('real-sculpted-3d',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,
  source:'real DungeonRuntime publicState; presentation-only extras',
  walls:diag.wallSculpture,cutaway:{walls:diag.cutawayWalls,floorBackings:diag.dressing.cutawayFloorBackings},gear:diag.authored3D.anatomicalDetailParts,
  composition:diag.composition,visibility:diag.visibility,drawCalls:diag.drawCalls,triangles:diag.triangles
 },null,2)),contentType:'application/json'});
});