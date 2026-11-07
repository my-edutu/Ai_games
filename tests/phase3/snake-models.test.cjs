'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('serpent detail switches retain finite bounded meshes and never bridge a portal', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const capacity = serpent.stats();
  const paths = [[{ x: 0, z: 0 }, { x: -1, z: 0 }], [{ x: 10, z: 7 }, { x: 11, z: 7 }, { x: 12, z: 7 }]];
  try {
    for (const detail of ['high', 'low', 'high']) {
      serpent.update(paths, { detail, time: 1, delta: 1 / 60 });
      const body = serpent.group.getObjectByName('Continuous sculpted serpent body').geometry;
      const p = body.attributes.position, indices = body.index.array;
      for (let i = 0; i < body.drawRange.count; i += 3) {
        const points = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(p, indices[i + j]));
        for (let j = 0; j < 3; j++) assert.ok(points[j].distanceTo(points[(j + 1) % 3]) < 2, 'triangle crossed the portal gap');
      }
    }
    const full = [];
    for (let z = 0; z < 16; z++) for (let x = 0; x < 28; x++) full.push({ x: z % 2 ? 27 - x : x, z });
    for (let i = 0; i < 40; i++) serpent.update([full], { detail: i % 2 ? 'low' : 'high', time: i / 60, delta: 1 / 60 });
    const current = serpent.stats();
    assert.equal(current.truncated, false);
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes']) assert.equal(current[key], capacity[key]);
    const body = serpent.group.getObjectByName('Continuous sculpted serpent body').geometry;
    for (let i = 0; i < current.bodyVertices * 3; i++) assert.ok(Number.isFinite(body.attributes.position.array[i]));
    for (let i = 0; i < body.drawRange.count; i++) assert.ok(body.index.array[i] < current.bodyVertices);
    serpent.update([], {});
    assert.equal(serpent.stats().bodyTriangles, 0);
  } finally { serpent.dispose(); serpent.dispose(); }
  assert.equal(serpent.stats().disposed, true);
});

test('world updates immutable public props with fixed resources and disposes cleanly', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const world = createWorld(THREE, { width: 28, height: 16 });
  const snapshot = Object.freeze({ obstacles: Object.freeze([12, 24]), hazards: Object.freeze([Object.freeze({ cell: 33, active: true }), Object.freeze({ cell: 38, active: false })]), portals: Object.freeze([Object.freeze({ entry: 18, exit: 380 })]), food: Object.freeze({ cell: 90, kind: 'bonus' }) });
  const original = JSON.stringify(snapshot);
  const before = world.stats();
  try {
    for (let i = 0; i < 250; i++) world.update(snapshot, { time: i / 60, delta: 1 / 60 });
    const after = world.stats();
    for (const key of ['geometries', 'materials', 'textures', 'staticMeshes', 'staticInstances', 'drawObjects']) assert.equal(after[key], before[key]);
    assert.equal(after.obstacles, 2);
    assert.equal(after.hazards, 2);
    assert.equal(after.portalEnds, 2);
    assert.equal(JSON.stringify(snapshot), original);
    world.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      const positions = mesh.geometry.attributes.position.array;
      for (const value of positions) assert.ok(Number.isFinite(value));
    });
    world.update({ obstacles: [], hazards: [], portals: [], food: null });
    assert.equal(world.stats().portalEnds, 0);
    assert.equal(world.stats().hazards, 0);
  } finally { world.dispose(); world.dispose(); }
  assert.equal(world.stats().disposed, true);
  assert.equal(world.group.children.length, 0);
});
