'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../dist/games/eko-street-run/src/index.js');

function input(state, sequence, payload = {}) {
  return {
    schemaVersion: 1,
    runId: state.runId,
    targetTick: state.tick,
    priority: 10,
    sourceId: 'player',
    sourceSequence: sequence,
    type: 'move',
    payload: { axis: 0, ...payload },
  };
}

function advance(state, command) {
  return api.stepSimulation(state, command ? [command] : []).state;
}

function jumpApex(seed, releaseTick) {
  let state = api.createInitialState(api.createDefaultConfig({ seed }));
  let seq = 1;
  state = advance(state, input(state, seq++, { jumpPressed: true }));
  let apex = state.player.position.y;
  for (let i = 1; i < 90; i += 1) {
    const command = i === releaseTick ? input(state, seq++, { jumpReleased: true }) : undefined;
    state = advance(state, command);
    apex = Math.max(apex, state.player.position.y);
    if (i > 5 && state.player.movementState === 'grounded') break;
  }
  return apex;
}

test('grounded jump command launches the player immediately', () => {
  let state = api.createInitialState(api.createDefaultConfig({ seed: 'eko-p2-jump' }));
  state = advance(state, input(state, 1, { jumpPressed: true }));
  assert.equal(state.player.movementState, 'rising');
  assert.ok(state.player.velocity.y > 0);
  assert.ok(state.player.position.y > state.route.groundY);
});

test('coyote jump consumes remaining grace while airborne', () => {
  let state = api.createInitialState(api.createDefaultConfig({ seed: 'eko-p2-coyote' }));
  state.player.position.y = 0.25;
  state.player.velocity.y = -1;
  state.player.movementState = 'falling';
  state.player.coyoteTicksRemaining = 2;
  state = advance(state, input(state, 1, { jumpPressed: true }));
  assert.equal(state.player.movementState, 'rising');
  assert.ok(state.player.velocity.y > 0);
  assert.equal(state.player.coyoteTicksRemaining, 0);
});

test('jump buffer fires on first legal landing tick', () => {
  let state = api.createInitialState(api.createDefaultConfig({ seed: 'eko-p2-buffer' }));
  state.player.position.y = 0.14;
  state.player.velocity.y = -4;
  state.player.movementState = 'falling';
  state.player.coyoteTicksRemaining = 0;
  state = advance(state, input(state, 1, { jumpPressed: true }));
  for (let i = 0; i < 4 && state.player.movementState !== 'rising'; i += 1) state = advance(state);
  assert.equal(state.player.movementState, 'rising');
  assert.ok(state.player.velocity.y > 0);
});

test('early jump release produces a meaningfully lower apex', () => {
  const held = jumpApex('eko-p2-held', -1);
  const cut = jumpApex('eko-p2-cut', 3);
  assert.ok(held > 1.5, `held apex ${held} should be a real jump`);
  assert.ok(cut < held - 0.35, `cut apex ${cut} should be below held apex ${held}`);
});

test('ground deceleration stops faster than passive airborne steering', () => {
  let grounded = api.createInitialState(api.createDefaultConfig({ seed: 'eko-p2-brake-ground' }));
  let airborne = api.createInitialState(api.createDefaultConfig({ seed: 'eko-p2-brake-air' }));
  grounded.player.velocity.x = 6;
  airborne.player.velocity.x = 6;
  airborne.player.position.y = 2;
  airborne.player.movementState = 'falling';
  grounded = advance(grounded, input(grounded, 1, { axis: 0 }));
  airborne = advance(airborne, input(airborne, 1, { axis: 0 }));
  assert.ok(Math.abs(grounded.player.velocity.x) < Math.abs(airborne.player.velocity.x));
});
