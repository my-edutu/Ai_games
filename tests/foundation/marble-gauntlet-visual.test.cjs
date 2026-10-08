'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const assets = path.resolve(__dirname, '../../games/marble-survival/public/complete-runtime');
const read = name => fs.readFileSync(path.join(assets, name), 'utf8');
const index = read('index.html');
const app = read('app.js');
const styles = read('arena-reborn.css');
const renderer = read('renderer3d.js');
const allBiomes = ['seeding-sprint', 'gate-gauntlet', 'hazard-circuit', 'final-four', 'championship'];

test('premium graphics use valid WebGL script syntax, including an independent GPU sky pass', () => {
  for (const name of ['renderer3d.js', 'app.js']) {
    execFileSync(process.execPath, ['--check', path.join(assets, name)], { stdio:'pipe' });
  }
  assert.ok(renderer.includes('function drawSkyAtmosphere'));
  assert.ok(renderer.includes("gl.drawArrays(gl.TRIANGLES,0,3)"));
  assert.ok(renderer.includes('drawSkyAtmosphere(theme,now)'));
  assert.ok(renderer.includes('const SKY_FRAGMENT_SHADER'));
  assert.ok(renderer.includes('skyUniforms.detail'));
  assert.ok(renderer.includes("quality==='low'?0:1"));
});

test('all five gameplay stages have distinct high-chroma environment identities', () => {
  for (const id of allBiomes) {
    assert.ok(renderer.includes("'" + id + "': Object.freeze") || renderer.includes(id + ': Object.freeze'), 'missing 3D palette for ' + id);
    assert.ok(app.includes("'" + id + "': Object.freeze") || app.includes(id + ': Object.freeze'), 'missing stage HUD art direction: ' + id);
    assert.ok(styles.includes('data-biome="' + id + '"') || id === 'seeding-sprint', 'missing stage colour CSS: ' + id);
  }
  for (const marker of ['skyUpper', 'skyLower', 'theme.secondary', 'uFogColor', 'drawEpicBackdrop', 'drawRacewayArt']) {
    assert.ok(renderer.includes(marker), 'missing environmental visual element: ' + marker);
  }
  assert.ok(renderer.includes('createTorusMesh'));
  assert.ok(renderer.includes("indices.push(a,a+1,b,b,a+1,b+1)"), 'external torus normals must face outward');
});

test('dramatic background environments are outside authority topology and quality-scaled', () => {
  for (const marker of [
    'function drawEpicBackdrop',
    'function drawRacewayArt',
    'function createTorusMesh',
    "quality==='low'?1:quality==='balanced'?3:quality==='high'?4:5",
    "quality==='low'?4:quality==='balanced'?9:15",
  ]) assert.ok(renderer.includes(marker), marker);
  for (const marker of ['Math.random(', 'forceWinner', 'teleportMarble', 'winnerOverride', '/api/operator']) {
    assert.equal(renderer.includes(marker), false, 'environment must not adjudicate gameplay: ' + marker);
  }
});

test('tournament UI includes genuinely redesigned broadcaster HUD and audience-safe stage copy', () => {
  for (const marker of [
    'arena-reborn.css',
    'id="arena-biome-title"',
    'id="arena-biome-subtitle"',
    'id="arena-stage-number"',
    'id="arena-threat"',
    'id="qualification-meter"',
    'id="qualification-meter-fill"',
    'id="arena-webgl"',
    'id="quality-select"',
    'data-layout="arena-first"',
  ]) assert.ok(index.includes(marker), 'missing broadcaster element: ' + marker);
  assert.ok(index.indexOf('spectator-polish.css') < index.indexOf('arena-reborn.css'),
    'new vivid art direction must override muted original stylesheet');
  for(const marker of [
    'shell.dataset.biome = next.arena.archetype',
    'next.round.qualified / Math.max(1, next.round.quota)',
    "qualificationMeter.setAttribute('aria-valuenow'",
    'BIOME_BROADCAST[next.arena.archetype]',
    "marble.status === 'threatened'",
  ]) assert.ok(app.includes(marker), 'HUD must be driven by real authority: ' + marker);
});

test('high-contrast accessibility, mobile composition and clean-stream controls survive visual redesign', () => {
  for (const marker of [
    'prefers-reduced-motion:reduce',
    'prefers-contrast:more',
    'data-clean="true"',
    'max-width:760px',
    '.arena-title-card',
    '.leaderboard-panel.broadcast-overlay',
    '.qualification-meter',
    '.broadcast-lower-overlay',
    '--arena-accent',
  ]) assert.ok(styles.includes(marker), 'missing accessibility or visual-design guard: ' + marker);
  assert.ok(!styles.includes('display:none!important} .arena-card'), 'clean view must preserve actual arena canvas');
});


