'use strict';
// A genuine server-result must have enough source-authoritative wall-clock
// lifetime to appear as an experience, not a one-tick unobservable blip.
const test = require('node:test');
const assert = require('node:assert/strict');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerRenderSnapshot } = require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const { createSession, advance, STREAM_CONFIG } = require('../../scripts/serve-tower-stream.cjs');

function toTerminal(runtime) {
  for (let i = 0; i < 150 && runtime.state.lifecycle === 'running'; i++) runtime.step();
  assert.equal(runtime.state.lifecycle, 'result', 'only real authority can terminate a run');
  assert.ok(runtime.state.result);
}
const short = { maxTicks: 100, noProgressTicks: 99, intermissionTicks: 3 };

test('explicit live result hold survives fixed steps then enters authentic intermission and new run', () => {
  const runtime = TowerRuntime.create({ ...short, resultHoldTicks: 6 }, 'tower-visible-end', { policy: 'idle-test' });
  toTerminal(runtime);
  const source = createTowerRenderSnapshot(runtime.state);
  assert.equal(runtime.state.intermissionRemaining, 6);
  for (let step = 0; step < 6; step++) {
    runtime.step();
    const frame = createTowerRenderSnapshot(runtime.state);
    assert.equal(runtime.state.lifecycle, 'result');
    assert.equal(frame.publicChecksum, source.publicChecksum, 'no invented move or forged result during the held tableau');
    assert.equal(frame.runToken, source.runToken);
    assert.equal(frame.tick, source.tick);
    assert.equal(runtime.state.intermissionRemaining, 5 - step);
  }
  runtime.step();
  assert.equal(runtime.state.lifecycle, 'intermission');
  assert.equal(runtime.state.intermissionRemaining, 3);
  runtime.step(); runtime.step(); runtime.step();
  const restarted = createTowerRenderSnapshot(runtime.state);
  assert.equal(runtime.state.lifecycle, 'running');
  assert.equal(restarted.tick, 0);
  assert.notEqual(restarted.runToken, source.runToken);
  assert.equal(runtime.state.stats.restarts, 1);
});

test('frozen default and historical policies retain the old one-step result transition and config shape', () => {
  const normal = TowerRuntime.create(short, 'tower-frozen-default', { policy: 'historical-v1' });
  assert.equal(Object.hasOwn(normal.config, 'resultHoldTicks'), false, 'do not move legacy baseline checksums');
  toTerminal(normal);
  normal.step();
  assert.equal(normal.state.lifecycle, 'intermission');
  const explicitZero = TowerRuntime.create({ ...short, resultHoldTicks: 0 }, 'tower-zero-result-hold', { policy: 'idle-test' });
  toTerminal(explicitZero);
  explicitZero.step();
  assert.equal(explicitZero.state.lifecycle, 'intermission');
});

test('authentic stream host holds its terminal visual through the source-controlled phase', () => {
  assert.equal(STREAM_CONFIG.resultHoldTicks, 48, 'viewer stream must expose a genuine 2.4s terminal phase');
  const session = createSession('tower-source-visible-terminal', { ...short, resultHoldTicks: 4 }, 'idle-test');
  for (let i = 0; i < 150 && session.runtime.state.lifecycle === 'running'; i++) {
    assert.equal(advance(session).accepted, true);
  }
  assert.equal(session.controller.frame().scene, 'result');
  const token = session.controller.frame().snapshot.runToken;
  for (let i = 0; i < 4; i++) {
    const receipt = advance(session);
    assert.equal(receipt.accepted, true, 'identical terminal snapshots remain valid while source clock holds');
    assert.equal(session.controller.frame().scene, 'result');
    assert.equal(session.controller.frame().snapshot.runToken, token);
  }
  assert.equal(advance(session).accepted, true);
  assert.equal(session.controller.frame().scene, 'intermission');
  while (session.runtime.state.lifecycle === 'intermission') assert.equal(advance(session).accepted, true);
  assert.notEqual(session.controller.frame().snapshot.runToken, token);
  assert.equal(session.controller.frame().scene, 'normal');
});

test('out-of-bounds terminal-hold settings are rejected rather than silently increasing host lifetimes', () => {
  for (const ticks of [-1, 241, 2.5, NaN]) {
    assert.throws(() => TowerRuntime.create({ ...short, resultHoldTicks: ticks }, 'bad-terminal-hold'), /resultHoldTicks/);
  }
});
