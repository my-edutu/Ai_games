'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../dist/games/eko-street-run/src/index.js');

function move(state, sequence, payload = {}) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 10, sourceId: 'player', sourceSequence: sequence, type: 'move', payload: { axis: 0, ...payload } };
}

function restart(state, sequence) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 0, sourceId: 'player', sourceSequence: sequence, type: 'restart', payload: {} };
}

test('large fall enters bounded stumble then recovers automatically', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-stumble' });
  let state = api.createInitialState(config);
  state.player.position.y = 5;
  state.player.velocity.y = -14;
  state.player.movementState = 'falling';
  let sawStumble = false;
  for (let i = 0; i < 120; i += 1) {
    state = api.stepSimulation(state, []).state;
    if (state.player.movementState === 'stumbling') sawStumble = true;
    if (sawStumble && state.player.movementState === 'grounded') break;
  }
  assert.equal(sawStumble, true);
  assert.equal(state.player.movementState, 'grounded');
  assert.equal(state.player.stumbleTicksRemaining, 0);
});

test('ordinary landing exposes compression feedback without locking horizontal control', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-landing' });
  let state = api.createInitialState(config);
  state.player.position.y = 0.25;
  state.player.velocity.y = -4;
  state.player.movementState = 'falling';
  state = api.stepSimulation(state, [move(state, 1, { axis: 1 })]).state;
  for (let i = 0; i < 8 && state.player.position.y > state.route.groundY; i += 1) state = api.stepSimulation(state, [move(state, i + 2, { axis: 1 })]).state;
  assert.ok(state.player.landingCompressionTicksRemaining > 0);
  const beforeX = state.player.position.x;
  state = api.stepSimulation(state, [move(state, 20, { axis: 1 })]).state;
  assert.ok(state.player.position.x > beforeX, 'landing compression must not lock movement');
});

test('kill plane creates gameplay failure and restart restores a deterministic checkpoint spawn', () => {
  assert.equal(typeof api.createMovementGrayboxRoute, 'function');
  const config = api.createDefaultConfig({ seed: 'eko-p2-restart' });
  let state = api.createInitialState(config);
  state.route = api.createMovementGrayboxRoute();
  state.player.position = { x: 5.75, y: -5.9 };
  state.player.velocity = { x: 0, y: -10 };
  state.player.movementState = 'falling';
  state = api.stepSimulation(state, []).state;
  assert.equal(state.lifecycle, 'failed');
  assert.equal(state.player.movementState, 'dead');
  const failedRecord = state.record.maxProgress;
  state = api.stepSimulation(state, [restart(state, 1)]).state;
  assert.equal(state.lifecycle, 'running');
  assert.equal(state.player.movementState, 'grounded');
  assert.equal(state.player.velocity.x, 0);
  assert.equal(state.player.velocity.y, 0);
  assert.equal(state.player.position.x, state.route.startX);
  assert.equal(state.record.maxProgress, failedRecord);
});
