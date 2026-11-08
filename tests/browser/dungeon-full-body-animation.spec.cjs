'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

function witness(accept){
 const game=DungeonRuntime.create('visual-room-art-18');
 let before=game.publicState();
 for(let i=0;i<950;i++){
  const after=game.step();
  const actor=after.units.find(unit=>accept(unit,before,after));
  if(actor)return{before,after,actor,seed:'visual-room-art-18'};
  before=after;
 }
 throw Error('No genuine eligible authority transition in the source seed');
}
const attack=()=>witness((u,before)=>
 u.faction==='party'&&u.hp>0&&u.action==='attack'&&
 before.units.some(old=>old.id===u.id&&old.actionTick!==u.actionTick));
const travel=()=>witness((u,before)=>
 u.faction==='party'&&u.hp>0&&before.units.some(old=>old.id===u.id&&
 (old.x!==u.x||old.z!==u.z)));

async function loadStage(page,snapshot){
 let state=snapshot;
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),
  {timeout:60000}).toBeGreaterThanOrEqual(3);
 return {set(next){state=next},errors};
}

test('real imported rig attack has one named action owner and source-clip audit',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/full-body-animation-controller.js')).status()).toBe(200);
 const event=attack(),stage=await loadStage(page,event.before);
 const original=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(original.authored3D.sourceClipAudits.length).toBeGreaterThanOrEqual(3);
 expect(original.authored3D.sourceClipAudits.some(a=>a.clips.length>0)).toBe(true);
 stage.set(event.after);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyModes?.attack??0),
  {timeout:18000,intervals:[70,90,120,180]}).toBeGreaterThanOrEqual(1);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyInterruptions).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.fullBodyRestarts).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.rigMeleeBones).toBeGreaterThanOrEqual(2);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-attack.png',timeout:60000});
 await test.info().attach('genuine-attack-frame',{contentType:'application/json',body:Buffer.from(JSON.stringify({
  seed:event.seed,tick:event.after.tick,actorId:event.actor.id,
  source:'unmodified DungeonRuntime publicState',headSha:process.env.GITHUB_SHA??null,
  owners:d.authored3D.fullBodyModes,clipAudits:d.authored3D.sourceClipAudits,
  interruptions:d.authored3D.fullBodyInterruptions,restarts:d.authored3D.fullBodyRestarts
 },null,2))});
});

test('real authority movement drives bounded support on original leg bones without fake combat',async({page})=>{
 test.setTimeout(120000);
 const event=travel(),stage=await loadStage(page,event.before);
 stage.set(event.after);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyFootSupportPeakRad??0),
  {timeout:22000,intervals:[70,90,110,140]}).toBeGreaterThan(.003);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyFootSupportPeakRad).toBeLessThanOrEqual(.063);
 expect(d.authored3D.rigGaitBones).toBeGreaterThanOrEqual(4);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.webgl).toBe(true);expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-travel.png',timeout:60000});
 await test.info().attach('genuine-stride-frame',{contentType:'application/json',body:Buffer.from(JSON.stringify({
  seed:event.seed,tick:event.after.tick,actorId:event.actor.id,
  source:'unmodified DungeonRuntime publicState',supportPeak:d.authored3D.fullBodyFootSupportPeakRad,
  gaitBones:d.authored3D.rigGaitBones,owners:d.authored3D.fullBodyModes
 },null,2))});
});
