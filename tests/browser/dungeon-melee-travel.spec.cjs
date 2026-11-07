'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

async function witnessedAdjacentMelee(){
 const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/facing-plan.js'),'utf8');
 const {planVisualContact}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-1']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let i=0;i<1300;i++){
   const after=game.step();
   const attacker=after.units.find(u=>u.hp>0&&['vanguard','revenant','warden'].includes(u.kind)&&
    u.action==='attack'&&before.units.some(old=>old.id===u.id&&old.actionTick!==u.actionTick)&&
    planVisualContact(u,after)?.distance===1);
   if(attacker&&before.run===after.run&&before.floor===after.floor)
    return {seed,before,after,attacker:attacker.id};
   before=after;
  }
 }
 throw Error('No genuine adjacent physical attack transition in the deterministic campaign');
}

test('real WebGL advances its weapon crescent through a sourced adjacent strike without inventing ranger sword arcs',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/melee-arc-plan.js')).status()).toBe(200);
 const frames=await witnessedAdjacentMelee();let current=frames.before;
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 current=frames.after;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStage?.totalMeleeArcs??0),{timeout:30000}).toBeGreaterThanOrEqual(1);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.webgl).toBe(true);
 expect(d.combatStage.totalMeleeArcs).toBeGreaterThan(0);
 expect(d.combatStage.activeMeleeArcs).toBeLessThanOrEqual(24);
 expect(d.combatStage.droppedCues).toBe(0);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-melee-travel-round57-world-only.png',timeout:60000});
 await test.info().attach('real-weapon-lane-seed-evidence',{body:Buffer.from(JSON.stringify({
  seed:frames.seed,tick:frames.after.tick,run:frames.after.run,floor:frames.after.floor,
  attacker:frames.attacker,source:'unaltered DungeonRuntime.step publicState',
  combatStage:d.combatStage,composition:d.composition,drawCalls:d.drawCalls,triangles:d.triangles
 },null,2)),contentType:'application/json'});
});
