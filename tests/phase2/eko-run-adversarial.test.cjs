'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../dist/games/eko-street-run/src/index.js');

function neutral(overrides = {}) {
  return { axis: 0, jumpPressed: false, jumpReleased: false, slide: false, vault: false, ...overrides };
}

function move(state, sourceId, sequence, priority, payload = {}) {
  return {
    schemaVersion: 1,
    runId: state.runId,
    targetTick: state.tick,
    priority,
    sourceId,
    sourceSequence: sequence,
    type: 'move',
    payload: { axis: 0, ...payload },
  };
}

function restart(state, sequence = 1) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 0, sourceId: 'player', sourceSequence: sequence, type: 'restart', payload: {} };
}

function movementStateAtEdge(config) {
  const route = api.createMovementGrayboxRoute();
  let player = api.createInitialState(config).player;
  player.position = { x: 2.72, y: 0 };
  player.movementState = 'grounded';
  for (let tick = 0; tick < 30; tick += 1) {
    player = api.stepPlayerKinematic(player, route, neutral({ axis: 1 }), config, tick).player;
    if (player.movementState === 'falling') return { player, route, tick: tick + 1 };
  }
  throw new Error('fixture never left the platform edge');
}

test('walk-off-edge coyote is real and expires after the configured grace window', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-real-coyote' });
  const first = movementStateAtEdge(config);
  const jumped = api.stepPlayerKinematic(first.player, first.route, neutral({ jumpPressed: true }), config, first.tick).player;
  assert.equal(jumped.movementState, 'rising');
  assert.ok(jumped.velocity.y > 0);

  const second = movementStateAtEdge(config);
  let expired = second.player;
  let tick = second.tick;
  for (let i = 0; i < config.coyoteTicks + 2; i += 1) {
    expired = api.stepPlayerKinematic(expired, second.route, neutral(), config, tick++).player;
  }
  const denied = api.stepPlayerKinematic(expired, second.route, neutral({ jumpPressed: true }), config, tick).player;
  assert.notEqual(denied.movementState, 'rising');
  assert.ok(denied.velocity.y <= 0);
});

test('moving solid cannot overlap a stationary player without deterministic separation', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-moving-separation' });
  const route = api.createMovementGrayboxRoute();
  let player = api.createInitialState(config).player;
  player.position = { x: 24.8, y: 0 };
  player.movementState = 'grounded';
  const tick = 30;
  player = api.stepPlayerKinematic(player, route, neutral(), config, tick).player;
  const moving = api.resolveCollider(route.colliders.find(item => item.id === 'moving-block'), tick, config);
  const playerMinX = player.position.x - config.playerHalfWidth;
  const playerMaxX = player.position.x + config.playerHalfWidth;
  const overlaps = playerMaxX > moving.minX + config.collisionSkin && playerMinX < moving.maxX - config.collisionSkin;
  assert.equal(overlaps, false, `moving block overlapped player at x=${player.position.x}`);
});

test('vault is rejected when the authoritative body path lacks overhead clearance', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-vault-clearance' });
  const route = api.createMovementGrayboxRoute();
  route.colliders.push({ id: 'vault-roof-test', minX: 20.0, maxX: 22.0, minY: 1.0, maxY: 2.6, kind: 'solid' });
  let player = api.createInitialState(config).player;
  player.position = { x: 20.1, y: 0 };
  player.movementState = 'grounded';
  const out = api.stepPlayerKinematic(player, route, neutral({ axis: 1, vault: true }), config, 0);
  assert.notEqual(out.player.movementState, 'vaulting');
  assert.equal(out.vaultStarted, false);
});

test('restart checkpoint spawn ignores overhead collider tops', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-safe-restart-spawn' });
  let state = api.createInitialState(config);
  state.route = api.createMovementGrayboxRoute();
  state.route.checkpointXs = [6];
  state.player.checkpointIndex = 1;
  state.player.position = { x: 6, y: state.route.killPlaneY };
  state.player.velocity = { x: 0, y: 0 };
  state.player.movementState = 'dead';
  state.lifecycle = 'failed';
  state = api.stepSimulation(state, [restart(state)]).state;
  assert.equal(state.lifecycle, 'running');
  assert.equal(state.player.position.x, 6);
  assert.equal(state.player.position.y, 0, 'restart must use authored/ground support, not slide-roof top');
});

test('only the deterministic winning move command is accepted and applied', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-command-conflict' });
  const state = api.createInitialState(config);
  const winner = move(state, 'human', 1, 0, { axis: 1 });
  const loser = move(state, 'ai', 1, 10, { axis: -1 });
  const out = api.stepSimulation(state, [loser, winner]);
  assert.equal(out.acceptedCommands.filter(command => command.type === 'move').length, 1);
  assert.equal(out.rejectedCommands.some(item => item.reason === 'MOVE_CONFLICT'), true);
  assert.ok(out.state.player.velocity.x > 0);
});

test('checksum includes movement timers and route geometry that affect outcomes', () => {
  const config = api.createDefaultConfig({ seed: 'eko-p2-checksum-coverage' });
  const a = api.createInitialState(config);
  const b = structuredClone(a);
  b.player.coyoteTicksRemaining = 1;
  assert.notEqual(api.checksumState(a), api.checksumState(b));
  const c = structuredClone(a);
  c.route.colliders.push({ id: 'checksum-solid', minX: 2, maxX: 3, minY: 0, maxY: 1, kind: 'solid' });
  assert.notEqual(api.checksumState(a), api.checksumState(c));
});
