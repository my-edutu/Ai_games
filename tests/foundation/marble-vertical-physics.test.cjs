'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  createMarbleSnapshot,
  parseMarbleConfig,
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
