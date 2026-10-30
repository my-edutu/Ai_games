'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const source = fs.readFileSync(path.resolve(__dirname, '../../public/ai-maze-escape/world.js'), 'utf8');
const three = pathToFileURL(path.resolve(__dirname, '../../node_modules/three/build/three.module.js')).href;
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source.replace("'./vendor/three.module.js'", JSON.stringify(three))).toString('base64')}`);
const fixture = (cells) => ({ runToken: 'terrace-fixture', width: 7, height: 9, currentCell: 24, cells, visibleCells: cells.map(c => c.cell), discoveredCells: cells.map(c => c.cell), doors: [], keys: [], threats: [], exitCell: null });

test('terrace stairs join disclosed legal passages and never disclose hidden neighbors', async () => {
  const { createMazeWorld, sampleGroundHeight, cellPosition, cellHeight } = await modulePromise;
  const low = {cell: 24, neighbors: [17]}, high = {cell: 17, neighbors: [24]};
  const known = fixture([low, high]), world = createMazeWorld({balanced: true});
  world.update(known);
  assert.deepEqual(world.stats().stairEdges, [[24, 17]]);
  const a = cellPosition(24, 7, 9), b = cellPosition(17, 7, 9);
  let previous = cellHeight(24, 7, 9);
  for (let i = 0; i <= 240; i++) {
    const progress = i / 240;
    const ground = sampleGroundHeight(a.x + (b.x - a.x) * progress, a.z + (b.z - a.z) * progress, known);
    assert.ok(ground >= previous - 1e-8);
    assert.ok(ground - previous <= .175001);
    previous = ground;
  }
  assert.equal(previous, cellHeight(17, 7, 9));
  const hidden = fixture([low]);
  world.update(hidden);
  assert.deepEqual(world.stats().renderedCells, [24]);
  assert.deepEqual(world.stats().stairEdges, []);
  assert.equal(sampleGroundHeight(a.x, a.z - .8, hidden), cellHeight(24, 7, 9));
  world.update(fixture([{...low, neighbors: []}, {...high, neighbors: []}]));
  assert.deepEqual(world.stats().stairEdges, []);
  world.dispose(); world.dispose();
  assert.equal(world.stats().geometryCount, 0);
  assert.equal(world.stats().materialCount, 0);
  assert.equal(world.stats().textureCount, 0);
});

test('successive real runs retain only disclosed geometry and fixed shared resources', async () => {
  const { createMazeWorld } = await modulePromise;
  for (const balanced of [false, true]) {
    const world = createMazeWorld({balanced});
    const budget = world.stats();
    assert.ok(budget.geometryCount <= 12 && budget.materialCount <= 24 && budget.textureCount <= 4);
    for (let run = 0; run < 6; run++) {
      const runtime = MazeRuntime.create({width: 13, height: 9, profile: 'loops', keyCount: 1, threatCount: 1, visibilityRadius: 3}, `3d-resources-${run}`);
      for (let tick = 0; tick < 18; tick++) {
        const snapshot = buildMazeRenderSnapshot(runtime.state), before = JSON.stringify(snapshot);
        world.update(snapshot); world.animate(tick / 3, {reducedMotion: tick % 2 === 0});
        const stats = world.stats(), known = new Map(snapshot.cells.map(cell => [cell.cell, cell]));
        assert.deepEqual(stats.renderedCells, snapshot.cells.map(cell => cell.cell));
        for (const [low, high] of stats.stairEdges) assert.ok(known.has(low) && known.has(high) && known.get(low).neighbors.includes(high));
        assert.equal(stats.geometryCount, budget.geometryCount);
        assert.equal(stats.materialCount, budget.materialCount);
        assert.equal(stats.textureCount, budget.textureCount);
        assert.equal(JSON.stringify(snapshot), before);
        if (snapshot.result) break;
        runtime.step();
      }
    }
    world.dispose();
    assert.equal(world.group.children.length, 0);
  }
});
