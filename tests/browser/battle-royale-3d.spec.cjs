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
    expect(status.sceneBuilds).toBeGreaterThan(0);
    const layer=page.locator('[data-testid="battle-3d-canvas"]');
    await expect(layer).toBeVisible();
    await expect(layer).toHaveAttribute('data-renderer','webgl2');
    await page.waitForTimeout(500);
    const buildsAfter=await page.evaluate(()=>window.BattleArena3D.status.sceneBuilds);
    expect(buildsAfter).toBe(status.sceneBuilds);
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
  await expect(page.locator('#verdict')).toContainText(/AAA QUALITY NOT MET|UNVERIFIED/i);
  await expect(page.locator('#history li').first()).toBeVisible();
  await expect(page.locator('#gaps li').first()).toBeVisible();
  await page.screenshot({path:path.join(captures,'progress-desktop.png'),fullPage:true});
});


test('Gauntlet captures matched-state baseline and 3D candidate without altering authority',async({browser})=>{
  const viewport={width:1600,height:900};
  const baseline=await browser.newPage({viewport});
  const candidate=await browser.newPage({viewport});
  try{
    const response=await baseline.request.get(base+'/battle/state?w=1600&h=900');
    expect(response.ok()).toBeTruthy();
    const payload=await response.json();
    const snapshot=payload.snapshot;
    expect(snapshot).toBeTruthy();
    const intercepted={...payload,status:{paused:true,simulationFault:false,lastStepAgeMs:0,runIndex:0}};
    const intercept=async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(intercepted)});
    await baseline.route('**/battle/state?*',intercept);
    await candidate.route('**/battle/state?*',intercept);
    await baseline.goto(base+'/battle?muted=1&visual=2d');
    await candidate.goto(base+'/battle?muted=1');
    await baseline.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
    await candidate.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
    const stateA=await baseline.evaluate(()=>window.__BATTLE_PUBLIC_STATE__);
    const stateB=await candidate.evaluate(()=>window.__BATTLE_PUBLIC_STATE__);
    expect(stateA.runToken).toBe(snapshot.runToken);
    expect(stateB.revision).toBe(stateA.revision);
    expect(stateB.goal).toEqual(stateA.goal);
    await expect(candidate.locator('.battle-3d-focus')).toBeVisible();
    await baseline.screenshot({path:path.join(captures,'matched-baseline-2d.png')});
    await candidate.screenshot({path:path.join(captures,'matched-candidate-3d.png')});
  }finally{
    await baseline.close();
    await candidate.close();
  }
});


test('slow battle-state network replies never cause overlapping broadcast polls',async({page})=>{
  let pending=0,highWater=0,requests=0;
  await page.route('**/battle/state?*',async route=>{
    pending++;requests++;
    highWater=Math.max(highWater,pending);
    await new Promise(resolve=>setTimeout(resolve,420));
    try{await route.continue()}finally{pending--}
  });
  await page.goto(base+'/battle?muted=1&visual=2d',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1800);
  expect(requests).toBeGreaterThanOrEqual(2);
  expect(highWater).toBe(1);
  await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
});
