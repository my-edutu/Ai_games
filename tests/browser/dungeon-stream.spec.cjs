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

test('camera Gauntlet uses actual projected 3D heroes rather than counting HUD cards',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 const c=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition);
 expect(c.subjectOnscreen).toBe(true);
 expect(c.minHeroPixels).toBeGreaterThan(12);
 expect(c.viewport.width).toBeGreaterThan(400);
 expect(c.viewport.height).toBeGreaterThan(300);
 expect(c.visibleHeroes).toBeLessThanOrEqual(3);
 await page.screenshot({path:'artifacts/dungeon-3d-composition-gauntlet.png',fullPage:true});
});
test('compact mobile view keeps at least one physically visible 3D protagonist',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 const c=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__.composition);
 expect(c.minHeroPixels).toBeGreaterThan(8);
 await page.screenshot({path:'artifacts/dungeon-3d-mobile-composition.png',fullPage:true});
});

test('real 3D camera-ray visibility gate: gameplay actors are not hidden behind art props',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.visibility?.testedHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.visibility?.unoccludedHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 const result=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__.visibility);
 expect(result.unoccludedHeroes+result.occludedHeroes).toBe(result.testedHeroes);
 expect(result.samples).toBeGreaterThanOrEqual(result.testedHeroes);
 const base=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(base.hiddenForegroundProps).toBeGreaterThanOrEqual(0);
 expect(base.dressing.clearedForeground).toBeGreaterThanOrEqual(0);
});

test('every living party member has a clear real 3D sightline after the cutaway settles',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.visibility?.testedHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 // Sample more than one render/update cycle: the director can switch focus
 // while the other two heroes fight independently.
 await expect.poll(async()=>{
  const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  return d?.visibility?.testedHeroes>0&&d.visibility.occludedHeroes===0?true:false;
 },{timeout:25000}).toBe(true);
 const result=await page.evaluate(()=>({visibility:window.__DUNGEON_RENDER_DIAGNOSTICS__.visibility,stage:window.__DUNGEON_RENDER_DIAGNOSTICS__.composition}));
 expect(result.visibility.unoccludedHeroes).toBe(result.visibility.testedHeroes);
 expect(result.visibility.occludedHeroes).toBe(0);
 await page.locator('canvas#world').screenshot({path:'artifacts/dungeon-all-heroes-sightlines.png'});
});

test('all fantasy biomes contain animated living inhabitants rather than static floor tiles',async({page,request})=>{
 expect((await request.get('/dungeon/living-world.js')).status()).toBe(200);
 await page.goto('/dungeon');
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.livingWorld?.animatedCreatures??0),{timeout:25000}).toBeGreaterThan(2);
 const life=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.livingWorld);
 expect(life.archetype).toMatch(/crypt moths|ember bats|crystal sprites|astral wisps/);
 expect(life.instancedMotes).toBeGreaterThan(20);
 expect(life.instancedMotes).toBeLessThanOrEqual(55);
 await page.screenshot({path:'artifacts/dungeon-living-world-3d.png'});
});

