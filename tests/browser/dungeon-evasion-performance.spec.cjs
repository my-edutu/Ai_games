'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
async function findAuthenticHeroEscape(){
 const src=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/evasion-performance-plan.js'),'utf8');
 const {planAuthorityEvasions:plan}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 for(let i=0;i<24;i++){
  const seed='gauntlet-corpus-v1-'+i,game=DungeonRuntime.create(seed);let before=game.publicState();
  for(let k=0;k<950;k++){
   const after=game.step(),beats=plan(before,after);
   if(beats.length)return {seed,before,after,beats};
   before=after;
  }
 }
 throw Error('24 x 950 real-authority ticks yielded no witnessed lawful hero dodge');
}
for(const width of [1440,390]){
 test('real '+width+'px WebGL hero sidestep bends imported skeleton and plants true touchdown dust',async({page,request})=>{
  test.setTimeout(150000);
  await page.setViewportSize({width,height:width===390?844:832});
  expect((await request.get('/dungeon/evasion-performance-plan.js')).status()).toBe(200);
  const frames=await findAuthenticHeroEscape();let current=frames.before;
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
  await page.goto('/dungeon');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
  current=frames.after;
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.evasionPoseActors??0),{intervals:[60,120,200],timeout:25000}).toBeGreaterThan(0);
  const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(d.combatStage.trueEvadeCues).toBeGreaterThan(0);
  expect(d.combatStage.activeEvadeDust).toBeLessThanOrEqual(24);
  expect(d.authored3D.missingAssets).toBe(0);
  expect(d.composition.visibleHeroes).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
  await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-authentic-evasion-'+width+'.png',timeout:60000});
  await test.info().attach('true-authority-dodge-'+width,{contentType:'application/json',body:Buffer.from(JSON.stringify({
   source:'actual unmodified DungeonRuntime.step publicState',seed:frames.seed,tick:frames.after.tick,
   beats:frames.beats,character:d.authored3D,combat:d.combatStage,visible:d.composition,drawCalls:d.drawCalls},null,2))});
 });
}
