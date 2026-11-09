'use strict';
const {test,expect}=require('@playwright/test');

// Real unmodified autonomous authority, local Three.js and genuine canvas.
// This is visual evidence and a performance/resource gate, NOT an A/B win.
test('live dungeon uses bounded environmental look maps, readable light and no new render passes',async({page,request})=>{
 test.setTimeout(150000);
 const module=await request.get('/dungeon/environment-look-plan.js');
 expect(module.ok()).toBe(true);
 expect(module.headers()['content-type']).toContain('text/javascript');
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.environmentLook??null),{timeout:60000}).not.toBeNull();
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const look=diag.environmentLook;
 expect(diag.webgl).toBe(true);
 expect(diag.renderedState.floor).toBeGreaterThanOrEqual(1);
 expect(diag.drawCalls).toBeGreaterThan(0);
 expect(diag.triangles).toBeGreaterThan(0);
 expect(look.materialRoles).toEqual(['masonry','floorStone','carvedStone']);
 expect(look.preset).toMatch(/CRYPT|CATHEDRAL|VAULT|SANCTUM/);
 expect(look.detailTextureCount).toBeLessThanOrEqual(5);
 expect([0,5]).toContain(look.detailTextureCount);
 expect(look.detailTextureRawBytes).toBeLessThanOrEqual(look.detailTextureBudgetBytes);
 expect(look.spatialWear?.tiles).toBeGreaterThan(0);
 expect(look.spatialWear?.bleedIntoWalls).toBe(0);
 expect(look.spatialWear?.instanceColorBytes).toBe(look.spatialWear.tiles*12);
 expect(look.spatialWear?.damp+look.spatialWear?.soot).toBeGreaterThanOrEqual(0);
 expect(look.hemisphereSky).toMatch(/^[0-9a-f]{6}$/);
 expect(look.hemisphereGround).toMatch(/^[0-9a-f]{6}$/);
 expect(look.keyDirection).toHaveLength(3);
 expect([0,2,7]).toContain(look.ambientDetailTextures);
 expect(diag.atmosphere?.roomArt?.materialDetailMaps).toBe(look.ambientDetailTextures);
 expect(diag.atmosphere?.roomArt?.materialDetailRawBytes).toBeLessThanOrEqual(7*128*128*4);
 if(diag.softwareWebGL)expect(look.ambientDetailTextures).toBe(0);
 expect(look.additionalLights).toBe(0);
 expect(look.additionalShadowMaps).toBe(0);
 expect(look.fogDensity).toBeGreaterThan(.012);
 expect(look.fogDensity).toBeLessThan(.021);
 if(look.detailTextureCount===5){
  expect(look.normalMapsEnabled).toBe(true);
  expect(look.roughnessMapsEnabled).toBe(true);
 }else{
  expect(look.normalMapsEnabled).toBe(false);
  expect(look.roughnessMapsEnabled).toBe(false);
 }
 expect(diag.wallMasonry.mapped).toBe(true);
 expect(errors).toEqual([]);
 // One genuine live WebGL canvas, never a generated mockup or a second,
 // redundant full-page screenshot (software rasterizer may be very slow).
 await page.locator('#world').screenshot({path:'artifacts/dungeon-session6-environment-look-real-webgl.png',timeout:60000});
 await test.info().attach('environment-look-live-receipt',{
  body:Buffer.from(JSON.stringify({renderedState:diag.renderedState,look,drawCalls:diag.drawCalls,
   triangles:diag.triangles,composition:diag.composition,visibility:diag.visibility,
   wallMasonry:diag.wallMasonry,atmosphere:diag.atmosphere?.roomArt},null,2)),contentType:'application/json'
 });
});

test('a 390px real mobile viewport preserves gameplay heroes under restrained environmental lighting',async({page})=>{
 test.setTimeout(150000);
 await page.setViewportSize({width:390,height:844});
 const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
 const game=DungeonRuntime.create('session6-mobile-legibility');
 for(let i=0;i<18;i++)game.step();
 const snapshot=game.publicState();
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.environmentLook?.spatialWear?.tiles??0),
  {timeout:60000}).toBeGreaterThan(0);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.renderedState.tick).toBe(snapshot.tick);
 expect(diag.renderedState.floor).toBe(snapshot.floor);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.environmentLook.additionalShadowMaps).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
 // Actual Three.js WebGL on a real authority snapshot, never a mock-up.
 await page.locator('#world').screenshot({path:'artifacts/dungeon-session6-mobile-real-world.png',timeout:60000});
 await test.info().attach('session6-mobile-physical-grade',{
  body:Buffer.from(JSON.stringify({seed:'session6-mobile-legibility',
   authorityTick:snapshot.tick,rendered:diag.renderedState,environmentLook:diag.environmentLook,
   visibleHeroes:diag.composition.visibleHeroes,heroVisibility:diag.visibility,
   roomArt:diag.atmosphere?.roomArt,drawCalls:diag.drawCalls},null,2)),contentType:'application/json'
 });
});
