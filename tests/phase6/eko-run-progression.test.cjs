'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase6(seed = 'phase6-progression') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function advanceCommand(state, sequence = 1) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 0, sourceId: 'phase6-test', sourceSequence: sequence, type: 'advance', payload: {} };
}

test('Phase 6 state starts at Mainland Morning with public progression metadata', () => {
  assert.equal(typeof eko.createPhase6State, 'function');
  const state = phase6();
  assert.equal(state.progression.districtIndex, 0);
  assert.equal(state.progression.districtId, 'mainland-morning');
  assert.equal(state.progression.cycle, 0);
  assert.equal(state.progression.districtCompletions, 0);
  assert.equal(state.lifecycle, 'running');
  assert.equal(state.route.id.includes('mainland-morning'), true);
});

test('district completion enters intermission and preserves run record context', () => {
  let state = phase6('phase6-complete');
  state.player.position.x = state.route.finishX - 0.01;
  state.player.velocity.x = 7;
  const out = eko.stepSimulation(state, [{ schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 10, sourceId: 'runner', sourceSequence: 1, type: 'move', payload: { axis: 1 } }]);
  assert.equal(out.state.lifecycle, 'intermission');
  assert.ok(out.events.some(event => event.type === 'district.completed'));
  assert.equal(out.state.progression.districtCompletions, 1);
  assert.ok(out.state.record.maxProgress > 0);
});

test('advance is replayable authority and progresses deterministic district ladder', () => {
  let state = phase6('phase6-advance');
  state.lifecycle = 'intermission';
  state.progression.districtCompletions = 1;
  let out = eko.stepSimulation(state, [advanceCommand(state, 1)]);
  assert.equal(out.acceptedCommands.length, 1);
  assert.equal(out.state.lifecycle, 'running');
  assert.equal(out.state.progression.districtIndex, 1);
  assert.equal(out.state.progression.districtId, 'market-rush');
  assert.equal(out.state.progression.cycle, 0);
  assert.equal(out.state.player.checkpointIndex, 0);
  assert.ok(out.events.some(event => event.type === 'district.started'));
});

test('Bridge Run advances to Mainland Morning and increments cycle', () => {
  let state = phase6('phase6-wrap');
  state.progression.districtIndex = 5;
  state.progression.districtId = 'bridge-run';
  state.progression.cycle = 3;
  state.lifecycle = 'intermission';
  const out = eko.stepSimulation(state, [advanceCommand(state, 1)]);
  assert.equal(out.state.progression.districtIndex, 0);
  assert.equal(out.state.progression.districtId, 'mainland-morning');
  assert.equal(out.state.progression.cycle, 4);
});

test('advance command is rejected outside intermission', () => {
  const state = phase6('phase6-advance-reject');
  const out = eko.stepSimulation(state, [advanceCommand(state, 1)]);
  assert.equal(out.acceptedCommands.length, 0);
  assert.equal(out.rejectedCommands[0].reason, 'ADVANCE_NOT_INTERMISSION');
  assert.equal(out.state.progression.districtIndex, 0);
});
