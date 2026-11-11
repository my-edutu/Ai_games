'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const THREE = require('three');
const modulePromise = import(pathToFileURL(path.resolve(
  __dirname, '../../public/infinite-tower-climb/visuals/guardian-circuit.mjs')).href);

function snapshot(overrides = {}) {
  return {
    lifecycle: 'running', runToken: 'run-a', tick: 44, floor: 8,
    chunkBaseY: 0, worldWidth: 480000, player: { health: 4 },
    enemies: [{ id: 'real-g8', kind: 'guardian', active: true,
      x: 226000, y: 930000, halfHeight: 18000,
      health: 6, maxHealth: 8, telegraph: false,
      telegraphTicksRemaining: 8 }],
    platforms: [
      { id: 'f8:lower', x: 210000, y: 899000,
        width: 110000, height: 13000 },
      { id: 'f8:cap', x: 170000, y: 960000,
        width: 140000, height: 15000 },
    ], ...overrides,
  };
}

test('only real active source guardian and matching physical cap can power the circuit', async () => {
  const { observedGuardianCircuit } = await modulePromise;
  const item = observedGuardianCircuit(snapshot());
  assert.equal(item.guardianId, 'real-g8');
  assert.equal(item.health, 6);
  assert.equal(item.openedFraction, .25);
  assert.ok(Number.isFinite(item.toX) && item.toX >= 170000 && item.toX <= 310000);
  assert.equal(observedGuardianCircuit(snapshot({ lifecycle: 'intermission' })), null);
  assert.equal(observedGuardianCircuit(snapshot({ player: { health: 0 } })), null);
  assert.equal(observedGuardianCircuit(snapshot({ enemies: [] })), null);
  assert.equal(observedGuardianCircuit(snapshot({ platforms: [] })), null);
  assert.equal(observedGuardianCircuit(snapshot({ runToken: '' })), null);
});

test('health and true windup drive real bounded 3D rail geometry; stale, terminal and restart cannot retain ghosts', async () => {
  const { createTowerGuardianCircuit } = await modulePromise;
  const effect = createTowerGuardianCircuit(THREE);
  const first = snapshot();
  effect.update(first);
  let d = effect.diagnostics();
  assert.equal(d.visible, true);
  assert.equal(d.railSegments, 44);
  assert.equal(d.conductorNodes, 23);
  assert.equal(d.lockReleaseFraction, .25);
  assert.equal(d.shadowCastingMeshes, 0);
  const rail = effect.group.getObjectByName('GuardianLockTwinBronzeRails');
  const before = new THREE.Matrix4();
  rail.getMatrixAt(0, before);
  const hit = snapshot({
    tick: 45,
    enemies: [{ ...first.enemies[0], health: 2,
      telegraph: true, telegraphTicksRemaining: 2 }],
  });
  effect.update(hit);
  d = effect.diagnostics();
  assert.equal(d.guardianHealth, 2);
  assert.equal(d.lockReleaseFraction, .75);
  assert.equal(d.actualTelegraph, true);
  const after = new THREE.Matrix4();
  rail.getMatrixAt(0, after);
  assert.notDeepEqual(after.toArray(), before.toArray(),
    'physical rail separation must respond to real guardian HP');
  effect.update(hit, { stale: true });
  assert.equal(effect.diagnostics().visible, false);
  effect.update(snapshot({ runToken: 'run-b', tick: 1 }));
  assert.equal(effect.diagnostics().runToken, 'run-b');
  effect.update(snapshot({ lifecycle: 'result' }));
  assert.equal(effect.group.visible, false);
  effect.dispose();
  assert.equal(effect.diagnostics().disposed, true);
  effect.update(first);
  assert.equal(effect.group.visible, false);
});

