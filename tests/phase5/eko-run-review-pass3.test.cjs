'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

test('review 3: checkpoint restart preserves completed past hazards and resets checkpoint/future hazards', () => {
  const config = eko.createDefaultConfig({ seed: 'review3-restart-hazards' });
  const state = eko.createPhase5State(config);
  state.tick = 500;
  state.player.checkpointIndex = 2;
  state.player.position.x = 96;
  state.player.movementState = 'dead';
  state.lifecycle = 'failed';

  const behind = state.hazards.encounters.find(entry => entry.family === 'handcart');
  const atCheckpoint = state.hazards.encounters.find(entry => entry.family === 'rolling-object');
  const future = state.hazards.encounters.find(entry => entry.family === 'crowd-compression');
  behind.phase = 'resolved'; behind.warningTick = 410; behind.resolvedTick = 430;
  atCheckpoint.phase = 'hit'; atCheckpoint.warningTick = 470; atCheckpoint.resolvedTick = 490;
  future.phase = 'resolved'; future.warningTick = 480; future.resolvedTick = 495;

  const result = eko.stepSimulation(state, [{
    schemaVersion: 1,
    runId: state.runId,
    targetTick: state.tick,
    priority: 0,
    sourceId: 'review3',
    sourceSequence: 1,
    type: 'restart',
    payload: {},
  }]);

  assert.equal(result.state.lifecycle, 'running');
  assert.equal(result.state.player.position.x, 96);
  assert.equal(result.state.hazards.encounters.find(entry => entry.family === 'handcart').phase, 'resolved');
  for (const family of ['rolling-object', 'crowd-compression', 'street-disturbance', 'temporary-block']) {
    const encounter = result.state.hazards.encounters.find(entry => entry.family === family);
    assert.equal(encounter.phase, 'unseen', `${family} should reset on checkpoint restart`);
    assert.equal(encounter.warningTick, null);
    assert.equal(encounter.resolvedTick, null);
  }
});
