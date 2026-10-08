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


test('biome-reactive high-chroma HUD and decorated 3D art are genuinely wired',async({page,request})=>{
  for(const asset of ['world-craft.js','experience-v4.css','character-art.js','atmosphere.js']){
    const response=await request.get(base+'/maze/'+asset);
    expect(response.ok(),asset).toBe(true);
  }
  await page.setViewportSize({width:1920,height:1080});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>=8);
  const state=await page.evaluate(()=>{
    const snapshot=window.__MAZE_PUBLIC_STATE__;
    const hud=document.querySelector('#broadcast');
    const style=getComputedStyle(hud);
    return{
      profile:snapshot.profile,biome:hud.dataset.mazeBiome,
      themeColor:style.getPropertyValue('--ui-cyan').trim(),
      fps:window.__MAZE_3D_METRICS__?.fps??0,
      details:window.__MAZE_3D_METRICS__?.artDetails,
      is3D:Boolean(window.__MAZE_3D_READY__),
      hasHero:document.querySelector('#maze-3d canvas')!==null
    };
  });
  expect(state.biome).toBe(state.profile);
  expect(state.themeColor).toMatch(/^#(?:[0-9a-f]{6})$/i);
  if(state.is3D){
    expect(state.hasHero).toBe(true);
    expect(state.details).toBeTruthy();
    expect(state.details.biome).toBe(state.profile);
    expect(state.details.clusters).toBeGreaterThanOrEqual(0);
  }
  await page.screenshot({path:path.join(artifacts,'gauntlet-world-art-v7.png'),fullPage:true});
  expect(pageErrors).toEqual([]);
});


test('theater button gives the 3D action more room without changing AI authority',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>3);
  const initial=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  const button=page.locator('#theater-toggle');
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#captions')).toBeVisible();
  await page.screenshot({path:path.join(artifacts,'gauntlet-theater-v8.png'),fullPage:true});
  await page.waitForTimeout(600);
  const later=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  expect(later).toBeGreaterThan(initial);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#hud')).toBeVisible();
});

test('original sculpted characters and biome weather expose a real 3D performance trace',async({page,request})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>12);
  const real=await page.evaluate(()=>({
    render:!!window.__MAZE_3D_READY__,
    report:window.__MAZE_3D_METRICS__,
    public:window.__MAZE_PUBLIC_STATE__
  }));
  expect(real.public.world).toBeUndefined();
  expect(real.public.seed).toBeUndefined();
  if(real.render){
    expect(real.report?.triangles).toBeGreaterThan(0);
    expect(real.report?.explorerMeshes).toBeGreaterThan(20);
    expect(real.report?.atmosphereParticles).toBeGreaterThanOrEqual(300);
    expect(real.report?.artDetails?.skyline).toBeGreaterThan(0);
    expect(real.report?.artDetails?.monumentalProps).toBeGreaterThanOrEqual(0);
  }
  await page.screenshot({path:path.join(artifacts,'gauntlet-character-atmosphere-v8.png'),fullPage:true});
});


test('adaptive GPU budget and autonomous cinematic lighting preserve the 24/7 stream',async({page,request})=>{
  for(const name of ['render-budget.js','cinematic-director.js']){
    const resource=await request.get(base+'/maze/'+name);
    expect(resource.ok(),name+' failed to load').toBe(true);
  }
  await page.setViewportSize({width:1366,height:768});
  await page.goto(base+'/maze?quality=performance',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>5);
  const initial=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  if(await page.evaluate(()=>!!window.__MAZE_3D_READY__)){
    await page.waitForFunction(()=>window.__MAZE_3D_METRICS__?.qualityMode==='performance');
    const metrics=await page.evaluate(()=>window.__MAZE_3D_METRICS__);
    expect(metrics.pixelRatio).toBeLessThanOrEqual(1);
    expect(['exploration','clues','exit','pursuit','success','setback']).toContain(metrics.cinematicCue);
    expect(metrics.drawCalls).toBeGreaterThan(0);
    await page.screenshot({path:path.join(artifacts,'gauntlet-cinematic-performance-v10.png'),fullPage:true});
  }
  await page.waitForTimeout(650);
  const advanced=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.tick);
  expect(advanced).toBeGreaterThan(initial);
});


test('graphics preset selector preserves user options and real 3D capture exports a PNG',async({page,request})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto(base+'/maze?quality=balanced&reducedMotion=1',{waitUntil:'domcontentloaded'});
  const selector=page.locator('#graphics-quality');
  await expect(selector).toHaveValue('balanced');
  await selector.selectOption('performance');
  await page.waitForURL(/quality=performance/);
  await expect(selector).toHaveValue('performance');
  expect(new URL(page.url()).searchParams.get('reducedMotion')).toBe('1');
  await page.waitForFunction(()=>window.__MAZE_PUBLIC_STATE__?.tick>4);
  const mode=await page.evaluate(()=>Boolean(window.__MAZE_3D_READY__));
  if(mode){
    const download=page.waitForEvent('download',{timeout:15000});
    await page.locator('#capture-scene').click();
    const result=await download;
    expect(result.suggestedFilename()).toMatch(/^ai-maze-escape-\d+\.png$/);
    await expect(page.locator('#capture-scene')).toContainText('SAVED');
  }else{
    await expect(page.locator('#capture-scene')).toBeHidden();
    await expect(page.locator('#maze')).toBeVisible();
  }
});
