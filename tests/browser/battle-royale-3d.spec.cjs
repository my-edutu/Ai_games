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
  await expect(page.locator('#verdict')).toContainText(/AAA QUALITY NOT MET|UNVERIFIED|NOT ACHIEVED|QUALITY BELOW BENCHMARK/i);
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


test('lower-end GPU quality draws fewer meshes while preserving the same simulation truth',async({browser,request})=>{
  const stateResponse=await request.get(base+'/battle/state?w=1280&h=720');
  expect(stateResponse.ok()).toBeTruthy();
  const payload=await stateResponse.json();
  const shared=JSON.stringify(payload);
  const open=async(query)=>{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.route('**/battle/state?*',route=>route.fulfill({status:200,contentType:'application/json',body:shared}));
    await page.goto(base+'/battle?muted=1&'+query);
    await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D));
    return page;
  };
  const full=await open('quality=high');
  const light=await open('quality=low');
  try{
    const stateA=await full.evaluate(()=>window.__BATTLE_PUBLIC_STATE__);
    const stateB=await light.evaluate(()=>window.__BATTLE_PUBLIC_STATE__);
    expect(stateA.runToken).toBe(stateB.runToken);
    expect(stateA.goal).toEqual(stateB.goal);
    const high=await full.evaluate(()=>({...window.BattleArena3D.status}));
    const low=await light.evaluate(()=>({...window.BattleArena3D.status}));
    expect(high.quality).toBe('high');
    expect(low.quality).toBe('low');
    if(high.mode==='webgl2'&&low.mode==='webgl2'){
      expect(low.triangles).toBeLessThan(high.triangles);
      expect(low.contenders).toBe(high.contenders);
      await full.screenshot({path:path.join(captures,'same-state-high-detail.png')});
      await light.screenshot({path:path.join(captures,'same-state-low-detail.png')});
    }
  }finally{await full.close();await light.close()}
});


test('unmuted original battle soundtrack stays responsive without browser exceptions',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/battle?muted=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D));
  await page.waitForTimeout(750);
  await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('v3 broadcast uses vivid esports palette, accurate telemetry and legible desktop UI',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/battle?muted=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__BATTLE_PUBLIC_STATE__?.tick>=1);
  await expect(page.locator('body')).toHaveAttribute('data-ux-revision','3');
  await expect(page.locator('#arena-biome')).not.toBeEmpty();
  await expect(page.locator('#arena-storm')).toContainText('PHASE');
  await expect(page.locator('#arena-contenders')).toContainText('/');
  await expect(page.locator('.brand-streak')).toContainText('LIVE AI SIMULATION');
  const metrics=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement);
    const hud=getComputedStyle(document.querySelector('.survivor-card'));
    const arena=document.querySelector('.arena-shell').getBoundingClientRect();
    return{color:root.getPropertyValue('--royal-cyan').trim(),
      gradient:hud.backgroundImage,arenaRatio:arena.width/innerWidth,
      chips:document.querySelector('#arena-counter').textContent,
      tick:window.__BATTLE_PUBLIC_STATE__.tick};
  });
  expect(metrics.color).toBe('#4ee9ff');
  expect(metrics.gradient).toContain('gradient');
  expect(metrics.arenaRatio).toBeGreaterThan(.48);
  expect(metrics.chips).toBe('TICK '+metrics.tick);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(captures,'v3-premium-ui-desktop.png'),fullPage:true});
});

