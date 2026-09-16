'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const { MarbleRuntime, applyOvertakeAccounting } = require(runtimePath);

function clone(value) {
  return structuredClone(value);
}

test('authority: a real front-to-back position crossing increments exactly one overtake', () => {
  assert.equal(typeof applyOvertakeAccounting, 'function');
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-overtake-accounting');
  const before = clone(runtime.state);
  const after = clone(runtime.state);
  const passer = before.marbles[0];
  const passed = before.marbles[1];

  before.activeIds = [passer.id, passed.id];
  after.activeIds = [passer.id, passed.id];
  for (const state of [before, after]) {
    for (const marble of state.marbles) {
      const active = state.activeIds.includes(marble.id);
      marble.status = active ? 'active' : 'eliminated';
      marble.roundStatus = active ? 'racing' : 'out';
    }
  }

  before.marbles[passer.id].position = { x: 4_000, y: 9_000 };
  before.marbles[passed.id].position = { x: 4_000, y: 8_000 };
  after.marbles[passer.id].position = { x: 4_000, y: 7_900 };
  after.marbles[passed.id].position = { x: 4_000, y: 8_000 };

  const result = applyOvertakeAccounting(before, after);
  assert.equal(result.state.marbles[passer.id].overtakes, before.marbles[passer.id].overtakes + 1);
  assert.equal(result.state.marbles[passed.id].overtakes, before.marbles[passed.id].overtakes);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].type, 'marble-overtake');
  assert.deepEqual(result.events[0].data, {
    marbleId: passer.id,
    passedMarbleId: passed.id,
    overtakes: before.marbles[passer.id].overtakes + 1,
  });
});

test('authority: unchanged race order does not create phantom overtakes', () => {
  assert.equal(typeof applyOvertakeAccounting, 'function');
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-overtake-stable-order');
  const before = clone(runtime.state);
  const after = clone(runtime.state);
  const first = before.marbles[0];
  const second = before.marbles[1];

  before.activeIds = [first.id, second.id];
  after.activeIds = [first.id, second.id];
  for (const state of [before, after]) {
    for (const marble of state.marbles) {
      const active = state.activeIds.includes(marble.id);
      marble.status = active ? 'active' : 'eliminated';
      marble.roundStatus = active ? 'racing' : 'out';
    }
  }

  before.marbles[first.id].position = { x: 3_000, y: 8_000 };
  before.marbles[second.id].position = { x: 3_000, y: 9_000 };
  after.marbles[first.id].position = { x: 3_000, y: 7_600 };
  after.marbles[second.id].position = { x: 3_000, y: 8_700 };

  const result = applyOvertakeAccounting(before, after);
  assert.equal(result.events.length, 0);
  assert.equal(result.state.marbles[first.id].overtakes, before.marbles[first.id].overtakes);
  assert.equal(result.state.marbles[second.id].overtakes, before.marbles[second.id].overtakes);
});
