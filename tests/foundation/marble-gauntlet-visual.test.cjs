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
