'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('distant water cells coarsen without touching near-fog samples, horizon, or topology', async () => {
  const THREE = await import('three');
  const { createWorld, createFogAwareWaterPlane } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24], [80, 40]]) {
    const extent = Math.max(512, width * 3, height * 3);
    const originalSegments = Math.max(64, Math.ceil(extent / 8));
    const grid = createFogAwareWaterPlane(THREE, extent, width, height);
    const world = createWorld(THREE, { width, height });
    try {
      const water = world.group.getObjectByName('Flowing water');
      assert.ok(water?.isMesh, 'animated water remains visible');
      assert.equal(water.geometry.index.count, grid.index.count);
      const pos = grid.getAttribute('position');
      const segments = Math.sqrt(pos.count) - 1;
      assert.ok(Number.isInteger(segments));
      assert.ok(segments < originalSegments,
        'the near-field must use fewer quads than the old full 512-unit tessellation');
      assert.ok(segments * segments <= originalSegments * originalSegments * .8,
        'meaningful reduction in water vertex and triangle work');
      assert.equal(grid.index.count, segments * segments * 6);
      const xs = Array.from({ length: segments + 1 }, (_, column) => pos.getX(column));
      const ys = Array.from({ length: segments + 1 }, (_, row) => pos.getY(row * (segments + 1)));
      assert.equal(xs[0], -extent / 2);
      assert.equal(xs.at(-1), extent / 2);
      assert.equal(ys[0], extent / 2);
      assert.equal(ys.at(-1), -extent / 2);
      for (let index = 1; index < xs.length - 2; index++) {
        const interval = xs[index + 1] - xs[index];
        assert.equal(interval, 8, 'near-camera fog samples retain the original 8-unit spacing');
      }
      assert.ok(xs[1] - xs[0] >= 8 && xs.at(-1) - xs.at(-2) >= 8);
      assert.equal(xs[1], -xs.at(-2), 'outer coarse strips must be symmetric');
      assert.ok(xs[1] <= -(Math.max(width, height) / 2 + 110),
        'the fog transition remains inside the dense grid even at board edges');
      for(let row=0;row<=segments;row++){
        assert.equal(ys[row], xs[segments - row], 'unwarped row/column geometry stays symmetric');
      }
      // The shader's waterUv is derived from actual XY, not PlaneGeometry's
      // UVs. Sparse outer quads therefore keep the same live flow frequency.
      assert.match(water.material.vertexShader, /waterUv=position\.xy\*\.018/);
      assert.match(water.material.fragmentShader, /texture2D\(waterField,waterUv\)/);
      assert.equal(water.rotation.x, -Math.PI / 2);
      assert.equal(water.position.y, -3.62);
      grid.computeBoundingSphere();
      assert.ok(grid.boundingSphere.radius > 180, 'far water still covers the horizon');
      const before = world.stats();
      const empty = Object.freeze({ obstacles: Object.freeze([]), portals: Object.freeze([]),
        hazards: Object.freeze([]), food: null });
      world.update(empty, { time: 4, reducedMotion: false });
      assert.equal(water.material.uniforms.time.value, 4);
      world.update(empty, { time: 8, reducedMotion: true });
      assert.equal(water.material.uniforms.time.value, 0);
      for (const key of ['drawObjects','staticMeshes','geometries','materials','textures']) {
        assert.equal(world.stats()[key], before[key], 'lifecycle budget: ' + key);
      }
    } finally {
      grid.dispose();
      world.dispose();
    }
    assert.equal(world.group.children.length, 0);
  }
});
