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
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicShot?.mode)).toBe('warden-warning');
 const warningLens=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens);
 expect(warningLens?.mode).toBe('warden-warning');
 expect(warningLens?.fov).toBeGreaterThan(48);
 expect(warningLens?.dangerPriority).toBe(true);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.warningEdgedTiles)).toBeGreaterThan(8);
 const court=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual);
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
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicLens?.portrait),{timeout:25000}).toBe(true);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-M1-rupture-mobile-WebGL.png',timeout:90000});
 current=game.step();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:20000}).toBe(current.tick);
 expect(current.bossWarning).toBeNull();
 await page.locator('#world').screenshot({path:'artifacts/dungeon-warden-M1-impact-WebGL.png',timeout:90000});
 expect(errors).toEqual([]);
 await test.info().attach('real-authority-warden-pattern',{body:Buffer.from(JSON.stringify({
  seed:'warden-three-phase-browser-M1',fixture:'legitimate seed, relocated legal heroes and RUPTURE Warden',
  source:'DungeonRuntime.step publicState',organicNarrativeReel:false,
  threeFreshCritics:false,verifiedAudibleOutput:false,desktopMobileRealWebGL:true
 },null,2)),contentType:'application/json'});
});