test('guardian-to-cap gantry stays outside tower core and physically retracts source HP lock bolts', async () => {
  const { createTowerGuardianCircuit } = await modulePromise;
  const effect = createTowerGuardianCircuit(THREE);
  const initial = snapshot({ enemies: [{ ...snapshot().enemies[0], health: 8 }] });
  const { observedGuardianCircuit } = await modulePromise;
  const anchored = observedGuardianCircuit(initial);
  assert.ok(anchored.fromY <= initial.enemies[0].y,
    'physical guardian attachment must not sit across the armored head or maul telegraph');
  effect.update(initial);
  const rails = effect.group.getObjectByName('GuardianLockTwinBronzeRails');
  const bolts = effect.group.getObjectByName('GuardianCapSourceLockBolts');
  const { observedGuardianLockStage } = await modulePromise;
  const source = observedGuardianCircuit(initial);
  const lockStage = observedGuardianLockStage(source);
  assert.ok(lockStage && lockStage.sourceTick === initial.tick);
  assert.equal(lockStage.guardianId, initial.enemies[0].id);
  assert.equal(lockStage.bolts.length, 8);
  assert.ok(Math.hypot(lockStage.center.x, lockStage.center.z) > 27.7,
    'combat framing must target the EXTERIOR real HP lock, not the recessed inner cap');
  const originalState = JSON.stringify(initial);
  assert.ok(bolts, 'real guardian gate must have an architectural lock at its actual cap anchor');
  assert.equal(bolts.count, 8);
  assert.equal(bolts.material.depthTest, true);
  for (let i = 0; i < 8; i++) {
    const matrix = new THREE.Matrix4();
    bolts.getMatrixAt(i, matrix);
    const actual = new THREE.Vector3().setFromMatrixPosition(matrix);
    const focused = lockStage.bolts[i];
    // InstancedMesh matrices are Float32 GPU buffers. Comparing a decoded
    // matrix to Float64 source coordinates at 1e-8 precision creates a false
    // mismatch at the exterior radius even when the renderer poses EXACTLY
    // the same source anchor. Check the true GPU-representable coordinate.
    const gpuCoordinate = new THREE.Vector3(
      Math.fround(focused.x), Math.fround(focused.y), Math.fround(focused.z));
    assert.ok(actual.distanceTo(gpuCoordinate) < 1e-7,
      'world-space camera lock bound must match the physical bolt at GPU precision');
  }
  assert.equal(JSON.stringify(initial), originalState,
    'both the camera stage and the renderer must consume source without mutating it');
  const conductor = effect.group.getObjectByName('GuardianLockHealthConductor');
  assert.ok(conductor.material.opacity <= .3,
    'initial HP link must be a quiet world-space cue, not an opaque face-covering ribbon');
  const matrix = new THREE.Matrix4();
  rails.getMatrixAt(10, matrix);
  const middle = new THREE.Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.hypot(middle.x, middle.z) > 29,
    'the physical conduit must arch OUTSIDE the occluding cylindrical stage, not disappear into masonry');
  bolts.getMatrixAt(0, matrix);
  const closed = new THREE.Vector3().setFromMatrixPosition(matrix);
  const lockedTint = new THREE.Color();
  bolts.getColorAt(0, lockedTint);
  assert.ok(Math.hypot(closed.x, closed.z) > 27.25,
    'cap bolts must stand outside the opaque tower core');
  const damaged = snapshot({
    tick: 45,
    enemies: [{ ...initial.enemies[0], health: 2 }],
  });
  effect.update(damaged);
  bolts.getMatrixAt(0, matrix);
  const opened = new THREE.Vector3().setFromMatrixPosition(matrix);
  const releasedTint = new THREE.Color();
  bolts.getColorAt(0, releasedTint);
  const tintDifference = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  assert.ok(tintDifference(releasedTint, lockedTint) > .12,
    'real HP loss must expose a visually different inner alloy on the SAME 3D lock');
  const laterPair = new THREE.Color();
  bolts.getColorAt(6, laterPair);
  assert.ok(tintDifference(laterPair, releasedTint) > .12,
    'a locked pair must not claim guardian HP has already been removed');
  assert.ok(opened.distanceTo(closed) > .6,
    'true guardian HP loss must visibly retract the mechanical lock');
  assert.equal(effect.diagnostics().lockBolts, 8);
  assert.equal(effect.diagnostics().maxExtraDraws, 8);
  effect.update(damaged, { stale: true });
  assert.equal(bolts.count, 0, 'stale streams cannot retain authoritative-looking lock teeth');
  effect.dispose();
  assert.equal(effect.group.children.length, 0);
});

