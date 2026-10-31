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
 expect(diag.authored3D.incompleteAssets).toBe(0);
 expect(diag.authored3D.missingAssets).toBe(0);
 expect(diag.webgl).toBe(true);expect(diag.drawCalls).toBeLessThan(1600);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.composition.bossOnscreen).toBe(true);
 expect(diag.visibility.occludedBosses).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-regalia-round24-world-only.png'});
 await test.info().attach('actual-warden-encounter',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,run:snapshot.run,
  warden:snapshot.units.find(u=>u.kind==='warden')?.id,source:'real DungeonRuntime publicState; no hand-set actors',
  authoredBosses:diag.authored3D.authoredBosses,bossRegaliaParts:diag.authored3D.bossRegaliaParts,
  texturedCharacters:diag.authored3D.texturedCharacters,drawCalls:diag.drawCalls,
  triangles:diag.triangles,composition:diag.composition,bossCutawayActive:diag.bossCutawayActive,visibility:diag.visibility
 },null,2)),contentType:'application/json'});
});
