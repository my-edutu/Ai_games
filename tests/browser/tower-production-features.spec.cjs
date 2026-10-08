'use strict';
const {test,expect}=require('@playwright/test');
const ROOT='http://127.0.0.1:4176';
test.use({launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test('real 3D runtime has GPU-visible sculpted landscape, rope, cinematic camera and ambient audio controller',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ROOT+'/tower/volumetric?seed=42',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
  const state=await page.evaluate(()=>({
    status:window.__TOWER_VOLUMETRIC_STATE__.status,
    renderer:{...window.__TOWER_VOLUMETRIC_RENDER_METRICS__},
    audioAvailable:typeof window.__TOWER_AUDIO_TOGGLE__,
    recordingAvailable:typeof window.__TOWER_EVIDENCE_RECORD__,
    screenshotAvailable:typeof window.__TOWER_EVIDENCE_CAPTURE__
  }));
  expect(state.renderer.drawCalls).toBeGreaterThan(0);
  expect(state.renderer.ropeSegments).toBe(22);
  expect(state.renderer.terrainMeshes).toBeGreaterThanOrEqual(10);
  expect(state.renderer.frames).toBeGreaterThan(0);
  expect(state.audioAvailable).toBe('function');
  expect(state.screenshotAvailable).toBe('function');
  expect(state.recordingAvailable).toBe('function');
  expect(errors).toEqual([]);
});
test('manual mode genuinely moves the physics character and jumps while autonomous mode remains available',async({page})=>{
  await page.goto(ROOT+'/tower/volumetric?manual=1&seed=42',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
  await expect(page.locator('#game-mode')).toContainText('RETURN TO AUTONOMY');
  await expect(page.locator('[data-tower-control="jump"]')).toBeVisible();
  const p=await page.evaluate(()=>({...window.__TOWER_VOLUMETRIC_STATE__}));
  await page.keyboard.down('KeyD');await page.waitForTimeout(650);await page.keyboard.up('KeyD');
  const moved=await page.evaluate(()=>({...window.__TOWER_VOLUMETRIC_STATE__}));
  expect(moved.x).toBeGreaterThan(p.x+.1);
  await page.keyboard.down('Space');await page.waitForTimeout(250);await page.keyboard.up('Space');
  const jump=await page.evaluate(()=>({...window.__TOWER_VOLUMETRIC_STATE__}));
  expect(jump.y).toBeGreaterThan(moved.y+.5);
  expect(jump.autonomous).toBe(false);
});
test('real captured WebGL frames are present on the live Gauntlet page',async({page})=>{
  await page.goto(ROOT+'/tower/volumetric?seed=42',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
  const result=await page.evaluate(()=>window.__TOWER_EVIDENCE_CAPTURE__());
  expect(result.kind).toBe('image');
  expect(result.bytes).toBeGreaterThan(2048);
  expect(result.state.dimensionality).toBeUndefined(); // evidence is minimized metadata, not fabricated gameplay
  await page.goto(ROOT+'/tower/gauntlet.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Number(document.getElementById('proof-count')?.textContent)>0,null,{timeout:15000});
  await expect(page.locator('.proof-card').first()).toBeVisible();
  expect(await page.locator('.proof-media').first().getAttribute('src')).toMatch(/^blob:/);
  await expect(page.locator('#critic-form')).toBeVisible();
});
