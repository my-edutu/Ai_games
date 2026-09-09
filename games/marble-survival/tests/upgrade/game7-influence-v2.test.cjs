'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

test('viewer influence catalogue preserves all six legacy families without pretending unsupported mechanics are live', () => {
  const { MARBLE_INFLUENCE_CATALOGUE } = game7();
  assert.ok(MARBLE_INFLUENCE_CATALOGUE);
  assert.deepEqual(Object.keys(MARBLE_INFLUENCE_CATALOGUE).sort(), [
    'cheer-pulse', 'gate-tempo', 'next-arena', 'shield-orb', 'theme-vote', 'wind-vote',
  ]);
  assert.equal(MARBLE_INFLUENCE_CATALOGUE['wind-vote'].operational, true);
  for (const family of ['gate-tempo', 'shield-orb', 'cheer-pulse', 'theme-vote', 'next-arena']) {
    assert.equal(MARBLE_INFLUENCE_CATALOGUE[family].operational, false);
  }
});

test('wind vote is scheduled by MarbleRuntime, applies once at a logical boundary, and marks assisted records', () => {
  const { MarbleRuntime } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'wind-authority');
  assert.equal(typeof runtime.scheduleInfluence, 'function');
  const before = runtime.state.tick;
  const accepted = runtime.scheduleInfluence({ id: 'wind-1', family: 'wind-vote', option: 'north' });
  assert.equal(accepted.accepted, true);
  assert.equal(runtime.state.influence.globalWindY, 0, 'scheduling must not apply physics immediately');
  assert.equal(runtime.state.influence.pending.length, 1);

  runtime.step();
  assert.ok(runtime.state.tick > before);
  assert.ok(runtime.state.influence.globalWindY < 0, 'north wind must apply a bounded negative-Y field');
  assert.equal(runtime.state.influence.pending.length, 0);
  assert.equal(runtime.state.records.category, 'assisted');
  assert.equal(runtime.state.influence.recordCategory, 'assisted');
  assert.equal(runtime.drainEvents().filter(event => event.type === 'influence-applied').length, 1);

  const duplicate = runtime.scheduleInfluence({ id: 'wind-1', family: 'wind-vote', option: 'south' });
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, 'duplicate');
});

test('unsupported legacy families fail closed without mutating tournament state', () => {
  const { MarbleRuntime } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1] }, 'unsupported-influence');
  const checksumBefore = JSON.stringify(runtime.state);
  const result = runtime.scheduleInfluence({ id: 'gate-1', family: 'gate-tempo', option: 'fast' });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'temporarily-unavailable');
  assert.equal(JSON.stringify(runtime.state), checksumBefore);
});
