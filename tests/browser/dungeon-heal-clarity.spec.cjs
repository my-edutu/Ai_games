'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function genuineHeal(){
 for(const seed of ['visual-room-art-18','dungeon-ui-round17','ashen-dungeon','healing-clarity-31']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let i=0;i<1100;i++){
   const after=game.step();
   if(after.units.some(u=>u.kind==='mystic'&&u.hp>0&&u.action==='cast')&&
    after.events.some(e=>e.kind==='healing'&&e.tick===after.tick))return{seed,before,after};
   before=after;
  }
 }
 throw Error('No real, same-tick mystic heal in the declared authority campaign');
}
test('real WebGL healer casts do not depict a damaging bolt aimed at an enemy',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/combat-intent-plan.js')).status()).toBe(200);
 const frames=genuineHeal();let current=frames.before;const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl??false),{timeout:60000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:30000}).toBeGreaterThanOrEqual(3);
 current=frames.after;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStage?.healingCues??0),{timeout:20000}).toBeGreaterThanOrEqual(1);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.combatStage.activeHitFlashes).toBeGreaterThanOrEqual(0);
 expect(d.combatStage.activeHitFlashes).toBeLessThanOrEqual(24);
 expect(d.combatStage.pendingCues).toBeLessThanOrEqual(24);
 expect(d.composition.visibleHeroes).toBeGreaterThanOrEqual(1);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-healing-clarity-round31-real-webgl.png'});
 await test.info().attach('authoritative-healing-cue',{body:Buffer.from(JSON.stringify({
  seed:frames.seed,tick:frames.after.tick,source:'real DungeonRuntime.step()',
  event:frames.after.events.find(e=>e.kind==='healing'&&e.tick===frames.after.tick),
  diagnostic:d.combatStage,authored3D:d.authored3D,composition:d.composition
 },null,2)),contentType:'application/json'});
});
