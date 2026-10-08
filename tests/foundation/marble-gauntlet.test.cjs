'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../games/marble-survival/public/complete-runtime');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const renderer = read('renderer3d.js');
const page = read('gauntlet.html');
const board = read('gauntlet.js');
const plan = JSON.parse(read('gauntlet-progress.json'));

test('new 3D character renderer and live dashboard have valid JavaScript syntax', () => {
  for (const file of ['renderer3d.js', 'gauntlet.js', 'gauntlet-ab.js', 'identity-overlay.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
});

test('glass material shading moves with rolling model geometry and cannot affect the race', () => {
  for (const expected of ['float fresnel', 'float coat', 'float ribbonMask', 'vLocalPosition', 'rollingById', 'uPatternType']) {
    assert.ok(renderer.includes(expected), `missing glass shading evidence: ${expected}`);
  }
  for (const forbidden of ['Math.random(', 'forceWinner', 'winnerOverride']) {
    assert.equal(renderer.includes(forbidden), false, `no authority manipulation in renderer: ${forbidden}`);
  }
});

test('stadium renders 3D geometry without editing authoritative obstacles', () => {
  assert.ok(renderer.includes('function drawStadiumScenery'));
  assert.ok(renderer.includes('drawStadiumScenery(arena,theme,viewProjection,camera.eye,snapshot.tick)'));
  assert.ok(renderer.includes("quality==='low'?2:quality==='balanced'?3:5"));
  assert.ok(renderer.includes('drawBox([x,height/2-0.14,0]'));
});

test('director camera applies time-based smoothing independent of refresh rate', () => {
  assert.ok(renderer.includes('smoothedCamera(snapshot,marbles,dt)'));
  assert.ok(renderer.includes('Math.pow(1-0.075,60*clamp(dt,0,0.05))'));
});

test('progress page exposes live metrics and never fabricates visual acceptance', () => {
  assert.ok(page.includes('href="/gauntlet.css"'));
  assert.ok(page.includes('src="/gauntlet.js"'));
  assert.ok(read('index.html').includes('href="/gauntlet.html"'));
  assert.ok(board.includes("fetch('/api/snapshot'"));
  assert.ok(board.includes("fetch('/gauntlet-progress.json'"));
  assert.ok(renderer.includes('window.marbleRenderTelemetry'));
  assert.ok(renderer.includes("new BroadcastChannel('marble-gauntlet-v1')"));
  assert.ok(board.includes("new BroadcastChannel('marble-gauntlet-v1')"));
  assert.ok(plan.comparisonStatus.includes('NOT YET VERIFIED'));
  assert.ok(plan.goals.some((goal) => goal.status === 'blocked'));
  assert.ok(!plan.goals.some((goal) => goal.status === 'verified' && /blind/i.test(goal.name)));
});

test('progress log is versioned and explicitly separates source work from runtime proof', () => {
  assert.equal(plan.schema, 1);
  assert.ok(plan.history.length >= 3);
  assert.ok(plan.history.every((entry) => entry.proof));
  assert.ok(/(critic|inspect|compare|run)/i.test(plan.criticTarget));
});


test('blinded local image critique never uploads screenshots or claims an automatic win', () => {
  const critic = read('gauntlet-ab.js');
  for (const marker of [
    "crypto.getRandomValues(random)",
    "fileAsDataUrl(inputA.files[0])",
    "fileAsDataUrl(inputB.files[0])",
    "independentlyVerified: false",
    "localStorage.setItem",
    "marble-gauntlet-blind-reviews.json",
  ]) assert.ok(critic.includes(marker), `missing review integrity gate: ${marker}`);
  for (const forbidden of ["fetch(", "XMLHttpRequest", "sendBeacon(", "forceWinner"]) {
    assert.equal(critic.includes(forbidden), false, `critic may not transmit or invent outcome: ${forbidden}`);
  }
  assert.ok(read('gauntlet.html').includes('id="ab-voting" hidden'));
  assert.ok(read('gauntlet.html').includes('src="/gauntlet-ab.js"'));
  assert.ok(read('gauntlet.css').includes('.ab-grid'));
});


test('authoritative 3D collisions and vertical launch mechanics are visible in broadcast presentation', () => {
  const gameRoot = path.resolve(__dirname, '../../games/marble-survival/src');
  const physics = fs.readFileSync(path.join(gameRoot, 'physics/solver.ts'), 'utf8');
  const generation = fs.readFileSync(path.join(gameRoot, 'generation/arena.ts'), 'utf8');
  const rules = fs.readFileSync(path.join(gameRoot, 'rules/tournament.ts'), 'utf8');
  const snapshot = fs.readFileSync(path.join(gameRoot, 'presentation/snapshot.ts'), 'utf8');
  const audio = read('audio-director.js');
  const app = read('app.js');
  for (const source of [
    physics.includes('heightDelta * heightDelta'),
    physics.includes('first.verticalVelocity = clampInteger'),
    physics.includes('marble.elevation >= colliderTop'),
    physics.includes('marble.elevation >= top'),
    physics.includes('BUMPER_COLLIDER_TOP'),
    physics.includes('bumper.launchSpeed ?? 0'),
    generation.includes('launchSpeed: roundIndex >= 2'),
    rules.includes("type: 'marble-launched'"),
    snapshot.includes("'marble-launched': ['marbleId', 'colliderId', 'launchSpeed']"),
    audio.includes("event.type === 'marble-launched'"),
    app.includes("event.type === 'marble-launched'"),
    renderer.includes("event.type==='marble-launched'"),
    renderer.includes("bumper.launchSpeed"),
  ]) assert.ok(source, 'authoritative spring/3D evidence missing');
});

test('victory scene is driven solely by an official authoritative champion', () => {
  for (const text of [
    'function drawVictoryCeremony',
    "['tournament-result','intermission'].includes(authority.lifecycle)",
    'const championId=authority.camera?.championId',
    'Number.isInteger(championId)',
    "champion.status==='eliminated'",
    'drawVictoryCeremony(snapshot,marbles,arena,viewProjection,camera.eye,now)',
  ]) assert.ok(renderer.includes(text), `missing authority-backed victory guard: ${text}`);
  assert.equal(renderer.includes('forceWinner'), false);
});
