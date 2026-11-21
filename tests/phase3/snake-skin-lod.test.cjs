'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('distance-aware skin retains pigment and close-up relief with constant resources', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const body = serpent.group.getObjectByName('Continuous sculpted serpent body');
  const skull = serpent.group.getObjectByName('Continuous tapered skull and neck');
  const paths = [[{ x: 0, z: 0 }, { x: 0, z: -1 }, { x: -1, z: -1 }, { x: -2, z: -1 }], [{ x: 10, z: 10 }]];
  const budgets = serpent.stats();
  try {
    serpent.update(paths, { detail: 'high', time: 1, delta: 1 / 60 });
    const bodyDetailed = body.material, skullDetailed = skull.material;
    const detailedIndices = body.geometry.drawRange.count;
    assert.equal(bodyDetailed.type, 'MeshStandardMaterial');
    assert.equal(skullDetailed.type, 'MeshStandardMaterial');
    assert.ok(bodyDetailed.bumpMap && bodyDetailed.roughnessMap);
    assert.ok(skullDetailed.bumpMap && skullDetailed.roughnessMap);
    serpent.update(paths, { detail: 'low', time: 1.1, delta: 1 / 60 });
    const bodyOverview = body.material, skullOverview = skull.material;
    assert.equal(bodyOverview.type, 'MeshLambertMaterial');
    assert.equal(skullOverview.type, 'MeshLambertMaterial');
    assert.equal(bodyOverview.map, bodyDetailed.map, 'original scale pigments must be preserved');
    assert.equal(skullOverview.map, skullDetailed.map, 'original facial pigment must be preserved');
    assert.ok(!bodyOverview.bumpMap && !bodyOverview.roughnessMap);
    assert.ok(!skullOverview.bumpMap && !skullOverview.roughnessMap);
    const overviewIndices = body.geometry.drawRange.count;
    assert.ok(overviewIndices < detailedIndices, 'overview uses lower geometric LOD');
    for (let i = 0; i < 120; i++) {
      const detail = i % 3 === 0 ? 'high' : 'low';
      serpent.update(paths, { detail, time: i / 60, delta: 1 / 60, eating: i % 7 / 6, direction: { x: 1, z: 0 } });
      assert.strictEqual(body.material, detail === 'low' ? bodyOverview : bodyDetailed);
      assert.strictEqual(skull.material, detail === 'low' ? skullOverview : skullDetailed);
      const after = serpent.stats();
      for (const key of ['geometries', 'materials', 'textures', 'bufferBytes']) {
        assert.equal(after[key], budgets[key], key + ' cannot grow as view changes');
      }
      assert.equal(after.paths, 2, 'keep isolated portal fragments');
      assert.equal(after.truncated, false);
      if (detail === 'low') assert.equal(body.geometry.drawRange.count, overviewIndices);
      for (let n = 0; n < body.geometry.drawRange.count; n++) {
        assert.ok(body.geometry.index.array[n] < after.bodyVertices, 'no uninitialized or cross-portal triangle');
      }
    }
    serpent.update(paths, { detail: 'high', reducedMotion: true });
    assert.strictEqual(body.material, bodyDetailed, 'close-up must recover PBR in reduced motion');
    assert.strictEqual(skull.material, skullDetailed);
    serpent.update([], { detail: 'low' });
    assert.equal(body.geometry.drawRange.count, 0, 'empty state cannot show stale geometry');
  } finally {
    serpent.dispose(); serpent.dispose();
  }
  assert.equal(serpent.stats().disposed, true);
});
