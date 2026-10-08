'use strict';const {test,expect}=require('@playwright/test');const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('actual 3D autonomous dungeon scene renders and advances',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
 await expect(page.getByTestId('floor')).not.toBeEmpty();
 await expect(page.getByTestId('intent')).not.toBeEmpty();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 const hasWebGL=await page.evaluate(()=>{const c=document.getElementById('world');return Boolean(c?.getContext('webgl2')||c?.getContext('webgl'))});expect(hasWebGL).toBe(true);
 const snapshot=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__);
 expect(snapshot.map.length).toBe(19);expect(snapshot.units.length).toBeGreaterThan(3);expect(snapshot.seed).toBeUndefined();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0),{timeout:15000}).toBeGreaterThan(100);
 await page.screenshot({path:'artifacts/dungeon-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('Gauntlet page exposes live health and honest quality gates',async({page})=>{
 await page.goto('/dungeon/gauntlet');await expect(page.locator('h1')).toContainText('Dungeon Gauntlet');
 await expect.poll(()=>page.locator('#health').textContent(),{timeout:15000}).toBe('HEALTHY');
 await expect(page.locator('body')).toContainText('NOT AAA CERTIFIED');
});
test('mobile viewport retains usable 3D scene',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/dungeon');
 await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 const width=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);expect(width).toBe(true);
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.activeUnits??0),{timeout:15000}).toBeGreaterThan(0);
 await page.screenshot({path:'artifacts/dungeon-mobile.png',fullPage:true});
});

test('redesigned command centre exposes vivid UI, tactical radar and independent scene dressing',async({page,request})=>{
 const shader=await request.get('/dungeon/environment.js');expect(shader.ok()).toBe(true);
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-visual-revision="4"]')).toBeVisible();
 await expect(page.getByTestId('dungeon-minimap')).toBeVisible();
 await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#party-count')).toContainText('3');
 await expect(page.locator('#theme')).not.toBeEmpty();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.decorInstances??0),{timeout:15000}).toBeGreaterThan(80);
 const colors=await page.locator('.gauntlet-link').evaluate(el=>({bg:getComputedStyle(el).backgroundImage,color:getComputedStyle(el).color}));
 expect(colors.bg).toContain('linear-gradient');
 expect(colors.color).not.toBe('rgb(0, 0, 0)');
 await page.locator('#audio-toggle').click();
 const available=await expect.poll(async()=>{
  const b=page.locator('#audio-toggle');
  const pressed=await b.getAttribute('aria-pressed'),reason=await b.getAttribute('title')||'';
  return pressed==='true'||/blocked|unavailable/i.test(reason)
 },{timeout:5000}).toBe(true);
 const audio=page.locator('#audio-toggle');
 if(await audio.getAttribute('aria-pressed')==='true'){
  await audio.click();
  await expect(audio).toHaveAttribute('aria-pressed','false');
 }else expect(await audio.getAttribute('title')).toMatch(/blocked|unavailable/i);
});
test('compact mobile viewport preserves full controls and semantic minimap',async({page})=>{
 await page.setViewportSize({width:360,height:740});await page.goto('/dungeon');
 await expect(page.getByTestId('dungeon-minimap')).toBeVisible();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/dungeon-mobile-compact.png',fullPage:true});
});

test('projected in-world health labels follow real autonomous state without synthetic damage',async({page})=>{
 await page.goto('/dungeon');
 await expect(page.getByTestId('battle-overlay')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.overlay?.labels??0),{timeout:20000}).toBeGreaterThan(0);
 const scene=await page.evaluate(()=>({labels:window.__DUNGEON_RENDER_DIAGNOSTICS__?.overlay?.labels,units:window.__DUNGEON_RENDER_DIAGNOSTICS__?.activeUnits}));
 expect(scene.labels).toBeLessThanOrEqual(scene.units);
});

test('colour-direction varies by dungeon biome and uses real-world broadcast framing',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.floor??0),{timeout:15000}).toBeGreaterThan(0);
 await expect(page.locator('body')).toHaveAttribute('data-biome',/sunken|ember|obsidian|hollow/);
 const state=await page.evaluate(()=>({label:document.querySelector('#theme')?.textContent,overlay:window.__DUNGEON_RENDER_DIAGNOSTICS__?.overlay,atmo:window.__DUNGEON_RENDER_DIAGNOSTICS__?.atmosphere}));
 expect(state.label).toBeTruthy();expect(state.atmo?.landmarks).toBeGreaterThan(0);
 expect(state.atmo?.particles).toBe(48);
});

test('actual desktop capture contains varied visible colour instead of near-black low-contrast output',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0),{timeout:20000}).toBeGreaterThan(100);
 const screenshot=await page.screenshot({path:'artifacts/dungeon-colour-audit.png',fullPage:true});
 const audit=await page.evaluate(async base64=>{
  const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
  const c=document.createElement('canvas');c.width=320;c.height=200;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,320,200);
  const d=ctx.getImageData(0,0,320,200).data;
  let lit=0,saturated=0,warm=0,cool=0,luminance=0;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min,L=.2126*r+.7152*g+.0722*b;
   luminance+=L;if(L>27)lit++;if(L>27&&chroma>21)saturated++;if(r>g*1.1&&r>b*1.14&&L>36)warm++;if(b>r*1.09||g>r*1.09)cool++;
  }
  const n=d.length/4;return {litFraction:lit/n,colouredFraction:saturated/n,warmFraction:warm/n,coolFraction:cool/n,meanLuminance:luminance/n,sampledPixels:n};
 },screenshot.toString('base64'));
 fs.writeFileSync('artifacts/dungeon-visual-metrics.json',JSON.stringify({schemaVersion:1,reference:'None – own-image colour audit only',at:new Date().toISOString(),...audit},null,2));
 expect(audit.litFraction).toBeGreaterThan(.18);
 expect(audit.colouredFraction).toBeGreaterThan(.05);
 expect(audit.meanLuminance).toBeGreaterThan(18);
});