test('v3 layout keeps playing field visible in phone landscape and isolates clean-feed overlays',async({browser})=>{
  const phone=await browser.newPage({viewport:{width:844,height:390}});
  const clean=await browser.newPage({viewport:{width:1280,height:720}});
  try{
    await phone.goto(base+'/battle?muted=1');
    await phone.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
    await expect(phone.locator('[data-testid="battle-canvas"]')).toBeVisible();
    await expect(phone.locator('#arena-biome')).toBeVisible();
    const width=await phone.locator('.arena-shell').evaluate(node=>node.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(450);
    await phone.screenshot({path:path.join(captures,'v3-phone-landscape.png')});
    await clean.goto(base+'/battle?muted=1&cleanFeed=1');
    await clean.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
    await expect(clean.locator('.arena-topline')).toBeHidden();
    await expect(clean.locator('.arena-footer')).toBeHidden();
    await expect(clean.locator('.hud')).toBeHidden();
    await clean.screenshot({path:path.join(captures,'v3-clean-feed.png')});
  }finally{
    await phone.close();await clean.close();
  }
});


test('Gauntlet critic captures all three art-direction biomes from a clearly labeled public-state fixture',async({browser,request})=>{
  const response=await request.get(base+'/battle/state?w=1600&h=900');
  expect(response.ok()).toBeTruthy();
  const payload=await response.json();
  expect(payload.snapshot?.arena).toBeTruthy();
  for(const theme of ['ember','neon','arctic']){
    const page=await browser.newPage({viewport:{width:1600,height:900}});
    try{
      // Visual-only art-direction fixture: no authoritative server state is changed.
      const snapshot={...payload.snapshot,arena:{...payload.snapshot.arena,theme}};
      const fixture=JSON.stringify({...payload,snapshot});
      await page.route('**/battle/state?*',route=>route.fulfill({
        status:200,contentType:'application/json',body:fixture
      }));
      await page.goto(base+'/battle?muted=1&quality=high',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__BATTLE_PUBLIC_STATE__?.arena?.theme!=null);
      await expect(page.locator('body')).toHaveAttribute('data-arena-biome',theme);
      await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
      const state=await page.evaluate(()=>({...window.BattleArena3D.status}));
      expect(['webgl2','fallback-2d']).toContain(state.mode);
      await page.screenshot({path:path.join(captures,'art-fixture-'+theme+'.png'),fullPage:true});
    }finally{await page.close()}
  }
});


test('3D nameplates follow published living AI fighters and never overwhelm broadcast',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/battle?muted=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D));
  const status=await page.evaluate(()=>({...window.BattleArena3D.status}));
  if(status.mode==='webgl2'){
    const layer=page.locator('.battle-3d-nameplates');
    await expect(layer).toBeVisible();
    const number=await page.locator('.battle-3d-nameplate').count();
    expect(number).toBeGreaterThan(0);
    expect(number).toBeLessThanOrEqual(6);
    const text=await page.locator('.battle-3d-nameplate').first().textContent();
    expect(text).toMatch(/HP/);
    expect(status.lastError).toBeNull();
    await page.screenshot({path:path.join(captures,'fighter-identity-nameplates.png')});
  }else{
    await expect(page.locator('[data-testid="battle-canvas"]')).toBeVisible();
  }
});

test('v3 WebGL scene preserves the biome sky behind actual shaded 3D geometry',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/battle?muted=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D));
  const values=await page.evaluate(()=>{
    const shell=document.querySelector('.arena-shell');
    const canvas=document.querySelector('.battle-webgl3d');
    const style=getComputedStyle(shell);
    return{background:style.backgroundImage,mode:window.BattleArena3D.status.mode,
      rendererError:window.BattleArena3D.status.lastError,
      canvasBackground:canvas?getComputedStyle(canvas).backgroundColor:null};
  });
  expect(values.background).toContain('gradient');
  if(values.mode==='webgl2'){
    expect(values.rendererError).toBeNull();
    expect(values.canvasBackground).toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({path:path.join(captures,'atmospheric-3d-sky.png')});
  }
});

test('theatre-first UI gives the 3D battlefield nearly the full screen, with panel-mode rollback',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/battle?muted=1');
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
  await expect(page.locator('body')).toHaveClass(/theatre-mode/);
  const theatre=await page.evaluate(()=>{
    const stage=document.querySelector('.arena-shell').getBoundingClientRect();
    const hud=document.querySelector('.hud').getBoundingClientRect();
    const caption=document.querySelector('.captions').getBoundingClientRect();
    return{stageWidth:stage.width,stageHeight:stage.height,
      hudWidth:hud.width,hudOverlap:hud.x<stage.x+stage.width,captionBottom:caption.bottom};
  });
  expect(theatre.stageWidth).toBeGreaterThan(1550);
  expect(theatre.stageHeight).toBeGreaterThan(760);
  expect(theatre.hudOverlap).toBeTruthy();
  await page.screenshot({path:path.join(captures,'v4-theatre-full-bleed.png')});
  await page.goto(base+'/battle?muted=1&layout=panels');
  await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__));
  await expect(page.locator('body')).not.toHaveClass(/theatre-mode/);
  const panels=await page.locator('.arena-shell').evaluate(el=>el.getBoundingClientRect().width);
  expect(panels).toBeLessThan(theatre.stageWidth*.78);
  await page.screenshot({path:path.join(captures,'v4-panel-rollback.png')});
});

test('broadcast cinematic elimination card is driven only by a public event and expires',async({browser,request})=>{
  const source=await request.get(base+'/battle/state?w=1600&h=900');
  expect(source.ok()).toBeTruthy();
  const payload=await source.json();
  const event={sequence:999997,type:'elimination',importance:4,tick:payload.snapshot.tick,
    detail:'Authoritative elimination test fixture'};
  const fixture=JSON.stringify({...payload,snapshot:{...payload.snapshot,
    recentEvents:[...payload.snapshot.recentEvents.slice(-8),event]}});
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  try{
    await page.route('**/battle/state?*',route=>route.fulfill({
      status:200,contentType:'application/json',body:fixture
    }));
    await page.goto(base+'/battle?muted=1');
    await expect(page.locator('#battle-highlight')).toBeVisible();
    await expect(page.locator('#battle-highlight-kicker')).toHaveText('ELIMINATION CONFIRMED');
    await expect(page.locator('#battle-highlight-title')).toHaveText('Authoritative elimination test fixture');
    await page.screenshot({path:path.join(captures,'v4-semantic-elimination.png')});
    await expect(page.locator('#battle-highlight')).toBeHidden({timeout:4000});
  }finally{await page.close()}
});


