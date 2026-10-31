'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../../public/ai-maze-escape/map-view.mjs');

test('the public step count remains cumulative after the visible trail is capped', () => {
  const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
  const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
  const run = MazeRuntime.create({ width: 7, height: 7, profile: 'tree' }, 'long-walk');
  run.state.explorer.steps = 301;
  run.state.explorer.route = Array(302).fill(run.state.explorer.cell);
  const snapshot = buildMazeRenderSnapshot(run.state);
  assert.equal(snapshot.steps, 301);
  assert.equal(snapshot.travelledRoute.length, 240);
});

function snapshot(route, extras = {}) {
  return {
    runToken: 'public-run', width: 7, height: 5, currentCell: route.at(-1),
    tick: route.length, travelledRoute: route, discoveredCells: [0, 1, 2, 8, 9],
    progressPermille: 100,
    cells: [
      { cell: 0, neighbors: [1] }, { cell: 1, neighbors: [0, 8] },
      { cell: 2, neighbors: [9] }, { cell: 8, neighbors: [1, 9] },
      { cell: 9, neighbors: [8, 2] },
    ], ...extras,
  };
}

test('skipped public ticks animate the observed turn instead of cutting through walls', async () => {
  const { planPublicMotion, samplePublicPath } = await load();
  const motion = planPublicMotion(snapshot([0, 1]), snapshot([0, 1, 8, 9]));
  assert.deepEqual(motion.cells, [1, 8, 9]);
  assert.equal(motion.snap, false);
  const midpoint = samplePublicPath(motion.cells, 0.5, 7, 5);
  assert.equal(midpoint.cell, 8);
  assert.equal(midpoint.x, -4.8);
  assert.equal(midpoint.z, -2.4);
});

test('restart never interpolates across two maze worlds', async () => {
  const { planPublicMotion } = await load();
  const next = snapshot([2], { runToken: 'next-public-run' });
  assert.deepEqual(planPublicMotion(snapshot([0, 1]), next), { cells: [2], snap: true });
});

test('missing route continuity snaps to disclosed position without inventing a path', async () => {
  const { planPublicMotion } = await load();
  assert.deepEqual(planPublicMotion(snapshot([0]), snapshot([2, 9])), { cells: [9], snap: true });
});

test('a path containing an undisclosed cell is not animated', async () => {
  const { planPublicMotion } = await load();
  const next = snapshot([0, 1, 2, 9], { discoveredCells: [0, 1, 8, 9], cells: snapshot([9]).cells.filter(c => c.cell !== 2) });
  assert.deepEqual(planPublicMotion(snapshot([0, 1]), next), { cells: [9], snap: true });
});

test('geometric adjacency does not allow interpolation through a known wall', async () => {
  const { planPublicMotion } = await load();
  assert.deepEqual(planPublicMotion(snapshot([0, 1]), snapshot([0, 1, 2])), { cells: [2], snap: true });
});

test('public camera keeps the explorer in frame and uses known-space extents', async () => {
  const { computePublicView } = await load();
  const state = snapshot([0, 1, 8, 9], { width: 21, height: 13 });
  const view = computePublicView(state, { centerCell: 99 });
  assert.equal(view.containsCurrentCell, true);
  assert.ok(view.widthCells < state.width);
  assert.ok(view.heightCells < state.height);
  assert.equal(view.centerCell, 9);
});

test('identical public routes have no spurious movement', async () => {
  const { planPublicMotion } = await load();
  const state = snapshot([0, 1, 8]);
  assert.deepEqual(planPublicMotion(state, state), { cells: [8], snap: false });
});

test('wayfinding marks only reciprocally disclosed legal edges beside the real current cell', async () => {
  const {publicWayfinding} = await load();
  const state = snapshot([0, 1, 8], {
    currentCell: 1, plannedRoute: [1, 8, 9],
    cells: [
      {cell: 0, neighbors: [1]},
      {cell: 1, neighbors: [0, 8, 2, 15, 4]},
      {cell: 8, neighbors: [1, 9]},
      {cell: 2, neighbors: [9]}, // No reciprocal passage through the wall.
      {cell: 4, neighbors: [1], blocked: true},
      {cell: 15, neighbors: [1]}, // Farther than one grid step.
    ],
  });
  assert.deepEqual(publicWayfinding(state), [
    {from: 1, to: 0, kind: 'known'},
    {from: 1, to: 8, kind: 'planned'},
  ]);
  assert.deepEqual(publicWayfinding({...state, plannedRoute: [0, 1, 8]}), [
    {from: 1, to: 0, kind: 'known'},
    {from: 1, to: 8, kind: 'known'},
  ], 'an old planned path must not be re-anchored');
  assert.deepEqual(publicWayfinding({...state, result: {reason: 'capture'}}), []);
  assert.deepEqual(publicWayfinding({...state, cells: state.cells.filter(c => c.cell !== 8)}),
    [{from: 1, to: 0, kind: 'known'}], 'undisclosed destinations must remain unmarked');
});
