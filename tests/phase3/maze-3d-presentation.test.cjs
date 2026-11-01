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
  assert.deepEqual(publicObjective(base), {kind: 'key', cell: 9, steps: 2, firstStep: 8});
  assert.deepEqual(publicObjective({...base, keys: [{id: 'shown', cell: 9, collected: true}]}),
    {kind: 'exit', cell: 2, steps: 3, firstStep: 8}, 'known exits stay distinct from guaranteed safe escapes');
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



test('observed goal arrows follow only public legal first steps without rewriting AI intent', async () => {
  const {publicWayfinding, publicObjective} = await load();
  const base = snapshot([1], {
    currentCell: 1, plannedRoute: [1, 0],
    keys: [{id: 'visible', cell: 9, collected: false}],
    doors: [], exitCell: 2,
  });
  assert.deepEqual(publicWayfinding(base), [
    {from: 1, to: 0, kind: 'planned'},
    {from: 1, to: 8, kind: 'known', goal: 'key'},
  ], 'a known landmark direction is not mislabeled as the AI plan');
  assert.deepEqual(publicWayfinding({...base, plannedRoute: [1, 8]}), [
    {from: 1, to: 0, kind: 'known'},
    {from: 1, to: 8, kind: 'planned', goal: 'key'},
  ], 'a known first step may also coincide with disclosed AI intent');
  const exit = {...base, keys: [{id: 'visible', cell: 9, collected: true}], plannedRoute: []};
  assert.deepEqual(publicWayfinding(exit), [
    {from: 1, to: 0, kind: 'known'},
    {from: 1, to: 8, kind: 'known', goal: 'exit'},
  ]);
  const shut = {...base, doors: [{a: 1, b: 8, open: false}], exitCell: null};
  assert.equal(publicObjective(shut), null);
  assert.deepEqual(publicWayfinding(shut), [{from: 1, to: 0, kind: 'planned'}],
    'a locked public gate removes the landmark and its suggested first step');
  assert.deepEqual(publicWayfinding({...base, keys: [{id: 'secret', cell: 21, collected: false}], exitCell: null}),
    [{from: 1, to: 0, kind: 'planned'}, {from: 1, to: 8, kind: 'known'}],
    'undisclosed goals cannot create goal-colored directions');
  assert.deepEqual(publicWayfinding({...base, result: {reason: 'escape'}}), []);
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


test('close-goal composition preserves known coastal stage, without pushing the explorer out of the shot', async () => {
  const {publicStageBias, composePublicCameraFocus} = await load();
  const coast = {width: 7, height: 5, currentCell: 1,
    cells: [{cell: 1}, {cell: 2}, {cell: 3}, {cell: 4}, {cell: 5}]};
  const stage = publicStageBias(coast);
  const near = composePublicCameraFocus(stage, {x: 4.8, z: 0}, true, 1.32);
  const goalOnly = composePublicCameraFocus({x: 0, z: 0}, {x: 4.8, z: 0}, true, 1.32);
  assert.ok(near.x > goalOnly.x, 'known local stage should counter empty water even when an exit is close');
  assert.ok(near.z < 0, 'retain disclosed stage depth rather than panning solely to the goal');
  assert.ok(Math.hypot(near.x, near.z) <= 2.500001, 'combine both camera pulls with a single finite bound');
  assert.deepEqual(composePublicCameraFocus(stage, {x: 4.8, z: 0}, false, 1.32), stage,
    'ordinary desktop follow framing retains existing stage composition');
  const portrait = composePublicCameraFocus(stage, null, false, .65);
  assert.ok(Math.hypot(portrait.x, portrait.z) < Math.hypot(stage.x, stage.z),
    'portrait framing preserves hero visibility with a weaker lateral stage pull');
  assert.deepEqual(composePublicCameraFocus({x: Infinity, z: NaN}, null, true, 1), {x: 0, z: 0},
    'invalid camera offsets cannot turn into non-finite projections');
});


test('publicNearbySealedGate framing selects only disclosed adjacent sealed obstacles', async () => {
  const {publicNearbySealedGate, composePublicSealedGateFocus} = await load();
  const state = {
    width: 7, height: 5, currentCell: 8,
    cells: [{cell: 8, neighbors: [9]}, {cell: 9, neighbors: [8]}],
    doors: [{id: 'visible-seal', a: 8, b: 9, open: false}],
    result: null,
  };
  const original = JSON.stringify(state);
  assert.deepEqual(publicNearbySealedGate(state), {a: 8, b: 9, steps: 0},
    'a public blocked passage may be framed, never suggested as traversable');
  assert.equal(JSON.stringify(state), original, 'camera selection cannot mutate public authority');
  assert.equal(publicNearbySealedGate({...state, doors: [{...state.doors[0], open: true}]}), null);
  assert.equal(publicNearbySealedGate({...state, cells: [{cell: 15}], currentCell: 15}), null,
    'a door outside the observed local stage is not a camera target');
  assert.equal(publicNearbySealedGate({...state, doors: [{a: 16, b: 17, open: false}]}), null,
    'an undisclosed obstruction must not steer the camera');
  assert.equal(publicNearbySealedGate({...state, doors: [{a: 13, b: 14, open: false}]}), null,
    'a wrapped, non-adjacent pair cannot become a gate focal point');
  assert.equal(publicNearbySealedGate({...state, result: {reason: 'escape'}}), null);
  assert.equal(publicNearbySealedGate({...state, currentCell: -1}), null);
  assert.equal(publicNearbySealedGate({...state, cells: [{cell: 8}], doors: [
    {id: 'half-known', a: 8, b: 9, open: false}]}).a, 8,
    'a visibly modeled public gate with one disclosed side remains eligible');

  const stage = {x: 2.75, z: -1};
  const gate = {x: -2.4, z: .5};
  const desktop = composePublicSealedGateFocus(stage, gate, 1.32);
  const portrait = composePublicSealedGateFocus(stage, gate, .65);
  assert.ok(desktop.x > 0 && desktop.z < 0,
    'observed walkable stage, not empty lagoon, should dominate the coastal camera');
  assert.ok(Math.hypot(desktop.x, desktop.z) <= 2.600001, 'desktop stage pull remains bounded');
  assert.ok(Math.hypot(portrait.x, portrait.z) <= 1.100001, 'portrait framing is more restrained');
  assert.ok(desktop.x > portrait.x,
    'desktop grants visibly more room to discovered terrain than narrow portrait');
  assert.ok(desktop.x < 2.75 * 1.05 - 2.4 * .23,
    'previous terrain-heavy shot left the genuine gate and hero at the screen edge');
  assert.ok(portrait.x < 2.75 * .48 - 2.4 * .24,
    'portrait must also pull back from the old gate/hero edge-biased framing');
  assert.ok(desktop.x > 0 && portrait.x > 0,
    'coastal context is retained rather than replacing it with a gate-only camera');
  const gateOnly = composePublicSealedGateFocus({x: 0, z: 0}, gate, 1.32);
  assert.ok(gateOnly.x < 0, 'a genuine disclosed gate still contributes without a stage bias');
  assert.deepEqual(composePublicSealedGateFocus({x: NaN, z: Infinity}, {x: Infinity, z: NaN}), {x: 0, z: 0});
});

test('matched-key camera prioritizes the real glove/socket pair without inventing a path or non-finite target', async () => {
  const {composePublicSealedGateFocus, composePublicKeyLockFocus} = await load();
  const stage = {x: 2.75, z: -1};
  const gate = {x: -2.4, z: .5};
  const before = JSON.stringify({stage,gate});
  const ordinaryPortrait = composePublicSealedGateFocus(stage, gate, .65);
  const portrait = composePublicKeyLockFocus(stage, gate, .65);
  const desktop = composePublicKeyLockFocus(stage, gate, 1.32);
  assert.ok(portrait.x < ordinaryPortrait.x - .5,
    'the real key/socket pairing moves away from the old left-edge, terrain-biased shot');
  // Fixed pass32 native frame cropped a public arch on the right: shift the
  // camera toward genuinely disclosed stage rather than inventing geometry.
  const pass32PortraitX = stage.x * .22 + gate.x * .49;
  assert.ok(portrait.x > pass32PortraitX + .25,
    'portrait keyed-gate composition must recover appreciable public stage room');
  assert.ok(Math.hypot(portrait.x, portrait.z) <= 1.500001,
    'native portrait shift stays bounded so the actor and gate cannot disappear');
  assert.ok(Math.hypot(desktop.x, desktop.z) <= 2.450001,
    'desktop stage and actual gate remain inside a finite camera bound');
  assert.ok(desktop.x < composePublicSealedGateFocus(stage, gate, 1.32).x,
    'the interaction also earns more center stage on desktop');
  assert.deepEqual(composePublicKeyLockFocus({x: NaN, z: Infinity}, {x: -Infinity, z: NaN}, .65),
    {x: 0, z: 0}, 'invalid input cannot corrupt the render camera');
  assert.equal(JSON.stringify({stage,gate}), before,
    'camera presentation must not mutate the sanitized public snapshot');
});


test('known sealed-gate HUD is true only for a public matching carried key at the actually closed nearby gate', async () => {
  const {publicHeldGateStatus} = await load();
  const state = {currentCell: 24, width: 7, height: 9, result: null,
    cells: [{cell: 24, neighbors: []}], doors: [{a: 24, b: 25, open: false, requiredKeyId: 'sun-key'}],
    inventory: ['sun-key']};
  const before = JSON.stringify(state);
  assert.equal(publicHeldGateStatus(state), true);
  assert.equal(publicHeldGateStatus({...state, inventory: ['wrong-key']}), false,
    'unmatched carried keys must not advertise this lock');
  assert.equal(publicHeldGateStatus({...state, inventory: []}), false,
    'a merely observed collectible is not carried');
  assert.equal(publicHeldGateStatus({...state, cells: []}), false,
    'undisclosed gate geometry cannot become public HUD knowledge');
  assert.equal(publicHeldGateStatus({...state, doors: [{...state.doors[0], open: true}]}), false,
    'an opened passage must not still appear sealed');
  assert.equal(publicHeldGateStatus({...state, currentCell: 0}), false,
    'remote doors cannot hijack the objective');
  assert.equal(publicHeldGateStatus({...state, result: {reason: 'escape'}}), false,
    'terminal result suppresses active lock caption');
  assert.equal(publicHeldGateStatus(null), false);
  assert.equal(JSON.stringify(state), before, 'HUD helper must never mutate authority');
});

test('key-to-lock gesture is driven only by an already public matching inventory and near sealed gate', async () => {
  const {publicCarriedGateCue} = await load();
  const state = {
    width: 7, height: 5, currentCell: 8, result: null,
    cells: [{cell: 8, neighbors: [9]}, {cell: 9, neighbors: [8]}],
    doors: [{id: 'seen', a: 8, b: 9, open: false, requiredKeyId: 'copper'}],
    keys: [{id: 'copper', cell: 8, collected: true}],
    inventory: ['copper'],
  };
  const position={x:-4.8,z:-2.4};
  const before=JSON.stringify(state);
  const cue=publicCarriedGateCue(state,position);
  assert.ok(cue && cue.strength>.9);
  assert.ok(Math.abs(cue.heading-Math.PI/2)<1e-8, 'Pip looks at the real gate, not a hidden path');
  assert.equal(JSON.stringify(state),before,'presentation never mutates authoritative snapshots');
  assert.equal(publicCarriedGateCue({...state, inventory: []},position),null);
  assert.equal(publicCarriedGateCue({...state,inventory:['other']},position),null);
  assert.equal(publicCarriedGateCue({...state,keys:[]},position)?.strength,cue.strength,
    'public inventory alone establishes that the key is truly carried');
  assert.equal(publicCarriedGateCue({...state,doors:[{...state.doors[0],requiredKeyId:'other'}]},position),null);
  assert.equal(publicCarriedGateCue({...state,doors:[{...state.doors[0],open:true}]},position),null);
  assert.equal(publicCarriedGateCue({...state,cells:[{cell:16,neighbors:[]}],currentCell:16},position),null);
  assert.equal(publicCarriedGateCue({...state,result:{reason:'escape'}},position),null);
  assert.equal(publicCarriedGateCue(state,{x:100,z:100}),null);
  assert.equal(publicCarriedGateCue(state,{x:NaN,z:0}),null);
  assert.equal(publicCarriedGateCue({...state,doors:[{...state.doors[0],a:13,b:14}]},position),null,
    'row-wrapped nonadjacent gates must never trigger a reach');
  assert.equal(publicCarriedGateCue({...state,doors:[{...state.doors[0],a:16,b:17}]},position),null,
    'an undisclosed gate cannot reveal a gesture');
});


test('disclosed guardian detail framing shares the real screen without inventing a threat', async () => {
  const {publicEncounterFrameWeight: weight} = await load();
  const disclosed=.56065;
  assert.ok(weight(disclosed,'detail',false,1280/900)>.45,
    'desktop Detail follows the genuinely observed opponent rather than forcing hero-only aim');
  assert.ok(weight(disclosed,'detail',false,390/844)<.2,
    'native phone retains more hero emphasis and does not pretend both fit at a desktop scale');
  assert.ok(weight(disclosed,'detail',false,1280/900)<=.5,
    'public actor focus cannot pass the midpoint into an enemy-only shot');
  assert.equal(weight(disclosed,'follow',false,1280/900),disclosed*.22,
    'ordinary Follow camera keeps the last verified public threat framing');
  for (const mode of ['overview','unknown','detail','follow']) {
    assert.equal(weight(disclosed,mode,true,1280/900),0,
      'actual terminal outcome always outranks any cosmetic guardian camera impulse');
  }
  for (const strength of [undefined,null,NaN,Infinity,-Infinity,-1,0]) {
    assert.equal(weight(strength,'detail',false,1280/900),0,
      'stale, undisclosed or invalid attention cannot move the camera toward an imagined actor');
  }
  assert.ok(weight(4,'detail',false,1280/900)<=.5,
    'invalid excess strength must be clamped rather than moving beyond the observed midpoint');
});
