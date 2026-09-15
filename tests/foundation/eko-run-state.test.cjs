'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TICK_RATE_HZ,
  GAME_VERSION,
  SCHEMA_VERSION,
  DETERMINISTIC_VERSION,
  CONTENT_VERSION,
  createDefaultConfig,
  createInitialState,
  checksumState,
} = require('../../dist/games/eko-street-run/src/index.js');

test('foundation state is versioned, serializable, finite, and starts on the Foundation Route', () => {
  const config = createDefaultConfig({ seed: 'eko-foundation-state' });
  const state = createInitialState(config);

  assert.equal(TICK_RATE_HZ, 60);
  assert.equal(GAME_VERSION, '0.2.0');
  assert.equal(SCHEMA_VERSION, 2);
  assert.equal(DETERMINISTIC_VERSION, 2);
  assert.equal(CONTENT_VERSION, 'movement-2');
  assert.equal(state.tick, 0);
  assert.equal(state.lifecycle, 'running');
  assert.deepEqual(state.player.position, { x: 0, y: 0 });
  assert.deepEqual(state.player.velocity, { x: 0, y: 0 });
  assert.equal(state.route.id, 'foundation-straight-001');
  assert.deepEqual(state.route.checkpointXs, [10]);
  assert.equal(state.route.finishX, 20);
  assert.equal(state.player.checkpointIndex, 0);
  assert.equal(state.player.progress, 0);
  assert.equal(state.player.movementState, 'grounded');
  assert.equal(state.player.vault, null);

  const encoded = JSON.stringify(state);
  const decoded = JSON.parse(encoded);
  assert.deepEqual(decoded, state);
  assert.match(checksumState(state), /^[0-9a-f]{16}$/);

  const numbers = [];
  JSON.stringify(state, (_key, value) => {
    if (typeof value === 'number') numbers.push(value);
    return value;
  });
  assert.equal(numbers.every(Number.isFinite), true);
});

test('independent initial states do not share mutable authoritative objects', () => {
  const config = createDefaultConfig({ seed: 'eko-foundation-isolation' });
  const a = createInitialState(config);
  const b = createInitialState(config);
  a.player.position.x = 3;
  a.commandWatermarks.controller = 9;
  a.route.groundSegments[0].y = 99;
  assert.equal(b.player.position.x, 0);
  assert.equal(b.commandWatermarks.controller, undefined);
  assert.equal(b.route.groundSegments[0].y, 0);
});
