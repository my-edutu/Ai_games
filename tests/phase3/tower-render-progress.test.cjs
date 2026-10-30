'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const create = async () => (await import('../../public/infinite-tower-climb/visuals/render-progress.mjs')).createRenderProgress();

test('receiving snapshots cannot refresh the age of the last render submission', async () => {
  const progress = await create();
  assert.equal(progress.diagnostics(20000).state, 'waiting');
  progress.expectFrame(20000);
  assert.equal(progress.diagnostics(20000).state, 'starting');
  progress.submitted({ tick: 7, floor: 0, runToken: 'first-run' }, 20100);
  progress.expectFrame(22999);
  assert.equal(progress.diagnostics(22999).state, 'current');
  const stalled = progress.diagnostics(23100);
  assert.equal(stalled.state, 'stalled');
  assert.equal(stalled.visibleIdleMs, 3000);
  assert.deepEqual(stalled.lastSubmitted, { tick: 7, floor: 0, runToken: 'first-run', atMs: 20100 });
  progress.submitted({ tick: 90, floor: 1, runToken: 'first-run' }, 23500);
  assert.equal(progress.diagnostics(23500).state, 'current');
  assert.equal(progress.diagnostics(23500).lastSubmitted.tick, 90);
});

test('no completed renderer call becomes a visible startup delay after the grace interval', async () => {
  const progress = await create();
  progress.expectFrame(0);
  assert.equal(progress.diagnostics(2999).state, 'starting');
  assert.equal(progress.diagnostics(3000).state, 'stalled');
  assert.equal(progress.diagnostics(3000).lastSubmitted, null);
});

test('hidden time does not count as a render stall and return starts a new grace interval', async () => {
  const progress = await create();
  progress.expectFrame(100);
  progress.submitted({ tick: 1, floor: 0, runToken: 'run' }, 200);
  progress.setVisible(false, 300);
  assert.equal(progress.diagnostics(90000).state, 'hidden');
  assert.equal(progress.diagnostics(90000).visibleIdleMs, 0);
  progress.setVisible(true, 90000);
  assert.equal(progress.diagnostics(90000).state, 'current');
  assert.equal(progress.diagnostics(92999).state, 'current');
  // Repeated visibility checks must not postpone detection indefinitely.
  progress.setVisible(true, 92999);
  assert.equal(progress.diagnostics(93000).state, 'stalled');
  progress.submitted({ tick: 10, floor: 0, runToken: 'run' }, 93001);
  assert.equal(progress.diagnostics(93001).state, 'current');
});

test('restored graphics or a cached page wait for a new submission without keeping a stale latch', async () => {
  const progress = await create();
  progress.expectFrame(0);
  progress.submitted({ tick: 1, floor: 0, runToken: 'old-run' }, 100);
  assert.equal(progress.diagnostics(5000).state, 'stalled');
  progress.reset(5000);
  assert.equal(progress.diagnostics(5000).state, 'starting');
  assert.equal(progress.diagnostics(5000).lastSubmitted.tick, 1, 'historical submission identity remains diagnostic only');
  assert.equal(progress.diagnostics(8000).state, 'stalled');
  progress.submitted({ tick: 2, floor: 1, runToken: 'new-run' }, 8001);
  assert.equal(progress.diagnostics(8001).state, 'current');
  assert.equal(progress.diagnostics(8001).lastSubmitted.runToken, 'new-run');
});

test('submission intervals are explicitly unmeasured during warmup and include visible multi-second stalls', async () => {
  const progress = await create();
  const snapshot = { tick: 1, floor: 0, runToken: 'run' };
  assert.deepEqual(progress.diagnostics(0).frameMs, { p50: null, p95: null, p99: null, max: null, samples: 0 });
  for (let frame = 1; frame <= 8; frame++) progress.submitted(snapshot, frame * 100);
  assert.equal(progress.diagnostics(800).frameMs.samples, 0);
  progress.submitted(snapshot, 12000);
  progress.submitted(snapshot, 12016);
  progress.submitted(snapshot, 12032);
  assert.deepEqual(progress.diagnostics(12032).frameMs, { p50: 16, p95: 11200, p99: 11200, max: 11200, samples: 3 });
});

test('a visibility crossing is excluded from frame intervals without dropping visible stalls', async () => {
  const progress = await create();
  const snapshot = { tick: 1, floor: 0, runToken: 'run' };
  for (let frame = 1; frame <= 8; frame++) progress.submitted(snapshot, frame * 100);
  progress.submitted(snapshot, 4000);
  progress.setVisible(false, 4100);
  progress.submitted(snapshot, 10000);
  progress.setVisible(true, 90000);
  progress.submitted(snapshot, 90010);
  assert.equal(progress.diagnostics(90010).frameMs.samples, 1);
  assert.equal(progress.diagnostics(90010).frameMs.max, 3200);
  progress.submitted(snapshot, 90026);
  assert.equal(progress.diagnostics(90026).frameMs.samples, 2);
  assert.equal(progress.diagnostics(90026).frameMs.max, 3200);
});

test('frame interval history stays bounded during a long-running expedition', async () => {
  const progress = await create();
  const snapshot = { tick: 1, floor: 0, runToken: 'run' };
  for (let frame = 1; frame <= 300; frame++) progress.submitted(snapshot, frame * 16);
  assert.deepEqual(progress.diagnostics(4800).frameMs, { p50: 16, p95: 16, p99: 16, max: 16, samples: 240 });
});
