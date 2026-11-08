'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});
async function pinRealRun(page,{seed='dungeon-ui-round17',ticks=18,size={width:390,height:844}}={}){
 const game=DungeonRuntime.create(seed);for(let i=0;i<ticks;i++)game.step();
 const snapshot=game.publicState();
 await page.setViewportSize(size);
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:30000}).toBeGreaterThan(2);
 return snapshot;
}

test('390px world-first party strip stays grounded in real health and preserves focus',async({page})=>{
 const state=await pinRealRun(page);
 await expect(page.locator('#loading-state')).toBeHidden();
 const quick=page.locator('#spectator-quickbar button');
 await expect(quick).toHaveCount(3);
 const heroes=state.units.filter(u=>u.faction==='party');
 for(const hero of heroes){
  const button=page.locator('#spectator-quickbar [data-hero-id="'+hero.id+'"]');
  await expect(button).toContainText(hero.hp+'/'+hero.maxHp);
 }
 const world=await page.locator('#world').boundingBox();
 expect(world.height).toBeGreaterThanOrEqual(500);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 const before=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum);
 const follow=page.locator('#spectator-quickbar [data-hero-id="ranger"]');
 await follow.click();
 await expect(follow).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#director-toggle')).toHaveAttribute('aria-pressed','false');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.focusedHeroId),{timeout:15000}).toBe('ranger');
 expect(await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum)).toBe(before);
 await expect(follow).toBeFocused();
 await page.screenshot({path:'artifacts/dungeon-spectator-mobile-real-state.png',fullPage:true});
});

test('mobile renderer stage size is independent of combat/warden HUD status',async({page})=>{
 await pinRealRun(page);
 const heights=await page.evaluate(()=>{
  const el=document.querySelector('#world');
  const h=()=>Math.round(el.getBoundingClientRect().height);
  document.body.dataset.encounterStage='exploration';const exploration=h();
  document.body.dataset.encounterStage='combat';const combat=h();
  document.body.dataset.encounterStage='warden';const warden=h();
  return {exploration,combat,warden};
 });
 expect(heights.combat).toBe(heights.exploration);
 expect(heights.warden).toBe(heights.exploration);
 await page.locator('#hud-toggle').click();
 await expect(page.locator('#spectator-quickbar')).toBeHidden();
 await page.locator('#hud-toggle').click();
 await expect(page.locator('#spectator-quickbar')).toBeVisible();
});

test('desktop HUD does not cover arena centre and journal restores focus',async({page})=>{
 await pinRealRun(page,{size:{width:1440,height:900}});
 await expect(page.locator('#spectator-quickbar')).toBeHidden();
 const center=await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2)?.id);
 expect(['world','battle-overlay']).toContain(center);
 await page.keyboard.press('j');
 await expect(page.locator('#journal-dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#journal-toggle')).toBeFocused();
 await page.screenshot({path:'artifacts/dungeon-spectator-desktop-real-state.png'});
});

test('a genuinely advancing stream generates an unmodified 390px running-game capture',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??-1),{timeout:20000}).toBeGreaterThanOrEqual(1);
 const before=await page.evaluate(()=>({tick:window.__DUNGEON_PUBLIC_STATE__.tick,run:window.__DUNGEON_PUBLIC_STATE__.run}));
 await expect.poll(()=>page.evaluate(({tick,run})=>{
  const s=window.__DUNGEON_PUBLIC_STATE__;
  return s?.run>run||(s?.run===run&&s?.tick>=tick+2);
 },before),{timeout:20000}).toBe(true);
 await expect(page.locator('#spectator-quickbar button')).toHaveCount(3);
 await page.screenshot({path:'artifacts/dungeon-spectator-mobile-live.png',fullPage:true});
});

test('real Warden warning stays visible on 390px even when ordinary objective is suppressed',async({page})=>{
 const game=DungeonRuntime.create('warden-counterwindow-browser-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 expect(boss).toBeTruthy();expect(hero).toBeTruthy();
 // Controlled setup; the snapshot is still computed by the real DungeonRuntime,
 // not a fabricated UI state or fake attack message.
 for(const u of s.units)if(u.faction==='enemy'&&u!==boss||u.faction==='party'&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=5;
 expect(s.map[hero.z][hero.x]).toBe('.');
 const snapshot=game.publicState();
 expect(snapshot.bossWarning?.cells.length).toBeGreaterThan(0);
 await page.setViewportSize({width:390,height:844});
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:30000}).toBe(5);
 await expect(page.locator('body')).toHaveAttribute('data-warden-focus','true');
 await expect(page.locator('.arena-lower')).toBeHidden();
 await expect(page.locator('#danger-readout')).toBeVisible();
 await expect(page.locator('#danger-title')).toHaveText('WARDEN WARNING');
 await expect(page.locator('#boss-phase')).toHaveText('WARDEN WARNING');
 await expect(page.locator('#danger-detail')).toContainText('impact in 1 turn');
 const stage=await page.locator('.arena').boundingBox();
 const notice=await page.locator('#danger-readout').boundingBox();
 expect(notice.y).toBeGreaterThan(stage.y+150);
 expect(notice.x+notice.width).toBeLessThanOrEqual(stage.x+stage.width);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'artifacts/dungeon-spectator-warden-mobile-real.png',fullPage:true});
});

