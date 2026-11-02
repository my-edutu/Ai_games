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
  assert.ok(bolts, 'real guardian gate must have an architectural lock at its actual cap anchor');
  assert.equal(bolts.count, 8);
  assert.equal(bolts.material.depthTest, true);
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
  assert.ok(Math.hypot(closed.x, closed.z) > 27.25,
    'cap bolts must stand outside the opaque tower core');
  const damaged = snapshot({
    tick: 45,
    enemies: [{ ...initial.enemies[0], health: 2 }],
  });
  effect.update(damaged);
  bolts.getMatrixAt(0, matrix);
  const opened = new THREE.Vector3().setFromMatrixPosition(matrix);
  assert.ok(opened.distanceTo(closed) > .6,
    'true guardian HP loss must visibly retract the mechanical lock');
  assert.equal(effect.diagnostics().lockBolts, 8);
  assert.equal(effect.diagnostics().maxExtraDraws, 5);
  effect.update(damaged, { stale: true });
  assert.equal(bolts.count, 0, 'stale streams cannot retain authoritative-looking lock teeth');
  effect.dispose();
  assert.equal(effect.group.children.length, 0);
});
