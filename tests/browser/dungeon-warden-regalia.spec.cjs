'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

// Never invent a combat frame: find a real public game state with a living
// Warden near the real autonomous party, without altering positions or HP.
function witnessedWarden(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let tick=0;tick<700;tick++){
  const s=game.publicState(),boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&s.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=4))return s;
  game.step();
 }
 throw Error('No authentic nearby living Warden in bounded seeded campaign');
}
test('true Chromium WebGL has recognisable locally authored Warden regalia, rendered in a real encounter',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/warden-regalia-plan.js')).status()).toBe(200);
 const snapshot=witnessedWarden();const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredBosses??0),{timeout:60000}).toBe(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.bossRegaliaParts??0),{timeout:15000}).toBe(24);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:30000}).toBeGreaterThanOrEqual(3);
 // Round 24: the filmed boss itself, not just surviving heroes, needs a clear actual 3D sightline.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.bossCutawayActive??false),{timeout:20000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.visibility?.unoccludedBosses??0),{timeout:20000}).toBe(1);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 // Round 29: the fallback-only Warden halo and mystic satellites must not
 // sit visibly atop the real textured GLB rigs. Keep true boss telegraphs.
 expect(diag.authored3D.hiddenFallbackOrnamentActors).toBeGreaterThanOrEqual(2);
 expect(diag.authored3D.hiddenFallbackOrnamentMeshes).toBeGreaterThanOrEqual(5);
 expect(diag.authored3D.incompleteAssets).toBe(0);
 expect(diag.authored3D.missingAssets).toBe(0);
 expect(diag.webgl).toBe(true);expect(diag.drawCalls).toBeLessThan(1600);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.composition.bossOnscreen).toBe(true);
 expect(diag.cinematicShot?.mode).toMatch(/^warden-/);
 expect(diag.criticalCameraFit?.subjects).toBeGreaterThanOrEqual(4);
 // Round 25: audit the ACTUAL WebGL camera chosen around this genuine Warden encounter.
 // A cinematic offset that leaves the authored dungeon perimeter exposes dead-black space.
 expect(diag.cameraRig?.mode).toBe('cinematic');
 expect(diag.cameraRig?.desiredPosition).toBeTruthy();
 const mapHalf=(snapshot.map.length-1)/2;
 for(const axis of ['x','z']){
  expect(Math.abs(diag.cameraRig.desiredPosition[axis])).toBeLessThanOrEqual(mapHalf-.65+1e-6);
  expect(diag.cameraRig.turn[axis]).toBeGreaterThanOrEqual(0);
  expect(diag.cameraRig.turn[axis]).toBeLessThanOrEqual(1);
 }
 expect(diag.cameraRig.desiredPosition.y).toBeGreaterThan(5);
 expect(diag.visibility.occludedBosses).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-ornament-hierarchy-round29-world-only.png'});
 // Inspect the SAME real autonomous Warden confrontation in a portrait
 // viewport; no replacement scene, painted boss or teleported characters.
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:30000}).toBeGreaterThan(100);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.bossOnscreen),{timeout:30000}).toBe(true);
 const portraitDiag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(portraitDiag.criticalCameraFit?.unframeable).toBe(false);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-actual-mobile-framed-WebGL.png'});
 await test.info().attach('actual-warden-encounter',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,run:snapshot.run,
  warden:snapshot.units.find(u=>u.kind==='warden')?.id,source:'real DungeonRuntime publicState; no hand-set actors',
  authoredBosses:diag.authored3D.authoredBosses,bossRegaliaParts:diag.authored3D.bossRegaliaParts,
  texturedCharacters:diag.authored3D.texturedCharacters,drawCalls:diag.drawCalls,
  triangles:diag.triangles,composition:diag.composition,mobileComposition:portraitDiag.composition,
  cameraFit:diag.criticalCameraFit,mobileCameraFit:portraitDiag.criticalCameraFit,bossCutawayActive:diag.bossCutawayActive,visibility:diag.visibility
 },null,2)),contentType:'application/json'});
});
