'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const sample=()=>{const game=DungeonRuntime.create('visual-room-art-18');for(let i=0;i<18;i++)game.step();return game.publicState()};
test('genuine seeded dungeon renders distinct sculptural wall niches without covering heroes',async({page,request})=>{
 for(const route of ['/dungeon/setpiece-plan.js','/dungeon/dungeon-setpieces.js'])expect((await request.get(route)).status()).toBe(200);
 const state=sample();await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:30000}).toBeGreaterThan(3);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.atmosphere.roomArt.motif).toBe('ossuary');
 expect(diag.atmosphere.roomArt.landmarks).toBeGreaterThanOrEqual(4);
 expect(diag.atmosphere.roomArt.wallReliefs).toBe(diag.atmosphere.roomArt.landmarks);
 expect(diag.atmosphere.roomArt.uniqueSculptureFamilies).toBe(4);
 expect(diag.atmosphere.lightShafts).toBe(0);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/dungeon-room18-desktop.png'});
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-room18-world-only.png'});
});
test('mobile biome artwork loads without losing the hero or overflowing controls',async({page})=>{
 const state=sample();await page.setViewportSize({width:390,height:844});
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.atmosphere?.roomArt?.landmarks??0),{timeout:30000}).toBeGreaterThan(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:15000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'artifacts/dungeon-room18-mobile.png',fullPage:true});
});

test('round 19 wall masonry has different physical crown heights in a genuine live WebGL scene',async({page,request})=>{
 expect((await request.get('/dungeon/wall-profile-plan.js')).status()).toBe(200);
 const state=sample();await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wallProfiles?.exposedWalls??0),{timeout:30000}).toBeGreaterThan(20);
 const diagnostic=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diagnostic.wallProfiles.distinctHeights).toBeGreaterThanOrEqual(3);
 expect(diagnostic.wallProfiles.minHeight).toBeGreaterThanOrEqual(2.5);
 expect(diagnostic.wallProfiles.maxHeight).toBeLessThanOrEqual(3.02);
 expect(diagnostic.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diagnostic.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-wall19-world-only.png'});
 await test.info().attach('physical-wall-profile-diagnostics',{body:Buffer.from(JSON.stringify(diagnostic.wallProfiles,null,2)),contentType:'application/json'});
});


test('round 32 genuine seeded WebGL walls show bounded eroded 3D stone relief without hiding heroes',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/stone-relief-plan.js')).status()).toBe(200);
 const pinned=sample();await page.route('**/dungeon/state',route=>route.fulfill({json:pinned}));
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.weatheredSpalls??0),{timeout:45000}).toBeGreaterThanOrEqual(12);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.webgl).toBe(true);
 expect(diag.dressing.weatheredSpalls).toBeLessThanOrEqual(96);
 expect(diag.dressing.brokenCopingStones).toBeGreaterThanOrEqual(3);
 expect(diag.dressing.brokenCopingStones).toBeLessThanOrEqual(48);
 expect(diag.dressing.weatheredBatches).toBe(2);
 expect(diag.dressing.clearedWeatheredPieces).toBeGreaterThanOrEqual(0);
 expect(diag.dressing.clearedWeatheredPieces).toBeLessThanOrEqual(diag.dressing.weatheredSpalls+diag.dressing.brokenCopingStones);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(diag.drawCalls).toBeLessThan(1600);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-weathered-stone-round32-world-only.png'});
 await test.info().attach('real-seeded-stone-relief',{body:Buffer.from(JSON.stringify({
  authority:'untouched DungeonRuntime.step real snapshot',seed:'visual-room-art-18',tick:pinned.tick,
  floor:pinned.floor,metrics:diag.dressing,composition:diag.composition,drawCalls:diag.drawCalls,triangles:diag.triangles
 },null,2)),contentType:'application/json'});
});

test('round 40 real seeded WebGL cavern rims fill exterior depth without hiding autonomous heroes',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/cavern-rim-plan.js')).status()).toBe(200);
 const snapshot=sample(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.atmosphere?.rimNear??0),{timeout:45000}).toBe(48);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(desktop.atmosphere.rimFar).toBe(32);
 expect(desktop.atmosphere.backgroundStructures).toBe(80);
 expect(desktop.atmosphere.lightShafts).toBe(0);
 expect(desktop.composition.visibleHeroes).toBeGreaterThan(0);
 expect(desktop.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(desktop.drawCalls).toBeLessThan(1600);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-cavern-rim-round40-desktop-world-only.png'});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:30000}).toBeGreaterThan(0);
 const mobile=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(mobile.atmosphere.rimNear+mobile.atmosphere.rimFar).toBe(80);
 expect(mobile.visibility.unoccludedHeroes).toBeGreaterThan(0);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-cavern-rim-round40-mobile-world-only.png'});
 expect(errors).toEqual([]);
 await test.info().attach('real-floor-cavern-depth',{body:Buffer.from(JSON.stringify({
  authority:'unmodified DungeonRuntime publicState',seed:'visual-room-art-18',
  tick:snapshot.tick,floor:snapshot.floor,desktop:{atmosphere:desktop.atmosphere,composition:desktop.composition,visibility:desktop.visibility,drawCalls:desktop.drawCalls,triangles:desktop.triangles},
  mobile:{composition:mobile.composition,visibility:mobile.visibility,drawCalls:mobile.drawCalls,triangles:mobile.triangles}
 },null,2)),contentType:'application/json'});
});
