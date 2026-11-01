'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
function scene(){const game=DungeonRuntime.create('dungeon-ui-round17');for(let i=0;i<18;i++)game.step();return game.publicState()}
async function openScene(page,size={width:1440,height:900}){
 const snapshot=scene();await page.setViewportSize(size);
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:30000}).toBeGreaterThan(2);
 return snapshot;
}
test('the real 3D stage dominates desktop instead of a dashboard',async({page})=>{
 await openScene(page);const box=await page.locator('#world').boundingBox();
 expect(box.width*box.height/(1440*900)).toBeGreaterThan(.85);
 const centre=await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2)?.id);
 expect(['world','battle-overlay']).toContain(centre);
 await page.screenshot({path:'artifacts/dungeon-immersive-desktop.png'});
});
test('clean view is reversible and does not change authoritative state',async({page})=>{
 const snapshot=await openScene(page);const toggle=page.locator('#hud-toggle');
 await toggle.click();await expect(page.locator('body')).toHaveAttribute('data-hud','clean');
 await expect(page.locator('#battle-overlay')).toBeHidden();
 await expect(toggle).toHaveAccessibleName(/show interface/i);
 expect(await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum)).toBe(snapshot.checksum);
 await page.screenshot({path:'artifacts/dungeon-immersive-clean.png'});
 await page.keyboard.press('h');await expect(page.locator('body')).toHaveAttribute('data-hud','visible');
 await expect(page.locator('#battle-overlay')).toBeVisible();
});
test('journal shows real bounded events and Escape restores keyboard focus',async({page})=>{
 const snapshot=await openScene(page);await page.keyboard.press('j');
 const dialog=page.locator('#journal-dialog');await expect(dialog).toBeVisible();
 expect(await page.locator('#journal-events li').count()).toBe(Math.min(9,snapshot.events.length));
 await expect(page.locator('#journal-events')).toContainText(snapshot.events.at(-1).text);
 await page.screenshot({path:'artifacts/dungeon-immersive-journal.png'});
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 await expect(page.locator('#journal-toggle')).toBeFocused();
});
test('mobile keeps full-width party cards, large controls and an optional map',async({page})=>{
 await openScene(page,{width:390,height:844});
 const stage=await page.locator('#world').boundingBox();expect(stage.height).toBeGreaterThan(422);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 for(const id of ['view-toggle','director-toggle','audio-toggle','hud-toggle','map-toggle','journal-toggle']){
  const box=await page.locator('#'+id).boundingBox();expect(box.width,id).toBeGreaterThanOrEqual(44);expect(box.height,id).toBeGreaterThanOrEqual(44);
 }
 for(const card of await page.locator('.hero-card').all())expect((await card.boundingBox()).width).toBeGreaterThan(340);
 await expect(page.locator('.map-panel')).toBeHidden();
 await page.screenshot({path:'artifacts/dungeon-immersive-mobile-default.png',fullPage:true});
 await page.locator('#map-toggle').click();
 await expect(page.locator('.map-panel')).toBeVisible();await expect(page.locator('#map-toggle')).toHaveAttribute('aria-expanded','true');
 await page.screenshot({path:'artifacts/dungeon-immersive-mobile.png',fullPage:true});
});
test('loading an existing run does not replay old event alerts across the scene',async({page})=>{
 await openScene(page);await expect(page.locator('#alert-flash')).toBeHidden();await expect(page.locator('#floor-splash')).toBeHidden();
});
test('a real boss encounter is framed using world coordinates',async({page})=>{
 const game=DungeonRuntime.create('dungeon-ui-round17');let snapshot;
 for(let i=0;i<350;i++){game.step();const s=game.publicState(),boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&s.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=5)){snapshot=s;break}}
 expect(snapshot).toBeTruthy();await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.bossFramed)).toBe(true);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.cameraLook).toBeDefined();
 const hero=snapshot.units.find(u=>u.id===d.focusedHeroId),boss=snapshot.units.find(u=>u.kind==='warden');
 // The current truth-locked cinematic director chooses a real hero/foe midpoint.
 // It then makes the same 28% Warden correction as spectator-ui.encounterTarget.
 const anchor=d.cinematicShot?{x:d.cinematicShot.x,z:d.cinematicShot.z}:d.encounterFrame??hero;
 const origin=(snapshot.map.length-1)/2;
 expect(d.cameraLook.x).toBeCloseTo((anchor.x-origin)*.72+(boss.x-origin)*.28,3);
 expect(d.cameraLook.z).toBeCloseTo((anchor.z-origin)*.72+(boss.z-origin)*.28,3);
});

test('clean view never hides a real connection failure',async({page})=>{
 await openScene(page);await page.locator('#hud-toggle').click();
 await page.unroute('**/dungeon/state');await page.route('**/dungeon/state',route=>route.fulfill({status:503,json:{error:'fixture outage'}}));
 await expect(page.locator('#recovery')).toBeVisible({timeout:12000});
});
test('a real terminal run has an explicit result and no live hero selection',async({page})=>{
 const game=DungeonRuntime.create('dungeon-ui-round17');let snapshot;
 for(let i=0;i<2500;i++){game.step();if(game.publicState().phase==='intermission'){snapshot=game.publicState();break}}
 expect(snapshot).toBeTruthy();await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));await page.goto('/dungeon');
 await expect(page.locator('#run-result')).toBeVisible();await expect(page.locator('#result-summary')).toContainText('Depth '+snapshot.floor);
 await expect(page.locator('.hero-card[aria-pressed="true"]')).toHaveCount(0);
 for(const card of await page.locator('.hero-card').all())await expect(card).toHaveAttribute('aria-disabled','true');
 await page.locator('#hud-toggle').click();await expect(page.locator('#run-result')).toBeVisible();
});
test('raw-world audit hides sibling HUD layers as well as scene overlays',async({page})=>{
 await openScene(page);await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 for(const selector of ['.scene-header','.sidebar','.lower-rail'])expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).visibility)).toBe('hidden');
 await page.locator('#world').screenshot({path:'artifacts/dungeon-immersive-world-only.png'});
 await page.locator('.arena').evaluate(el=>el.classList.remove('world-only-audit'));
 await expect(page.locator('.squad-panel')).toBeVisible();
});

test('development progress page has permitted styling and the approved benchmark',async({page,request})=>{
 const css=await request.get('/dungeon/gauntlet.css');expect(css.status()).toBe(200);
 await page.goto('/dungeon/gauntlet');
 expect(await page.locator('.grid').evaluate(el=>getComputedStyle(el).display)).toBe('grid');
 await expect(page.locator('body')).toContainText('Diablo IV');
 await expect(page.locator('body')).toContainText('NOT AAA CERTIFIED');
 await expect(page.locator('#transformation-status')).toContainText(/NOT TRANSFORMED|TRANSFORMED & VERIFIED/);
 await expect(page.locator('#transform-baseline')).toContainText('281735d');
 for(const pillar of ['looks','feels','plays'])await expect(page.locator('#transform-'+pillar)).toHaveText(/UNVERIFIED|AFTER PREFERRED|REJECTED/);
 await expect(page.locator('#transform-evidence')).not.toBeEmpty();
 await page.screenshot({path:'artifacts/dungeon-immersive-progress.png',fullPage:true});
});