test('actual public snapshot provides exact floor enemies, active traps and exit availability',async({page})=>{
 const s=await pinRealRun(page);
 const foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 const traps=s.traps.filter(t=>t.active&&!t.disarmed).length;
 await expect(page.locator('#hostiles-left')).toHaveText(String(foes));
 await expect(page.locator('#hazards-active')).toHaveText(String(traps));
 await expect(page.locator('#portal-status')).toHaveText(foes?'PORTAL SEALED':'PORTAL AVAILABLE');
 await expect(page.locator('#expedition-objective')).toHaveText(
  foes?'Defeat remaining enemies':'Reach the portal to descend'
 );
 // Numeric counts remain available even when the minimap is closed.
 await expect(page.locator('.map-panel')).toBeHidden();
 await expect(page.locator('.depth-track')).toBeHidden();
});

test('keyboard H preserves focus from a selected mobile hero',async({page})=>{
 await pinRealRun(page);
 const follow=page.locator('#spectator-quickbar [data-hero-id="ranger"]');
 await follow.focus();
 await expect(follow).toBeFocused();
 await page.keyboard.press('h');
 await expect(page.locator('body')).toHaveAttribute('data-hud','clean');
 await expect(page.locator('#hud-toggle')).toBeFocused();
 await page.keyboard.press('h');
 await expect(page.locator('body')).toHaveAttribute('data-hud','visible');
 await expect(page.locator('#spectator-quickbar')).toBeVisible();
});

test('a genuine recent authority outcome is shown as a small history note, not a false tactical alert',async({page})=>{
 const game=DungeonRuntime.create('dungeon-ui-round17');
 const kinds=new Set(['floor','defeat','kill','loot','healing','phase','cover','block','interrupt','disarm','trap','danger','opening','summon','restart']);
 let snapshot,event;
 for(let i=0;i<750;i++){
  snapshot=game.step();
  event=[...snapshot.events].reverse().find(e=>e.tick===snapshot.tick&&kinds.has(e.kind));
  if(event)break;
 }
 expect(event,'actual deterministic authority produced a meaningful event').toBeTruthy();
 await page.setViewportSize({width:390,height:844});
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??-1),{timeout:30000}).toBe(snapshot.tick);
 await expect(page.locator('#quick-outcome')).toBeVisible();
 await expect(page.locator('#outcome-text')).toContainText(event.text.slice(0,40));
 await expect(page.locator('#assistive-announcement')).toBeEmpty();
 await page.screenshot({path:'artifacts/dungeon-spectator-recent-outcome-mobile.png',fullPage:true});
});

test('a real Warden cast is labelled as released, not falsely confirmed as landed',async({page})=>{
 const game=DungeonRuntime.create('warden-counterwindow-browser-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const u of s.units)if(u.faction==='enemy'&&u!==boss||u.faction==='party'&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=5;
 expect(s.map[hero.z][hero.x]).toBe('.');
 let snapshot=game.publicState();
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:30000}).toBe(5);
 snapshot=game.step();
 expect(snapshot.bossRecovery?.remaining).toBe(2);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:30000}).toBe(6);
 await expect(page.locator('#boss-phase')).toHaveText('STRIKE RELEASED');
 await expect(page.locator('#boss-phase')).not.toContainText('LANDED');
 await expect(page.locator('#danger-title')).toHaveText('WARDEN STRIKE');
 await page.screenshot({path:'artifacts/dungeon-spectator-warden-release-real.png'});
});

test('disconnect remains visible until a new authentic state tick proves recovery',async({page})=>{
 const game=DungeonRuntime.create('dungeon-ui-round17');for(let i=0;i<18;i++)game.step();
 let snapshot=game.publicState(),offline=false;
 await page.route('**/dungeon/state',route=>offline?
  route.fulfill({status:503,json:{error:'unavailable'}}):route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:30000}).toBe(snapshot.tick);
 offline=true;
 await expect(page.locator('#recovery')).toBeVisible({timeout:12000});
 await expect(page.locator('body')).toHaveAttribute('data-stream-connection','reconnecting');
 offline=false;
 // HTTP 200 from a stale replica is not a recovered autonomous expedition.
 await expect(page.locator('#recovery')).toBeVisible();
 snapshot=game.step();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBe(snapshot.tick);
 await expect(page.locator('#recovery')).toBeHidden();
 await expect(page.locator('body')).toHaveAttribute('data-stream-connection','live');
});

test('original audio is never started by a page reload',async({page})=>{
 await pinRealRun(page,{size:{width:390,height:844}});
 const audio=page.locator('#audio-toggle');
 await expect(audio).toHaveAttribute('aria-pressed','false');
 await audio.click();
 if(await audio.getAttribute('aria-pressed')==='true')await audio.click();
 await expect(audio).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>localStorage.getItem('edutu-dungeon-audio-muted'))).toBe('true');
 await page.reload();
 await expect(audio).toHaveAttribute('aria-pressed','false');
 await expect(audio).toHaveAccessibleName(/enable original dungeon audio/i);
});

test('320px narrow phone preserves every 44px control without horizontal scroll',async({page})=>{
 await pinRealRun(page,{size:{width:320,height:740}});
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(width).toBeLessThanOrEqual(320);
 const header=await page.locator('.masthead').boundingBox();
 expect(header.height).toBeGreaterThanOrEqual(155);
 for(const id of ['director-toggle','view-toggle','fx-toggle','audio-toggle',
  'map-toggle','journal-toggle','hud-toggle']){
  const bounds=await page.locator('#'+id).boundingBox();
  expect(bounds.width,id).toBeGreaterThanOrEqual(44);
  expect(bounds.height,id).toBeGreaterThanOrEqual(44);
 }
 await page.screenshot({path:'artifacts/dungeon-spectator-320px-real.png',fullPage:true});
});
