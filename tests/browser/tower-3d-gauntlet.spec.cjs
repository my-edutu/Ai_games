'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');
const {analyzePng}=require('../../scripts/tower-image-metrics.cjs');
const base='http://127.0.0.1:4176';
const artifacts=path.resolve(__dirname,'../../artifacts/tower-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));
// CI containers may not have a GPU; require deterministic Chromium software WebGL.
test.use({launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});

test('3D tower really starts WebGL, progresses autonomously and produces screenshot evidence',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_3D_METRICS__?.status==='live',null,{timeout:30000});
  await expect(page.locator('#tower-3d-canvas')).toBeVisible();
  const first=await page.evaluate(()=>({tick:window.__TOWER_PUBLIC_STATE__?.tick,metrics:{...window.__TOWER_3D_METRICS__}}));
  expect(first.metrics.actors).toBeGreaterThan(0);
  expect(first.metrics.platforms).toBeGreaterThan(0);
  expect(first.metrics.frames).toBeGreaterThan(0);
  expect(first.metrics.renderer).toBe('webgl');
  // Software WebGL can render slowly in CI: wait for a real additional frame rather than a fixed 1.2s.
  await page.waitForFunction(({frames,tick})=>window.__TOWER_3D_METRICS__?.frames>frames&&window.__TOWER_PUBLIC_STATE__?.tick>tick,{frames:first.metrics.frames,tick:first.tick},{timeout:12000});
  const second=await page.evaluate(()=>({tick:window.__TOWER_PUBLIC_STATE__?.tick,metrics:{...window.__TOWER_3D_METRICS__}}));
  expect(second.tick).toBeGreaterThan(first.tick);
  expect(second.metrics.frames).toBeGreaterThan(first.metrics.frames);
  await page.waitForFunction(()=>window.__TOWER_3D_METRICS__?.heroScreenHeightPct>0,null,{timeout:12000});
  const composition=await page.evaluate(()=>({...window.__TOWER_3D_METRICS__}));
  expect(composition.heroVisible,'3D climber must be visible in the game viewport').toBe(true);
  expect(composition.heroScreenHeightPct,'The climber must be a readable broadcast-scale subject').toBeGreaterThan(8);
  const canvas=page.locator('#tower-3d-canvas');
  const box=await canvas.boundingBox();expect(box.width).toBeGreaterThan(400);expect(box.height).toBeGreaterThan(300);
  const png=await page.screenshot({path:path.join(artifacts,'gauntlet-3d-desktop.png'),fullPage:true});
  const world=analyzePng(png,{region:[.06,.21,.73,.86],stride:4});
  fs.writeFileSync(path.join(artifacts,'gauntlet-3d-diagnostics.json'),JSON.stringify({first,second,world,errors},null,2));
  expect(world.meanLuminance,'3D world must not be a dim silhouette').toBeGreaterThan(34);
  expect(world.luminanceStdDev,'3D scene needs legible depth and contrast').toBeGreaterThan(9);
  expect(errors).toEqual([]);
});

test('3D portrait broadcast composition stays bounded',async({page})=>{
  await page.setViewportSize({width:900,height:1600});
  await page.goto(base+'/tower/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_3D_METRICS__?.status==='live',null,{timeout:30000});
  expect(await page.locator('#tower-3d-canvas').isVisible()).toBe(true);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-portrait.png'),fullPage:true});
});

test('2D fallback remains functional without WebGL canvas',async({page})=>{
  await page.goto(base+'/tower/?renderer=2d',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#tower-canvas')).toBeVisible();
  await expect(page.locator('#tower-3d-canvas')).toHaveCount(0);
  await page.waitForFunction(()=>window.__TOWER_PUBLIC_STATE__?.tick>0);
  const renderer=await page.evaluate(()=>window.__TOWER_3D_ACTIVE__||false);expect(renderer).toBe(false);
});
