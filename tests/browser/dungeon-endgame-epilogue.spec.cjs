'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});

/**
 * Real seeded autonomous expedition, no forced damage, death, loss or floor
 * advance. The final genuine public authority snapshot feeds real browser
 * Three.js WebGL on two aspect ratios. Not a continuous matched M1 film.
 */
test('organic campaign death remains a legible 3D last stand on real desktop and mobile',async({page})=>{
 test.setTimeout(210000);
 // 92b06b2's actual 24-seed / 900-tick replay corpus recorded a genuine
 // death for seed 0 (one of six authentic restarts). The old UI seed survived
 // 2,500 ticks, so it cannot be used as a guaranteed natural last-stand fixture.
 const seed='gauntlet-corpus-v1-0',runtime=DungeonRuntime.create(seed);
 let terminal=null,combat=0;const floors=new Set();
 for(let i=0;i<2500;i++){
  const s=runtime.step();floors.add(s.floor);
  if(s.events.some(e=>e.kind==='danger'||e.kind==='combat'))combat++;
  if(s.phase==='intermission'){terminal=s;break;}
 }
 expect(terminal,'this seed must reach actual autonomous defeat without a scripted result').toBeTruthy();
 expect(terminal.units.filter(u=>u.faction==='party'&&u.hp>0)).toHaveLength(0);
 expect(floors.size).toBeGreaterThan(1);
 expect(combat).toBeGreaterThan(0);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:terminal}));
 await page.setViewportSize({width:1440,height:832});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),
  {timeout:90000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicShot?.mode),
  {timeout:90000}).toBe('last-stand');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.lastStandBodies),
  {timeout:45000}).toBe(3);
 // This MUST inspect actual imported skinned body joints, not just a flat defeat-card image.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.skinnedDefeatActors??0),
  {timeout:90000}).toBeGreaterThan(0);
 await expect(page.locator('#run-result')).toBeVisible();
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-natural-last-stand-desktop-real.png',timeout:90000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens?.portrait),
  {timeout:60000}).toBe(true);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-natural-last-stand-mobile-real.png',timeout:90000});
 await test.info().attach('natural-terminal-authority-audit',{body:Buffer.from(JSON.stringify({
  seed,authoritativeSource:'actual production DungeonRuntime.step() naturally reached loss',
  tick:terminal.tick,run:terminal.run,floor:terminal.floor,distinctFloors:floors.size,
  combatSnapCount:combat,deadHeroCount:3,
  skinnedDefeatActors:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.skinnedDefeatActors??0),
  baselineSha:'281735d0910c6b2443648af976003d50412ee324',
  matchedFullBeforeAfter:false,originalAudioMotionCaptured:false,independentCritics:false
 },null,2)),contentType:'application/json'});
 expect(pageErrors).toEqual([]);
});
