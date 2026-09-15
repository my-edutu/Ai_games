'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const EXPECTED_FAMILIES = new Set([
  'danfo-pull-out',
  'molue-crossing',
  'pothole',
  'open-drain',
  'construction-trench',
  'flood-puddle',
  'handcart',
  'rolling-object',
  'crowd-compression',
  'street-disturbance',
  'temporary-block',
]);

function phase5(seed = 'phase5-base') {
  return eko.createPhase5State(eko.createDefaultConfig({ seed }));
}

function contract(family, seed = 'phase5-base') {
  const found = eko.getPhase5HazardContracts(seed).find(item => item.family === family);
  assert.ok(found, `missing ${family}`);
  return found;
}

test('Phase 5 exposes all eleven hazard families with unique explicit contracts', () => {
  const contracts = eko.getPhase5HazardContracts('phase5-contracts');
  assert.equal(contracts.length, 11);
  assert.deepEqual(new Set(contracts.map(item => item.family)), EXPECTED_FAMILIES);
  assert.equal(new Set(contracts.map(item => item.id)).size, contracts.length);
  for (const item of contracts) {
    assert.ok(item.warningDistance > 0);
    assert.ok(Number.isInteger(item.minResponseTicks) && item.minResponseTicks > 0);
    assert.ok(item.width > 0 && item.height >= 0);
    assert.ok(Array.isArray(item.legalResponses) && item.legalResponses.length > 0);
    assert.equal(typeof item.captionKey, 'string');
    assert.equal(typeof item.visualToken, 'string');
  }
});

test('Phase 5 has an explicit long-form hazard route and authoritative runtime state', () => {
  const state = phase5('phase5-state');
  assert.equal(state.route.id, 'mainland-hazard-001');
  assert.ok(state.route.finishX >= 110);
  assert.ok(state.hazards);
  assert.equal(state.hazards.hazardSchemaVersion, 1);
  assert.equal(state.hazards.encounters.length, 11);
  assert.equal(new Set(state.hazards.encounters.map(item => item.id)).size, 11);
});

test('seeded hazard campaign is deterministic without changing fairness geometry', () => {
  const a = eko.getPhase5HazardContracts('same-seed');
  const b = eko.getPhase5HazardContracts('same-seed');
  const c = eko.getPhase5HazardContracts('different-seed');
  assert.deepEqual(a, b);
  assert.deepEqual(a.map(({ phaseOffsetTicks, ...rest }) => rest), c.map(({ phaseOffsetTicks, ...rest }) => rest));
  assert.notDeepEqual(a.map(item => item.phaseOffsetTicks), c.map(item => item.phaseOffsetTicks));
});

test('pothole collision causes bounded gameplay stumble after a valid warning window', () => {
  let state = phase5('phase5-pothole-hit');
  const item = contract('pothole', 'phase5-pothole-hit');
  state.tick = 100;
  state.player.position.x = item.baseX;
  state.player.position.y = 0;
  state.player.velocity.x = 4;
  const encounter = state.hazards.encounters.find(entry => entry.id === item.id);
  encounter.phase = 'warned';
  encounter.warningTick = state.tick - item.minResponseTicks;

  const result = eko.stepSimulation(state, []);
  assert.ok(result.events.some(event => event.type === 'hazard.hit' && event.data.hazardId === item.id));
  assert.equal(result.state.lifecycle, 'running');
  assert.equal(result.state.player.movementState, 'stumbling');
  assert.ok(result.state.player.stumbleTicksRemaining > 0);
});

test('jumping above an ordinary low hazard avoids collision', () => {
  let state = phase5('phase5-pothole-jump');
  const item = contract('pothole', 'phase5-pothole-jump');
  state.tick = 100;
  state.player.position.x = item.baseX;
  state.player.position.y = item.height + 0.8;
  state.player.velocity = { x: 4, y: 0 };
  state.player.movementState = 'falling';
  const encounter = state.hazards.encounters.find(entry => entry.id === item.id);
  encounter.phase = 'warned';
  encounter.warningTick = state.tick - item.minResponseTicks;

  const result = eko.stepSimulation(state, []);
  assert.equal(result.events.some(event => event.type === 'hazard.hit' && event.data.hazardId === item.id), false);
  assert.notEqual(result.state.lifecycle, 'failed');
});

test('open drain collision produces causal gameplay failure rather than quarantine', () => {
  let state = phase5('phase5-drain-hit');
  const item = contract('open-drain', 'phase5-drain-hit');
  state.tick = 120;
  state.player.position.x = item.baseX;
  state.player.position.y = 0;
  state.player.velocity.x = 3;
  const encounter = state.hazards.encounters.find(entry => entry.id === item.id);
  encounter.phase = 'warned';
  encounter.warningTick = state.tick - item.minResponseTicks;

  const result = eko.stepSimulation(state, []);
  assert.equal(result.state.lifecycle, 'failed');
  assert.equal(result.state.player.movementState, 'dead');
  assert.ok(result.events.some(event => event.type === 'hazard.hit' && event.data.hazardId === item.id));
  assert.ok(result.events.some(event => event.type === 'run.failed' && event.data.reason === `hazard:${item.family}`));
});
