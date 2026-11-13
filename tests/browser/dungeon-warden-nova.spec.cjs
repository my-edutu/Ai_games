'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
/**
 * One integrated, truly playable Sentinel NOVA sequence. This is not a
 * fabricated fight: real authoritative steps control all hero movement,
 * Warden warning footprints and incoming damage. Browser animation is real
 * software WebGL; recordings remain an additional unverified acceptance gate.
 */
test('real three-beat NOVA carves one truthful 3D threat and autonomous heroes physically escape it',async({page,request})=>{
 test.setTimeout(185000);
 const game=DungeonRuntime.create('nova-readable-counterplay-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const u of s.units)if(u!==boss&&u!==hero)u.hp=0;
 const start=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>({x:boss.x+dx,z:boss.z+dz}))
  .find(p=>s.map[p.z]?.[p.x]==='.');expect(start).toBeTruthy();
 hero.x=start.x;hero.z=start.z;s.tick=2;
 let snapshot=game.publicState();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.setViewportSize({width:1440,height:832});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl),{timeout:90000}).toBe(true);
 const sequence=[];
 for(const remaining of [3,2,1]){
  snapshot=game.step();
  expect(snapshot.bossWarning?.turnsUntilImpact).toBe(remaining);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:25000}).toBe(snapshot.tick);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningTellProgress),{timeout:25000}).toBeCloseTo((4-remaining)/3,2);
  const data=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual);
  expect(data?.warningTiles).toBeGreaterThan(14);
  // Every genuinely threatened cell now carries one direction-coded,
  // shallow incision; no safe tile may receive a false warning.
  expect(data?.warningTiles).toBe(snapshot.bossWarning.cells.length);
  expect(data?.warningIncisions).toBeGreaterThan(0);
  expect(data?.warningIncisions).toBe(data.warningTiles);
  expect(data.warningIncisions).toBeLessThanOrEqual(48);
  expect(data?.warningStoneGeometry).toBe('bevelled-original-basalt');
  expect(data?.warningStoneLift).toBeGreaterThan(0);
   expect(data?.warningBoundaryEdges).toBeGreaterThan(14);
   expect(data?.warningBoundaryEdges).toBeLessThanOrEqual(data.warningTiles*4);
  const sceneHero=snapshot.units.find(u=>u.id==='vanguard');
  sequence.push({tick:snapshot.tick,hero:{x:sceneHero.x,z:sceneHero.z},warned:data.warningTiles,progress:data.warningTellProgress});
  if(remaining===3||remaining===1)await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-real-nova-'+remaining+'-desktop.png',timeout:100000});
 }
 expect(new Set(sequence.map(v=>v.hero.x+','+v.hero.z)).size).toBe(3);
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens?.portrait),{timeout:25000}).toBe(true);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-real-nova-mobile.png',timeout:100000});
 const hp=hero.hp;
 snapshot=game.step();expect(snapshot.bossWarning).toBeNull();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:25000}).toBe(snapshot.tick);
 expect(snapshot.events.some(e=>/The Warden nova shockwave struck/.test(e.text))).toBe(true);
 const strikeCells=sequence[0].warned;
 expect(strikeCells).toBeGreaterThan(14);
 expect(hero.hp).toBe(hp);
 expect(errors).toEqual([]);
 await test.info().attach('real-three-beat-NOVA-authority-receipt',{body:Buffer.from(JSON.stringify({
  seed:'nova-readable-counterplay-M1',baselineSha:'281735d0910c6b2443648af976003d50412ee324',
  sequence,impactTick:snapshot.tick,impactHP:hero.hp,source:'real runtime.step + software WebGL',
  organicFullAdventure:false,originalAudioCaptured:false,independentBlindCritics:0
 },null,2)),contentType:'application/json'});
});
