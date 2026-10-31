'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('the 3D garden has bounded raised landscape silhouettes in every camera heading', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    try {
      const sectors = new Set();
      world.group.traverse(mesh => {
        if (!mesh.isMesh || !mesh.userData.staticWorld) return;
        const p = mesh.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          if (y < 3) continue;
          if (x < -width / 2 - 8) sectors.add('west');
          if (x > width / 2 + 8) sectors.add('east');
          if (z < -height / 2 - 8) sectors.add('north');
          if (z > height / 2 + 8) sectors.add('south');
          assert.ok(Math.abs(x) < width / 2 + 48 && Math.abs(z) < height / 2 + 48 && y < 12,
            'landscape remains inside the declared scene envelope');
        }
      });
      assert.deepEqual([...sectors].sort(), ['east', 'north', 'south', 'west'],
        `detail camera must not turn toward an empty horizon on ${width}x${height}`);
      const stats = world.stats();
      assert.ok(stats.staticMeshes <= 13, 'reuse existing material batches');
      assert.equal(stats.textures, 4, 'no new downloaded or generated texture allocations');
      assert.ok(stats.geometries <= 37, 'one shared continuous cliff primitive, not per-island allocation');
    } finally { world.dispose(); }
  }
});

test('horizon dressing preserves every existing vertex in the playable court and coping', async () => {
  const THREE = await import('three');
  const { createHash } = require('node:crypto');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  // Captured from c086716's actual model before adding the distant landscape.
  const fixtures = [[8, 8, '04f2ae8f27ea38d45ca700bd0a582475be0b90c9d9eb67cfdb228643c80f3977'],
    [28, 16, '277c7d660f88c2c90a9956b096919d5a1e3c5eaede155d0bd4642acd8ea8f55b'],
    [40, 24, '587de9395e35166688cbdc109be5509b2c733e45f3dfe0dbd1c47b2b11f238c5']];
  for (const [width, height, expected] of fixtures) {
    const world = createWorld(THREE, { width, height });
    try {
      const values = [];
      world.group.traverse(mesh => {
        if (!mesh.isMesh || !mesh.userData.staticWorld) return;
        const p = mesh.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          if (Math.abs(p.getX(i)) <= width / 2 + 1 && Math.abs(p.getZ(i)) <= height / 2 + 1)
            values.push(p.getX(i), p.getY(i), p.getZ(i));
        }
      });
      const digest = createHash('sha256').update(Buffer.from(new Float32Array(values).buffer)).digest('hex');
      assert.equal(digest, expected, 'no changed gameplay-plane or coping geometry');
    } finally { world.dispose(); }
  }
});
