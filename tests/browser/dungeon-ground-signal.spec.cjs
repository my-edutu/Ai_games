'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

test('actual seeded Chromium WebGL shows dark contact shadows but no permanent idle glow rings',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/ground-signal-plan.js')).status()).toBe(200);
 const game=DungeonRuntime.create('dungeon-ui-round17');
 for(let i=0;i<18;i++)game.step();
 const snapshot=game.publicState(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.groundSignals?.subjects??-1),{timeout:15000}).toBe(snapshot.units.length);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const live=snapshot.units.filter(u=>u.hp>0);
 const active=live.filter(u=>u.action==='cast'||u.action==='guard');
 const casting=active.filter(u=>u.action==='cast');
 expect(d.webgl).toBe(true);
 expect(d.groundSignals.shadows).toBe(live.length);
 expect(d.groundSignals.ritualSigils).toBe(active.length);
 expect(d.groundSignals.coronas).toBe(casting.length);
 expect(d.groundSignals.ritualSigils).toBeLessThanOrEqual(d.groundSignals.shadows);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.drawCalls).toBeLessThan(1600);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-ground-clarity-round56-world-only.png',timeout:60000});
 await test.info().attach('real-contact-ground-signal',{body:Buffer.from(JSON.stringify({
  seed:'dungeon-ui-round17',tick:snapshot.tick,floor:snapshot.floor,source:'unaltered DungeonRuntime publicState',
  unitActions:snapshot.units.map(u=>({id:u.id,kind:u.kind,action:u.action,alive:u.hp>0})),
  groundSignals:d.groundSignals,webgl:d.webgl,drawCalls:d.drawCalls,triangles:d.triangles,composition:d.composition
 },null,2)),contentType:'application/json'});
});
