'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
// Real game campaign only: never reposition the party or invent HP/actions.
function realEncounter(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let tick=0;tick<700;tick++){
  const s=game.publicState();
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&s.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=4))return s;
  game.step();
 }
 throw Error('No real nearby Warden observed in the fixed seed campaign');
}
test('actual Chromium WebGL renders bounded original class identities on textured character rigs',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/role-silhouette-plan.js')).status()).toBe(200);
 const snapshot=realEncounter(),errors=[];let state=snapshot;
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.roleSilhouetteActors??0),{timeout:15000}).toBeGreaterThanOrEqual(3);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.authored3D.roleSilhouetteParts).toBeGreaterThanOrEqual(21);
 expect(diag.authored3D.roleSilhouetteParts).toBeLessThanOrEqual(120);
 expect(diag.authored3D.missingAssets).toBe(0);
 expect(diag.authored3D.incompleteAssets).toBe(0);
 expect(diag.drawCalls).toBeLessThan(1600);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.webgl).toBe(true);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-role-silhouettes-round26-world-only.png'});
 await test.info().attach('real-class-identities',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,
  source:'actual DungeonRuntime publicState; no hand-set combat state',
  texturedCharacters:diag.authored3D.texturedCharacters,
  roleSilhouetteActors:diag.authored3D.roleSilhouetteActors,
  roleSilhouetteParts:diag.authored3D.roleSilhouetteParts,
  drawCalls:diag.drawCalls,triangles:diag.triangles,composition:diag.composition
 },null,2)),contentType:'application/json'});
});
