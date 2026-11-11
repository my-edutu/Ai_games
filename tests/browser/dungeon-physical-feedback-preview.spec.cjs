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
    if(victims.length){
     // Continue only real DungeonRuntime.step() outcomes. Holding a single
     // HP-delta pair for 70s triggers the genuine stream-stall watchdog
     // and cannot test subsequent attack / original foley presentation.
     const followups=[];
     for(let i=0;i<180;i++)followups.push(game.step());
     return{seed,before,after,victimIds:victims.map(x=>x.id),followups};
    }
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
  // Missing from the static serving allowlist until the D04 real-browser
  // trace caught a 404; an absent ESM dependency prevents renderer startup.
  '/dungeon/warden-warning-lifecycle.js',
  '/dungeon/original-combat-foley.js',
  '/dungeon/physical-combat-feedback.js'
 ])expect((await request.get(endpoint)).status(),endpoint).toBe(200);
 const real=witnessActualDamage();
 const errors=[],stream=[real.before,real.after,...real.followups];
 let cursor=0,ceiling=0;
 page.on('pageerror',e=>errors.push(String(e)));
 // Every response is one consecutive authentic authority snapshot. A gate
 // keeps the verified HP transition readable before releasing the followups.
 await page.route('**/dungeon/state',route=>{
  const index=Math.min(cursor,ceiling);
  const snapshot=stream[index];
  if(cursor<ceiling)cursor++;
  return route.fulfill({json:snapshot});
 });
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
 ceiling=1;
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick),
   {timeout:70000}).toBe(real.after.tick);
 const atDamage=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(atDamage.renderedState.checksum).toBe(real.after.checksum);
 // Release authentic subsequent activity instead of synthesizing repeated
 // snapshots that stall the stream. Old cues remain subject to the 400ms
 // deadline; a stalled frame must never invent a late impact.
 ceiling=stream.length-1;
 try{
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback?.visualAccepted??0),
    {timeout:70000}).toBeGreaterThan(0);
 }finally{
  const diagnostic=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  await test.info().attach('d04-real-stream-debug.json',{
   body:Buffer.from(JSON.stringify({seed:real.seed,victims:real.victimIds,
    beforeTick:real.before.tick,damageTick:real.after.tick,
    delivered:cursor,allowed:ceiling,atDamage:atDamage?.physicalFeedback,
    latest:diagnostic?.physicalFeedback,rendered:diagnostic?.renderedState,
    lastPageErrors:errors.slice(-6)},null,2)),contentType:'application/json'
  });
 }
 const observed=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(observed.physicalFeedback.visuals.active).toBeLessThanOrEqual(104);
 expect(observed.physicalFeedback.visuals.activeDrawCalls).toBeLessThanOrEqual(7);
 expect(observed.physicalFeedback.adapterFailures).toBe(0);
 expect([...atDamage.physicalFeedback.recentDeliveryReceipts,
  ...observed.physicalFeedback.recentDeliveryReceipts].some(x=>
  x.kind==='damage'||x.kind==='damage-fatal')).toBe(true);
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
  checksum:real.after.checksum,optedIn,authenticFollowupSteps:real.followups.length,
  originalDamageFrame:atDamage?.renderedState,continuouslyDelivered:cursor,
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