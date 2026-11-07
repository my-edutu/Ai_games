'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

// Use a genuine deterministic authority frame, never a hand-written scene or
// a synthetic combat action. The 3D renderer consumes the normal publicState.
function authenticCombatFrame(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let step=0;step<900;step++){
  const state=game.step();
  const seenAttack=state.units.some(u=>u.faction==='party'&&u.hp>0&&u.action==='attack'&&
   state.units.some(v=>v.faction==='enemy'&&(v.hp>0||v.action==='hurt')&&
    Math.abs(v.x-u.x)+Math.abs(v.z-u.z)===1));
  if(seenAttack)return state;
 }
 throw Error('The deterministic replay never produced a visible adjacent party strike');
}
test('real rigged combatants physically turn toward a witnessed autonomous strike',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/facing-plan.js')).status()).toBe(200);
 const snapshot=authenticCombatFrame();
 const failures=[];page.on('pageerror',error=>failures.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:45000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatFacingActors??0),{timeout:30000}).toBeGreaterThanOrEqual(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.alignedCombatActors??0),{timeout:30000}).toBeGreaterThanOrEqual(1);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(diag.alignedCombatActors).toBeLessThanOrEqual(diag.combatFacingActors);
 expect(failures).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-facing-round21-world-only.png'});
 await test.info().attach('actual-turning-combat-frame',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,run:snapshot.run,floor:snapshot.floor,
  actions:snapshot.units.filter(u=>u.action==='attack').map(u=>({id:u.id,x:u.x,z:u.z,actionTick:u.actionTick})),
  diagnostic:{combatFacingActors:diag.combatFacingActors,alignedCombatActors:diag.alignedCombatActors,
   authored3D:diag.authored3D,composition:diag.composition,drawCalls:diag.drawCalls,triangles:diag.triangles}
 },null,2)),contentType:'application/json'});
});
