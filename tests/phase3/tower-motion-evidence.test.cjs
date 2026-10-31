'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assessTowerMotion } = require('../../scripts/tower-motion-evidence.cjs');

function evidence() {
  return Array.from({length: 15}, (_, i) => ({
    atMs: 1000 + i * 1000,
    tick: 100 + i * 20,
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
