'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

test('review 2: first valid warning tick cannot also punish the player', () => {
  const state = eko.createPhase5State(eko.createDefaultConfig({ seed: 'review2-warning-grace' }));
  const item = eko.getPhase5HazardContracts(state.rootSeed).find(contract => contract.family === 'pothole');
  assert.ok(item);
  state.tick = 100;
  state.player.position.x = item.baseX;
  state.player.position.y = 0;
  state.player.velocity = { x: 0, y: 0 };
  state.player.movementState = 'grounded';
  const encounter = state.hazards.encounters.find(entry => entry.id === item.id);
  encounter.phase = 'unseen';
  encounter.warningTick = null;
  encounter.resolvedTick = null;

  const result = eko.stepSimulation(state, []);
  assert.equal(result.events.some(event => event.type === 'hazard.warned' && event.data.hazardId === item.id), true);
  assert.equal(result.events.some(event => event.type === 'hazard.hit' && event.data.hazardId === item.id), false);
  assert.equal(result.state.lifecycle, 'running');
  assert.equal(result.state.hazards.encounters.find(entry => entry.id === item.id).phase, 'warned');
});
