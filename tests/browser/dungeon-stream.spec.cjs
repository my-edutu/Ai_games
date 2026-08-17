'use strict';
const fs=require('node:fs');
const path=require('node:path');
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4189',artifacts=path.resolve(__dirname,'../../artifacts/ai-dungeon/r3-phase-03/browser');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('dungeon desktop broadcast is animated readable bounded and privacy safe',async({page})=>{
  const failures=[];page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});page.on('pageerror',error=>failures.push(error.message));
  await page.setViewportSize({width:1920,height:1080});
  await page.goto(`${base}/dungeon`,{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
  await expect(page.getByTestId('captions')).not.toBeEmpty();
  await page.waitForFunction(()=>window.__DUNGEON_PUBLIC_STATE__?.tick>=0);
  const first=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.tick);await page.waitForTimeout(650);const second=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.tick);expect(second).toBeGreaterThan(first);
  const state=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__);expect(state.seed).toBeUndefined();expect(state.runId).toBeUndefined();expect(state.config).toBeUndefined();expect(state.cells.length).toBeLessThanOrEqual(state.dimensions.width*state.dimensions.height);expect(state.entities.length).toBeLessThanOrEqual(32);expect(state.events.length).toBeLessThanOrEqual(8);
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('[data-testid="dungeon-canvas"]').getBoundingClientRect().toJSON()}));expect(layout.scroll).toBe(layout.viewport);expect(layout.canvas.width).toBeGreaterThan(1400);expect(layout.canvas.height).toBeGreaterThan(800);await expect(page.getByTestId('controls')).toHaveCSS('opacity','0');
  await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});expect(failures).toEqual([]);
});

test('phone landscape keeps goal health map Astra and captions legible',async({page})=>{
  await page.setViewportSize({width:640,height:360});await page.goto(`${base}/dungeon`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__DUNGEON_PUBLIC_STATE__?.tick>=0);await expect(page.getByTestId('dungeon-canvas')).toBeVisible();await expect(page.getByTestId('captions')).not.toBeEmpty();const box=await page.getByTestId('dungeon-canvas').boundingBox();expect(box.width).toBeGreaterThan(600);expect(box.height).toBeGreaterThan(340);const summary=await page.locator('#sr-summary').textContent();expect(summary).toMatch(/Floor \d+/);expect(summary).toMatch(/Health \d+/);expect(summary).toMatch(/Astra intends/i);await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true});
});

test('reduced motion and clean feed preserve authoritative game meaning',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/dungeon?reducedMotion=1&cleanFeed=1&muted=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__DUNGEON_FRAME__?.snapshot);await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');await expect(page.locator('body')).toHaveAttribute('data-clean-feed','true');const frame=await page.evaluate(()=>window.__DUNGEON_FRAME__);expect(frame.options.reducedMotion).toBe(true);expect(frame.options.cleanFeed).toBe(true);expect(frame.layout.side.width).toBe(0);await expect(page.getByTestId('captions')).not.toBeEmpty();await page.screenshot({path:path.join(artifacts,'clean-feed.png'),fullPage:true});
});
