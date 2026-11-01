'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function witnessedBoss(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let tick=0;tick<700;tick++){
  const s=game.publicState(),boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&s.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=4))return s;
  game.step();
 }
 throw Error('Cannot capture original forged armor without a real autonomous Warden encounter');
}
test('real desktop and mobile WebGL boss fight renders original sculpted armor on genuine skinned characters',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/forged-armor.js')).status()).toBe(200);
 const snapshot=witnessedBoss(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.sculptedArmorActors??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(desktop.authored3D.sculptedArmorVertices).toBeGreaterThan(3000);
 expect(desktop.authored3D.sculptedArmorProfiles.length).toBeGreaterThanOrEqual(3);
 expect(desktop.authored3D.missingAssets).toBe(0);
 expect(desktop.authored3D.incompleteAssets).toBe(0);
 expect(desktop.drawCalls).toBeLessThan(1600);
 expect(desktop.webgl).toBe(true);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-forged-armor-real-warden-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:30000}).toBeGreaterThan(100);
 const mobile=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(mobile.authored3D.sculptedArmorActors).toBeGreaterThanOrEqual(3);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-forged-armor-real-warden-mobile.png'});
 expect(errors).toEqual([]);
 await test.info().attach('real-forged-armor-encounter',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,run:snapshot.run,
  source:'real bounded DungeonRuntime publicState; no hand-positioned actors',
  desktop:{drawCalls:desktop.drawCalls,triangles:desktop.triangles,composition:desktop.composition,authored:desktop.authored3D},
  mobile:{drawCalls:mobile.drawCalls,triangles:mobile.triangles,composition:mobile.composition,authored:mobile.authored3D}
 },null,2)),contentType:'application/json'});
});
