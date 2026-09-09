'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

function serverModule() {
  const serverPath = path.resolve(__dirname, '../../scripts/serve-complete-runtime.cjs');
  delete require.cache[require.resolve(serverPath)];
  return require(serverPath);
}

test('snapshot restore preserves one pending wind command and applies it exactly once', () => {
  const { MarbleRuntime, createMarbleSnapshot, restoreMarbleSnapshot, marbleStateChecksum } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'restore-influence');
  const accepted = runtime.scheduleInfluence({ id: 'restore-wind-1', family: 'wind-vote', option: 'west' });
  assert.equal(accepted.accepted, true);
  const restored = restoreMarbleSnapshot(createMarbleSnapshot(runtime));
  assert.equal(marbleStateChecksum(restored.state), marbleStateChecksum(runtime.state));
  runtime.step();
  restored.step();
  assert.equal(marbleStateChecksum(restored.state), marbleStateChecksum(runtime.state));
  const applied = restored.drainEvents().filter(event => event.type === 'influence-applied');
  assert.equal(applied.length, 1);
});

test('snapshot restore rejects an influence queue that exceeds the declared authority cap', () => {
  const { MarbleRuntime, createMarbleSnapshot, restoreMarbleSnapshot, MarbleSnapshotError } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1] }, 'corrupt-influence');
  runtime.state.influence.pending = Array.from({ length: 65 }, (_, index) => ({
    id: `overflow-${index}`,
    family: 'wind-vote',
    option: 'north',
    applyTick: runtime.state.tick,
    durationTicks: 180,
  }));
  const snapshot = createMarbleSnapshot(runtime);
  assert.throws(
    () => restoreMarbleSnapshot(snapshot),
    error => error instanceof MarbleSnapshotError && error.code === 'state'
  );
});

test('advancing a round clears the active wind field but keeps bounded idempotency history', () => {
  const { MarbleRuntime, advanceMarbleRound } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 4, roundQuotas: [2, 1, 1, 1, 1], roundIntroTicks: 0 }, 'round-wind-cleanup');
  runtime.scheduleInfluence({ id: 'round-wind-1', family: 'wind-vote', option: 'east' });
  runtime.step();
  assert.ok(runtime.state.influence.globalWindX > 0);
  runtime.state.lifecycle = 'round-result';
  runtime.state.qualifiedIds = runtime.state.marbles.slice(0, 2).map(marble => marble.id);
  const history = [...runtime.state.influence.appliedIds];
  const advanced = advanceMarbleRound(runtime.state, runtime.rng).state;
  assert.equal(advanced.influence.globalWindX, 0);
  assert.equal(advanced.influence.globalWindY, 0);
  assert.equal(advanced.influence.activeFamily, null);
  assert.equal(advanced.influence.activeOption, null);
  assert.equal(advanced.influence.effectUntilTick, -1);
  assert.deepEqual(advanced.influence.appliedIds, history);
});

test('live host bounds replay and public event history during sustained presentation ticks', () => {
  const { createRuntime } = serverModule();
  const host = createRuntime({ seed: 'bounded-host', nowMs: 0, replayCapacity: 7, maxCatchUpTicks: 8 });
  for (let cycle = 1; cycle <= 300; cycle++) host.advanceDue(cycle * (1000 / 30));
  assert.equal(host.replayFrames(120).length, 7);
  assert.ok(host.events.length <= 128);
  assert.ok(host.authority.getPendingEvents().length <= host.authority.config.maxEventHistory);
});
