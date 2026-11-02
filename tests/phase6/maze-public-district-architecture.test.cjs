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
    for (const file of ['world.js', 'gate-moment.mjs', 'map-view.mjs'])
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

test('offshore rock silhouettes depend only on public board size, never undisclosed routes', async () => {
  const { world: module, cleanup } = await loadRealWorld();
  const width = 11, height = 13;
  const base = {
    runToken: 'reef-public-dimension', tick: 1, width, height,
    cells: [], visibleCells: [], doors: [], keys: [], inventory: [], exitCell: null,
  };
  const disclosed = {
    ...base, tick: 2,
    cells: [{ cell: 14, neighbors: [], blocked: false, trap: false,
      checkpoint: false, clue: false }],
    visibleCells: [14],
  };
  const emptyWorld = module.createMazeWorld({ balanced: true });
  const discoveredWorld = module.createMazeWorld({ balanced: true });
  function originalRockPositions(world) {
    const rocks = [];
    world.group.traverse(node => {
      if (!node.isInstancedMesh ||
          !node.name.startsWith('Dimension-only offshore')) return;
      assert.ok(node.instanceMatrix.array.length === node.count * 16);
      for (let i = 0; i < node.count; i++) {
        const data = node.instanceMatrix.array;
        if (node.name === 'Dimension-only offshore broken rock silhouettes')
          assert.equal(node.geometry.type, 'ConeGeometry',
            'reef silhouette must remain an irregular tidal spire, not a floating round boulder');
        if (node.name === 'Dimension-only offshore lichen caps')
          assert.ok(data[i * 16 + 13] < -1.35,
            'lichen must be grounded at the submerged rock base, not a floating item');
        const x = data[i * 16 + 12], z = data[i * 16 + 14];
        // Each rock is beyond the guaranteed public board; NEVER a possible
        // missing cell, bridge, door, collectible or navigation hint.
        assert.ok(
          Math.abs(x) > width * module.CELL_SIZE / 2 + 3 ||
          Math.abs(z) > height * module.CELL_SIZE / 2 + 3,
          'non-navigable scenic rock must not overlap the board'
        );
        rocks.push([node.name, x, data[i * 16 + 13], z]);
      }
    });
    return rocks;
  }
  try {
    emptyWorld.update(base);
    discoveredWorld.update(disclosed);
    const a = originalRockPositions(emptyWorld);
    const b = originalRockPositions(discoveredWorld);
    assert.equal(a.length, 64, 'modeled rocks and lichen share a fixed draw budget');
    assert.deepEqual(a, b,
      'hidden cells, discovery count and run tick cannot reveal topology via backdrop');
    assert.ok(emptyWorld.stats().geometryCount <= 16);
    assert.ok(emptyWorld.stats().materialCount <= 26);
    assert.ok(emptyWorld.stats().textureCount <= 3);
  } finally {
    emptyWorld.dispose();
    discoveredWorld.dispose();
    cleanup();
  }
});

test('original blocked-tile windcatcher is physical, deterministic and never reveals an undisclosed cell', async () => {
  const { world: module, cleanup } = await loadRealWorld();
  const publicCell = {
    cell: 22, neighbors: [], blocked: true, trap: false,
    checkpoint: false, clue: false,
  };
  // Cell 22 is a deterministic windcatcher candidate; it has no secret
  // relation to a goal, private map, navigation policy or run seed.
  const known = {
    runToken: 'disclosed-windcatcher-a', tick: 1, width: 7, height: 7,
    cells: [publicCell], visibleCells: [22],
    doors: [], keys: [], inventory: [], exitCell: null,
  };
  const unknown = { ...known, cells: [], visibleCells: [] };
  const revealed = module.createMazeWorld({ balanced: true });
  const baseline = module.createMazeWorld({ balanced: true });
  const replay = module.createMazeWorld({ balanced: true });
  try {
    baseline.update(unknown);
    assert.equal(baseline.stats().windcatcherTowers, 0,
      'an undisclosed blocked tile must never be represented by a tower');
    revealed.update(known);
    replay.update({ ...known, runToken: 'disclosed-windcatcher-b', tick: 902 });
    assert.deepEqual(revealed.stats().renderedCells, [22]);
    assert.equal(revealed.stats().windcatcherTowers, 1,
      'the public blocked cell must carry one genuinely modeled silhouette');
    assert.equal(replay.stats().windcatcherTowers, 1);
    assert.equal(revealed.stats().instances, replay.stats().instances,
      'physical model distribution must not depend on tick or run token');
    assert.ok(revealed.stats().instances > baseline.stats().instances + 20,
      'the new landmark must be physical batched 3D, not a HUD label');
    assert.ok(revealed.stats().geometryCount <= 16);
    assert.ok(revealed.stats().materialCount <= 26);
    assert.ok(revealed.stats().textureCount <= 3);
    assert.deepEqual(known.cells, [publicCell],
      'world construction must not mutate the disclosed source');
    revealed.update({ ...unknown, runToken: 'disclosed-windcatcher-next' });
    assert.deepEqual(revealed.stats().renderedCells, []);
    assert.equal(revealed.stats().windcatcherTowers, 0,
      'new runs may not inherit a previous run\'s discovered scenery');
  } finally {
    revealed.dispose();
    baseline.dispose();
    replay.dispose();
    cleanup();
  }
});