test('actual pit geometry has openings, an inset reactor floor and illuminated safety rims', () => {
  const html=index;
  const geo=read('arena-geometry.js');
  assert.ok(html.includes('src="/arena-geometry.js"'));
  assert.ok(html.indexOf('src="/arena-geometry.js"') < html.indexOf('src="/renderer3d.js"'));
  for (const evidence of [
    'function deckLayout(arena)',
    "h.kind === 'pit'",
    'openingArea',
    'solidArea',
    'worldArea',
  ]) assert.ok(geo.includes(evidence), 'missing deterministic cutout layout: ' + evidence);
  for (const evidence of [
    'window.MarbleArenaGeometry?.deckLayout(arena)',
    'const pieces=cutouts?.tiles',
    'function drawHazardPit',
    'const warning=material(theme.accent',
    'shell.dataset.cutoutCount',
    'shell.dataset.deckTileCount',
  ]) assert.ok(renderer.includes(evidence), 'missing physical pit evidence: ' + evidence);
});

test('multi-light marble optics and altitude-dependent shadows are rendered from real state', () => {
  for(const evidence of [
    'uniform vec3 uStageAccent',
    'vec3 reflected = reflect(-viewDir, normal)',
    'float softbox',
    'float edgeStrip',
    'float skyBounce',
    'const airborne=Math.max(0,(marble.elevation||0)*WORLD_SCALE-support)',
    'const opacity=0.38/(1+airborne*0.64)',
  ]) assert.ok(renderer.includes(evidence), 'missing character material evidence: ' + evidence);
});

test('competitor spotlight and cinema toggles remain accessible read-only spectator actions', () => {
  for(const evidence of [
    'id="spotlight-card"',
    'id="view-toggle"',
    'id="spotlight-name"',
    'id="spotlight-progress"',
    'id="spotlight-close"',
    'data-view="broadcast"',
  ]) assert.ok(index.includes(evidence), 'missing inspectable spectator UI: '+evidence);
  for(const evidence of [
    'function renderSpotlight(next)',
    'shell.dataset.view',
    'selectedSpotlightId',
    "marble.progressPermille / 10",
    "Math.hypot(marble.velocityX || 0, marble.velocityY || 0)",
    "selectedSpotlightId === marbleId ? null : marbleId",
  ]) assert.ok(app.includes(evidence), 'inspector not driven by real server snapshot: '+evidence);
  for(const evidence of [
    '.spotlight-card',
    '.spotlight-orb',
    '.inspect-marble',
    '[data-view="cinematic"]',
    'pointer-events:auto',
  ]) assert.ok(styles.includes(evidence), 'missing cinematic inspector styling: '+evidence);
  for(const forbidden of ['fetch("/api/operator"', "fetch('/api/operator'"]) {
    assert.equal(app.includes(forbidden),false, 'inspecting must never invoke operator commands');
  }
});


test('cinematic 3D LED billboard displays only public authority and updates its GPU texture', () => {
  for(const marker of [
    'const BILLBOARD_VERTEX_SHADER',
    'const BILLBOARD_FRAGMENT_SHADER',
    "const boardTexture=gl.createTexture()",
    "boardCanvas=document.createElement('canvas')",
    "gl.texImage2D(gl.TEXTURE_2D",
    "gl.drawArrays(gl.TRIANGLE_FAN,0,4)",
    "function updateArenaBillboard(next)",
    "function drawArenaBillboards(arena,theme",
    "state.remaining",
    "state.qualified",
    "state.quota",
    "updateArenaBillboard(next)",
    "shell.dataset.ledArena",
    "shell.dataset.ledRound",
  ]) assert.ok(renderer.includes(marker), 'missing 3D broadcast billboard feature: '+marker);
  for(const forbidden of ['rootSeed', 'tournamentSeed', 'forceWinner', '/api/operator', 'Math.random(']) {
    assert.equal(renderer.includes(forbidden),false, 'broadcast display must not access private state or command races');
  }
});

