'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function witnessedAction(){
 const game=DungeonRuntime.create('visual-room-art-18');
 let before=game.publicState();
 for(let i=0;i<900;i++){
  const after=game.step();
  const attack=after.units.find(u=>u.faction==='party'&&u.hp>0&&u.action==='attack'&&
   before.units.some(old=>old.id===u.id&&old.actionTick!==u.actionTick));
  if(attack)return{before,after,attacker:attack.id};
  before=after;
 }
 throw Error('No real public authority-frame attack transition in the seed campaign');
}
test('actual WebGL GLB rigs have bounded secondary attack staging, without invented actions',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/character-motion-plan.js')).status()).toBe(200);
 expect((await request.get('/dungeon/combat-cue-plan.js')).status()).toBe(200);
 const frames=witnessedAction();let current=frames.before;
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authoredMotionPivots??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:30000}).toBeGreaterThanOrEqual(3);
 current=frames.after;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authoredCombatPoseActors??0),{timeout:15000}).toBeGreaterThanOrEqual(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authoredMotionPeak??0),{intervals:[40,50,80,100],timeout:8000}).toBeGreaterThan(.025);
 // The first real authoritative attack must release its visual cue after the
 // actor's visible anticipation, not at the start of the action snapshot.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStage?.releasedCues??0),{timeout:18000}).toBeGreaterThan(0);
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.combatStage.contactLockedCues).toBeGreaterThan(0);
 expect(diag.combatStage.disarmCues).toBeGreaterThanOrEqual(0);
 expect(diag.combatStage.suppressedUnmatchedCues).toBeGreaterThanOrEqual(0);
 expect(diag.combatStage.pendingCues).toBeGreaterThanOrEqual(0);
 expect(diag.combatStage.pendingCues).toBeLessThanOrEqual(24);
 expect(diag.combatStage.droppedCues).toBe(0);
 expect(diag.combatStage.activeHitFlashes).toBeLessThanOrEqual(24);
 expect(diag.authoredMotionMaxOffset).toBeLessThanOrEqual(.20);
 expect(diag.authoredMotionPeak).toBeLessThanOrEqual(.20);
 // Genuine imported arm bones must move under one real authoritative attack,
 // with bounded local joint angles, not a screenshot-only faux model.
 expect(diag.authored3D.rigGestureBones).toBeGreaterThanOrEqual(3);
 expect(diag.authored3D.rigGesturePeakRad).toBeGreaterThan(.15);
 expect(diag.authored3D.rigGesturePeakRad).toBeLessThanOrEqual(.43);
 expect(diag.composition.visibleHeroes).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-combat-clarity-round30-world-only.png'});
 await test.info().attach('real-action-motion-review',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:frames.after.tick,run:frames.after.run,attacker:frames.attacker,
  sourcedFrom:'actual DungeonRuntime.step publicState',diagnostic:{
   authoredMotionPivots:diag.authoredMotionPivots,authoredCombatPoseActors:diag.authoredCombatPoseActors,
   authoredMotionPeak:diag.authoredMotionPeak,authoredMotionMaxOffset:diag.authoredMotionMaxOffset,
   authored3D:diag.authored3D,combatStage:diag.combatStage,composition:diag.composition,drawCalls:diag.drawCalls,triangles:diag.triangles}
 },null,2)),contentType:'application/json'});
});
