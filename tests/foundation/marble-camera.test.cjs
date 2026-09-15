'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  chooseMarbleCameraDirective,
} = require('../../dist/games/marble-survival/src/index.js');

function input(overrides = {}) {
  return {
    tick: 100,
    lifecycle: 'active',
    round: { qualified: 4, quota: 8, remaining: 12 },
    leaderId: 1,
    dangerIds: [],
    contestedQualificationIds: [1, 2, 3],
    championId: null,
    events: [],
    ...overrides,
  };
}

test('camera uses overview until competition becomes decision-critical', () => {
  const directive = chooseMarbleCameraDirective(input());
  assert.equal(directive.mode, 'overview');
  assert.deepEqual(directive.focusIds, [1]);
  assert.ok(directive.holdUntilTick > 100);
});

test('cut-line battle outranks incidental danger when the final qualifying places are contested', () => {
  const directive = chooseMarbleCameraDirective(input({
    round: { qualified: 7, quota: 8, remaining: 3 },
    dangerIds: [9],
    contestedQualificationIds: [4, 5, 6],
  }));
  assert.equal(directive.mode, 'cut-line');
  assert.deepEqual(directive.focusIds, [4, 5, 6]);
});

test('danger earns a focused shot outside a decisive cut-line battle', () => {
  const directive = chooseMarbleCameraDirective(input({ dangerIds: [8, 9] }));
  assert.equal(directive.mode, 'danger');
  assert.deepEqual(directive.focusIds, [8, 9]);
});

test('official finish and champion events can interrupt a held lower-priority shot', () => {
  const held = chooseMarbleCameraDirective(input({
    tick: 200,
    dangerIds: [8],
  }));
  assert.equal(held.mode, 'danger');

  const finish = chooseMarbleCameraDirective(input({
    tick: 201,
    events: [{ seq: 20, tick: 201, type: 'marble-qualified', data: { marbleId: 6, finishRank: 1 } }],
  }), held);
  assert.equal(finish.mode, 'finish');
  assert.deepEqual(finish.focusIds, [6]);

  const victory = chooseMarbleCameraDirective(input({
    tick: 202,
    lifecycle: 'tournament-result',
    championId: 6,
  }), finish);
  assert.equal(victory.mode, 'victory');
  assert.deepEqual(victory.focusIds, [6]);
});

test('minimum shot hold prevents equal/lower priority camera thrashing', () => {
  const first = chooseMarbleCameraDirective(input({ tick: 300, dangerIds: [8] }));
  const duringHold = chooseMarbleCameraDirective(input({ tick: 301, dangerIds: [9] }), first);
  assert.equal(duringHold.mode, first.mode);
  assert.deepEqual(duringHold.focusIds, first.focusIds);
  assert.equal(duringHold.issuedAtTick, first.issuedAtTick);
});
