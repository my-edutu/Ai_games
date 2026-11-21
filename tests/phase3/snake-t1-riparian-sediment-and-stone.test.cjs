'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('T1 actual bank geometry carries varied readable sediment without adding draw objects or moving cells', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const { createCourtyardEcology } = await import('../../public/snake-stream/courtyard-ecology.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    const ecology = createCourtyardEcology(THREE, { width, height, world });
    const repeatWorld = createWorld(THREE, { width, height });
    const repeat = createCourtyardEcology(THREE, { width, height, world: repeatWorld });
    try {
      const state = ecology.stats();
      const geometry = ecology.group.children[0].geometry;
      const source = geometry.getAttribute('color');
      const clone = repeat.group.children[0].geometry.getAttribute('color');
      const braidVertices = state.braidedSurfaceTriangles * 3;
      assert.ok(braidVertices > 900, 'original long-watercourse coverage remains physically present');
      assert.deepEqual(source.array, clone.array, 'all bank color remains deterministic from public board dimensions');
      const greens = [];
      for (let i = 0; i < braidVertices; i++) {
        const green = source.getY(i), red = source.getX(i), blue = source.getZ(i);
        assert.ok([red, green, blue].every(Number.isFinite));
        assert.ok(green < 0.42 && green > 0.02, 'no fluorescent road paint or black blanking');
        greens.push(green);
      }
      greens.sort((a, b) => a - b);
      const quantile = f => greens[Math.floor((greens.length - 1) * f)];
      assert.ok(quantile(0.9) - quantile(0.1) > 0.108,
        'physically planted banks contain broad leaf/rock/shade differences, not one monotonous pale ribbon');
      assert.equal(state.meshCount, 1);
      assert.equal(state.publicCellsMoved, 0);
      assert.ok(state.triangles <= 3100);
      assert.equal(world.stats().staticMeshes, 13);
      assert.equal(world.stats().textures, 4);
    } finally { ecology.dispose(); repeat.dispose(); world.dispose(); repeatWorld.dispose(); }
  }
  const browser = fs.readFileSync(path.resolve(__dirname, '../browser/snake-stream.spec.cjs'), 'utf8');
  assert.match(browser, /expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
