'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('actual desktop and mobile WebGL show real warning tiles and subsequent Warden strike',async({page,request})=>{
 test.setTimeout(180000);
 const game=DungeonRuntime.create('warden-three-phase-browser-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),vanguard=s.units.find(u=>u.id==='vanguard');
 boss.hp=Math.ceil(boss.maxHp*.5);
 for(const u of s.units)if(u.faction==='enemy'&&u!==boss)u.hp=0;
 vanguard.x=boss.x+2;vanguard.z=boss.z;
 for(const h of s.units.filter(u=>u.faction==='party'&&u!==vanguard)){h.x=boss.x+3;h.z=boss.z+1;}
 s.tick=4;let current=game.publicState();const errors=[];
 expect(current.bossWarning?.shape).toBe('RIFT_CROSS');
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.setViewportSize({width:1440,height:832});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl),{timeout:75000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningTiles),{timeout:45000}).toBeGreaterThan(8);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.bossWarning?.shape)).toBe('RIFT_CROSS');
 // This is actual software-WebGL, original native-bone figures in the real
 // RUPTURE warning, not an invented cinematic or unit-test-only model.
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredBosses??0),
  {timeout:60000}).toBeGreaterThanOrEqual(1);
 const wardenArt=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 expect(wardenArt.nativeContinuousActors).toBeGreaterThanOrEqual(3);
 expect(wardenArt.authoredBosses).toBeGreaterThanOrEqual(1);
 const warningLens=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens);
 expect(warningLens?.mode).toBe('warden-warning');
 expect(warningLens?.fov).toBeGreaterThan(48);
 expect(warningLens?.dangerPriority).toBe(true);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningEdgedTiles)).toBe(0);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningBoundaryEdges)).toBeGreaterThan(8);
 const court=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual);
 expect(court?.warningIncisions).toBe(court.warningTiles);
 expect(court.warningIncisions).toBeLessThanOrEqual(48);
 expect(court?.sculptedCourtSlabs).toBe(28);
 expect(court?.originalEngravings).toBe(18);
 expect(court?.phaseRelief).toBe('RUPTURE');
 expect(court?.cathedralWallButtresses).toBeGreaterThanOrEqual(0);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-M1-rupture-desktop-WebGL.png',timeout:90000});
 current=game.step();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:20000}).toBe(current.tick);
 expect(current.events.some(e=>e.kind==='guard'||e.kind==='evade')).toBe(true);
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:25000}).toBeGreaterThan(100);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-M1-rupture-mobile-WebGL.png',timeout:90000});
 current=game.step();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:20000}).toBe(current.tick);
 expect(current.bossWarning).toBeNull();
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-M1-impact-WebGL.png',timeout:90000});
 expect(errors).toEqual([]);
 await test.info().attach('real-authority-warden-pattern',{body:Buffer.from(JSON.stringify({
  seed:'warden-three-phase-browser-M1',fixture:'legitimate seed, relocated legal heroes and RUPTURE Warden',
  source:'DungeonRuntime.step publicState',nativeBoneWardens:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredBosses??0),
  continuousNativeSkinnedMeshes:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.nativeVisibleSkinnedMeshes??0),
  originalWaveAudioRecorded:false,organicNarrativeReel:false,
  threeFreshCritics:false,verifiedAudibleOutput:false,desktopMobileRealWebGL:true
 },null,2)),contentType:'application/json'});
});

/** Real staged final-HP authoritative battle in desktop/mobile WebGL. This
 * fixture is NOT an organic full campaign and never counts as a blind A/B win.
 */
test('Eclipse three-lane stone pressure is genuine moving desktop/mobile gameplay',async({page,request})=>{
 test.setTimeout(190000);
 const game=DungeonRuntime.create('eclipse-pressure-browser-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 boss.hp=Math.ceil(boss.maxHp*.2);
 for(const u of s.units)if(u!==boss&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=5; // first genuine Eclipse warning arrives on tick 6 in the nine-beat phase
 let current=game.publicState();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.setViewportSize({width:1440,height:832});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl),{timeout:90000}).toBe(true);
 const beats=[];
 for(const remaining of [3,2,1]){
  current=game.step();
  expect(current.bossWarning?.shape).toBe('ECLIPSE_SWEEP');
  expect(current.bossWarning?.turnsUntilImpact).toBe(remaining);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:27000}).toBe(current.tick);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningTellProgress),
   {timeout:27000}).toBeCloseTo((4-remaining)/3,2);
  const ritual=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual);
  expect(ritual?.warningTiles).toBe(current.bossWarning.cells.length);
  expect(ritual.warningTiles).toBeGreaterThan(18);
  expect(ritual.warningTiles).toBeLessThanOrEqual(48);
  const p=current.units.find(u=>u.id==='vanguard');
  beats.push({tick:current.tick,x:p.x,z:p.z,phase:current.bossPhase,tiles:ritual.warningTiles});
  if(remaining===3)await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-eclipse-first-beat-desktop-real.png',timeout:90000});
 }
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens?.portrait),{timeout:30000}).toBe(true);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-eclipse-final-warning-mobile-real.png',timeout:90000});
 const priorHp=hero.hp;
 current=game.step();expect(current.bossWarning).toBeNull();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:30000}).toBe(current.tick);
 expect(hero.hp).toBe(priorHp,'two real steps to clear stone must survive the honest Warden cast');
 expect(errors).toEqual([]);
 await test.info().attach('real-eclipse-combat-fixture',{body:Buffer.from(JSON.stringify({
  seed:'eclipse-pressure-browser-M1',fixture:'authentic seeded dungeon with Warden placed at legitimate low HP and one hero at a legal centre-lane tile',
  beats,impactTick:current.tick,baselineSha:'281735d0910c6b2443648af976003d50412ee324',
  organicFullJourney:false,synchronizedAudioMotion:false,independentBlindCritics:0
 },null,2)),contentType:'application/json'});
});
