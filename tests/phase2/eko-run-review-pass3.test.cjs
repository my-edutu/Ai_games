'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDefaultConfig,
  createInitialState,
  createMovementGrayboxRoute,
  stepPlayerKinematic,
  createSnapshot,
  InvariantError,
  resolveCollider,
} = require('../../dist/games/eko-street-run/src/index.js');

function neutral(axis = 0, overrides = {}) {
  return { axis, jumpPressed: false, jumpReleased: false, slide: false, vault: false, ...overrides };
}

test('jump cannot expand a sliding body into a low roof and remains buffered for later clearance', () => {
  const config = createDefaultConfig({ seed: 'eko-pass3-slide-jump-clearance' });
  const route = createMovementGrayboxRoute();
  const player = createInitialState(config).player;
  player.position = { x: 6.5, y: 0 };
  player.velocity = { x: 0, y: 0 };
  player.movementState = 'sliding';
  player.slideTicksRemaining = 8;
  player.coyoteTicksRemaining = config.coyoteTicks;

  const output = stepPlayerKinematic(player, route, neutral(0, { jumpPressed: true }), config, 0);
  assert.equal(output.player.movementState, 'sliding');
  assert.equal(output.player.velocity.y, 0);
  assert.equal(output.jumpStarted, false);
  assert.ok(output.player.jumpBufferTicksRemaining > 0, 'blocked jump should remain buffered');
});

test('fast moving solid sweep cannot tunnel completely through a stationary player between ticks', () => {
  const config = createDefaultConfig({ seed: 'eko-pass3-moving-sweep' });
  const route = createMovementGrayboxRoute();
  route.groundSegments = [{ id: 'sweep-ground', minX: route.minX, maxX: route.maxX, y: 0 }];
  route.slopes = [];
  route.colliders = [{
    id: 'fast-moving-solid',
    minX: 2.5,
    maxX: 3,
    minY: 0,
    maxY: 1.5,
    kind: 'moving',
    motion: { minOffsetX: -2, maxOffsetX: 2, periodTicks: 2 },
  }];
  const player = createInitialState(config).player;
  player.position = { x: 2, y: 0 };
  player.velocity = { x: 0, y: 0 };
  player.movementState = 'grounded';

  const previous = resolveCollider(route.colliders[0], 0, config);
  const current = resolveCollider(route.colliders[0], 1, config);
  assert.ok(previous.maxX < player.position.x - config.playerHalfWidth);
  assert.ok(current.minX > player.position.x + config.playerHalfWidth);

  const output = stepPlayerKinematic(player, route, neutral(), config, 1);
  assert.equal(output.contacts.some(contact => contact.colliderId === 'fast-moving-solid' && contact.kind === 'moving'), true);
  assert.ok(output.player.position.x > current.maxX, `player was not displaced ahead of swept mover: x=${output.player.position.x}`);
});

test('snapshot creation fails closed when the authoritative body extends outside route bounds', () => {
  const config = createDefaultConfig({ seed: 'eko-pass3-snapshot-body-bounds' });
  const state = createInitialState(config);
  state.route = createMovementGrayboxRoute();
  state.player.position = { x: state.route.minX, y: state.route.groundY };
  state.player.velocity = { x: 0, y: 0 };
  state.player.movementState = 'grounded';

  assert.throws(
    () => createSnapshot(state),
    error => error instanceof InvariantError && error.code === 'PLAYER_BODY_OUT_OF_BOUNDS',
  );
});
