'use strict';
// Engineering safety only. Source-authentic full-motion A/B and independent
// LOOKS/FEELS/PLAYS judgments remain the transformation acceptance gate.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const url = file => pathToFileURL(path.join(ROOT, file)).href;
const sourceModule = import(url('public/infinite-tower-climb/visuals/scene-hierarchy.mjs'));
const visuals = Promise.all([
  import(url('node_modules/three/build/three.module.js')),
  import(url('public/infinite-tower-climb/visuals/atmosphere.mjs')),
]);
const frame = () => ({
  lifecycle: 'running', runToken: 'staged-42', tick: 382, floor: 5,
  theme: 'foundry', worldWidth: 480000, chunkBaseY: 1000000,
  player: { x: 240000, y: 1350000, health: 5, maxHealth: 6,
    state: 'airborne', vy: 14000, vx: 1800, attacking: false },
  enemies: [], hazards: [], intent: { mode: 'air-control' },
});
const guardian = () => ({ id: 'real-boss', kind: 'guardian', active: true,
  x: 260000, y: 1350000, health: 8, maxHealth: 8, telegraph: true });
const shutter = () => ({ id: 'observed-shutter', x: 227000, y: 1345000,
  width: 30000, height: 10000, active: true, chargeTicksRemaining: 0 });

test('source-only quiet -> imminent danger -> real guardian -> outcome without phantom focus', async () => {
  const { observedSceneHierarchy: observe } = await sourceModule;
  const base = frame(), before = JSON.stringify(base);
  assert.deepEqual(observe(base), { kind: 'ascent', focus: 0 });
  assert.equal(JSON.stringify(base), before, 'source snapshots remain immutable');
  const active = { ...base, hazards: [shutter()] };
  assert.deepEqual(observe(active), { kind: 'hazard', focus: .82 });
  const distant = { ...base, hazards: [{ ...shutter(), x: 10000 }] };
  assert.deepEqual(observe(distant), { kind: 'ascent', focus: 0 });
  const earlyCharge = { ...base, hazards: [{ ...shutter(),
    active: false, chargeTicksRemaining: 18 }],
    intent: { mode: 'evading-hazard' } };
  assert.deepEqual(observe(earlyCharge), { kind: 'ascent', focus: 0 });
  const imminent = { ...earlyCharge, hazards: [{
    ...shutter(), active: false, chargeTicksRemaining: 8 }] };
  assert.equal(observe(imminent).kind, 'hazard');
  assert.equal(observe({ ...imminent, intent: { mode: 'aligning' } }).focus, 0);
  assert.equal(observe({ ...active, enemies: [guardian()] }).kind, 'guardian',
    'present boss encounter outranks even immediate shutter danger');
  assert.equal(observe({ ...base, enemies: [{ ...guardian(), x: 10000 }] }).focus, 0,
    'untouched distant boss must not dim ordinary ascent');
  assert.equal(observe({ ...base, enemies: [{ ...guardian(), telegraph: false }] }).focus, 0);
  assert.equal(observe({ ...base, enemies: [{ ...guardian(), telegraph: false,
    health: 6 }] }).kind, 'guardian', 'witnessed HP loss establishes a real duel');
  assert.equal(observe({ ...base, enemies: [{ ...guardian(), telegraph: false }],
    intent: { mode: 'engaging-enemy' } }).kind, 'guardian');
  const ended = { ...base, lifecycle: 'result',
    result: { kind: 'game', reason: 'health-depleted' } };
  assert.deepEqual(observe(ended), { kind: 'terminal', focus: .86 });
  assert.deepEqual(observe({ ...ended, result: null }), { kind: 'ascent', focus: 0 },
    'do not fabricate a win, failure or result from a phase alone');
  for (const f of [{ ...base, stale: true }, { ...base, runToken: '' },
    { ...base, tick: -1 }, { ...base, player: { ...base.player, health: 0 } }])
    assert.equal(observe(f).focus, 0);
});

test('simultaneous source-authentic guardian and immediate shutter clear decorative crisis space',async()=>{
  const { observedSceneHierarchy, observedImmediateTrap }=await sourceModule;
  const base=frame();
  const hero={...base.player,halfWidth:9000,halfHeight:14000};
  const battle={...base,player:hero, enemies:[guardian()],hazards:[shutter()]};
  const before=JSON.stringify(battle);
  assert.deepEqual(observedImmediateTrap(battle),{id:'observed-shutter',x:242000,y:1350000});
  assert.deepEqual(observedSceneHierarchy(battle),{kind:'crossfire',focus:1});
  assert.equal(JSON.stringify(battle),before,'world layer cannot alter published source');
  const far={...battle,hazards:[{...shutter(),x:60000}]};
  assert.equal(observedImmediateTrap(far),null);
  assert.equal(observedSceneHierarchy(far).kind,'guardian');
  const dormant={...battle,hazards:[{...shutter(),active:false,chargeTicksRemaining:11}],
    intent:{mode:'evading-hazard'}};
  assert.equal(observedSceneHierarchy(dormant).kind,'guardian');
  assert.equal(observedSceneHierarchy({...dormant,hazards:[{...dormant.hazards[0],chargeTicksRemaining:5}]}).kind,'crossfire');
  assert.equal(observedImmediateTrap({...battle,stale:true}),null);
  assert.equal(observedImmediateTrap({...battle,runToken:''}),null);
  assert.equal(observedImmediateTrap({...battle,player:{...hero,halfWidth:NaN}}),null);
});

