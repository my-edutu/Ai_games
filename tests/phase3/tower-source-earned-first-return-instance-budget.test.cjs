'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const policy = import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/source-earned-first-return-instancing.mjs')).href);

const largeOriginalCasting = () => ({
  quality: 'low', sourceEarned: true, count: 16, usedDraws: 0,
  instanceColor: false, isAnimated: false,
  sourceVertices: 320, sourceIndexCount: 1440,
  positionBytes: 3840, normalBytes: 3840, uvBytes: 2560, indexBytes: 2880
});

test('first authentic cold Floor9 return keeps eligible EXISTING instanced stone/steel on the GPU as instances rather than CPU-repacking every casting', async () => {
  const { chooseSourceEarnedFirstReturnInstancing:choose } = await policy;
  const eligible=largeOriginalCasting();
  const first=choose(eligible);
  assert.equal(first.preserve,true);
  assert.ok(first.estimatedAvoidedPackedBytes > 16 * 1024);
  assert.ok(first.existingSourceAndMatricesBytes > 0);
  assert.ok(first.packedBatchBytes > first.existingSourceAndMatricesBytes);
  assert.equal(choose({...eligible,usedDraws:7}).preserve,true);
  assert.equal(choose({...eligible,usedDraws:8}).preserve,false,
    'at most eight extra retained original scene draws');
  assert.deepEqual(eligible,largeOriginalCasting(),'the decision cannot mutate source geometry');
});

test('no gameplay-critical, false-source, animated, color-per-instance or tiny mesh bypasses the normal authored batch', async () => {
  const { chooseSourceEarnedFirstReturnInstancing:choose } = await policy;
  const valid=largeOriginalCasting();
  for (const change of [
    {quality:'high'}, {quality:'normal'}, {sourceEarned:false},
    {count:2}, {usedDraws:8}, {usedDraws:-1}, {usedDraws:1.4},
    {instanceColor:true}, {isAnimated:true},
    {sourceVertices:0}, {sourceIndexCount:Infinity},
    {positionBytes:0}, {normalBytes:-3}, {uvBytes:NaN},
    {sourceVertices:8,sourceIndexCount:36,count:4},
    {count:150}, {sourceIndexCount:1},
  ]) {
    assert.equal(choose({...valid,...change}).preserve,false,
      'source gate rejects '+JSON.stringify(change));
  }
  assert.equal(choose(null).preserve,false);
});

test('shipping world applies preservation only under exact same-run earned cold-F9 source ownership and discloses non-GPU estimate', () => {
  const world=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/chooseSourceEarnedFirstReturnInstancing/);
  assert.match(world,/snapshot\.floor===9/);
  assert.match(world,/retainedEarnedCap\?\.guardianGateRetained===true/);
  assert.match(world,/coldOriginalInstanceDraws/);
  assert.match(world,/estimatedAvoidedPackedBytes/);
  assert.match(world,/isAnimated:/);
  assert.match(world,/not measured GPU memory or performance/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
