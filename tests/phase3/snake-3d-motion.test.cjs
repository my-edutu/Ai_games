'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const load = () => import(pathToFileURL(path.resolve(__dirname, '../../public/snake-stream/motion.mjs')).href);
function snapshot(cells, overrides = {}) {
  return { width: 10, height: 6, runToken: 'one', movementStep: 2, snake: cells.map((cell, i) => ({ cell, id: `snake-${i}` })), ...overrides };
}

test('3D motion smoothly follows adjacent authoritative cells without modifying snapshots', async () => {
  const { buildMotion } = await load();
  const previous = snapshot([11, 10], { movementStep: 1 });
  const next = snapshot([12, 11, 10]);
  const before = JSON.stringify([previous, next]);
  const motion = buildMotion(next, previous, 0.5);
  assert.equal(motion.paths[0][0].x, -3);
  assert.equal(motion.paths[0][0].z, -1.5);
  assert.deepEqual(motion.direction, { x: 1, z: 0 });
  assert.equal(JSON.stringify([previous, next]), before);
});

test('3D portal bodies split at nonadjacent cells and never interpolate across the board', async () => {
  const { buildMotion } = await load();
  const motion = buildMotion(snapshot([45, 44, 11, 10]), snapshot([11, 10, 0], { movementStep: 1 }), 0.2);
  assert.equal(motion.paths.length, 2);
  assert.deepEqual(motion.paths[0][0], { x: 0.5, z: 1.5 });
  for (const segment of motion.paths) for (let i = 1; i < segment.length; i++) {
    assert.ok(Math.hypot(segment[i].x - segment[i - 1].x, segment[i].z - segment[i - 1].z) <= 1.01);
  }
});

test('new runs and skipped movement frames snap cleanly instead of dragging across prior worlds', async () => {
  const { buildMotion } = await load();
  const next = snapshot([24, 23]);
  const differentRun = snapshot([25, 24], { movementStep: 1, runToken: 'old' });
  assert.deepEqual(buildMotion(next, differentRun, 0).paths[0][0], { x: -0.5, z: -0.5 });
  const skipped = snapshot([25, 24], { movementStep: 0 });
  assert.deepEqual(buildMotion(next, skipped, 0).paths[0][0], { x: -0.5, z: -0.5 });
});

test('motion preserves numeric safety on empty, single-cell and same-revision views', async () => {
  const { buildMotion } = await load();
  assert.deepEqual(buildMotion(snapshot([]), null, 0.5).paths, []);
  const next = snapshot([5]);
  const motion = buildMotion(next, next, Number.NaN);
  assert.deepEqual(motion.paths, [[{ x: 0.5, z: -2.5 }]]);
  assert.ok(Number.isFinite(motion.direction.x));
});
