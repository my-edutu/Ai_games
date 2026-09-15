'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDefaultConfig,
  createInitialState,
  createRenderSnapshot,
  checksumState,
} = require('../../dist/games/eko-street-run/src/index.js');

test('render snapshot is a deeply frozen sanitized projection with no authoritative stream internals', () => {
  const state = createInitialState(createDefaultConfig({ seed: 'eko-render-snapshot' }));
  const before = checksumState(state);
  const snapshot = createRenderSnapshot(state, []);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.player), true);
  assert.equal(Object.isFrozen(snapshot.player.position), true);
  assert.equal(Object.isFrozen(snapshot.route), true);
  assert.equal('randomStreams' in snapshot, false);
  assert.equal('commandWatermarks' in snapshot, false);
  assert.equal(snapshot.player.position === state.player.position, false);
  assert.throws(() => { snapshot.player.position.x = 500; }, TypeError);
  assert.equal(checksumState(state), before);
});

test('render snapshot contains only public gameplay facts needed by future Three.js presentation', () => {
  const state = createInitialState(createDefaultConfig({ seed: 'eko-render-fields' }));
  const snapshot = createRenderSnapshot(state, []);
  assert.equal(snapshot.tick, 0);
  assert.equal(snapshot.lifecycle, 'running');
  assert.equal(snapshot.route.id, 'foundation-straight-001');
  assert.equal(snapshot.route.finishX, 20);
  assert.equal(snapshot.progress, 0);
  assert.deepEqual(snapshot.recentEvents, []);
});
