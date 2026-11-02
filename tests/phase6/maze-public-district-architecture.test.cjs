'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The browser resolves /maze/vendor/*.js from its explicit HTTP asset routes.
// Node's focused suite has no public/vendor directory, so load the IDENTICAL
// authored world and exact installed Three build from a disposable ESM tree.
// Do not rewrite game source, stub Three, or relax the geometric assertions.
async function loadRealWorld() {
  const root = path.resolve(__dirname, '../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'maze-physical-world-'));
  const source = path.join(root, 'public/ai-maze-escape');
  const vendor = path.join(root, 'node_modules/three/build');
  try {
    fs.mkdirSync(path.join(temp, 'vendor'));
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    for (const file of ['world.js', 'gate-moment.mjs'])
      fs.copyFileSync(path.join(source, file), path.join(temp, file));
    for (const file of ['three.module.js', 'three.core.js'])
      fs.copyFileSync(path.join(vendor, file), path.join(temp, 'vendor', file));
    const world = await import(pathToFileURL(path.join(temp, 'world.js')).href);
    return { world, cleanup: () => fs.rmSync(temp, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
}

// Source-bound 3D geometry acceptance. These districts must be physical,
// instanced masonry built exclusively from already-disclosed coordinates.
test('public terraces have distinct sculpted clay/tide masonry without hidden construction', async () => {
  const { world: module, cleanup } = await loadRealWorld();
  const { createMazeWorld, cellHeight } = module;
  const width = 3, height = 9;
  const known = [1, 10, 19].map(cell => ({
    cell, neighbors: [], blocked: false, trap: false,
    checkpoint: false, clue: false,
  }));
  assert.deepEqual(known.map(c => cellHeight(c.cell, width, height)), [2.8, 1.4, 0]);
  const snapshot = {
    runToken: 'public-district-geometry', tick: 1, width, height,
    cells: known, visibleCells: known.map(c => c.cell),
    doors: [], keys: [], inventory: [], exitCell: null,
  };
  const world = createMazeWorld({ balanced: true });
  const empty = createMazeWorld({ balanced: true });
  const collected = root => {
    const materials = new Map();
    root.group.traverse(node => {
      if (!node.isInstancedMesh) return;
      const hex = node.material.color.getHexString();
      materials.set(hex, (materials.get(hex) || 0) + node.count);
    });
    return materials;
  };
  try {
    empty.update({ ...snapshot, cells: [], visibleCells: [] });
    assert.deepEqual(empty.stats().renderedCells, []);
    assert.equal(collected(empty).get('b07953') || 0, 0,
      'an undisclosed clay court cannot be constructed');
    assert.equal(collected(empty).get('5d968e') || 0, 0,
      'an undisclosed tide court cannot be constructed');
    world.update(snapshot);
    const counts = collected(world);
    assert.deepEqual(world.stats().renderedCells, [1, 10, 19]);
    assert.ok((counts.get('b07953') || 0) > 12,
      'the middle clay district needs physical wall relief beyond a floor tint');
    assert.ok((counts.get('5d968e') || 0) > 12,
      'the low tidal district needs physical wall relief beyond a floor tint');
    assert.ok(world.stats().geometryCount <= 16);
    assert.ok(world.stats().materialCount <= 26);
    assert.ok(world.stats().textureCount <= 3);
    assert.deepEqual(snapshot.cells, known, 'rendering may not mutate disclosed maze geometry');
    const next = createMazeWorld({ balanced: true });
    try {
      next.update(snapshot);
      assert.deepEqual([...collected(next)].sort(), [...counts].sort(),
        'same public cells must produce deterministic 3D facade distribution');
    } finally { next.dispose(); }
  } finally {
    world.dispose();
    empty.dispose();
    cleanup();
  }
});
