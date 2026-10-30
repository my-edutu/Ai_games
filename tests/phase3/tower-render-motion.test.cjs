'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('enemy gait velocity remains per simulation tick across different polling cadences', async () => {
  const { snapshotVelocity } = await import('../../public/infinite-tower-climb/visuals/motion.mjs');
  for (const ticks of [1, 2, 5, 11]) {
    assert.equal(snapshotVelocity(10000, 10000 + ticks * 1200, ticks), 1200);
    assert.equal(snapshotVelocity(10000, 10000 - ticks * 700, ticks), -700);
  }
  assert.equal(snapshotVelocity(10000, 11000, 0), 0);
  assert.equal(snapshotVelocity(10000, 11000, -1), 0);
  assert.equal(snapshotVelocity(NaN, 11000, 2), 0);
});
