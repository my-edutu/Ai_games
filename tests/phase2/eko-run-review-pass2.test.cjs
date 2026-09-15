'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  COMMAND_SCHEMA_VERSION,
  createDefaultConfig,
  createInitialState,
  createMovementGrayboxRoute,
  stepSimulation,
  stepPlayerKinematic,
  createSnapshot,
  restoreSnapshot,
  checksumState,
} = require('../../dist/games/eko-street-run/src/index.js');

function move(runId, tick, sequence, payload = {}) {
  return {
    schemaVersion: COMMAND_SCHEMA_VERSION,
    runId,
    targetTick: tick,
    priority: 0,
    sourceId: 'phase2-review-pass2',
    sourceSequence: sequence,
    type: 'move',
    payload: { axis: 0, ...payload },
  };
}

function movementState(seed) {
  const config = createDefaultConfig({ seed });
  const state = createInitialState(config);
  state.route = createMovementGrayboxRoute();
  state.player.position = { x: state.route.startX, y: state.route.groundY };
  state.player.velocity = { x: 0, y: 0 };
  state.player.movementState = 'grounded';
  return { config, state };
}

test('snapshot restored mid-vault matches uninterrupted authoritative continuation', () => {
  const { config } = movementState('eko-pass2-mid-vault');
  let { state } = movementState('eko-pass2-mid-vault');
  state.player.position = { x: 20.1, y: 0 };
  state = stepSimulation(state, [move(state.runId, state.tick, 1, { axis: 1, vault: true })], config).state;
  assert.equal(state.player.movementState, 'vaulting');
  assert.ok(state.player.vault && state.player.vault.ticksRemaining > 0);

  const restored = restoreSnapshot(createSnapshot(state));
  let uninterrupted = state;
  let resumed = restored;
  for (let index = 0; index < config.vaultDurationTicks + 5; index += 1) {
    uninterrupted = stepSimulation(uninterrupted, [], config).state;
    resumed = stepSimulation(resumed, [], config).state;
  }
  assert.equal(checksumState(uninterrupted), checksumState(resumed));
  assert.deepEqual(uninterrupted.player, resumed.player);
});

test('vault is rejected when a moving solid will enter the future authoritative body path', () => {
  const { config, state } = movementState('eko-pass2-moving-vault-gate');
  state.player.position = { x: 20.1, y: 0 };
  state.route.colliders.push({
    id: 'future-vault-gate',
    minX: 21.5,
    maxX: 21.8,
    minY: 0.4,
    maxY: 3,
    kind: 'moving',
    motion: { minOffsetX: -2, maxOffsetX: 0, periodTicks: 32 },
  });

  const output = stepSimulation(state, [move(state.runId, state.tick, 1, { axis: 1, vault: true })], config);
  assert.notEqual(output.state.player.movementState, 'vaulting');
  assert.equal(output.events.some(event => event.type === 'player.vaulted'), false);
});

test('authoritative player body remains inside both route boundaries under sustained input', () => {
  const config = createDefaultConfig({ seed: 'eko-pass2-body-bounds' });
  const route = createMovementGrayboxRoute();
  const left = createInitialState(config).player;
  left.position = { x: route.minX + config.playerHalfWidth, y: route.groundY };
  left.velocity = { x: 0, y: 0 };
  left.movementState = 'grounded';

  let player = left;
  for (let tick = 0; tick < 60; tick += 1) {
    player = stepPlayerKinematic(
      player,
      route,
      { axis: -1, jumpPressed: false, jumpReleased: false, slide: false, vault: false },
      config,
      tick,
    ).player;
  }
  assert.ok(
    player.position.x >= route.minX + config.playerHalfWidth - config.quantization,
    `left body escaped route: center=${player.position.x}`,
  );

  player = { ...left, position: { x: route.maxX - config.playerHalfWidth, y: route.groundY }, velocity: { x: 0, y: 0 } };
  for (let tick = 0; tick < 60; tick += 1) {
    player = stepPlayerKinematic(
      player,
      route,
      { axis: 1, jumpPressed: false, jumpReleased: false, slide: false, vault: false },
      config,
      tick,
    ).player;
  }
  assert.ok(
    player.position.x <= route.maxX - config.playerHalfWidth + config.quantization,
    `right body escaped route: center=${player.position.x}`,
  );
});
