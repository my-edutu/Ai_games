'use strict';
const fs=require('node:fs'),path=require('node:path');
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4176',artifacts=path.resolve(__dirname,'../../artifacts/tower-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

async function waitForVisibleWorld(page){
  await page.waitForFunction(()=>window.__TOWER_RENDER_DIAGNOSTICS__?.playerVisible&&window.__TOWER_RENDER_DIAGNOSTICS__.platformsVisible>0);
  return page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__);
}

test('tower desktop broadcast is animated readable and privacy safe',async({page})=>{
  const failures=[];page.on('console',m=>{if(m.type()==='error')failures.push(m.text())});page.on('pageerror',e=>failures.push(e.message));
  await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/tower`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="floor"]')).toBeVisible();await expect(page.locator('[data-testid="ai-intent"]')).not.toBeEmpty();await expect(page.locator('[data-testid="milestone"]')).toBeVisible();expect(await page.locator('[data-testid="run-token"]').count()).toBe(0);
  const first=await page.locator('[data-testid="tick"]').textContent();await page.waitForTimeout(650);const second=await page.locator('[data-testid="tick"]').textContent();expect(second).not.toBe(first);
  const state=await page.evaluate(()=>window.__TOWER_PUBLIC_STATE__);expect(state).toBeTruthy();expect(state.seed).toBeUndefined();expect(state.runId).toBeUndefined();expect(state.config).toBeUndefined();expect(state.chunks).toBeUndefined();
  const diagnostics=await waitForVisibleWorld(page);expect(diagnostics.playerVisible).toBe(true);expect(diagnostics.platformsVisible).toBeGreaterThan(0);expect(diagnostics.playerHeightPx).toBeGreaterThanOrEqual(58);expect(diagnostics.sampleCount).toBeLessThanOrEqual(120);expect(Number.isFinite(diagnostics.frameMsP95)).toBe(true);
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('[data-testid="tower-canvas"]').getBoundingClientRect().toJSON()}));expect(layout.scroll).toBe(layout.viewport);expect(layout.canvas.width).toBeGreaterThan(1000);expect(layout.canvas.height).toBeGreaterThan(500);
  await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});expect(failures).toEqual([]);
});

test('phone landscape retains game progress intent captions and visible gameplay',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto(`${base}/tower`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="floor"]')).toBeVisible();await expect(page.locator('[data-testid="captions"]')).toBeVisible();
  const box=await page.locator('[data-testid="tower-canvas"]').boundingBox();expect(box.width).toBeGreaterThan(700);expect(box.height).toBeGreaterThan(250);
  const diagnostics=await waitForVisibleWorld(page);expect(diagnostics.playerVisible).toBe(true);expect(diagnostics.platformsVisible).toBeGreaterThan(0);expect(diagnostics.playerHeightPx).toBeGreaterThanOrEqual(58);await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true});
});

test('phone portrait retains health stamina AI intent and visible gameplay',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/tower?muted=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="health"]')).toBeVisible();await expect(page.locator('[data-testid="stamina"]')).toBeVisible();await expect(page.locator('[data-testid="ai-intent"]')).toBeVisible();await expect(page.locator('[data-testid="ai-intent"]')).not.toBeEmpty();
  const diagnostics=await waitForVisibleWorld(page);expect(diagnostics.playerVisible).toBe(true);expect(diagnostics.platformsVisible).toBeGreaterThan(0);expect(diagnostics.playerHeightPx).toBeGreaterThanOrEqual(58);
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,side:document.querySelector('[data-testid="side-panel"]').getBoundingClientRect().toJSON()}));expect(layout.scroll).toBe(layout.viewport);expect(layout.side.width).toBeGreaterThan(180);expect(layout.side.height).toBeGreaterThan(120);
  await page.screenshot({path:path.join(artifacts,'phone-portrait.png'),fullPage:true});
});

test('reduced motion high contrast mute and clean feed preserve the game view',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/tower?reducedMotion=1&highContrast=1&muted=1&cleanFeed=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');await expect(page.locator('body')).toHaveAttribute('data-high-contrast','true');await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="hud"]')).toBeHidden();
  const diagnostics=await waitForVisibleWorld(page);expect(diagnostics.playerVisible).toBe(true);expect(diagnostics.playerHeightPx).toBeGreaterThanOrEqual(58);await page.screenshot({path:path.join(artifacts,'clean-feed.png'),fullPage:true});
});

test('slow state responses never create overlapping polling requests',async({page})=>{let active=0,max=0;await page.route('**/tower/state**',async route=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,180));await route.continue();active--});await page.goto(`${base}/tower`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);expect(max).toBe(1)});

const evidenceCases=[
  ['normal','normal-climbing.png',s=>s.floor===0,d=>d.playerVisible&&d.platformsVisible>0],
  ['large','large-vertical-environment.png',s=>s.floor===25,d=>d.playerVisible&&d.platformsVisible>0],
  ['hazard','hazard-encounter.png',s=>s.hazards.some(h=>h.active),d=>d.playerVisible&&d.hazardsVisible>0],
  ['guardian','guardian-encounter.png',s=>s.enemies.some(e=>e.active&&e.kind==='guardian'&&e.telegraph),d=>d.playerVisible&&d.guardiansVisible>0&&d.guardianHeightPx>=118&&d.guardianPhase>=1&&d.guardianPhase<=3&&d.guardianTelegraphVisible===true],
  ['jump','dramatic-jump-fall.png',s=>Math.abs(s.player.vy)>=9000,d=>d.playerVisible&&d.platformsVisible>0],
  ['theme','different-environment-theme.png',s=>s.theme==='void',d=>d.playerVisible&&d.platformsVisible>0],
  ['milestone','milestone-checkpoint.png',s=>s.floor===10,d=>d.playerVisible&&d.platformsVisible>0]
];
for(const[scenario,name,predicate,visiblePredicate]of evidenceCases){
  test(`visual evidence ${scenario} keeps required gameplay subjects on screen`,async({page})=>{
    test.setTimeout(30000);await page.setViewportSize({width:1600,height:900});
    await page.route('**/tower/state**',route=>{const u=new URL(route.request().url());u.searchParams.set('scenario',scenario);return route.continue({url:u.toString()})});
    await page.goto(`${base}/tower?cleanFeed=1&muted=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__TOWER_PUBLIC_STATE__&&window.__TOWER_PUBLIC_STATE__.tick>=0);
    const state=await page.evaluate(()=>window.__TOWER_PUBLIC_STATE__);expect(predicate(state),`${scenario} evidence predicate`).toBeTruthy();
    await page.waitForFunction(()=>window.__TOWER_RENDER_DIAGNOSTICS__?.playerVisible,{timeout:8000});await page.waitForTimeout(220);
    const diagnostics=await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__);expect(visiblePredicate(diagnostics),`${scenario} required subjects must be visibly framed`).toBeTruthy();expect(diagnostics.playerHeightPx).toBeGreaterThanOrEqual(58);expect(diagnostics.sampleCount).toBeLessThanOrEqual(120);expect(Number.isFinite(diagnostics.frameMsP95)).toBe(true);
    await page.screenshot({path:path.join(artifacts,name),fullPage:true});
  });
}
