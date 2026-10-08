'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4174';
const artifacts=path.resolve(__dirname,'../../artifacts/maze-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('premium broadcast layout prioritizes the game, readable telemetry, and real AI state',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1920,height:1080});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>0);
  await expect(page.locator('#broadcast')).toHaveAttribute('data-ux-revision','3');
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#objective-strip')).toBeVisible();
  await expect(page.locator('#captions')).toBeVisible();
  await expect(page.locator('#event-feed li').first()).not.toBeEmpty();
  const layout=await page.evaluate(()=>{
    const read=selector=>document.querySelector(selector).getBoundingClientRect();
    return {stage:read('#stage').width,viewport:innerWidth,hud:read('#hud').width,
      stageHeight:read('#stage').height,bodyScroll:document.documentElement.scrollWidth,
      minFont:parseFloat(getComputedStyle(document.querySelector('#hud h1')).fontSize)};
  });
  expect(layout.stage).toBeGreaterThan(layout.viewport*.92);
  expect(layout.stageHeight).toBeGreaterThan(900);
  expect(layout.hud).toBeGreaterThan(260);
  expect(layout.minFont).toBeGreaterThanOrEqual(18);
  expect(layout.bodyScroll).toBeLessThanOrEqual(layout.viewport);
  const state=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__);
  expect(state.seed).toBeUndefined();
  expect(state.world).toBeUndefined();
  expect(state.runId).toBeUndefined();
  await page.screenshot({path:path.join(artifacts,'gauntlet-ui-v3-desktop.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('three camera buttons change presentation state without affecting autonomous simulation',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'/maze?camera=follow',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-camera-mode="follow"]')).toHaveAttribute('aria-pressed','true');
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>2);
  const before=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  const webgl=await page.evaluate(()=>Boolean(window.__MAZE_3D_READY__));
  if(!webgl){
    await expect(page.locator('#camera-switch')).toBeHidden();
    return;
  }
  await page.getByRole('button',{name:'Tactical'}).click();
  expect(await page.evaluate(()=>window.__MAZE_CAMERA_MODE__)).toBe('tactical');
  await expect(page.locator('[data-camera-mode="tactical"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-camera-mode="follow"]')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Cinematic'}).click();
  expect(await page.evaluate(()=>window.__MAZE_CAMERA_MODE__)).toBe('cinema');
  await page.waitForTimeout(650);
  const after=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  expect(after).toBeGreaterThan(before);
});

test('mobile landscape preserves legible HUD without covering full scene',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>0);
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#captions')).toBeVisible();
  await expect(page.locator('#mission-title')).not.toBeEmpty();
  const geometry=await page.evaluate(()=>{
    const rect=sel=>document.querySelector(sel).getBoundingClientRect();
    const stage=rect('#stage'),hud=rect('#hud'),caption=rect('#captions');
    return {stageWidth:stage.width,hudWidth:hud.width,hudX:hud.left,captionWidth:caption.width,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(geometry.stageWidth).toBeGreaterThan(800);
  expect(geometry.hudWidth).toBeLessThan(215);
  expect(geometry.captionWidth).toBeGreaterThan(250);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  await page.screenshot({path:path.join(artifacts,'gauntlet-ui-v3-landscape.png'),fullPage:true});
});

test('portrait interface and clean feed keep accessibility and real captions',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>0);
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#captions')).toBeVisible();
  await page.screenshot({path:path.join(artifacts,'gauntlet-ui-v3-portrait.png'),fullPage:true});
  await page.goto(base+'/maze?cleanFeed=1&reducedMotion=1&highContrast=1',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#captions')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');
});
