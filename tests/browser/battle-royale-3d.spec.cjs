'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const base='http://127.0.0.1:4177';
const captures=path.resolve(__dirname,'../../artifacts/battle-gauntlet');
test.beforeAll(()=>fs.mkdirSync(captures,{recursive:true}));

test('Battle Royale 3D Gauntlet draws a real WebGL2 scene or safely falls back to Canvas 2D',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/battle?muted=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D));
  const capability=await page.evaluate(()=>Boolean(document.createElement('canvas').getContext('webgl2')));
  const status=await page.evaluate(()=>({...window.BattleArena3D.status}));
  if(capability){
    expect(status.mode).toBe('webgl2');
    expect(status.frames).toBeGreaterThan(0);
    expect(status.triangles).toBeGreaterThan(100);
    expect(status.contenders).toBeGreaterThan(0);
    expect(Number.isFinite(status.p95SubmitMs)).toBe(true);
    const layer=page.locator('[data-testid="battle-3d-canvas"]');
    await expect(layer).toBeVisible();
    await expect(layer).toHaveAttribute('data-renderer','webgl2');
    await page.screenshot({path:path.join(captures,'webgl3d-desktop.png')});
  }else{
    expect(status.mode).toBe('fallback-2d');
    await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('visual=2d preserves the legacy renderer without a WebGL canvas',async({page})=>{
  await page.goto(base+'/battle?muted=1&visual=2d');
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
  const mode=await page.evaluate(()=>window.BattleArena3D.status.mode);
  expect(mode).toBe('forced-2d');
  await expect(page.locator('[data-testid="battle-3d-canvas"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
});

test('Gauntlet progress offers live before/after comparison with honest review status',async({page})=>{
  await page.goto(base+'/battle/gauntlet');
  await expect(page.locator('h1')).toContainText('AI Battle Royale');
  await expect(page.locator('.versus iframe')).toHaveCount(2);
  await expect(page.locator('#verdict')).toContainText('UNVERIFIED');
  await expect(page.locator('#history li').first()).toBeVisible();
  await expect(page.locator('#gaps li').first()).toBeVisible();
  await page.screenshot({path:path.join(captures,'progress-desktop.png'),fullPage:true});
});
