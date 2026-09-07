'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

function championshipState(seed) {
  const { MarbleRuntime } = game7();
  const runtime = MarbleRuntime.create({
    rosterSize: 2,
    roundQuotas: [1, 1, 1, 1, 1],
    roundIntroTicks: 0,
    roundTimeoutTicks: 1000,
  }, seed);
  runtime.state.roundIndex = 4;
  runtime.state.roundNumber = 5;
  runtime.state.currentQuota = 1;
  runtime.state.activeIds = [0, 1];
  runtime.state.qualifiedIds = [];
  runtime.state.marbles.forEach((marble) => {
    marble.status = 'active';
    marble.roundStatus = 'racing';
    marble.finishRank = null;
    marble.finishTick = null;
  });
  return runtime.state;
}

test('finish crossing comparison prefers earlier within-tick crossing before stable ID', () => {
  const { compareFinishCrossings } = game7();
  assert.equal(typeof compareFinishCrossings, 'function');
  const laterLowId = { marbleId: 0, numerator: 9, denominator: 10 };
  const earlierHighId = { marbleId: 1, numerator: 1, denominator: 2 };
  assert.ok(compareFinishCrossings(earlierHighId, laterLowId) < 0);
  assert.ok(compareFinishCrossings(laterLowId, earlierHighId) > 0);
  assert.ok(compareFinishCrossings({ marbleId: 0, numerator: 1, denominator: 2 }, { marbleId: 1, numerator: 1, denominator: 2 }) < 0);
});

test('same-tick championship finish is decided by crossing fraction rather than marble ID', () => {
  const { applyTournamentRules } = game7();
  const state = championshipState('finish-cohort');
  const boundary = state.arena.finishY + state.config.marbleRadius;
  const lowId = state.marbles.find((marble) => marble.id === 0);
  const highId = state.marbles.find((marble) => marble.id === 1);
  lowId.position.y = boundary - 10;
  highId.position.y = boundary - 300;
  const previousPositions = new Map([
    [0, { x: lowId.position.x, y: boundary + 100 }],
    [1, { x: highId.position.x, y: boundary + 300 }],
  ]);
  const output = applyTournamentRules(state, [], previousPositions);
  assert.equal(output.state.lifecycle, 'tournament-result');
  assert.equal(output.state.result?.kind, 'champion');
  assert.equal(output.state.result?.championId, 1);
});

test('championship all-fall cannot stay active or fabricate an eliminated champion', () => {
  const { applyTournamentRules } = game7();
  const state = championshipState('all-fall-final');
  state.arena.hazards = [{
    id: 'final-kill-zone',
    kind: 'pit',
    x: 0,
    y: 0,
    width: state.arena.width,
    height: state.arena.height,
  }];
  const output = applyTournamentRules(state, []);
  assert.equal(output.state.lifecycle, 'quarantined');
  assert.equal(output.state.result?.kind, 'technical');
  assert.equal(output.state.activeIds.length, 0);
  assert.equal(output.state.qualifiedIds.length, 0);
});
