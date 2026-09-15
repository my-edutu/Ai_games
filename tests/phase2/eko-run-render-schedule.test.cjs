'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../dist/games/eko-street-run/src/index.js');

function runWithRenderHz(renderHz) {
  const config = api.createDefaultConfig({ seed: 'eko-p2-render-schedule' });
  let state = api.createInitialState(config);
  let sequence = 1;
  let accumulator = 0;
  let maxY = 0;
  const snapshots = [];
  const renderPerTick = renderHz / config.tickRateHz;
  for (let i = 0; i < 180; i += 1) {
    const payload = { axis: i < 150 ? 1 : 0 };
    if (i === 8) payload.jumpPressed = true;
    if (i === 14) payload.jumpReleased = true;
    const command = { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 10, sourceId: 'player', sourceSequence: sequence++, type: 'move', payload };
    const out = api.stepSimulation(state, [command]);
    state = out.state;
    maxY = Math.max(maxY, state.player.position.y);
    accumulator += renderPerTick;
    while (accumulator >= 1) {
      snapshots.push(api.createRenderSnapshot(state, out.events));
      accumulator -= 1;
    }
    if (state.lifecycle !== 'running') break;
  }
  return { checksum: api.checksumState(state), lifecycle: state.lifecycle, progress: state.player.progress, maxY, snapshots };
}

test('30/60/120 Hz presentation sampling produces identical authoritative outcome', () => {
  const at30 = runWithRenderHz(30);
  const at60 = runWithRenderHz(60);
  const at120 = runWithRenderHz(120);
  assert.ok(at60.maxY > 0.5, `movement corpus must include a real jump, maxY=${at60.maxY}`);
  assert.equal(at30.checksum, at60.checksum);
  assert.equal(at60.checksum, at120.checksum);
  assert.equal(at30.lifecycle, at120.lifecycle);
  assert.equal(at30.progress, at120.progress);
  assert.ok(at30.snapshots.length < at60.snapshots.length);
  assert.ok(at60.snapshots.length < at120.snapshots.length);
});
