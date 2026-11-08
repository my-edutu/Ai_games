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
