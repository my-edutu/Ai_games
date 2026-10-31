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
  assert.deepEqual(publicWayfinding({...state, doors: [{id: 'lock', a: 1, b: 8, open: false}]}),
    [{from: 1, to: 0, kind: 'known'}], 'a disclosed locked door blocks the otherwise known corridor');
  assert.deepEqual(publicWayfinding({...state, doors: [{id: 'lock', a: 1, b: 8, open: true}]}),
    publicWayfinding(state), 'opening an observed door restores its legal corridor');
  assert.deepEqual(publicWayfinding({...state, result: {reason: 'capture'}}), []);
  assert.deepEqual(publicWayfinding({...state, cells: state.cells.filter(c => c.cell !== 8)}),
    [{from: 1, to: 0, kind: 'known'}], 'undisclosed destinations must remain unmarked');
});


test('disclosed landmark selector never marks hidden, locked, blocked or unreachable destinations', async () => {
  const {publicObjective} = await load();
  const base = snapshot([1], {
    currentCell: 1,
    keys: [{id: 'shown', cell: 9, collected: false}, {id: 'hidden', cell: 21, collected: false}],
    doors: [], exitCell: 2,
  });
  assert.deepEqual(publicObjective(base), {kind: 'key', cell: 9, steps: 2});
  assert.deepEqual(publicObjective({...base, keys: [{id: 'shown', cell: 9, collected: true}]}),
    {kind: 'exit', cell: 2, steps: 3}, 'known exits stay distinct from guaranteed safe escapes');
  assert.equal(publicObjective({...base, doors: [{a: 1, b: 8, open: false}], exitCell: null}), null);
  assert.deepEqual(publicObjective({...base, doors: [{a: 1, b: 8, open: true}]}),
    publicObjective(base), 'an opened public gate restores the observed chain');
  assert.equal(publicObjective({...base, cells: base.cells.filter(c => c.cell !== 9), exitCell: null}), null);
  assert.equal(publicObjective({...base, cells: base.cells.map(c => c.cell === 9 ? {...c, neighbors: [2]} : c), exitCell: null}), null);
  assert.equal(publicObjective({...base, cells: base.cells.map(c => c.cell === 8 ? {...c, blocked: true} : c), exitCell: null}), null);
  assert.equal(publicObjective({...base, keys: [{id: 'hidden', cell: 21, collected: false}], exitCell: null}), null);
  assert.equal(publicObjective({...base, result: {reason: 'capture'}}), null);
  assert.equal(publicObjective({...base, currentCell: 11}), null);
});


test('coastal stage camera bias uses only nearby public cells, stays bounded and vanishes for results', async () => {
  const {publicStageBias} = await load();
  const coast = {width: 7, height: 5, currentCell: 1,
    cells: [{cell: 1}, {cell: 2}, {cell: 3}, {cell: 4}, {cell: 5}]};
  const offset = publicStageBias(coast);
  assert.ok(offset.x > 0 && offset.z < 0, 'focus moves into the known stage instead of empty water');
  assert.ok(Math.hypot(offset.x, offset.z) <= 2.750001, 'hero-relative bias has a hard cap');
  assert.deepEqual(publicStageBias({...coast, cells: [{cell: 1}]}), {x: 0, z: 0});
  assert.deepEqual(publicStageBias({...coast, cells: [{cell: 1}, {cell: 33}]}), {x: 0, z: 0},
    'unrelated distant discoveries cannot pull the local camera');
  assert.deepEqual(publicStageBias({...coast, result: {reason: 'escape'}}), {x: 0, z: 0});
  assert.deepEqual(publicStageBias({...coast, currentCell: -1}), {x: 0, z: 0});
});
