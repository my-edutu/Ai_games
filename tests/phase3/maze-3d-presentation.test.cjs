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

test('full-bleed portrait follow camera preserves actual previously visible horizontal stage span', async () => {
  const {publicFullBleedFollowHalfHeight: f} = await load();
  for (const h of [4.7,5.42,6.2]) {
    assert.equal(f(.7,h),h,'former 390px in-page stage keeps its validated view');
    assert.equal(f(1280/900,h),h,'desktop scene remains unchanged');
    const full = f(390/844,h);
    assert.ok(Math.abs(full * (390/844) - h * .70) < 1e-8,
      'authentic 390px portrait preserves known horizontal world span, including visible key and gate');
    assert.ok(full > h && full < h * 2.2,'widen the frustum without infinite or unbounded camera motion');
  }
  assert.equal(f(NaN,4.7),4.7,'non-finite aspect never corrupts the renderer');
  assert.equal(f(0,4.7),4.7,'zero viewport has finite neutral fallback');
  assert.equal(f(.42,NaN),7.3*.7/.42,'non-finite requested zoom uses bounded standard stage value');
  assert.ok(f(.01,4.7) <= 4.7*2.2,'pathological tiny canvas cannot explode the camera zoom');
});


test('a native Follow portrait shares frame by the physical actor outlines, not only centers', async () => {
  const {publicPortraitGuardianBalance: balance,publicPortraitGuardianHalfHeight: height}=await load();
  const hero={x:-3,z:0}, guardian={x:3,z:0}, focus={x:0,z:0};
  const aspect=390/844, strength=1, base=10;
  const before=JSON.stringify({hero,guardian,focus});
  const correction=balance(aspect,strength,hero,guardian,focus);
  const right={x:18/Math.hypot(18,15),z:-15/Math.hypot(18,15)};
  const shift=correction.x*right.x+correction.z*right.z;
  assert.ok(shift>.20 && shift<=.55+1e-12,
    'larger actual Thornback sails and claws shift the shared aim slightly toward the guardian');
  assert.ok(Math.abs(correction.x*right.z-correction.z*right.x)<1e-12,
    'only screen-right aim changes, never the camera elevation or game simulation');
  const aim={x:focus.x+correction.x,z:focus.z+correction.z};
  const fullHeight=height(aspect,base,strength,hero,guardian,aim,aim);
  const screenX=p=>((p.x-aim.x)*18-(p.z-aim.z)*15)/Math.hypot(18,15);
  const edge=Math.max(Math.abs(screenX(hero))+1.10,Math.abs(screenX(guardian))+1.80);
  assert.ok(edge <= fullHeight*aspect*.94+1e-9,
    'the genuine hero and larger guardian silhouettes both have in-frame clearance');
  assert.ok(fullHeight<base && fullHeight>=base*.84,
    'balanced real physical framing may remain legible without inventing actor scale');
  for(const invalid of [null,{x:NaN,z:0},{x:Infinity,z:1}])
    assert.deepEqual(balance(aspect,strength,hero,guardian,invalid),{x:0,z:0},
      'missing or invalid public focus never moves a camera');
  assert.deepEqual(balance(aspect,0,hero,guardian,focus),{x:0,z:0},
    'an undisclosed/withdrawn guardian cannot trigger a camera response');
  assert.deepEqual(balance(844/390,strength,hero,guardian,focus),{x:0,z:0},
    'landscape retains its verified authored shot');
  assert.deepEqual(balance(.34,strength,hero,guardian,focus),{x:0,z:0},
    'pathologically narrow view does not fabricate a focus');
  assert.deepEqual(balance(aspect,strength,hero,{x:NaN,z:0},focus),{x:0,z:0});
  assert.equal(JSON.stringify({hero,guardian,focus}),before,
    'no authoritative or public input position is ever mutated');
});

