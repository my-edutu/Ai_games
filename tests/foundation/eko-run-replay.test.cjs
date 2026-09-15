'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDefaultConfig,
  createInitialState,
  stepSimulation,
  checksumState,
  createSnapshot,
  restoreSnapshot,
  replayRun,
  IntegrityError,
} = require('../../dist/games/eko-street-run/src/index.js');

function move(runId, tick, sequence) {
  return { schemaVersion: 1, runId, targetTick: tick, priority: 10, sourceId: 'replay-controller', sourceSequence: sequence, type: 'move', payload: { axis: 1 } };
}

function buildSteps(runId, startTick, count) {
  return Array.from({ length: count }, (_, offset) => {
    const tick = startTick + offset;
    return { commands: [move(runId, tick, tick)] };
  });
}

test('replay uses production stepping and matches uninterrupted authority', () => {
  const config = createDefaultConfig({ seed: 'eko-replay-production' });
  const initial = createInitialState(config);
  const steps = buildSteps(initial.runId, 0, 500);
  const replayA = replayRun(initial, steps);
  const replayB = replayRun(createInitialState(config), steps);
  assert.equal(replayA.state.lifecycle, 'completed');
  assert.equal(replayA.finalChecksum, replayB.finalChecksum);
  assert.deepEqual(replayA.checkpointChecksums, replayB.checkpointChecksums);
});

test('snapshot restore plus remaining commands equals uninterrupted result', () => {
  const config = createDefaultConfig({ seed: 'eko-snapshot-restore' });
  let state = createInitialState(config);
  for (let i = 0; i < 120; i++) state = stepSimulation(state, [move(state.runId, state.tick, i)]).state;
  const envelope = createSnapshot(state);
  const restored = restoreSnapshot(structuredClone(envelope));
  const remaining = buildSteps(state.runId, state.tick, 500);
  const a = replayRun(state, remaining);
  const b = replayRun(restored, remaining);
  assert.equal(a.finalChecksum, b.finalChecksum);
  assert.equal(checksumState(a.state), checksumState(b.state));
});

test('corrupted or unsupported snapshots fail typed instead of silently restoring', () => {
  const state = createInitialState(createDefaultConfig({ seed: 'eko-snapshot-corrupt' }));
  const envelope = createSnapshot(state);
  const corrupt = structuredClone(envelope);
  corrupt.state.player.position.x = 99;
  assert.throws(() => restoreSnapshot(corrupt), error => error instanceof IntegrityError && error.code === 'CHECKSUM_MISMATCH');

  const unsupported = structuredClone(envelope);
  unsupported.snapshotVersion = 99;
  assert.throws(() => restoreSnapshot(unsupported), error => error instanceof IntegrityError && error.code === 'UNSUPPORTED_VERSION');

  const versionMismatch = structuredClone(envelope);
  versionMismatch.state.schemaVersion += 1;
  versionMismatch.checksum = checksumState(versionMismatch.state);
  assert.throws(() => restoreSnapshot(versionMismatch), error => error instanceof IntegrityError && error.code === 'ENVELOPE_MISMATCH');
});