test('true guardian HP changes produce short exterior impact echoes with no restart or stale ghosts', async () => {
  const { createTowerGuardianCircuit } = await modulePromise;
  const effect = createTowerGuardianCircuit(THREE);
  const initial = snapshot({ tick: 42, enemies: [{ ...snapshot().enemies[0], health: 8 }] });
  effect.update(initial);
  const shards = effect.group.getObjectByName('GuardianObservedHealthLossFragments');
  assert.ok(shards && shards.material.depthTest && !shards.material.depthWrite);
  assert.equal(shards.count, 0, 'first observed guardian cannot create a fabricated hit');
  const injured = snapshot({ tick: 43, enemies: [{ ...initial.enemies[0], health: 6 }] });
  effect.update(injured);
  assert.equal(effect.diagnostics().observedHealthLossTick, 43);
  assert.equal(shards.count, 12, 'a real health decrease makes a bounded, depth-tested two-anchor echo');
  const before = new THREE.Matrix4();
  shards.getMatrixAt(0, before);
  effect.update(injured);
  const repeated = new THREE.Matrix4();
  shards.getMatrixAt(0, repeated);
  assert.deepEqual(repeated.toArray(), before.toArray(),
    'same authoritative tick cannot replay a visual impact');
  effect.update({ ...injured, tick: 50 });
  assert.equal(shards.count, 0, 'bounded tick age retires the effect');
  effect.update({ ...injured, tick: 1, runToken: 'fresh-run' });
  assert.equal(shards.count, 0, 'run change may not carry old hits');
  effect.update({ ...injured, tick: 2, runToken: 'fresh-run',
    enemies: [{ ...injured.enemies[0], health: 4 }] }, { reducedMotion: true });
  assert.equal(shards.count, 0, 'reduced motion retains mechanical state without particles');
  effect.update(injured, { stale: true });
  assert.equal(shards.count, 0, 'stale snapshots cannot claim a current hit');
  effect.dispose();
  assert.equal(effect.group.children.length, 0, 'GPU graph releases all visual parts');
});


