'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

/** The only frames staged below come from consecutive real authority steps. */
function witnessRealFinalBlow(){
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-1','gauntlet-corpus-v1-2','warden-seal-v1']){
  const game=DungeonRuntime.create(seed);let previous=game.publicState();
  for(let i=0;i<1500;i++){
   const after=game.step();
   if(after.run!==previous.run||after.floor!==previous.floor){previous=after;continue}
   const victim=after.units.find(u=>u.faction==='enemy'&&u.hp===0&&
    previous.units.some(old=>old.id===u.id&&old.hp>0)&&
    after.units.some(hero=>hero.faction==='party'&&hero.hp>0&&
     hero.targetId===u.id&&hero.actionTick===after.tick&&['attack','cast'].includes(hero.action)));
   if(victim)return{seed,before:previous,after,victim:victim.id};
   previous=after;
  }
 }
 throw Error('A real, same-tick AI-driven final blow was not found; do not fake a death frame');
}
test('actual WebGL damage and final blow visibly change actor body pose, then clear',async({page,request})=>{
 test.setTimeout(180000);
 expect((await request.get('/dungeon/impact-choreography-plan.js')).status()).toBe(200);
 const witnessed=witnessRealFinalBlow();
 let served=witnessed.before;const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:served}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-real-final-blow-before-world-only.png'});
 const initial=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 served=witnessed.after;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.damageChoreography?.observedFatalBeats??0),{timeout:20000}).toBeGreaterThanOrEqual(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.damageChoreography?.visibleFallen??0),{timeout:20000}).toBeGreaterThanOrEqual(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.damageChoreography?.maxFallenPitch??0),{timeout:80000}).toBeGreaterThan(.3);
 const actual=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-real-final-blow-collapse-world-only.png'});
 expect(actual.damageChoreography.maxFallenPitch).toBeLessThanOrEqual(1.5);
 expect(actual.damageChoreography.observedDamageBeats).toBeGreaterThanOrEqual(1);
 expect(actual.damageChoreography.visibleFallen).toBeGreaterThanOrEqual(1);
 expect(actual.composition.visibleHeroes).toBeGreaterThan(0);
 expect(actual.authored3D.proceduralFallbacks).toBe(0);
 expect(errors).toEqual([]);
 await test.info().attach('truthful-final-blow-3d-snapshot',{body:Buffer.from(JSON.stringify({
  source:'real DungeonRuntime.step() publicState; not a synthetic hit',
  seed:witnessed.seed,run:witnessed.after.run,floor:witnessed.after.floor,
  beforeTick:witnessed.before.tick,afterTick:witnessed.after.tick,victim:witnessed.victim,
  initial:{camera:initial.camera,composition:initial.composition},
  actual:{camera:actual.camera,composition:actual.composition,damage:actual.damageChoreography,
   ritual:actual.wardenRitual,drawCalls:actual.drawCalls,triangles:actual.triangles}
 },null,2)),contentType:'application/json'});
});
