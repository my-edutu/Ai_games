'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

test('real 3D dungeon keeps sound off until gesture and then runs original bounded sound scene',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/soundstage-plan.js')).status()).toBe(200);
 expect((await request.get('/dungeon/soundstage.js')).status()).toBe(200);
 const game=DungeonRuntime.create('dungeon-ui-round17');
 for(let n=0;n<18;n++)game.step();
 let current=game.publicState(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:60000}).toBe(true);
 const sound=page.locator('#audio-toggle');
 await expect(sound).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage)).toBeNull();
 await sound.click();
 const pressed=await sound.getAttribute('aria-pressed');
 expect(['true','false']).toContain(pressed);
 if(pressed==='true'){
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage?.started),{timeout:15000}).toBe(true);
  const base=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(base.soundstage.enabled).toBe(true);
  expect(base.soundstage.engine).toBe('original-synth-web-audio');
  expect(base.soundstage.biome).toBe(0);
  expect(base.soundstage.voiceCap).toBeLessThanOrEqual(10);
  expect(base.soundstage.masterGain).toBeLessThanOrEqual(.15);
  expect(base.soundstage.cuesPlayed).toBeGreaterThanOrEqual(1);
  // Use genuine autonomous advancement, not a hand-authored attack snapshot.
  for(let n=0;n<11;n++)game.step();
  current=game.publicState();
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:20000}).toBe(current.tick);
  const later=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage);
  expect(later.voices).toBeLessThanOrEqual(10);
  expect(later.sceneChanges).toBeGreaterThanOrEqual(1);
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed','false');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage?.enabled),{timeout:12000}).toBe(false);
 }else{
  // Real headless environments without audio devices must fail safely.
  expect((await sound.getAttribute('title'))||'').toMatch(/unavailable|blocked|failed/i);
 }
 expect(pageErrors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-transformation-original-audio-world.png'});
 await test.info().attach('actual-soundstage-browser-audit',{body:Buffer.from(JSON.stringify({
  seed:'dungeon-ui-round17',tick:current.tick,source:'actual DungeonRuntime.step publicState',
  audioButton:pressed,soundstage:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.soundstage||null),
  webgl:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true)
 },null,2)),contentType:'application/json'});
});
