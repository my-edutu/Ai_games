'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDefaultConfig,
  createInitialState,
  createRandomStreams,
  stepSimulation,
  checksumState,
  createRenderSnapshot,
} = require('../../dist/games/eko-street-run/src/index.js');

function move(runId, tick, sequence, axis = 1) {
  return { schemaVersion: 1, runId, targetTick: tick, priority: 10, sourceId: 'controller', sourceSequence: sequence, type: 'move', payload: { axis } };
}

function run(seed, renderEveryTicks) {
  const config = createDefaultConfig({ seed });
  let state = createInitialState(config);
  const checkpointChecksums = [];
  for (let guard = 0; guard < 800 && state.lifecycle === 'running'; guard++) {
    const out = stepSimulation(state, [move(state.runId, state.tick, guard)]);
    state = out.state;
    if (out.events.some(event => event.type === 'checkpoint.reached')) checkpointChecksums.push(checksumState(state));
    if (state.tick % renderEveryTicks === 0) createRenderSnapshot(state, out.events);
  }
  return { state, checkpointChecksums, finalChecksum: checksumState(state) };
}

test('same seed and normalized commands produce the same checkpoint and final checksums', () => {
  const a = run('eko-determinism-repeat', 1);
  const b = run('eko-determinism-repeat', 1);
  assert.equal(a.state.lifecycle, 'completed');
  assert.equal(b.state.lifecycle, 'completed');
  assert.deepEqual(a.checkpointChecksums, b.checkpointChecksums);
  assert.equal(a.finalChecksum, b.finalChecksum);
});

test('render snapshot cadence cannot change authoritative outcome', () => {
  const render30ish = run('eko-render-independent', 2);
  const render60 = run('eko-render-independent', 1);
  const render120ish = run('eko-render-independent', 1);
  assert.equal(render30ish.finalChecksum, render60.finalChecksum);
  assert.equal(render60.finalChecksum, render120ish.finalChecksum);
});

test('cosmetic random draws cannot perturb authoritative named streams', () => {
  const a = createRandomStreams('eko-stream-isolation');
  const b = createRandomStreams('eko-stream-isolation');
  for (let i = 0; i < 50; i++) a.nextInt('cosmetic', 1000);
  assert.deepEqual(a.snapshotAuthoritative(), b.snapshotAuthoritative());
  assert.equal(a.nextInt('route', 1_000_000), b.nextInt('route', 1_000_000));
  assert.equal(a.nextInt('traffic', 1_000_000), b.nextInt('traffic', 1_000_000));
  assert.deepEqual(a.snapshotAuthoritative(), b.snapshotAuthoritative());
});