test('physical guardian-side HP relay stays on the real exterior gantry and retracts only after authoritative damage', async () => {
  const { observedGuardianCircuit, observedGuardianRelayStage,
    observedGuardianPowerSpineStage, guardianLinkSite, createTowerGuardianCircuit } = await modulePromise;
  const original = snapshot({ tick: 52, enemies: [{ ...snapshot().enemies[0], health: 8 }] });
  const source = observedGuardianCircuit(original);
  const relay = observedGuardianRelayStage(source);
  assert.ok(relay && relay.sourceTick === 52 && relay.remainingFraction === 1);
  const power = observedGuardianPowerSpineStage(source);
  assert.ok(power?.center && power.guardianId === source.guardianId);
  assert.equal(power.sourceTick,source.tick);
  const closeGantry = guardianLinkSite(source,.23);
  assert.ok(new THREE.Vector3(power.center.x,power.center.y,power.center.z).distanceTo(
    new THREE.Vector3(closeGantry.x,closeGantry.y,closeGantry.z))<1e-9);
  const sharedGantry = guardianLinkSite(source, .12);
  assert.ok(new THREE.Vector3(relay.center.x, relay.center.y, relay.center.z).distanceTo(
    new THREE.Vector3(sharedGantry.x, sharedGantry.y, sharedGantry.z)) < 1e-9);
  assert.ok(Math.hypot(relay.center.x, relay.center.z) > 27.5,
    'guardian relay must be visible from outside the solid tower, not inside a wall');
  const before = JSON.stringify(original);
  const effect = createTowerGuardianCircuit(THREE);
  effect.update(original);
  const teeth = effect.group.getObjectByName('GuardianSourceHPMechanicalRelay');
  assert.ok(teeth?.material.depthTest && !teeth.castShadow);
  assert.equal(teeth.count, 8);
  assert.equal(effect.diagnostics().nearbyRelayTeeth, 8);
  assert.equal(effect.diagnostics().relaySourceHP, 8);
  const locked = new THREE.Matrix4(), unlocked = new THREE.Matrix4();
  const colorLocked = new THREE.Color(), colorUnlocked = new THREE.Color();
  teeth.getMatrixAt(7, locked);
  teeth.getColorAt(7, colorLocked);
  effect.update({ ...original, tick: 53, enemies: [{ ...original.enemies[0], health: 2 }] });
  teeth.getMatrixAt(7, unlocked);
  teeth.getColorAt(7, colorUnlocked);
  assert.notDeepEqual(locked.toArray(), unlocked.toArray(),
    'actual HP loss retracts a guardian-local physical gear tooth');
  assert.ok(Math.hypot(colorLocked.r - colorUnlocked.r,
    colorLocked.g - colorUnlocked.g, colorLocked.b - colorUnlocked.b) > .1,
    'genuine HP loss exposes a different metal alloy on the relay');
  assert.equal(effect.diagnostics().relaySourceHP, 2);
  assert.equal(JSON.stringify(original), before, 'presentation must never mutate the source');
  effect.update(original, { stale: true });
  assert.equal(teeth.count, 0, 'connection loss may not leave a fake live HP indicator');
  effect.update({ ...original, runToken: 'new-run', tick: 1 });
  assert.equal(teeth.count, 8);
  effect.update({ ...original, lifecycle: 'result' });
  assert.equal(teeth.count, 0);
  assert.equal(observedGuardianRelayStage({ ...source, health: 0 }), null);
  effect.dispose();
  assert.equal(effect.group.children.length, 0);
});


test('three real HP-gated gantry clutches expose a legible physical power spine without inventing victories', async () => {
  const { createTowerGuardianCircuit, observedGuardianCircuit, guardianLinkSite } = await modulePromise;
  const initial = snapshot({ tick: 60, enemies: [{ ...snapshot().enemies[0], health: 8 }] });
  const frozen = JSON.stringify(initial);
  const circuit = createTowerGuardianCircuit(THREE);
  try {
    circuit.update(initial, { quality: 'low' });
    const leaves = circuit.group.getObjectByName('GuardianSourcePowerSpineClutches');
    assert.ok(leaves?.isInstancedMesh, 'six real-world shutters share one GPU draw');
    assert.equal(leaves.count, 6);
    assert.equal(circuit.diagnostics().gantryClutchPairs, 3);
    assert.equal(circuit.diagnostics().powerSpineLeaves, 6);
    assert.ok(!leaves.castShadow && !leaves.receiveShadow && leaves.material.depthTest);
    const closed = [], open = [];
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 6; i++) {
      leaves.getMatrixAt(i, matrix);
      closed.push(new THREE.Vector3().setFromMatrixPosition(matrix));
      const site = guardianLinkSite(observedGuardianCircuit(initial), [.23, .53, .82][Math.floor(i / 2)]);
      assert.ok(Math.hypot(site.x, site.z) > 27.5,
        'all physical phase releases stay on the genuine exterior guardian-to-cap spine');
    }
    const hurt = snapshot({tick: 61,
      enemies: [{...initial.enemies[0], health: 2}]});
    circuit.update(hurt, { quality: 'low' });
    const tint = new THREE.Color();
    for (let i = 0; i < 6; i++) {
      leaves.getMatrixAt(i, matrix);
      open.push(new THREE.Vector3().setFromMatrixPosition(matrix));
    }
    assert.ok(open[0].distanceTo(closed[0]) > 1.2,
      'the first mechanical clutch responds materially to real source damage');
    assert.ok(open[4].distanceTo(closed[4]) > .1,
      'later clutches respond at their earned HP stages too');
    const firstColor = new THREE.Color(), lastColor = new THREE.Color();
    leaves.getColorAt(0, firstColor);
    leaves.getColorAt(4, lastColor);
    assert.ok(Math.hypot(firstColor.r-lastColor.r,
      firstColor.g-lastColor.g, firstColor.b-lastColor.b) > .08,
      'later unearned HP stages stay visually distinguishable, not a fake full clearance');
    assert.equal(JSON.stringify(initial), frozen, 'decorative machinery must not edit the authoritative source');
    circuit.update(hurt, { stale: true });
    assert.equal(leaves.count, 0, 'stale authority cannot leave falsely live machinery');
    circuit.update({...initial,runToken:'new-run',tick:1}, { reducedMotion: true });
    assert.equal(leaves.count, 6, 'still-motion makes the lock status visible without pulsing');
    circuit.update({...initial,lifecycle:'result'});
    assert.equal(leaves.count, 0, 'outcome retires the source HP stage');
  } finally { circuit.dispose(); }
  assert.equal(circuit.group.children.length, 0, 'all 3D owned resources are torn down on recovery');
});


