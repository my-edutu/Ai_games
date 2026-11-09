'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {openOfflineGame}=require('./dungeon-offline-harness.cjs');
const fs=require('node:fs');
fs.mkdirSync('artifacts/session9',{recursive:true});
async function open(page,size={width:390,height:844},providedGame=null){
 if(process.env.DUNGEON_OFFLINE_EVIDENCE==='1'){
  const feed=await openOfflineGame(page,{size,game:providedGame});
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:30000}).toBeGreaterThan(0);
  return feed;
 }
 const game=providedGame||DungeonRuntime.create('dungeon-ui-round17');if(!providedGame)for(let i=0;i<18;i++)game.step();
 let snapshot=game.publicState(),offline=false;const receipts=[];await page.setViewportSize(size);
 await page.route('**/dungeon/state',r=>{if(offline)return r.fulfill({status:503,json:{}});receipts.push(snapshot.checksum);return r.fulfill({json:snapshot})});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:30000}).toBeGreaterThan(0);
 return {game,receipts,setOffline(value){offline=value},get snapshot(){return snapshot},advance(n=1){for(let i=0;i<n;i++)snapshot=game.step();return snapshot},close(){}};
}
async function waitState(page,snapshot){await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.checksum)).toBe(snapshot.checksum)}

test('keyboard hero focus is mirrored immediately without a new authority tick',async({page})=>{
 const feed=await open(page);const checksum=feed.snapshot.checksum;
 await page.keyboard.press('2');
 await expect(page.locator('.hero-card[data-hero-id="ranger"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#spectator-quickbar [data-hero-id="ranger"]')).toHaveAttribute('aria-pressed','true',{timeout:1500});
 expect(await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum)).toBe(checksum);
 feed.close();
});

test('clean view, map and journal never resize the 390px world canvas',async({page})=>{
 const feed=await open(page);const box=await page.locator('#world').boundingBox();
 for(const id of ['hud-toggle','hud-toggle','map-toggle','map-toggle','journal-toggle','journal-close']){
  await page.locator('#'+id).click();
  const next=await page.locator('#world').boundingBox();
  expect(next.width,id).toBeCloseTo(box.width,2);expect(next.height,id).toBeCloseTo(box.height,2);
 }
 feed.close();
});

test('resizing out of the mobile quickbar transfers keyboard focus to the same real hero',async({page})=>{
 const feed=await open(page);
 const quick=page.locator('#spectator-quickbar [data-hero-id="ranger"]');await quick.focus();
 await page.evaluate(()=>{window.__breakpointChanged=false;matchMedia('(max-width:759px)').addEventListener('change',()=>window.__breakpointChanged=true,{once:true})});
 await page.setViewportSize({width:1440,height:900});
 await expect.poll(()=>page.evaluate(()=>window.__breakpointChanged)).toBe(true);
 await expect(page.locator('.hero-card[data-hero-id="ranger"]')).toBeFocused();
 feed.close();
});

test('journal shortcut returns focus to the hero it interrupted',async({page})=>{
 const feed=await open(page);const quick=page.locator('#spectator-quickbar [data-hero-id="mystic"]');await quick.focus();
 await page.keyboard.press('j');await expect(page.locator('#journal-dialog')).toBeVisible();
 await page.evaluate(()=>{window.__closedJournal=false;document.querySelector('#journal-dialog').addEventListener('close',()=>window.__closedJournal=true,{once:true})});
 await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__closedJournal)).toBe(true);
 await expect(quick).toBeFocused({timeout:2000});feed.close();
});

test('journal keeps the reading position while new genuine events arrive',async({page})=>{
 const feed=await open(page);await page.locator('#journal-toggle').click();
 const old=await page.locator('#journal-events').textContent();
 await page.evaluate(()=>{window.__journalReadingNode=document.querySelector('#journal-events li');document.querySelector('#journal-dialog').scrollTop=40});
 const snapshot=feed.advance(10);await waitState(page,snapshot);
 expect(await page.locator('#journal-events').textContent()).toBe(old);
 expect(await page.evaluate(()=>window.__journalReadingNode.isConnected)).toBe(true);
 await expect(page.locator('#journal-refresh')).toBeVisible();
 await page.locator('#journal-refresh').click();
 await expect(page.locator('#journal-events')).toContainText(snapshot.events.at(-1).text);
 await expect(page.locator('#journal-refresh')).toBeFocused();
 await page.screenshot({path:'artifacts/session9/journal-reading.png'});feed.close();
});

test('the mobile healer has a named resource and the same node survives genuine ticks',async({page})=>{
 const feed=await open(page),hero=feed.snapshot.units.find(u=>u.id==='mystic');
 const quick=page.locator('#spectator-quickbar [data-hero-id="mystic"]');
 await expect(quick).toContainText('Focus '+hero.focus+'/'+hero.maxFocus);
 await quick.focus();await quick.evaluate(el=>window.__focusedQuickNode=el);
 const snapshot=feed.advance();await waitState(page,snapshot);
 expect(await quick.evaluate(el=>el===window.__focusedQuickNode)).toBe(true);
 await expect(quick).toBeFocused();feed.close();
});