test('real 3D biome weather yields to source danger, clears on stale and keeps one draw', async () => {
  const [THREE, { createTowerAtmosphere }] = await visuals;
  const fx = createTowerAtmosphere(THREE);
  const mesh = fx.group.getObjectByName('SourceBoundBiomeAtmosphere');
  try {
    const base = frame(), before = JSON.stringify(base);
    fx.update(base, { quality: 'high' });
    const ordinary = mesh.material.opacity;
    const count = mesh.count;
    fx.update({ ...base, hazards: [shutter()] }, { quality: 'high' });
    assert.ok(mesh.material.opacity < ordinary * .6,
      'source-owned danger suppresses high-contrast ambience, not hazard cues');
    assert.equal(fx.diagnostics().encounterHierarchy.kind, 'hazard');
    assert.equal(mesh.count, count, 'no allocation/draw budget change');
    fx.update({ ...base, enemies: [guardian()] }, { quality: 'high' });
    assert.equal(fx.diagnostics().encounterHierarchy.kind, 'guardian');
    assert.ok(mesh.material.opacity < ordinary * .4);
    assert.equal(fx.diagnostics().drawCallsIfVisible, 1);
    assert.equal(JSON.stringify(base), before);
    fx.update(base, { stale: true });
    assert.equal(mesh.visible, false);
    assert.equal(fx.diagnostics().encounterHierarchy.focus, 0);
    fx.update(base, { reducedMotion: true });
    assert.equal(mesh.count, 0);
  } finally { fx.dispose(); }
});


test('real same-floor guardian death keeps clockwork sightlines and hazard hierarchy legible', async () => {
  const { observedSceneHierarchy: observe } = await sourceModule;
  const base = frame(), body = guardian(), cap = {
    id: 'f5:cap', x: 170000, y: 1340000, width: 180000, height: 12000,
  };
  const released = Object.freeze({
    ...base, player: Object.freeze({ ...base.player, halfWidth: 10000,
      halfHeight: 16000 }),
    enemies: Object.freeze([Object.freeze({ ...body, active: false, health: 0,
      halfHeight: 15000 })]),
    platforms: Object.freeze([Object.freeze(cap)]),
    guardianExitX: cap.x + Math.floor(cap.width * .76),
  });
  const unchanged = JSON.stringify(released);
  assert.deepEqual(observe(released), { kind: 'guardian-release', focus: .93 },
    'the physical body and authentic cap must remain visible through its earned doorway');
  assert.equal(JSON.stringify(released), unchanged, 'the scene director cannot edit replay');
  assert.deepEqual(observe({ ...released, guardianExitX: undefined }),
    { kind: 'ascent', focus: 0 },
    'a historic defeated guardian without an authoritative exit is not an earned release');
  assert.deepEqual(observe({ ...released, guardianExitX: released.guardianExitX + 1 }),
    { kind: 'ascent', focus: 0 },
    'the exact fixed-step floor-cap crossing must match the source exit');
  assert.deepEqual(observe({ ...released, enemies: [{ ...released.enemies[0], id: 'old-guardian', x: 8000 },
    released.enemies[0]] }), { kind: 'ascent', focus: 0 },
    'ambiguous historical first-boss source cannot claim the current victory even when another body is near');
  assert.deepEqual(observe({ ...released, enemies: [{ ...body, active: true, health: 0 }] }),
    { kind: 'ascent', focus: 0 }, 'an invalid still-active zero-HP boss is not a victory');
  assert.deepEqual(observe({ ...released, platforms: [] }), { kind: 'ascent', focus: 0 },
    'the victory emphasis needs the real source floor cap');
  assert.deepEqual(observe({ ...released, enemies: [{ ...body, active: false,
    health: 0, x: 8000 }] }), { kind: 'ascent', focus: 0 },
    'a remote defeated boss may not darken routine ascent');
  assert.deepEqual(observe({ ...released, hazards: [shutter()] }),
    { kind: 'hazard', focus: .82 }, 'immediate true crusher remains legible after defeat');
  assert.deepEqual(observe({ ...released, stale: true }), { kind: 'ascent', focus: 0 });
  assert.deepEqual(observe({ ...released, floor: 6, enemies: [], platforms: [] }),
    { kind: 'ascent', focus: 0 }, 'new floor is never declared an ongoing victory');
});
