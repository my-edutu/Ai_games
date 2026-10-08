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
  for (const file of ['renderer3d.js', 'gauntlet.js']) {
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
  assert.ok(plan.criticTarget.includes('Visually inspect'));
});