test('portrait encounter camera grows actual actors only within genuine public full-model bounds', async () => {
  const {publicPortraitGuardianHalfHeight: frame}=await load();
  const hero={x:-1,z:0}, guardian={x:1,z:0}, focus={x:0,z:0};
  const before=JSON.stringify({hero,guardian,focus});
  const aspect=320/740, base=10.04;
  const close=frame(aspect,base,1,hero,guardian,focus);
  const physicalMargin=(18/Math.hypot(18,15)+1.35)/aspect;
  assert.ok(close<base && close>=base*.84-1e-9,
    'a real close pair earns a bounded, physically larger portrait shot');
  assert.ok(close>=physicalMargin,
    'actual modeled guardian limbs retain margin; never fake visibility with center-only bounds');
  assert.equal(frame(aspect,base,0,hero,guardian,focus),base,
    'a hidden or withdrawn guardian never changes camera scale');
  assert.equal(frame(aspect,base,1,{x:-50,z:0},guardian,focus),base,
    'a threatened but distant pair cannot be cropped to inflate actors');
  assert.equal(frame(844/390,base,1,hero,guardian,focus),base,
    'landscape gameplay retains the already-reviewed wider authored diorama');
  assert.equal(frame(aspect,base,1,hero,guardian,{x:NaN,z:0}),base,
    'invalid public coordinates can never corrupt the camera');
  assert.equal(frame(aspect,base,1,hero,guardian,null),base,
    'no inferred unseen camera anchor is permitted');
  assert.equal(frame(aspect,base,1,hero,guardian,focus,{x:40,z:0}),base,
    'a genuine pair remains fully visible while the public camera is still easing from an older target');
  assert.equal(frame(aspect,base,1,hero,guardian,focus,{x:NaN,z:0}),base,
    'non-finite preceding camera target fails safely without cropping');
  assert.equal(frame(aspect,base,1,hero,guardian,focus),close,
    'the same public state produces a deterministic and repeatable shot');
  assert.equal(JSON.stringify({hero,guardian,focus}),before,
    'renderer composition never mutates authoritative or public snapshot positions');
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
  assert.ok(weight(disclosed,'detail',false,390/844)>.45,
    'real native-phone guardian was clipped under the earlier 0.22 cap; active Detail must stage both actors');
  assert.ok(weight(disclosed,'detail',false,390/844)<=.48,
    'phone retains a modest Pip bias and never moves beyond the observed actor pair');
  assert.ok(weight(disclosed,'detail',false,1280/900)<=.5,
    'public actor focus cannot pass the midpoint into an enemy-only shot');
  assert.equal(weight(disclosed,'follow',false,1280/900),disclosed*.22,
    'ordinary Follow camera keeps the last verified public threat framing');
  const native320=weight(disclosed,'follow',false,320/740);
  const native390=weight(disclosed,'follow',false,390/844);
  assert.ok(native320>.40 && native320<=.46 && native390>.40 && native390<=.46,
    'a genuine two-actor portrait encounter receives a bounded source-disclosed shared camera focus');
  assert.equal(weight(disclosed,'follow',false,844/390),disclosed*.22,
    '844px landscape stays at its verified wider Follow composition');
  assert.equal(weight(disclosed,'follow',false,.34),disclosed*.22,
    'pathologically narrow canvas cannot invent a new composition');
  assert.equal(weight(0,'follow',false,320/740),0,
    'no current public guardian means no portrait enemy camera motion');
  assert.equal(weight(disclosed,'follow',true,320/740),0,
    'terminal outcomes suppress the portrait camera cue');
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


test('native Detail keeps both disclosed actors in the prior verified horizontal world span after HUD compaction', async () => {
  const { publicDetailEncounterHalfHeight } = await load();
  const reference = publicDetailEncounterHalfHeight(.75, .56);
  assert.equal(reference, 5.7, 'the verified original 390x520 actor-pair view stays unchanged');
  const tallerAspect = 390 / 576;
  const taller = publicDetailEncounterHalfHeight(tallerAspect, .56);
  assert.ok(taller > 6.30 && taller < 6.32, 'a taller stage restores the former horizontal world span');
  assert.ok(taller * tallerAspect >= reference * .75 - 1e-12);
  assert.equal(publicDetailEncounterHalfHeight(.8, .56), 5.7, 'normal portrait detail retains its prior scale');
  assert.equal(publicDetailEncounterHalfHeight(tallerAspect, 0), 4.6, 'no public guardian cannot create threat framing');
  assert.equal(publicDetailEncounterHalfHeight(tallerAspect, NaN), 4.6, 'invalid attention cannot invent a visible threat');
  assert.equal(publicDetailEncounterHalfHeight(1280 / 900, .56), 4.6, 'desktop Detail is unchanged');
  assert.equal(publicDetailEncounterHalfHeight(-1, .56), 4.6, 'invalid viewport aspect stays neutral');
});
