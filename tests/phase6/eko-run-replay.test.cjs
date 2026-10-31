'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase6(seed = 'phase6-replay') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function advance(state, sequence) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 0, sourceId: 'replay', sourceSequence: sequence, type: 'advance', payload: {} };
}

test('generated Phase 6 states with identical seed have identical checksums', () => {
  assert.equal(eko.checksumState(phase6('phase6-deterministic')), eko.checksumState(phase6('phase6-deterministic')));
});

test('intermission advance is deterministic after JSON snapshot restore', () => {
  let a = phase6('phase6-intermission-restore');
  a.lifecycle = 'intermission';
  a.progression.districtCompletions = 1;
  const restored = eko.restoreSnapshot(JSON.parse(JSON.stringify(eko.createSnapshot(a))));
  const left = eko.stepSimulation(a, [advance(a, 1)]);
  const right = eko.stepSimulation(restored, [advance(restored, 1)]);
  assert.equal(left.checksum, right.checksum);
  assert.deepEqual(left.state.progression, right.state.progression);
});

test('changing outcome-relevant generated content changes checksum', () => {
  const a = phase6('phase6-checksum-generated');
  const b = structuredClone(a);
  b.progression.activeContent.tokens[0].x += 0.25;
  assert.notEqual(eko.checksumState(a), eko.checksumState(b));
});

test('pacing grammar contains calm anticipation crisis and recovery beats in order', () => {
  const generated = eko.generateDistrict('phase6-pacing', 0, 0);
  assert.deepEqual(generated.milestones.map(item => item.band), ['calm', 'anticipation', 'crisis', 'recovery']);
  assert.deepEqual([...generated.milestones].sort((a, b) => a.x - b.x), generated.milestones);
});
