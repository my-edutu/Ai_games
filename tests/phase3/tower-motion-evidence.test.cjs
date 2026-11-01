'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assessTowerMotion } = require('../../scripts/tower-motion-evidence.cjs');

function evidence() {
  return Array.from({length: 15}, (_, i) => ({
    atMs: 1000 + i * 1000,
    tick: 100 + i * 20,
    runToken: 'run-a',
    checksum: 'checksum-' + i,
    frames: 15 + i * 3,
    frameMs: { samples: 30 + i, p50: 25, p95: 140, p99: 190 },
    contextLost: false,
    renderErrors: 0,
    canvasHash: i % 3 === 0 ? 'frame-' + i : null,
  }));
}

test('a live changing canvas and advancing source earns a scoped motion-capture pass, not an FPS pass', () => {
  const result = assessTowerMotion(evidence());
  assert.equal(result.scopedPass, true);
  assert.equal(result.wallMs, 14000);
  assert.equal(result.tickDelta, 280);
  assert.equal(result.renderedDelta, 42);
  assert.equal(result.uniqueCanvasFrames, 5);
  assert.equal(result.performanceGate, 'UNVERIFIED: submitted intervals are not presented GPU frames or intended-device FPS');
});

test('fresh renderer submissions cannot conceal a frozen authoritative run', () => {
  const samples = evidence();
  samples.forEach(sample => { sample.tick = 100; sample.checksum = 'same'; });
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('authoritative-ticks-not-advancing'));
});

test('changing checksums and submitted calls cannot conceal identical canvas pixels', () => {
  const samples = evidence();
  samples.forEach(sample => { if (sample.canvasHash) sample.canvasHash = 'frozen-pixels'; });
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('canvas-pixels-not-changing'));
});

test('render failures and missing interval samples block a motion evidence pass', () => {
  const samples = evidence();
  samples[samples.length - 1].renderErrors = 1;
  samples[samples.length - 1].frameMs.samples = 0;
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('renderer-error-or-context-loss'));
  assert.ok(result.blockers.includes('renderer-intervals-not-measured'));
});

test('short or broken capture cannot earn evidence', () => {
  const short = evidence().slice(0, 5);
  assert.equal(assessTowerMotion(short).scopedPass, false);
  const invalid = evidence(); invalid[6].atMs = Number.NaN;
  assert.ok(assessTowerMotion(invalid).blockers.includes('invalid-observation'));
});

test('legitimate source restart between samples preserves capture integrity without claiming a visible transition', () => {
  const samples = evidence();
  for (let i = 7; i < samples.length; i++) {
    samples[i].runToken = 'run-b';
    samples[i].tick = (i - 7) * 20;
  }
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, true);
  assert.equal(result.runTransitions, 1);
  assert.equal(result.tickAdvance, 260);
  assert.equal(result.transitionEvidence, 'OPEN: sampled restart is not proof of rendered death/intermission/restart');
});

test('a tick rollback in one run cannot masquerade as a legitimate restart', () => {
  const samples = evidence();
  samples[7].tick = 10;
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('invalid-observation'));
});

test('a missing public run token blocks the restart integrity decision', () => {
  const samples = evidence();
  delete samples[7].runToken;
  const result = assessTowerMotion(samples);
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('invalid-observation'));
});


test('the 60-second comparison gate rejects formerly sufficient 14-second captures', () => {
  const result = assessTowerMotion(evidence(), { minDurationMs: 60000 });
  assert.equal(result.scopedPass, false);
  assert.ok(result.blockers.includes('capture-too-short'));
  assert.equal(result.minDurationMs, 60000);
});

test('full-cycle evidence needs a real result, intermission and changed authoritative run token', () => {
  const frames = Array.from({ length: 72 }, (_, i) => ({
    atMs: 1000 + i * 1000,
    tick: i < 38 ? Math.min(700, i * 20) : (i - 38) * 20,
    runToken: i < 38 ? 'run-a' : 'run-b',
    checksum: 'checksum-' + i,
    frames: 20 + i * 3,
    frameMs: { samples: 12 + i, p50: 20, p95: 35, p99: 50 },
    contextLost: false,
    renderErrors: 0,
    scene: i === 35 ? 'result' : i === 36 || i === 37 ? 'intermission' : 'running',
    canvasHash: i % 10 === 0 ? 'canvas-' + i : null,
  }));
  const options = { minDurationMs: 60000, requireOutcomeRestart: true };
  const valid = assessTowerMotion(frames, options);
  assert.equal(valid.scopedPass, true, JSON.stringify(valid.blockers));
  assert.equal(valid.runTransitions, 1);
  // A run-token rollover alone does not prove the terminal-to-intermission
  // sequence appeared in the sampled authentic recording.
  const noIntermission = frames.map(frame => ({ ...frame }));
  noIntermission[36].scene = 'running';
  noIntermission[37].scene = 'running';
  const incomplete = assessTowerMotion(noIntermission, options);
  assert.equal(incomplete.scopedPass, false);
  assert.ok(incomplete.blockers.includes('complete-terminal-intermission-restart-not-observed'));
});
