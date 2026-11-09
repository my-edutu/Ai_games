'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = () => import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/render-recovery.mjs')).href);
test('a single renderer exception does not falsely declare WebGL context loss', async () => {
  const { towerRenderFaultDecision } = await load();
  assert.deepEqual(towerRenderFaultDecision(1, 0, 1000),
    { state: 'live', attempts: 0, retryAt: null });
});
test('repeated faults get a finite, increasing reset schedule and then stop', async () => {
  const { towerRenderFaultDecision, towerRenderRetryReady } = await load();
  const first = towerRenderFaultDecision(2, 0, 1000);
  assert.deepEqual(first, { state: 'retrying', attempts: 1, retryAt: 1250 });
  assert.equal(towerRenderRetryReady(first.state, first.retryAt, 1249), false);
  assert.equal(towerRenderRetryReady(first.state, first.retryAt, 1250), true);
  const second = towerRenderFaultDecision(3, first.attempts, 1250);
  assert.deepEqual(second, { state: 'retrying', attempts: 2, retryAt: 2000 });
  const third = towerRenderFaultDecision(4, second.attempts, 2000);
  assert.deepEqual(third, { state: 'retrying', attempts: 3, retryAt: 3800 });
  assert.deepEqual(towerRenderFaultDecision(5, third.attempts, 3800),
    { state: 'failed', attempts: 3, retryAt: null });
  assert.equal(towerRenderRetryReady('failed', null, 999999), false);
});
test('bad clocks and counters fail closed rather than create an endless retry loop', async () => {
  const { towerRenderFaultDecision } = await load();
  for (const args of [[2, 0, NaN], [2, -1, 0], [-1, 0, 0], [2, 0, Infinity]]) {
    assert.equal(towerRenderFaultDecision(...args).state, 'failed');
  }
});
