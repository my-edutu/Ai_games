'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  NamedRng,
  createMarbleSnapshot,
  generateMarbleArena,
  marbleStateChecksum,
  parseMarbleConfig,
  stepMarblePhysics,
} = require('../../dist/games/marble-survival/src/index.js');

test('physics v2 initializes deterministic vertical state and versioned snapshot contract', () => {
  const config = parseMarbleConfig({
    rosterSize: 4,
    roundQuotas: [2, 1, 1, 1, 1],
    roundIntroTicks: 0,
  });

  assert.equal(config.gravityPerTick, 18);
  assert.equal(config.maxVerticalSpeed, 480);

  const runtime = MarbleRuntime.create(config, 'vertical-contract');
  assert.equal(runtime.state.determinismVersion, 'marble-physics-v2');

  for (const marble of runtime.state.marbles) {
    assert.equal(marble.elevation, 0);
    assert.equal(marble.verticalVelocity, 0);
    assert.equal(marble.grounded, true);
    assert.equal(Number.isSafeInteger(marble.elevation), true);
    assert.equal(Number.isSafeInteger(marble.verticalVelocity), true);
  }

  const snapshot = createMarbleSnapshot(runtime);
  assert.equal(snapshot.deterministicVersion, 'marble-physics-v2');
  assert.equal(snapshot.payload.state.determinismVersion, 'marble-physics-v2');
});

test('gate gauntlet generation contains a bounded authoritative ramp surface', () => {
  const config = parseMarbleConfig({
    rosterSize: 8,
    roundQuotas: [4, 2, 1, 1, 1],
  });
  const arena = generateMarbleArena(config, 1, NamedRng.fromSeed('factory-ramp-generation'));

  assert.ok(Array.isArray(arena.ramps));
  assert.ok(arena.ramps.length >= 1);
  const ramp = arena.ramps[0];
  assert.equal(ramp.kind, 'ramp');
  assert.equal(ramp.axis, 'y');
  assert.ok(Number.isSafeInteger(ramp.startElevation));
  assert.ok(Number.isSafeInteger(ramp.endElevation));
  assert.notEqual(ramp.startElevation, ramp.endElevation);
  assert.ok(ramp.x >= 0 && ramp.x + ramp.width <= arena.width);
  assert.ok(ramp.y >= 0 && ramp.y + ramp.height <= arena.height);
});

test('ramp traversal changes authoritative elevation and stays replay deterministic', () => {
  const runtime = MarbleRuntime.create({
    rosterSize: 2,
    roundQuotas: [1, 1, 1, 1, 1],
    roundIntroTicks: 0,
    frictionPermille: 1_000,
  }, 'vertical-ramp-replay');

  const state = structuredClone(runtime.state);
  state.arena.obstacles = [];
  state.arena.bumpers = [];
  state.arena.hazards = [];
  state.arena.windZones = [];
  state.arena.sweepers = [];
  state.arena.ramps = [{
    id: 'test-ramp',
    kind: 'ramp',
    x: 9_000,
    y: 9_000,
    width: 6_000,
    height: 3_000,
    axis: 'y',
    startElevation: 1_200,
    endElevation: 0,
  }];
  state.activeIds = [0];
  state.marbles[1].status = 'eliminated';
  state.marbles[1].roundStatus = 'out';
  const marble = state.marbles[0];
  marble.position = { x: 12_000, y: 12_500 };
  marble.velocity = { x: 0, y: -300 };
  marble.elevation = 0;
  marble.verticalVelocity = 0;
  marble.grounded = true;

  let left = state;
  let right = structuredClone(state);
  let peakElevation = 0;
  const actions = [{
    marbleId: 0,
    steerX: 0,
    steerY: 0,
    boostPermille: 1_000,
    intent: 'holding-line',
    confidence: 'high',
  }];

  for (let tick = 0; tick < 24; tick += 1) {
    const nextLeft = stepMarblePhysics(left, actions);
    const nextRight = stepMarblePhysics(right, actions);
    assert.equal(nextLeft.integrityIssue, undefined);
    assert.equal(nextRight.integrityIssue, undefined);
    assert.equal(marbleStateChecksum(nextLeft.state), marbleStateChecksum(nextRight.state), `vertical tick ${tick}`);
    left = nextLeft.state;
    right = nextRight.state;
    peakElevation = Math.max(peakElevation, left.marbles[0].elevation);
  }

  assert.ok(peakElevation >= 800, `expected meaningful ramp elevation, got ${peakElevation}`);
  assert.ok(left.marbles[0].elevation >= 0);
  assert.ok(Math.abs(left.marbles[0].verticalVelocity) <= left.config.maxVerticalSpeed);
});
