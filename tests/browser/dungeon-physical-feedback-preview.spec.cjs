'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

function witnessActualDamage(){
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','dungeon-ui-round17']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let n=0;n<1300;n++){
   const after=game.step();
   if(after.run===before.run&&after.floor===before.floor&&after.tick===before.tick+1){
    const victims=after.units.filter(u=>before.units.some(old=>old.id===u.id&&old.hp>u.hp));
    if(victims.length)return{seed,before,after,victimIds:victims.map(x=>x.id)};
   }
   before=after;
  }
 }
 throw Error('No authentic adjacent DungeonRuntime HP-loss pair found; cannot fake the combat witness');
}

test('D04 gated preview observes genuine public damage, safe effect bounds and render-submitted sound',async({page,request})=>{
 test.setTimeout(240000);
 for(const endpoint of [
  '/dungeon/physical-feedback-plan.js',
  '/dungeon/physical-feedback-visuals.js',
  '/dungeon/original-combat-foley.js',
  '/dungeon/physical-combat-feedback.js'
 ])expect((await request.get(endpoint)).status(),endpoint).toBe(200);
 const real=witnessActualDamage();
 const errors=[];let served=real.before;
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:served}));
 await page.goto('/dungeon?feedback=d04');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.implementation),
  {timeout:90000}).toBe('D04-physical-authority-feedback');
 const initial=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(initial.d04PreviewEnabled).toBe(true);
 expect(initial.physicalFeedback.audioOptedIn).toBe(false,'no autoplay');
 expect(initial.physicalFeedback.visuals.reservedInstances).toBeLessThanOrEqual(104);
 expect(initial.physicalFeedback.visuals.drawCalls).toBeLessThanOrEqual(7);
 expect(initial.soundstage).toBeNull();
 const button=page.locator('#audio-toggle');
 await expect(button).toHaveAttribute('aria-pressed','false');
 await button.click();
 const optedIn=(await button.getAttribute('aria-pressed'))==='true';
 if(optedIn){
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:20000}).toBe(true);
  expect((await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage?.suppressCombat))).toBe(true);
 }
 // This state pair comes ONLY from real seeded DungeonRuntime.step().
 // No hand-edited HP, staged cinematic hit, or synthetic combat action.
 served=real.after;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick),
   {timeout:70000}).toBe(real.after.tick);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.visualAccepted??0),
   {timeout:70000}).toBeGreaterThan(0);
 const observed=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(observed.renderedState.checksum).toBe(real.after.checksum);
 expect(observed.physicalFeedback.visuals.active).toBeLessThanOrEqual(104);
 expect(observed.physicalFeedback.visuals.activeDrawCalls).toBeLessThanOrEqual(7);
 expect(observed.physicalFeedback.adapterFailures).toBe(0);
 expect(observed.physicalFeedback.recentDeliveryReceipts.some(x=>
  x.proof==='observed-hp-drop'||x.kind==='damage'||x.kind==='damage-fatal')).toBe(true);
 if(optedIn){
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.framesAcknowledged??0),
   {timeout:40000}).toBeGreaterThan(0);
  const fresh=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(fresh.physicalFeedback.recentDeliveryReceipts.filter(x=>x.audio).every(x=>
   x.frameId!==null)).toBe(true,'no audio before acknowledged WebGL submission');
 }
 await page.locator('#world').screenshot({path:'artifacts/dungeon-d04-real-combat-world.png'});
 const receipt={
  source:'seeded, actual DungeonRuntime.step -> publicState -> actual Three.js WebGL renderer',
  seed:real.seed,run:real.after.run,floor:real.after.floor,
  beforeTick:real.before.tick,afterTick:real.after.tick,victims:real.victimIds,
  checksum:real.after.checksum,optedIn,
  visual:observed.physicalFeedback.visuals,
  cues:observed.physicalFeedback.recentDeliveryReceipts,
  audio:observed.physicalFeedback.audio,
  evidenceLimit:'render submission receipt is not proof of audio/video sample-level synchronization'
 };
 await test.info().attach('d04-authentic-combat-presentation-receipt.json',{
  body:Buffer.from(JSON.stringify(receipt,null,2)),contentType:'application/json'
 });
 if(optedIn){
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','false');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.audioOptedIn),
   {timeout:20000}).toBe(false);
 }
 expect(errors).toEqual([]);
});