test('genuine guardian HP relay is hoisted clear of both armored bodies, remains mechanically connected to the source gantry, and preserves restart truth', async () => {
  const { observedGuardianCircuit, observedGuardianRelayStage, guardianLinkSite,
    createTowerGuardianCircuit } = await modulePromise;
  const live = snapshot({tick:301});
  const before = JSON.stringify(live);
  const source = observedGuardianCircuit(live);
  const fighter = live.enemies[0];
  const guardianCrown = (fighter.y + fighter.halfHeight - live.chunkBaseY) / 10000;
  const relay = observedGuardianRelayStage(source);
  assert.ok(relay.center.y >= guardianCrown + 1.10,
    'the visible bronze relay cannot occupy the living guardian head/maul silhouette');
  assert.ok(Math.hypot(relay.center.x, relay.center.z) > 27.5,
    'hoisting does not bury the true HP-bearing mechanism inside the tower');
  const entry = guardianLinkSite(source, 0);
  const distant = guardianLinkSite(source, .36);
  const sourceFeetY = (source.fromY - source.baseY) / 10000;
  assert.ok(Math.abs(entry.y - sourceFeetY) < 1e-8,
    'the gantry must remain physically connected to the real source opponent');
  assert.ok(distant.y < relay.center.y,
    'a short overhead hoist returns to the physical destination, not a hovering duplicate');
  const effect = createTowerGuardianCircuit(THREE);
  try {
    effect.update(live);
    const ring = effect.group.getObjectByName('GuardianLockGuardianAnchor');
    const teeth = effect.group.getObjectByName('GuardianSourceHPMechanicalRelay');
    assert.ok(ring && teeth && ring.scale.x <= 1,
      'original full-size near-camera ring cannot continue covering the combatant');
    assert.equal(teeth.count, 8);
    const matrix = new THREE.Matrix4(), at = new THREE.Vector3();
    for (let i = 0; i < teeth.count; i++) {
      teeth.getMatrixAt(i, matrix);
      at.setFromMatrixPosition(matrix);
      assert.ok(at.y > guardianCrown + .25,
        'source HP tooth '+i+' cannot bisect a living guardian face or warning');
    }
    const struck = snapshot({tick:302,enemies:[{...fighter,health:2}]});
    effect.update(struck);
    assert.equal(effect.diagnostics().relaySourceHP,2,
      'the overhead clutch still follows true source HP loss, not decorative time');
    effect.update({...struck,tick:303,enemies:[{...fighter,active:false,health:0}]});
    assert.equal(effect.group.visible,false,
      'defeat retires the living HP machine; an opened gate is controlled elsewhere');
    effect.update({...live,runToken:'fresh',tick:1});
    assert.equal(effect.group.visible,true,
      'a real restart rehydrates only the new guardian rather than stale victory');
    assert.equal(JSON.stringify(live),before,
      'hoist and source geometry must never mutate the authoritative snapshot');
  }finally{effect.dispose();}
});