test('visible UI retains real targets, native audio opt-in and reduced-motion support',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const feed=await open(page);
 for(const id of ['director-toggle','view-toggle','audio-toggle','hud-toggle','map-toggle','journal-toggle']){
  const b=await page.locator('#'+id).boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);
 }
 await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.quick-fill')).transitionDuration)).toBe('0s');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);feed.close();
});

 test('spectator installation is idempotent and disposes its listeners',async({page})=>{
 const feed=await open(page);
 const hasDispose=await page.evaluate(async()=>{
  const url=window.__OFFLINE_MODULE_URLS__?.['/dungeon/spectator-ui.js']||'/dungeon/spectator-ui.js';
  const mod=await import(url);window.__uiModuleForTest=mod;
  window.__uiHandleForTest=mod.installSpectatorUI(document);
  return typeof window.__uiHandleForTest.dispose;
 });
 expect(hasDispose).toBe('function');
 expect(await page.evaluate(()=>window.__uiHandleForTest===window.__uiModuleForTest.installSpectatorUI(document))).toBe(true);
 await page.evaluate(()=>window.__uiHandleForTest.dispose());
 const mode=await page.locator('body').getAttribute('data-hud');await page.keyboard.press('h');
 await expect(page.locator('body')).toHaveAttribute('data-hud',mode);
 await page.evaluate(()=>window.__uiModuleForTest.installSpectatorUI(document));
 await page.keyboard.press('h');await expect(page.locator('body')).toHaveAttribute('data-hud','clean');
 await expect(page.locator('#journal-refresh')).toHaveCount(1);feed.close();
 });

 test('genuine defeat and restart do not strand focus or resize the stage',async({page})=>{
 const search=DungeonRuntime.create('gauntlet-corpus-v1-0');let prior;
 for(let i=0;i<2500;i++){prior=search.save();search.step();if(search.publicState().phase==='intermission')break}
 expect(search.publicState().phase).toBe('intermission');
 const feed=await open(page,{width:390,height:844},DungeonRuntime.restore(prior));
 const survivor=feed.snapshot.units.find(u=>u.faction==='party'&&u.hp>0);
 expect(survivor).toBeTruthy();
 await page.locator('#spectator-quickbar [data-hero-id="'+survivor.id+'"]').focus();
 const before=await page.locator('#world').boundingBox(),run=feed.snapshot.run;
 let s=feed.advance();await waitState(page,s);await expect(page.locator('#run-result')).toBeVisible();
 await expect(page.locator('#hud-toggle')).toBeFocused();
 for(const card of await page.locator('#spectator-quickbar button').all())await expect(card).toHaveAttribute('aria-disabled','true');
 await page.screenshot({path:'artifacts/session9/real-defeat.png'});
 s=feed.advance(s.intermission);expect(s.run).toBe(run+1);await waitState(page,s);
 await expect(page.locator('#run-result')).toBeHidden();await expect(page.locator('#spectator-quickbar')).toBeVisible();
 await expect(page.locator('#hud-toggle')).toBeFocused();
 const after=await page.locator('#world').boundingBox();expect(after.height).toBe(before.height);
 await expect(page.locator('#restart-status')).not.toBeFocused();feed.close();
 });

 test('connection recovery stays truthful in clean view until a fresh real snapshot arrives',async({page})=>{
 const feed=await open(page);await page.locator('#hud-toggle').click();feed.setOffline(true);
 await expect(page.locator('#recovery')).toBeVisible({timeout:15000});
 const last=feed.receipts.length;feed.setOffline(false);
 await expect.poll(()=>feed.receipts.length).toBeGreaterThan(last);
 await expect(page.locator('#recovery')).toBeVisible();
 const s=feed.advance();await waitState(page,s);
 await expect(page.locator('#recovery')).toBeHidden();
 expect(await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum)).toBe(s.checksum);feed.close();
 });

 test('a natural Warden warning and real release are not presented as a confirmed hit',async({page})=>{
 const search=DungeonRuntime.create('gauntlet-corpus-v1-0');let before;
 for(let i=0;i<2500;i++){
  const prior=search.save(),warning=search.publicState().bossWarning,s=search.step();
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(warning&&s.phase!=='intermission'&&boss?.action==='cast'&&boss.actionTick===s.tick){before=prior;break}
 }
 expect(before,'unmodified authority produces a warning followed by a living-party release').toBeTruthy();
 const feed=await open(page,{width:390,height:844},DungeonRuntime.restore(before));
 await expect(page.locator('#danger-title')).toHaveText('WARDEN WARNING');
 await expect(page.locator('#boss-phase')).toHaveText('WARDEN WARNING');
 await page.screenshot({path:'artifacts/session9/real-warden-warning.png'});
 const s=feed.advance();await waitState(page,s);
 await expect(page.locator('#boss-phase')).toHaveText('STRIKE RELEASED');
 await expect(page.locator('#danger-title')).toHaveText('WARDEN STRIKE');
 await expect(page.locator('#boss-phase')).not.toContainText('LANDED');
 await page.screenshot({path:'artifacts/session9/real-warden-release.png'});feed.close();
 });
