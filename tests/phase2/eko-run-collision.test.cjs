'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../dist/games/eko-street-run/src/index.js');

function requirePhase2Api() {
  assert.equal(typeof api.createMovementGrayboxRoute, 'function', 'Phase 2 graybox route factory must exist');
  assert.equal(typeof api.stepPlayerKinematic, 'function', 'Phase 2 kinematic step must exist');
}

function intent(overrides = {}) {
  return { axis: 0, jumpPressed: false, jumpReleased: false, slide: false, vault: false, ...overrides };
}

function setup(seed) {
  requirePhase2Api();
  const config = api.createDefaultConfig({ seed });
  const state = api.createInitialState(config);
  state.route = api.createMovementGrayboxRoute();
  return { config, state };
}

test('fast horizontal motion cannot tunnel through a tall solid', () => {
  const { config, state } = setup('eko-p2-wall');
  state.player.position = { x: 11, y: 0 };
  state.player.velocity = { x: 80, y: 0 };
  state.player.movementState = 'grounded';
  const out = api.stepPlayerKinematic(state.player, state.route, intent({ axis: 1 }), config, 0);
  assert.ok(out.player.position.x <= 11.651, `player crossed wall boundary at ${out.player.position.x}`);
  assert.equal(out.player.velocity.x, 0);
});

test('ceiling contact cancels upward velocity without penetration', () => {
  const { config, state } = setup('eko-p2-ceiling');
  state.player.position = { x: 14.5, y: 0 };
  state.player.velocity = { x: 0, y: 15 };
  state.player.movementState = 'rising';
  let player = state.player;
  let touched = false;
  for (let tick = 0; tick < 20; tick += 1) {
    const out = api.stepPlayerKinematic(player, state.route, intent(), config, tick);
    player = out.player;
    if (out.contacts.some(contact => contact.kind === 'ceiling')) { touched = true; break; }
  }
  assert.equal(touched, true);
  assert.ok(player.velocity.y <= 0);
  assert.ok(player.position.y + config.playerStandingHeight <= 2.201);
});

test('low step is climbable while tall step blocks horizontal travel', () => {
  const { config, state } = setup('eko-p2-steps');
  let player = state.player;
  player.position = { x: 8.2, y: 0 };
  for (let tick = 0; tick < 45; tick += 1) player = api.stepPlayerKinematic(player, state.route, intent({ axis: 1 }), config, tick).player;
  assert.ok(player.position.y >= 0.34, `expected to climb low step, y=${player.position.y}`);
  assert.ok(player.position.x < 11.7, `tall wall should stop player, x=${player.position.x}`);
});

test('slope traversal stays grounded and follows support height without jitter', () => {
  const { config, state } = setup('eko-p2-slope');
  let player = state.player;
  player.position = { x: 17.05, y: 0 };
  player.movementState = 'grounded';
  let airborneTicks = 0;
  for (let tick = 0; tick < 25; tick += 1) {
    player = api.stepPlayerKinematic(player, state.route, intent({ axis: 1 }), config, tick).player;
    if (player.movementState !== 'grounded') airborneTicks += 1;
  }
  assert.equal(airborneTicks, 0);
  assert.ok(player.position.y > 0.2);
});

test('slide uses lower collider and standing is delayed until overhead clearance exists', () => {
  const { config, state } = setup('eko-p2-slide');
  let player = state.player;
  player.position = { x: 5.7, y: 0 };
  for (let tick = 0; tick < 30; tick += 1) {
    player = api.stepPlayerKinematic(player, state.route, intent({ axis: 1, slide: tick === 0 }), config, tick).player;
    if (player.position.x > 7.8) break;
  }
  assert.ok(player.position.x > 7.2, `slide should pass tunnel, x=${player.position.x}`);
  assert.notEqual(player.movementState, 'dead');
});

test('vault crosses eligible low obstacle but cannot target tall wall', () => {
  const { config, state } = setup('eko-p2-vault');
  let player = state.player;
  player.position = { x: 20.1, y: 0.75 };
  player.movementState = 'grounded';
  for (let tick = 0; tick < config.vaultDurationTicks + 4; tick += 1) {
    player = api.stepPlayerKinematic(player, state.route, intent({ axis: 1, vault: tick === 0 }), config, tick).player;
  }
  assert.ok(player.position.x > 21.7, `vault should cross low obstacle, x=${player.position.x}`);

  player = api.createInitialState(config).player;
  player.position = { x: 11, y: 0 };
  player = api.stepPlayerKinematic(player, state.route, intent({ axis: 1, vault: true }), config, 0).player;
  assert.notEqual(player.movementState, 'vaulting');
});

test('moving obstacle contact remains bounded and cannot push through a wall', () => {
  const { config, state } = setup('eko-p2-moving');
  let player = state.player;
  player.position = { x: 24.8, y: 0 };
  for (let tick = 0; tick < 60; tick += 1) {
    const out = api.stepPlayerKinematic(player, state.route, intent(), config, tick);
    player = out.player;
    assert.ok(Number.isFinite(player.position.x));
    assert.ok(player.position.x >= state.route.minX && player.position.x <= state.route.maxX);
  }
});
