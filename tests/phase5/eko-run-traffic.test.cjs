'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase5(seed = 'phase5-traffic') {
  return eko.createPhase5State(eko.createDefaultConfig({ seed }));
}

test('moving Lagos traffic remains deterministic finite and speed bounded tick-to-tick', () => {
  const contracts = eko.getPhase5HazardContracts('phase5-traffic-motion').filter(item => item.motion);
  assert.ok(contracts.length >= 4, 'expected multiple moving traffic/street hazards');
  for (const item of contracts) {
    let previous = eko.hazardPositionAtTick(item, 0);
    for (let tick = 1; tick <= item.motion.periodTicks * 2; tick += 1) {
      const current = eko.hazardPositionAtTick(item, tick);
      assert.equal(Number.isFinite(current), true);
      const maxPerTick = item.maxHazardSpeed / 60 + 1e-9;
      assert.ok(Math.abs(current - previous) <= maxPerTick, `${item.id} exceeded declared speed bound at ${tick}`);
      previous = current;
    }
  }
});

test('traffic activity windows and positions are pure functions of contract plus tick', () => {
  const item = eko.getPhase5HazardContracts('phase5-traffic-pure').find(contract => contract.family === 'danfo-pull-out');
  assert.ok(item?.motion);
  for (const tick of [0, 1, 17, 59, 60, 119, 120, 359]) {
    assert.equal(eko.hazardPositionAtTick(item, tick), eko.hazardPositionAtTick(item, tick));
    assert.equal(eko.hazardActiveAtTick(item, tick), eko.hazardActiveAtTick(item, tick));
  }
});

test('hazard authority produces identical checksums for identical commands', () => {
  let a = phase5('phase5-repeat');
  let b = phase5('phase5-repeat');
  for (let tick = 0; tick < 180; tick += 1) {
    const command = {
      schemaVersion: eko.COMMAND_SCHEMA_VERSION,
      runId: a.runId,
      sourceId: 'controller',
      sourceSequence: tick + 1,
      targetTick: a.tick,
      priority: 10,
      type: 'move',
      payload: { axis: tick < 120 ? 1 : 0 },
    };
    const mirror = { ...command, runId: b.runId, targetTick: b.tick };
    a = eko.stepSimulation(a, [command]).state;
    b = eko.stepSimulation(b, [mirror]).state;
  }
  assert.equal(eko.checksumState(a), eko.checksumState(b));
  assert.deepEqual(a.hazards, b.hazards);
});

test('render snapshot publishes hazard facts without authoritative seed or encounter internals', () => {
  const state = phase5('phase5-public');
  const snapshot = eko.createRenderSnapshot(state, []);
  assert.ok(Array.isArray(snapshot.hazards));
  assert.equal(snapshot.hazards.length, 11);
  assert.equal('rootSeed' in snapshot, false);
  assert.equal('randomStreams' in snapshot, false);
  assert.equal('commandWatermarks' in snapshot, false);
  for (const item of snapshot.hazards) {
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.family, 'string');
    assert.equal(Number.isFinite(item.x), true);
    assert.equal(Array.isArray(item.legalResponses), true);
    assert.equal('warningTick' in item, false);
    assert.equal('phaseOffsetTicks' in item, false);
  }
});
