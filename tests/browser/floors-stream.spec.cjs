'use strict';
const fs=require('node:fs');const path=require('node:path');const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4177',artifacts=path.resolve(__dirname,'../../artifacts/floors-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('floors desktop broadcast is game-first animated readable and privacy safe',async({page})=>{
  const failures=[];page.on('console',m=>{if(m.type()==='error')failures.push(m.text())});page.on('pageerror',e=>failures.push(e.message));
  await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#tower')).toBeVisible();await expect(page.locator('#floor')).toContainText(/Floor \d+ \/ 1000/);await expect(page.locator('#intent')).not.toBeEmpty();await expect(page.locator('#sector')).not.toBeEmpty();
  const first=await page.locator('#floor').textContent();await page.waitForTimeout(900);const state=await page.evaluate(async()=>await(await fetch('/floors/state',{cache:'no-store'})).json());
  expect(state.gameId).toBe('ai-vs-1000-floors');expect(state.cells.length).toBeGreaterThan(0);expect(state.sectorIdentity.name).toBeTruthy();const text=JSON.stringify(state);for(const forbidden of ['seed','runId','rng','operator','token','queued','applied'])expect(text).not.toContain(forbidden);
  const layout=await page.evaluate(()=>{const stage=document.getElementById('stage-shell').getBoundingClientRect();return{viewportWidth:innerWidth,viewportHeight:innerHeight,scroll:document.documentElement.scrollWidth,stage:{width:stage.width,height:stage.height}}});
  expect(layout.scroll).toBe(layout.viewportWidth);expect(layout.stage.width/layout.viewportWidth).toBeGreaterThan(.9);expect(layout.stage.height/layout.viewportHeight).toBeGreaterThan(.72);await page.screenshot({path:path.join(artifacts,'desktop-1920x1080.png'),fullPage:true});expect(failures).toEqual([]);expect(first).toBeTruthy();
});

test('quality presets are presentation-only controls and low remains intentionally rendered',async({page})=>{
  await page.setViewportSize({width:1440,height:810});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});const requests=[];page.on('request',request=>requests.push({method:request.method(),url:request.url()}));const quality=page.locator('#quality');await expect(quality).toBeVisible();await quality.selectOption('low');await expect(page.locator('#broadcast')).toHaveAttribute('data-quality','low');await expect(page.locator('#tower')).toBeVisible();await page.waitForTimeout(250);expect(requests.filter(item=>item.method!=='GET')).toEqual([]);const canvas=await page.locator('#tower').boundingBox();expect(canvas.width).toBeGreaterThan(900);expect(canvas.height).toBeGreaterThan(500);await page.screenshot({path:path.join(artifacts,'desktop-low-quality.png'),fullPage:true});
});

test('spectator telemetry is on demand and keyboard dismissible',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});const toggle=page.locator('#details-toggle'),drawer=page.locator('#telemetry');await expect(toggle).toBeVisible();await expect(drawer).toHaveAttribute('aria-hidden','true');await toggle.focus();await page.keyboard.press('Enter');await expect(drawer).toHaveAttribute('aria-hidden','false');await page.keyboard.press('Escape');await expect(drawer).toHaveAttribute('aria-hidden','true');
});

test('floors phone landscape retains game objective progress and captions',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});await expect(page.locator('#tower')).toBeVisible();await expect(page.locator('#floor')).toBeVisible();await expect(page.locator('#objective')).toBeVisible();await expect(page.locator('#caption')).toBeVisible();const box=await page.locator('#tower').boundingBox();expect(box.width).toBeGreaterThan(680);expect(box.height).toBeGreaterThan(220);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBe(0);await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true});
});

test('reduced motion preference is truthful and control is keyboard accessible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});const motion=page.locator('#motion');await expect(motion).toBeVisible();await expect(motion).toHaveAttribute('aria-pressed','true');await expect(page.locator('#broadcast')).toHaveAttribute('data-reduced-motion','true');await motion.focus();await page.keyboard.press('Enter');await expect(motion).toHaveAttribute('aria-pressed','false');await page.keyboard.press('Enter');await expect(motion).toHaveAttribute('aria-pressed','true');await expect(page.locator('#tower')).toBeVisible();await page.screenshot({path:path.join(artifacts,'reduced-motion.png'),fullPage:true});
});
