'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4176';
const artifacts=path.resolve(__dirname,'../../artifacts/tower-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('3D tower uses real snapshot geometry and keeps autonomous simulation authoritative',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.publicChecksum)).toBeTruthy();
  const canWebGL=await page.evaluate(()=>{
    try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}
  });
  if(canWebGL){
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_ACTIVE__),{timeout:20000}).toBe(true);
    await expect(page.locator('#tower-3d-canvas')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.drawCalls||0),{timeout:20000}).toBeGreaterThan(10);
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.triangles||0),{timeout:20000}).toBeGreaterThan(100);
    await expect(page.locator('body')).toHaveAttribute('data-tower-renderer','three-dimensional');
  }else{
    await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:15000}).toBe('2d-fallback');
  }
  const one=await page.locator('[data-testid="tick"]').textContent();
  await page.waitForTimeout(450);
  const two=await page.locator('[data-testid="tick"]').textContent();
  expect(two).not.toEqual(one);
  const state=await page.evaluate(()=>window.__TOWER_PUBLIC_STATE__);
  expect(state.seed).toBeUndefined();
  expect(state.runId).toBeUndefined();
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-desktop.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('original renderer is available as a side-by-side visual regression baseline',async({page})=>{
  await page.goto(base+'/tower?renderer=2d&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick)).toBeGreaterThan(0);
  await expect(page.locator('body')).toHaveAttribute('data-tower-renderer','2d-reference');
  await expect(page.locator('#tower-3d-canvas')).toHaveCount(0);
  await page.screenshot({path:path.join(artifacts,'gauntlet-2d-reference.png'),fullPage:true});
});

test('gauntlet progress and blinded comparison page expose honest status',async({page})=>{
  await page.goto(base+'/tower/gauntlet');
  await expect(page.getByRole('heading',{name:/3D GAUNTLET/})).toBeVisible();
  await expect.poll(()=>page.locator('#round').textContent()).toBe('1');
  await expect(page.locator('#views iframe')).toHaveCount(2);
  await expect(page.locator('#label-a')).toContainText('HIDDEN');
  await page.getByRole('button',{name:'REVEAL VERSIONS'}).click();
  const labels=(await page.locator('.tag').allTextContents()).join(' ');
  expect(labels).toContain('ORIGINAL 2D');
  expect(labels).toContain('NEW 3D');
  await expect(page.locator('#status')).toContainText('pending');
});

test('3D module unavailable degrades safely to the existing 2D scene',async({page})=>{
  await page.route('**/tower/scene3d.js',route=>route.fulfill({status:503,body:'Module unavailable'}));
  await page.goto(base+'/tower');
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:12000}).toBe('2d-fallback');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick),{timeout:15000}).toBeGreaterThan(4);
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();
});