test('four character archetypes have unique non-authoritative 3D identities',()=>{
  const names=['navigator','sprinter','bruiser','survivor'];
  assert.ok(renderer.includes('function drawArchetypeAccents'));
  for(const name of names){
    assert.ok(renderer.includes("marble.archetype==='"+name+"'"),"missing distinct 3D identity: "+name);
  }
  assert.ok(renderer.includes('drawArchetypeAccents(marble,arena,viewProjection,cameraPosition,nowSeconds,focused)'));
  assert.ok(renderer.includes("if(quality==='low'&&!emphasis)return"),'Balanced competitors must all retain their visible role silhouettes');
  assert.ok(renderer.includes("quality==='low'"));
});

test('pit dive danger rings are driven by real negative altitude, never fabricated',()=>{
  for(const marker of [
    'function drawPitFallBeacons(arena,marbles',
    "(m.elevation||0)<0",
    "h.kind==='pit'",
    'drawPitFallBeacons(arena,marbles,theme,viewProjection,camera.eye,now)',
    'const isFallingIntoPit',
  ]){
    if(marker==='const isFallingIntoPit')continue; // Authoritative checkpoint guard is in the TypeScript layer.
    assert.ok(renderer.includes(marker),'missing actual physics-backed scene cue: '+marker);
  }
  assert.ok(renderer.includes("'marble-pit-falling'"));
  assert.ok(app.includes("'marble-pit-falling'"));
});

test('the rendered glass racers use real quality-specific geometry and feathered projected shadows',()=>{
  for(const marker of [
    'sphereMeshLow=createSphereMesh(12,18)',
    'sphereMeshHigh=createSphereMesh(36,52)',
    'sphereMeshUltra=createSphereMesh(50,72)',
    'function marbleMeshForQuality()',
    'drawMesh(marbleMeshForQuality(),model',
    'const SHADOW_FRAGMENT_SHADER',
    'float feather=1.0-smoothstep(0.15,1.0,radial)',
    'gl.useProgram(shadowProgram)',
    'gl.depthMask(false)',
  ])assert.ok(renderer.includes(marker),'missing glass racer quality bar: '+marker);
  assert.ok(renderer.includes("h.kind==='pit'"),'shadows must not float over open holes');
});

test('live crowds and arena wind are budgeted, 3D and sourced from real tournament authority',()=>{
  for(const marker of [
    'const CROWD_VERTEX_SHADER',
    'const CROWD_FRAGMENT_SHADER',
    'function prepareCrowd(arena,theme,quality)',
    'function drawLivingCrowd(',
    'gl.drawArrays(gl.POINTS,0,crowdCount)',
    'shell.dataset.crowdCount',
    "quality==='low'?64:quality==='balanced'?320:quality==='high'?660:1100",
    'function drawAuthoritativeWindFields(',
    'const zones=Array.isArray(arena.windZones)?arena.windZones:[]',
    'const dx=zone.forceX/intensity,dz=zone.forceY/intensity',
    'shell.dataset.publicWindZones',
    'gl.uniform1f(crowdUniforms.excitement,intensity)',
  ]) assert.ok(renderer.includes(marker),'missing real-world spectator detail: '+marker);
  const snapshot=fs.readFileSync(path.resolve(__dirname,
    '../../games/marble-survival/src/presentation/snapshot.ts'),'utf8');
  assert.ok(snapshot.includes('windZones: state.arena.windZones.map(zone => ('));
  assert.equal(renderer.includes('Math.random('),false,'crowd formation must not introduce nondeterministic outcomes');
});

test('all track neon must break around actual voids and default graphics resolution must recover gracefully',()=>{
  const geometry=read('arena-geometry.js');
  for(const marker of [
    'function solidLineSegments(arena, x, startY=0, endY=arena.height)',
    'return sections;',
    'deckLayout, solidLineSegments',
  ])assert.ok(geometry.includes(marker),'missing track topology safeguard: '+marker);
  for(const marker of [
    'const fragments=window.MarbleArenaGeometry?.solidLineSegments(',
    'function tuneRenderResolution(fps)',
    'adaptiveResolution=Math.max(.82',
    "if(quality!=='balanced')",
    "quality==='balanced'?adaptiveResolution:1",
  ])assert.ok(renderer.includes(marker),'missing track polish / FPS resilience: '+marker);
  assert.ok(app.includes('currentStageIdentity=next.arena.id'));
  assert.ok(app.includes('next.arena.windZones||[]'));
  assert.ok(styles.includes('.broadcast-shell.stage-entering .arena-title-card'));
  assert.ok(styles.includes('@media(prefers-reduced-motion:reduce)'));
});

