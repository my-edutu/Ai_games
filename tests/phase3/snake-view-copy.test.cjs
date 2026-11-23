'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const load = () => import(pathToFileURL(path.resolve(__dirname, '../../public/snake-stream/view-copy.mjs')).href);
test('occupancy uses occupied cells over board area, rather than treating the count as a ratio', async () => {
  const { spectatorCopy } = await load();
  const copy = spectatorCopy({ width:28, height:16, occupancy:23, foodsCollected:20, ai:{mode:'preserve-space'} });
  assert.equal(copy.occupancy, '5% of the garden occupied');
});
test('spectator intent conveys validated strategy without internal planner diagnostics', async () => {
  const { spectatorCopy } = await load();
  const copy = spectatorCopy({ width:8, height:8, occupancy:3, ai:{ mode:'preserve-space',intent:'preserve-space: reachable=426, foodDistance=13, tail=true' } });
  assert.equal(copy.intent, 'Keeping a safe way through');
  assert.doesNotMatch(copy.intent, /reachable|foodDistance|tail=/);
  assert.equal(spectatorCopy({width:8,height:8,occupancy:3,ai:{mode:'unknown'}}).intent,'Finding a safe path');
});