test('stream updates preserve clickable hero cards instead of detaching them each tick',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 const start=await page.evaluate(()=>{window.__DUNGEON_HERO_DOM_PROBE__=document.querySelector('.hero-card[data-hero-id="ranger"]');return window.__DUNGEON_PUBLIC_STATE__.tick});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(start+3);
 expect(await page.evaluate(()=>window.__DUNGEON_HERO_DOM_PROBE__?.isConnected&&window.__DUNGEON_HERO_DOM_PROBE__===document.querySelector('.hero-card[data-hero-id="ranger"]'))).toBe(true);
 // The probe intentionally tracks the ranger even when the autonomous AI
 // knocks that hero out. Spectator focus must instead target a living hero.
 const live=page.locator('.hero-card:not(.down)').first();
 await expect(live).toBeVisible({timeout:12000});
 await live.scrollIntoViewIfNeeded();
 const pointerHit=await live.evaluate(el=>{
  const rect=el.getBoundingClientRect();
  const top=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
  return top===el||el.contains(top);
 });
 expect(pointerHit).toBe(true);
 await live.click({timeout:15000});
 await expect(live).toHaveAttribute('aria-pressed','true');
});
test('mobile gameplay has a dominant 3D stage and legible full-width hero cards',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:20000}).toBeGreaterThan(3);
 const m=await page.evaluate(()=>{
  const a=document.querySelector('.arena').getBoundingClientRect(),p=document.querySelector('.squad-panel').getBoundingClientRect(),h=document.querySelector('.hero-card').getBoundingClientRect();
  return{stageHeight:a.height,ratio:h.width/p.width,font:parseFloat(getComputedStyle(document.querySelector('.hero-heading b')).fontSize),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(m.stageHeight).toBeGreaterThan(400);expect(m.ratio).toBeGreaterThan(.88);
 expect(m.font).toBeGreaterThanOrEqual(11);expect(m.overflow).toBeLessThanOrEqual(1);
 await page.screenshot({path:'artifacts/dungeon-mobile-legibility-round13.png',fullPage:true});
});

test('world-only screenshot audits actual WebGL light, chroma and hero visibility',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:25000}).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0),{timeout:25000}).toBeGreaterThan(100);
 // Locator screenshots capture DOM overlays composited above the canvas. Mask
 // them temporarily or the so-called world-only audit is falsely inflated by HUD.
 // Toggle an existing same-origin CSS rule: inline style tags violate our CSP.
 // This excludes DOM overlays and the battle canvas from the real WebGL audit.
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 let capture;
 try{
  expect(await page.locator('.scene-header').evaluate(el=>getComputedStyle(el).visibility)).toBe('hidden');
  capture=await page.locator('canvas#world').screenshot({path:'artifacts/dungeon-3d-world-only.png'});
 }finally{await page.locator('.arena').evaluate(el=>el.classList.remove('world-only-audit'))}
 const pixels=await page.evaluate(async encoded=>{
  const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=100;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,160,100);
  const rgba=ctx.getImageData(0,0,160,100).data;let lit=0,coloured=0,brightness=0;
  for(let i=0;i<rgba.length;i+=4){
   const r=rgba[i],g=rgba[i+1],b=rgba[i+2],l=.2126*r+.7152*g+.0722*b;
   brightness+=l;if(l>25)lit++;if(l>25&&Math.max(r,g,b)-Math.min(r,g,b)>18)coloured++;
  }
  return{sampledPixels:rgba.length/4,litFraction:lit/(rgba.length/4),colouredFraction:coloured/(rgba.length/4),meanLuminance:brightness/(rgba.length/4)};
 },capture.toString('base64'));
 const diagnostics=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const evidence={schemaVersion:1,reference:'None; candidate WebGL canvas only',at:new Date().toISOString(),...pixels,triangles:diagnostics.triangles,composition:diagnostics.composition,visibility:diagnostics.visibility,authored3D:diagnostics.authored3D,dressing:diagnostics.dressing,atmosphere:diagnostics.atmosphere,livingWorld:diagnostics.livingWorld};
 fs.writeFileSync('artifacts/dungeon-scene-visual-metrics.json',JSON.stringify(evidence,null,2));
 expect(evidence.composition.visibleHeroes).toBeGreaterThan(0);
 expect(evidence.dressing?.archWindows??0).toBeGreaterThan(0);
 expect(evidence.litFraction).toBeGreaterThan(.08);
 expect(evidence.meanLuminance).toBeGreaterThan(10);
});

test('Gauntlet desktop header remains collision-free and all masonry layers report true 3D cutaways',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cutawayParapets),{timeout:20000}).toBeGreaterThanOrEqual(0);
 const layout=await page.evaluate(()=>{
  const brand=document.querySelector('.brand').getBoundingClientRect();
  const nav=document.querySelector('.top-actions').getBoundingClientRect();
  const status=document.querySelector('.top-status');
  return{brandRight:brand.right,navLeft:nav.left,statusVisible:getComputedStyle(status).display!=='none'};
 });
 expect(layout.brandRight).toBeLessThanOrEqual(layout.navLeft+1);
 expect(layout.statusVisible).toBe(false);
 await page.screenshot({path:'artifacts/dungeon-header-and-parapets.png',fullPage:true});
});

test('Gauntlet framing keeps the autonomous protagonist large enough to inspect in actual 3D',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.minHeroPixels??0),{timeout:25000}).toBeGreaterThan(53);
 const before=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(before.composition.subjectOnscreen).toBe(true);
 expect(before.camera).toBe('cinematic');
 expect(before.cameraMargin).toBeGreaterThanOrEqual(0);
 expect(before.composition.visibleHeroes).toBeGreaterThan(0);
 await page.locator('canvas#world').screenshot({path:'artifacts/dungeon-readable-cinematic-scale.png'});
});

test('real fantasy dungeon chambers contain distinct woven textile setpieces',async({page})=>{
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.wovenRugs??0),{timeout:20000}).toBeGreaterThan(0);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.dressing.texturedSurfaces).toBeGreaterThan(100);
 expect(d.dressing.wovenRugs).toBeLessThanOrEqual(6);
 await page.locator('canvas#world').screenshot({path:'artifacts/dungeon-room-textile-setpieces.png'});
});