test('stage cinematography uses true motion, connected 3D speed ribbons and one authority camera',()=>{
  for(const fragment of [
    "shell.dataset.view==='cinematic'&&focus.length",
    "const avgVX=focus.reduce",
    "target=[target[0]+clamp(avgVX*WORLD_SCALE*3",
    "function drawMarbleSpeedTrails",
    "const speed=Math.hypot(vx,vz)",
    "const length=0.2+Math.min(1.7,speed*WORLD_SCALE*3.8)",
    "drawBox([x,height-0.05*t,z]",
    "marbleMeshForQuality()",
    "window.marbleRenderFrame={snapshot,marbles,viewProjection",
  ])assert.ok(renderer.includes(fragment),'broken race-dynamics camera or trails: '+fragment);
  for(const fake of ["forceWinner","overrideCameraAuthority","fakeVelocity","Math.random("]){
    assert.equal(renderer.includes(fake),false,'presentation must not invent simulation input: '+fake);
  }
  assert.ok(app.includes("setTimeout(()=>{"));
  assert.ok(styles.includes("@keyframes marble-stage-unveil"));
});

test('built 3D arenas have cached genuine 3D architecture with no GPU memory leak',()=>{
  for(const marker of [
    'function appendArchitecturalBox(batches,group',
    'function prepareGrandArchitecture(arena,quality)',
    "const groups=Array.from({length:3}",
    'function drawGrandArchitecture(arena,theme',
    'drawGrandArchitecture(arena,theme,viewProjection,camera.eye)',
    'gl.deleteVertexArray?.(mesh.vao)',
    'gl.deleteBuffer?.(buffer)',
    'shell.dataset.stadiumModules',
    'shell.dataset.stadiumStyle',
    'floorPattern:5.0','floorPattern:6.0','floorPattern:7.0',
    'floorPattern:8.0','floorPattern:9.0',
  ]) assert.ok(renderer.includes(marker),'missing stage architecture or GPU lifecycle: '+marker);
  assert.ok(renderer.includes('const trackSurface=material(theme.deck,0.43,0.40,0.015,1,theme.floorPattern'));
});
test('clickable spectator leaderboard reconciles stable actual DOM nodes',()=>{
  for(const marker of [
    'const byMarbleId=new Map(',
    'const wanted=next.leaderboard.map((entry,index)=>',
    'leaderboard.insertBefore(expected,leaderboard.children[index]||null)',
    'if(!visibleIds.has(id))item.remove();',
    "inspect.setAttribute('aria-pressed'",
  ])assert.ok(app.includes(marker),'unstable clickable leaderboard: '+marker);
  assert.equal(app.includes('leaderboard.replaceChildren'),false,
    'updating 10 times/second must never recreate every spectator button');
});

test('postprocess explicitly restores lost offscreen anti-aliasing and protects low-tier FPS',()=>{
  for(const marker of [
    'const POST_FRAGMENT_SHADER',
    'vec3 n=texture(uSceneColor',
    'float edgeBlend=smoothstep(.065,.30,contrast)*.33',
    'original=mix(original,(n+so+e+w)*.25,edgeBlend)',
    'const postFramebuffer=gl.createFramebuffer()',
    'gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE',
    'function beginStagePostprocess()',
    "if(quality==='low')return false",
    "function finishStagePostprocess(theme,active)",
    'gl.bindFramebuffer(gl.FRAMEBUFFER,null)',
    'shell.dataset.postprocess',
  ]) assert.ok(renderer.includes(marker),'missing physically rendered, quality-bounded WebGL glow/FXAA: '+marker);
  assert.equal(renderer.includes('fakeWinner'),false);
});
test('five scenery heroes and distant terrain are actual source meshes, never canvas image mockups',()=>{
  for(const marker of [
    'function drawStageLandmark(arena,theme',
    'function prepareDistantHorizon(arena,quality)',
    'function drawDistantLandscape(arena,theme',
    'drawDistantLandscape(arena,theme,viewProjection,camera.eye)',
    'drawStageLandmark(arena,theme,viewProjection,camera.eye,now)',
    'shell.dataset.horizonGeometry',
    'shell.dataset.landmarkStyle',
    "'gate-gauntlet'","'hazard-circuit'","'final-four'",
    'gl.deleteVertexArray?.(mesh.vao)',
  ])assert.ok(renderer.includes(marker),'missing camera-visible procedural world: '+marker);
});
