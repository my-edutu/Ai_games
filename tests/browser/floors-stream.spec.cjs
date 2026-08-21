'use strict';
const fs=require('node:fs');const path=require('node:path');const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4177',artifacts=path.resolve(__dirname,'../../artifacts/floors-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('floors desktop broadcast is animated readable and privacy safe',async({page})=>{
  const failures=[];page.on('console',m=>{if(m.type()==='error')failures.push(m.text())});page.on('pageerror',e=>failures.push(e.message));
  await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#tower')).toBeVisible();await expect(page.locator('#floor')).toContainText(/Floor \d+ \/ 1000/);await expect(page.locator('#intent')).not.toBeEmpty();
  const first=await page.locator('#floor').textContent();await page.waitForTimeout(900);const state=await page.evaluate(async()=>await(await fetch('/floors/state',{cache:'no-store'})).json());
  expect(state.gameId).toBe('ai-vs-1000-floors');expect(state.cells.length).toBeGreaterThan(0);const text=JSON.stringify(state);for(const forbidden of ['seed','runId','rng','operator','token','queued','applied'])expect(text).not.toContain(forbidden);
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.getElementById('tower').getBoundingClientRect().toJSON()}));
  expect(layout.scroll).toBe(layout.viewport);expect(layout.canvas.width).toBeGreaterThan(900);expect(layout.canvas.height).toBeGreaterThan(500);await page.screenshot({path:path.join(artifacts,'desktop-1920x1080.png'),fullPage:true});expect(failures).toEqual([]);expect(first).toBeTruthy();
});

test('floors phone landscape retains game objective progress and captions',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});await expect(page.locator('#tower')).toBeVisible();await expect(page.locator('#floor')).toBeVisible();await expect(page.locator('#objective')).toBeVisible();await expect(page.locator('#caption')).toBeVisible();const box=await page.locator('#tower').boundingBox();expect(box.width).toBeGreaterThan(480);expect(box.height).toBeGreaterThan(180);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBe(0);await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true});
});

test('reduced motion preference is truthful and control is keyboard accessible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/floors`,{waitUntil:'domcontentloaded'});const motion=page.locator('#motion');await expect(motion).toBeVisible();await expect(motion).toHaveAttribute('aria-pressed','true');await expect(page.locator('#broadcast')).toHaveAttribute('data-reduced-motion','true');await motion.focus();await page.keyboard.press('Enter');await expect(motion).toHaveAttribute('aria-pressed','false');await page.keyboard.press('Enter');await expect(motion).toHaveAttribute('aria-pressed','true');await expect(page.locator('#tower')).toBeVisible();await page.screenshot({path:path.join(artifacts,'reduced-motion.png'),fullPage:true});
});
