'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('real autonomous dungeon builds readable original vaulted wall breaks on desktop',async({page,request})=>{
 test.setTimeout(120000);
 for(const name of ['vaulted-wall-plan.js','vaulted-wall-gallery.js'])
  expect((await request.get('/dungeon/'+name)).status()).toBe(200);
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let i=0;i<18;i++)game.step();
 const state=game.publicState(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters||0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.webgl).toBe(true);
 expect(d.vaultedGallery?.bays).toBeGreaterThan(0);
 expect(d.vaultedGallery?.bays).toBeLessThanOrEqual(72);
 expect(d.vaultedGallery?.stoneBatches).toBe(3);
 expect(d.vaultedGallery?.collisionEffects).toBe(0);
 expect(d.dressing?.vaultedFacadeOpenings).toBeGreaterThanOrEqual(d.vaultedGallery.bays);
 expect(d.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(d.drawCalls).toBeLessThan(1600);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-vaulted-chamber-original-real-WebGL.png',timeout:60000});
 await test.info().attach('authentic-architecture-summary',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',floor:state.floor,tick:state.tick,gallery:d.vaultedGallery,visibility:d.visibility,
  drawCalls:d.drawCalls,triangles:d.triangles,originalWallCount:d.wallSculpture.wallCount
 },null,2)),contentType:'application/json'});
});