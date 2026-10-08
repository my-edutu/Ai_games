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

test('articulated hero close-up proves mesh detail and independently capturable pose',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'/tower?camera=hero&cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_ACTIVE__),{timeout:20000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.heroParts||0),{timeout:20000}).toBeGreaterThan(70);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.drawCalls||0),{timeout:20000}).toBeGreaterThan(80);
  const status=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(status.heroCamera).toBe(true);
  expect(status.drawCalls).toBeLessThan(1400);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-hero.png'),fullPage:true});
});

test('2D fallback projects floor-relative game entities after ascending',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto(base+'/tower?renderer=2d&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.floor||0),{timeout:25000}).toBeGreaterThanOrEqual(1);
  await page.waitForTimeout(200);
  const visible=await page.evaluate(()=>{
    const canvas=document.getElementById('tower-canvas'),ctx=canvas.getContext('2d'),{data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);
    let details=0;
    for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5){
      const p=(y*width+x)*4;
      if(data[p]>65&&data[p+1]>75&&data[p+2]>100)details++;
    }
    return details;
  });
  expect(visible).toBeGreaterThan(60);
  await page.screenshot({path:path.join(artifacts,'gauntlet-2d-higher-floor.png'),fullPage:true});
});

test('low-power accessible 3D maintains scene and exposes measured frame pacing',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto(base+'/tower?quality=low&highContrast=1&reducedMotion=1&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.sampledFrames||0),{timeout:25000}).toBeGreaterThan(55);
  const d=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(d.highContrast).toBe(true);
  expect(d.pixelRatio).toBeLessThanOrEqual(1);
  expect(d.averageFps).toBeGreaterThan(0);
  expect(d.drawCalls).toBeGreaterThan(50);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-mobile-accessible.png'),fullPage:true});
});

test('a critic can record the largest remaining visual gap without making a false AAA claim',async({page})=>{
  await page.goto(base+'/tower/gauntlet');
  await expect(page.getByRole('heading',{name:'Jusant quality gate'})).toBeVisible();
  const reference=page.getByRole('link',{name:/INSPECT OFFICIAL JUSANT/});
  await expect(reference).toHaveAttribute('href','https://dont-nod.com/en/games/jusant/');
  await page.locator('[name="environment"]').fill('4');
  await page.locator('#critic-gap').fill('Architectural silhouettes still repeat too obviously; diversify the near, mid, and far layers in comparable reference-camera captures.');
  await page.getByRole('button',{name:'SAVE LOCAL REVIEW'}).click();
  await expect(page.locator('#review-state')).toContainText('saved');
  await page.reload();
  await expect(page.locator('#critic-gap')).toHaveValue(/Architectural silhouettes/);
  await expect(page.locator('[name="environment"]')).toHaveValue('4');
});

test('3D module unavailable degrades safely to the existing 2D scene',async({page})=>{
  await page.route('**/tower/scene3d.js',route=>route.fulfill({status:503,body:'Module unavailable'}));
  await page.goto(base+'/tower');
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:12000}).toBe('2d-fallback');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick),{timeout:15000}).toBeGreaterThan(4);
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();
});
