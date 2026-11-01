'use strict';
// Source-backed guardian cap progression: actual tower meshes and the live
// source's present guardian state, not an illustration or a mocked WebGL shot.
// Structural safety checks do not count as Gauntlet LOOKS/FEELS/PLAYS votes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-guardian-seal-'));
const threeUrl = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const coordsUrl = pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
const surfaceUrl = pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const source = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/world.mjs'), 'utf8')
  .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeUrl))
  .replace("'./coordinates.mjs'", JSON.stringify(coordsUrl))
  .replace("'./world-surface.mjs'", JSON.stringify(surfaceUrl));
fs.writeFileSync(path.join(scratch, 'world.mjs'), source);
const loaded = import(pathToFileURL(path.join(scratch, 'world.mjs')).href);
test.after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function frame({active = true, floor = 8, guardian = true, runToken = 'genuine-gate-run'} = {}) {
  const base = floor * 360000;
  return {
    runToken, floor, theme: 'ruins', worldWidth: 480000,
    chunkBaseY: base, chunkHeight: 360000, lifecycle: 'running',
    platforms: [{
      id: `f${floor}:cap`, kind: 'oneway', x: 145000, width: 190000,
      y: base + 324000, height: 12000,
    }],
    hazards: [],
    enemies: guardian ? [{
      id: `f${floor}:guardian`, kind: 'guardian',
      x: 230000, y: base + 350000, health: 8, maxHealth: 8, active,
    }] : [],
  };
}
function named(root, name) {
  let found = null;
  root.traverse(object => { if (object.name === name) found = object; });
  return found;
}

test('a genuine living guardian owns a closed, dimensional world-space seal, not a HUD promise', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    const sourceFrame = frame(), before = JSON.stringify(sourceFrame);
    world.update(sourceFrame, .016, 0, { quality: 'low' });
    const gate = named(world.group, 'AuthoritativeGuardianGate');
    const left = named(world.group, 'GuardianSealWingLeft');
    const right = named(world.group, 'GuardianSealWingRight');
    const crest = named(world.group, 'ObservedGuardianLockCrest');
    assert.ok(gate && left && right && crest, 'the real world contains an original 3D door and lock');
    assert.equal(left.position.x, 0);
    assert.equal(right.position.x, 0);
    assert.ok(crest.isMesh && crest.geometry.attributes.position.count >= 6,
      'the crest is physical faceted geometry, not a flat status decal');
    const inset = named(world.group, 'GuardianGateInset');
    assert.ok(inset, 'the 3D gate has its own inward architectural mounting');
    inset.updateWorldMatrix(true, false);
    const THREE = await import(threeUrl);
    const anchor = inset.getWorldPosition(new THREE.Vector3());
    assert.ok(Math.hypot(anchor.x, anchor.z) < 22.4,
      'the physical gate is inward of the real walkable deck, not a fake collider');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false);
    assert.equal(JSON.stringify(sourceFrame), before, '3D cannot edit authoritative snapshots');
    let dynamicMeshes = 0;
    gate.traverse(object => {
      if (object.isMesh) {
        dynamicMeshes++;
        assert.equal(object.castShadow, false, 'the gate must not multiply shadow-map submissions');
      }
    });
    assert.ok(dynamicMeshes >= 7 && dynamicMeshes <= 12, 'one bounded original physical gate');
  } finally { world.dispose(); }
});

test('an authentic guardian defeat opens BOTH world-space doors and its distinct source-bound crest', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    world.update(frame(), .016, 0, { quality: 'low' });
    const left = named(world.group, 'GuardianSealWingLeft');
    const right = named(world.group, 'GuardianSealWingRight');
    const crest = named(world.group, 'ObservedGuardianLockCrest');
    // The real authority commonly transfers floors on the decisive hit.
    // Prior guardian damage MUST show visible progression while the source
    // guardian still lives; a post-death animation alone may never be seen.
    const hurt = frame();
    hurt.enemies[0].health = 2;
    const beforeHurt = JSON.stringify(hurt);
    for (let i = 0; i < 8; i++) world.update(hurt, .05, i * .05, { quality: 'low' });
    assert.ok(left.position.x < -.9 && left.position.x > -2.7,
      'the genuine lost guardian HP must split the bronze doors before defeat');
    assert.ok(right.position.x > .9 && right.position.x < 2.7);
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false,
      'damaging an active enemy cannot claim the guardian gate is cleared');
    assert.equal(JSON.stringify(hurt), beforeHurt);
    const release = frame({ active: false });
    const before = JSON.stringify(release);
    for (let i = 0; i < 20; i++) world.update(release, .05, i * .05, { quality: 'low' });
    assert.ok(left.position.x < -2.7 && right.position.x > 2.7,
      'the visible passage must physically clear in both directions');
    assert.ok(crest.rotation.z > 1.5, 'the actual lock geometry changes state');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, true);
    assert.equal(JSON.stringify(release), before, 'the observed source remains immutable');
    world.update(frame({ active: true }), .05, 2, { quality: 'low' });
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false);
    assert.ok(Math.abs(left.position.x) < 2.8, 'the same-floor live reversal must not stick open');
  } finally { world.dispose(); }
});

test('no invented guardian means no gate; high/low switches and a new run restore from real state', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    world.update(frame({ guardian: false }), .016, 0, { quality: 'low' });
    assert.equal(named(world.group, 'AuthoritativeGuardianGate'), null);
    assert.equal(world.diagnostics().guardianGates.length, 0);
    world.update(frame({ active: false, floor: 9 }), .016, 1, { quality: 'high' });
    assert.equal(world.diagnostics().guardianGates[0].opening, 1,
      'recovery must not re-lock a guardian already defeated in the source');
    world.update(frame({ active: true, floor: 9, runToken: 'new-run' }), .016, 2, { quality: 'low' });
    assert.equal(world.diagnostics().guardianGates[0].opening, 0,
      'restart must not retain an earlier victory animation');
    assert.equal(named(world.group, 'GuardianSealWingLeft').position.x, 0);
  } finally { world.dispose(); }
});
