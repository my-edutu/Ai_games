'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeQuality,
  qualitySettings,
  interpolationPoint,
  foodBurstKey,
  occupancyRatio,
  decisionSummary,
  inferHeadDirection,
} = require('../../public/snake-stream/render-policy.js');

test('render quality is cosmetic, bounded and defaults to balanced', () => {
  assert.equal(normalizeQuality('low'), 'low');
  assert.equal(normalizeQuality('ULTRA'), 'ultra');
  assert.equal(normalizeQuality('unknown'), 'balanced');

  const low = qualitySettings('low', 3);
  const balanced = qualitySettings('balanced', 3);
  const ultra = qualitySettings('ultra', 3);
  assert.equal(low.pixelRatio, 1);
  assert.ok(low.particleLimit < balanced.particleLimit);
  assert.ok(balanced.particleLimit < ultra.particleLimit);
  assert.ok(ultra.pixelRatio <= 2);
  assert.equal(low.simulationRate, 1);
  assert.equal(ultra.simulationRate, 1);
});

test('portal-sized jumps never interpolate visibly across the arena', () => {
  const halfway = interpolationPoint(10, 89, 10, 0.49);
  const landed = interpolationPoint(10, 89, 10, 0.51);
  assert.equal(halfway.teleported, true);
  assert.deepEqual({ x: halfway.x, y: halfway.y }, { x: 0, y: 1 });
  assert.deepEqual({ x: landed.x, y: landed.y }, { x: 9, y: 8 });

  const normal = interpolationPoint(10, 11, 10, 0.5);
  assert.equal(normal.teleported, false);
  assert.deepEqual({ x: normal.x, y: normal.y }, { x: 0.5, y: 1 });
});

test('food burst keys advance once per authoritative collection, not once per render frame', () => {
  const previous = { runToken: 'run-a', foodsCollected: 4, revision: 10 };
  const next = { runToken: 'run-a', foodsCollected: 5, revision: 11 };
  assert.equal(foodBurstKey(previous, next), 'run-a:5');
  assert.equal(foodBurstKey(next, next), null);
  assert.equal(foodBurstKey(previous, { ...next, foodsCollected: 4 }), null);
});

test('arena occupancy converts authoritative occupied-cell counts into a truthful ratio', () => {
  const ratio = occupancyRatio(10, 28, 16, 0);
  assert.ok(ratio > 0.02 && ratio < 0.023);
  assert.equal(Math.round(ratio * 100), 2);

  const withWalls = occupancyRatio(10, 10, 10, 20);
  assert.equal(withWalls, 0.125);
  assert.equal(occupancyRatio(500, 10, 10, 0), 1);
});

test('AI summaries expose concise facts instead of raw planner diagnostics', () => {
  assert.equal(decisionSummary({ mode: 'seek-food', confidence: 88 }, 0.18), 'Safe food route selected · 88% confidence');
  assert.equal(decisionSummary({ mode: 'follow-tail', confidence: 71 }, 0.42), 'Following tail to reopen safe territory · 71% confidence');
  assert.equal(decisionSummary({ mode: 'preserve-space', confidence: 64 }, 0.82), 'Preserving escape space · arena 82% occupied');
  assert.equal(decisionSummary({ mode: 'fallback-survival', confidence: 5 }, 0.91), 'No planned route passed safety checks · deterministic fallback');
  assert.doesNotMatch(decisionSummary({ mode: 'replan', confidence: 50 }, 0.5), /reachable=|foodDistance=|tail=/);
});

test('head direction follows the neck and remains stable after a portal jump', () => {
  const normal = {
    width: 10,
    snake: [{ cell: 24, role: 'head' }, { cell: 23, role: 'body' }],
    portals: [],
  };
  assert.deepEqual(inferHeadDirection(normal), { x: 1, y: 0 });

  const teleported = {
    width: 10,
    snake: [{ cell: 89, role: 'head' }, { cell: 10, role: 'body' }],
    portals: [{ entry: 11, exit: 89 }],
  };
  const previous = {
    width: 10,
    snake: [{ cell: 10, role: 'head' }, { cell: 0, role: 'body' }],
    portals: [{ entry: 11, exit: 89 }],
  };
  assert.deepEqual(inferHeadDirection(teleported, previous), { x: 1, y: 0 });
});
