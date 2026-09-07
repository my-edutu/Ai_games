'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

test('public snapshot remains an allowlist with no authority secrets', () => {
  const { MarbleRuntime, createMarblePublicSnapshot } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'privacy-snapshot');
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const serialized = JSON.stringify(snapshot);
  for (const forbidden of ['rootSeed', 'tournamentSeed', 'rng', 'operatorToken', 'config']) {
    assert.equal(serialized.includes(forbidden), false, `public snapshot leaked ${forbidden}`);
  }
});

test('camera gives decisive finish priority over noisy contact events', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, selectMarbleCamera } = game7();
  assert.equal(typeof selectMarbleCamera, 'function');
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'camera-finish');
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const directive = selectMarbleCamera(snapshot, [
    { tick: 4, type: 'physics-contact', data: { marbleId: 0, impulse: 120 } },
    { tick: 4, type: 'marble-qualified', data: { marbleId: 1, finishRank: 1 } },
    { tick: 4, type: 'physics-contact', data: { marbleId: 0, impulse: 140 } },
  ]);
  assert.equal(directive.mode, 'finish');
  assert.deepEqual(directive.targetIds, [1]);
});

test('camera selects victory only from a confirmed champion result', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, selectMarbleCamera } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'camera-victory');
  runtime.state.roundIndex = 4;
  runtime.state.roundNumber = 5;
  runtime.state.currentQuota = 1;
  runtime.state.marbles[1].status = 'champion';
  runtime.state.marbles[1].roundStatus = 'finished';
  runtime.state.activeIds = [];
  runtime.state.qualifiedIds = [1];
  runtime.state.lifecycle = 'tournament-result';
  runtime.state.result = { kind: 'champion', championId: 1, tournamentTicks: 300, recordCategory: 'standard' };
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const directive = selectMarbleCamera(snapshot, [{ tick: 300, type: 'tournament-champion', data: { championId: 1 } }]);
  assert.equal(directive.mode, 'victory');
  assert.deepEqual(directive.targetIds, [1]);
});

test('replay buffer is bounded and isolated from authority and caller mutation', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, MarbleReplayBuffer } = game7();
  assert.equal(typeof MarbleReplayBuffer, 'function');
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'replay-isolation');
  const authorityX = runtime.state.marbles[0].position.x;
  const replay = new MarbleReplayBuffer(2);
  const first = createMarblePublicSnapshot(runtime.state);
  replay.push(first, [{ tick: 0, type: 'round-started', data: { roundIndex: 0 } }]);
  runtime.step();
  replay.push(createMarblePublicSnapshot(runtime.state), []);
  runtime.step();
  replay.push(createMarblePublicSnapshot(runtime.state), []);
  const frames = replay.frames();
  assert.equal(frames.length, 2);
  frames[0].snapshot.marbles[0].x = -999999;
  assert.notEqual(replay.frames()[0].snapshot.marbles[0].x, -999999);
  assert.equal(runtime.state.marbles[0].position.x === authorityX || runtime.state.marbles[0].position.x !== -999999, true);
});