test('camera gauntlet contrasts same public match using cinematic hero and tactical map',async({browser,request})=>{
  const response=await request.get(base+'/battle/state?w=1600&h=900');
  expect(response.ok()).toBeTruthy();
  const payload=await response.json();
  const alive=payload.snapshot.combatants.filter(f=>f.alive);
  const snapshot={...payload.snapshot,
    combatants:payload.snapshot.combatants.map((f,i)=>({
      ...f,alive:i===0||i===1,
      health:i<=1?Math.max(1,f.health):0
    })),
    scene:'final-circle'};
  const shared=JSON.stringify({...payload,snapshot});
  const pages=[];
  try{
    for(const mode of ['hero','tactical','broadcast']){
      const page=await browser.newPage({viewport:{width:1600,height:900}});
      pages.push(page);
      await page.route('**/battle/state?*',route=>route.fulfill({
        status:200,contentType:'application/json',body:shared
      }));
      await page.goto(base+'/battle?muted=1&camera='+mode);
      await page.waitForFunction(()=>Boolean(window.__BATTLE_PUBLIC_STATE__&&window.BattleArena3D?.status.frames>0));
      const state=await page.evaluate(()=>window.__BATTLE_PUBLIC_STATE__);
      expect(state.runToken).toBe(snapshot.runToken);
      expect(state.revision).toBe(snapshot.revision);
      const status=await page.evaluate(()=>window.BattleArena3D.status);
      if(status.mode==='webgl2'){
        expect(status.cameraMode).toBe(mode==='broadcast'?'hero':mode);
        expect(status.projection).toBe(mode==='tactical'?'stylized':'pinhole');
        if(mode!=='tactical'){
          expect(status.heroDistance).toBeGreaterThanOrEqual(3);
          expect(status.heroDistance).toBeLessThanOrEqual(4.3);
          expect(status.heroActorId).toBeTruthy();
        }
        const overlay=await page.locator('.battle-3d-focus').textContent();
        expect(overlay).toContain(mode==='tactical'?'LIVE ACTION':'TACTICAL OVERVIEW');
        await page.screenshot({path:path.join(captures,'camera-'+mode+'-same-state.png')});
      }
    }
  }finally{
    await Promise.all(pages.map(page=>page.close()));
  }
});


test('original local GPU surface atlas loads and compares against same-state material rollback',async({browser,request})=>{
  const atlas=await request.get(base+'/battle/material-atlas.svg');
  expect(atlas.ok()).toBeTruthy();
  expect(atlas.headers()['content-type']).toContain('image/svg+xml');
  const surface=await atlas.text();
  expect(surface).toContain('Original Battle Royale surface atlas');
  expect(surface).not.toContain('<script');
  expect(surface).not.toMatch(/<script|<foreignObject|href=['\"]https?:/i);

  const source=await request.get(base+'/battle/state?w=1600&h=900');
  expect(source.ok()).toBeTruthy();
  const payload=await source.json(),fixture=JSON.stringify(payload);
  const pages=[];
  try{
    for(const materials of ['on','off']){
      const page=await browser.newPage({viewport:{width:1600,height:900}});
      pages.push(page);
      await page.route('**/battle/state?*',route=>route.fulfill({
        status:200,contentType:'application/json',body:fixture
      }));
      await page.goto(base+'/battle?muted=1&camera=hero&materials='+materials);
      await page.waitForFunction(()=>window.BattleArena3D?.status.frames>0);
      const mode=await page.evaluate(()=>window.BattleArena3D.status.mode);
      if(mode==='webgl2'){
        if(materials==='on'){
          await page.waitForFunction(()=>window.BattleArena3D.status.materialAtlas==='ready',
            null,{timeout:15000});
        }
        const info=await page.evaluate(()=>({...window.BattleArena3D.status}));
        expect(info.materialAtlas).toBe(materials==='off'?'disabled':'ready');
        expect(info.cameraMode).toBe('hero');
        expect(info.lastError).toBeNull();
        await page.screenshot({path:path.join(captures,'material-'+materials+'-hero.png')});
      }
      expect(await page.evaluate(()=>window.__BATTLE_PUBLIC_STATE__.runToken))
        .toBe(payload.snapshot.runToken);
    }
  }finally{
    await Promise.all(pages.map(page=>page.close()));
  }
});