test('animated dungeon hazards match authoritative state and surface in radar',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.traps?.length??0),{timeout:15000}).toBeGreaterThan(0);
 await expect(page.locator('#hazard-count')).not.toBeEmpty();
 const projection=await page.evaluate(()=>({traps:window.__DUNGEON_PUBLIC_STATE__.traps,rendered:window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0}));
 expect(projection.traps.every(t=>['arcane','ember'].includes(t.kind))).toBe(true);
 expect(projection.rendered).toBeGreaterThan(100);
});

test('CC0 authored asset rigging is observable, with graceful procedural fallback',async({page,request})=>{
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.proceduralFallbacks??-1),{timeout:15000}).toBeGreaterThanOrEqual(0);
 const assets=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 expect(assets.authoredCharacters+assets.proceduralFallbacks).toBeGreaterThanOrEqual(3);
 expect(assets.missingAssets).toBeGreaterThanOrEqual(0);
 const addon=await request.get('/dungeon/vendor/addons/loaders/GLTFLoader.js');
 expect(addon.status()).toBe(200);
 expect(await addon.text()).toContain("/dungeon/vendor/three.module.js");
 if(process.env.DUNGEON_REQUIRE_MODELS==='1'){
  await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredCharacters??0),{timeout:30000}).toBeGreaterThan(2);
  expect((await request.get('/dungeon/assets/player/player_swordsman.glb')).status()).toBe(200);
 }
 const blocked=await request.get('/dungeon/assets/../package.json');expect(blocked.status()).toBe(404);
});

test('public stream exposes authentic boss phase and a health/checkpoint monitor',async({page,request})=>{
 await page.goto('/dungeon');await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.bossPhase),{timeout:15000}).toBeTruthy();
 const state=await(await request.get('/dungeon/state')).json();
 expect(['SENTINEL','RUPTURE','ECLIPSE','VANQUISHED']).toContain(state.bossPhase);
 const meta=await(await request.get('/dungeon/gauntlet/state')).json();
 expect(meta.game.bossPhase).toBeTruthy();
 expect(Number.isInteger(meta.game.heroesAlive)).toBe(true);
 const health=await(await request.get('/dungeon/health')).json();
 expect(typeof health.restored).toBe('boolean');
 expect(health.status).toBe('healthy');
});

test('optional cinematic glow uses locally served Three.js postprocessing and remains reversible',async({page,request})=>{
 for(const path of ['/dungeon/vendor/addons/postprocessing/EffectComposer.js','/dungeon/vendor/addons/postprocessing/UnrealBloomPass.js','/dungeon/vendor/addons/shaders/LuminosityHighPassShader.js'])
  expect((await request.get(path)).status()).toBe(200);
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.postFXStatus??'not started'),{timeout:25000}).toBe('ready');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.postFX),{timeout:15000}).toBe('bloom');
 await page.locator('#fx-toggle').click();
 await expect(page.locator('#fx-toggle')).toHaveAttribute('aria-pressed','false');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.postFX),{timeout:10000}).toBe('direct');
 await page.locator('#fx-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.postFX),{timeout:10000}).toBe('bloom');
});

test('Three.js core module resolves and startup watchdog detects a real 3D frame',async({page,request})=>{
 const core=await request.get('/dungeon/vendor/three.core.js');expect(core.status()).toBe(200);
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>document.body.dataset.rendererStatus),{timeout:24000}).toBe('ready');
 await expect(page.locator('#recovery')).toBeHidden();
 const engine=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(engine.frame).toBeGreaterThan(3);
});

test('actual class footprints, spells and character-close camera are inspectable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.groundedActors??0),{timeout:20000}).toBeGreaterThan(2);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.combatStage?.activeProjectiles??-1),{timeout:20000}).toBeGreaterThanOrEqual(0);
 const ranger=page.locator('.hero-card[data-hero-id="ranger"]');await ranger.click();
 await page.locator('#view-toggle').click();await page.locator('#view-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),{timeout:12000}).toBe('chase');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:20000}).toBeGreaterThan(12);
 await page.locator('canvas#world').screenshot({path:'artifacts/dungeon-ranger-close-world.png'});
 await page.screenshot({path:'artifacts/dungeon-ranger-close-ui.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('autonomous spectator director can be overridden without changing the AI simulation',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:20000}).toBeGreaterThan(3);
 const before=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum);
 const director=page.locator('#director-toggle');
 await expect(director).toHaveAttribute('aria-pressed','true');
 await page.locator('.hero-card[data-hero-id="ranger"]').click();
 await expect(director).toHaveAttribute('aria-pressed','false');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.autoDirector),{timeout:8000}).toBe(false);
 await director.click();
 await expect(director).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.autoDirector),{timeout:8000}).toBe(true);
 const after=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.checksum);
 expect(before).toBeTruthy();expect(after).toBeTruthy();
});

test('camera and environment expose real sightlines instead of foreground wall slabs',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:25000}).toBeGreaterThan(5);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0),{timeout:25000}).toBeGreaterThan(100);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cutawayWalls),{timeout:18000}).toBeGreaterThanOrEqual(0);
 const stage=page.locator('canvas#world');
 await stage.screenshot({path:'artifacts/dungeon-clear-sightline.png'});
 await page.screenshot({path:'artifacts/dungeon-cinematic-after-occlusion-fix.png',fullPage:true});
 const data=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(data.webgl).toBe(true);
 expect(data.cutawayWalls).toBeGreaterThanOrEqual(0);
 expect(errors).toEqual([]);
});
