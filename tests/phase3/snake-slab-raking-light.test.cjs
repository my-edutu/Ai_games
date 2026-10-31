'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('authored quarry raking light models raised slab lips without new geometry or authority changes', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const width = 28, height = 16;
  const world = createWorld(THREE, { width, height });
  try {
    const court = world.group.children.find(object => object.isMesh && object.material?.map?.image?.width === 1024
      && object.material.map.image.height === 512);
    assert.ok(court, 'inspect the actual court texture bound to the rendered mesh');
    const map = court.material.map;
    assert.equal(map.colorSpace, THREE.SRGBColorSpace);
    const { data } = map.image;
    const luminance = (cellX, cellZ, u, v) => {
      const px = Math.floor((cellX + u) / width * 1024), py = Math.floor((cellZ + v) / height * 512);
      const index = (py * 1024 + px) * 4;
      assert.equal(data[index + 3], 255, 'original opaque playable court remains opaque');
      return (data[index] + data[index + 1] + data[index + 2]) / 3;
    };
    let sunward = 0, crosswise = 0, samples = 0;
    for (let z = 1; z < height - 1; z++) for (let x = 1; x < width - 1; x++) {
      // Shadow and highlight are on opposite sides of *the same* slab; comparing
      // each cell to itself removes broad stone-color and per-cell tint changes.
      sunward += luminance(x, z, 0.07, 0.5) - luminance(x, z, 0.93, 0.5);
      crosswise += luminance(x, z, 0.5, 0.07) - luminance(x, z, 0.5, 0.93);
      samples++;
    }
    assert.ok(sunward / samples > 10, 'west-facing quarry lip must catch authored grazing light');
    assert.ok(crosswise / samples > 10, 'north-facing quarry lip must catch authored grazing light');
    const initial = world.stats();
    assert.equal(initial.staticMeshes, 13, 'retain all original static world material batches');
    assert.equal(initial.textures, 4, 'bake relief into the original existing texture');
    const snapshot = { obstacles: [12], hazards: [], portals: [], food: { cell: 17 } };
    const immutable = JSON.stringify(snapshot);
    world.update(snapshot, { time: 1.2, reducedMotion: false });
    world.update(snapshot, { time: 2.4, reducedMotion: true });
    assert.equal(JSON.stringify(snapshot), immutable, 'world presentation cannot mutate public snapshots');
    for (const key of ['staticMeshes', 'geometries', 'materials', 'textures', 'drawObjects'])
      assert.equal(world.stats()[key], initial[key], `bounded ${key} after updates`);
  } finally {
    world.dispose();
    assert.equal(world.group.children.length, 0, 'release the entire garden scene');
  }
});
