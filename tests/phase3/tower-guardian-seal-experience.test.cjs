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
    const conduit = named(world.group, 'GuardianEncounterConduit');
    const capstan = named(world.group, 'GuardianGateCapstan');
    const tension = named(world.group, 'GuardianCounterweightTension');
    assert.ok(capstan && tension?.isInstancedMesh && tension.count === 2,
      'an actual source-powered drum and exactly two tension lines belong to the 3D guardian gate');
    assert.ok(Math.abs(capstan.rotation.z)<1e-12,
      'an undamaged real guardian cannot visibly turn a victory drum');
    assert.equal(tension.userData.collider,undefined);
    assert.ok(gate && left && right && crest, 'the real world contains an original 3D door and lock');
    assert.ok(conduit?.isMesh && !conduit.castShadow && !conduit.receiveShadow,
      'the real HP conduit is a physical, shadow-free mesh in the guardian cap');
    assert.ok(Math.abs(conduit.scale.z - .18) < 1e-12,
      'no damage leaves only an inset lock socket; the path cannot claim a win');
    assert.equal(conduit.userData.collider, undefined);
    assert.ok(named(world.group,'GuardianCounterweightLeft') && named(world.group,'GuardianCounterweightRight'),
      'the source-powered lock uses real paired 3D counterweights');
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
    assert.ok(dynamicMeshes >= 12 && dynamicMeshes <= 26,
      `one bounded gate, source conduit and counterweights (actual meshes: ${dynamicMeshes})`);
    const masonryBatches = gate.children.filter(child => child.name === 'rigid-material-batch');
    assert.equal(masonryBatches.length, 2,
      'guardian portal piers, lintel and rails are consolidated into two shadow-free rigid material draws');
    for (const batch of masonryBatches) {
      assert.equal(batch.isMesh, true);
      assert.equal(batch.castShadow, false);
      assert.equal(batch.receiveShadow, false);
    }
    assert.ok(gate.getObjectByName('GuardianSealWingLeft') &&
      gate.getObjectByName('GuardianCounterweightRight') &&
      gate.getObjectByName('GuardianEncounterConduit') &&
      gate.getObjectByName('GuardianGateCapstan') &&
      gate.getObjectByName('GuardianCounterweightTension'),
      'only inert masonry is batched; all genuine source-driven components stay articulated');
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
    const leftWeight = named(world.group,'GuardianCounterweightLeft');
    const rightWeight = named(world.group,'GuardianCounterweightRight');
    const conduit = named(world.group,'GuardianEncounterConduit');
    const capstan = named(world.group,'GuardianGateCapstan');
    const tension = named(world.group,'GuardianCounterweightTension');
    const THREE = await import(threeUrl);
    const cableMatrix = new THREE.Matrix4();
    const cableScale = new THREE.Vector3();
    const cablePosition = new THREE.Vector3();
    const cableQuaternion = new THREE.Quaternion();
    tension.getMatrixAt(0,cableMatrix);
    cableMatrix.decompose(cablePosition,cableQuaternion,cableScale);
    assert.ok(Math.abs(cableScale.y-.54)<1e-5,
      'at full health the original drum has only taut, short undrawn cable');
    assert.ok(Math.abs(leftWeight.position.y)<1e-12, 'left counterweight starts physically closed');
    assert.ok(Math.abs(rightWeight.position.y)<1e-12, 'right counterweight starts physically closed');
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
    assert.ok(leftWeight.position.y < -1 && leftWeight.position.y > -2.35,
      'real guardian HP mechanically lowers the visible counterweights');
    assert.ok(capstan.rotation.z > 1.8,
      'observed real guardian damage visibly turns the winch');
    tension.getMatrixAt(0,cableMatrix);
    cableMatrix.decompose(cablePosition,cableQuaternion,cableScale);
    assert.ok(cableScale.y>1.5 && cableScale.y<2.9,
      'the same genuine HP loss physically draws additional load-bearing cable');
    assert.equal(leftWeight.position.y,rightWeight.position.y,
      'the pair cannot disagree on authoritative gate progress');
    assert.ok(conduit.scale.z > 2.25 && conduit.scale.z < 4.2,
      'real guardian damage must reveal a growing physical link to the gate');
    assert.ok(conduit.position.z + conduit.scale.z * .5 + 21.8 < 27.18,
      'the source-linked conduit must never overshoot the real outer cap rim');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false,
      'damaging an active enemy cannot claim the guardian gate is cleared');
    assert.equal(JSON.stringify(hurt), beforeHurt);
    const release = frame({ active: false });
    const before = JSON.stringify(release);
    for (let i = 0; i < 20; i++) world.update(release, .05, i * .05, { quality: 'low' });
    assert.ok(left.position.x < -2.7 && right.position.x > 2.7,
      'the visible passage must physically clear in both directions');
    assert.ok(crest.rotation.z > 1.5, 'the actual lock geometry changes state');
    assert.ok(leftWeight.position.y < -2.3 && rightWeight.position.y < -2.3,
      'an actual finished guardian fully releases the heavy mechanical weights');
    tension.getMatrixAt(0,cableMatrix);
    cableMatrix.decompose(cablePosition,cableQuaternion,cableScale);
    assert.ok(Math.abs(cableScale.y-2.89)<1e-5,
      'only an observed authentic defeat fully draws the physical cable');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, true);
    assert.ok(conduit.scale.z > 4.6 && conduit.scale.z < 4.8,
      'authentic defeated guardians illuminate the full outer-lane passage');
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
    assert.ok(Math.abs(named(world.group, 'GuardianEncounterConduit').scale.z - .18) < 1e-12,
      'a genuinely new source run starts with a closed progression conduit');
    assert.equal(named(world.group, 'GuardianGateCapstan').rotation.z,0,
      'new run must not retain a preceding guardian capstan turn');
  } finally { world.dispose(); }
});

// The guardian stands on the final lower approach platform, not at the
// midpoint of the much wider cap. Stage its actual mechanical lock where
// a viewer can see the opponent and causal gate in one local encounter.
// This is a presentation layout check, never a visual-quality PASS.
test('guardian approach anchors one stationary physical gate without relocating the actual cap or checkpoint', async () => {
  const { createTowerWorld } = await loaded;
  const { guardianGateAnchorX, angleFor } = await import(coordsUrl);
  const world = createTowerWorld();
  try {
    const sourceFrame = frame(), base = sourceFrame.floor * 360000;
    sourceFrame.platforms.unshift({
      id: `f${sourceFrame.floor}:p6`, kind: 'oneway', x: 45000,
      y: base + 300000, width: 120000, height: 10000,
    });
    sourceFrame.enemies[0] = { ...sourceFrame.enemies[0],
      x: 105000, y: base + 328000, halfHeight: 18000 };
    const cap = sourceFrame.platforms.find(platform => platform.id.endsWith(':cap'));
    const original = JSON.stringify(sourceFrame);
    const x = guardianGateAnchorX(sourceFrame, cap);
    assert.equal(x, cap.x + 40000,
      'the fixed encounter approach places the lock within the real cap bounds');
    assert.ok(x < cap.x + cap.width / 2 - 40000,
      'do not leave the guardian-facing lock at a distant cap midpoint');
    world.update(sourceFrame, .016, 0, { quality: 'low' });
    const gate = named(world.group, 'AuthoritativeGuardianGate');
    const deck = named(world.group, `platform:f${sourceFrame.floor}:cap`);
    assert.ok(gate && deck, 'distinct world-space gateway and authoritative cap exist');
    assert.ok(Math.abs(gate.rotation.y - angleFor(x, sourceFrame.worldWidth)) < 1e-9,
      'real 3D lock angle is tied to the deterministic guardian approach');
    assert.ok(Math.abs(deck.rotation.y - angleFor(cap.x + cap.width / 2, sourceFrame.worldWidth)) < 1e-9,
      'unchanged collision-aligned deck remains centered on its actual source coordinates');
    assert.equal(world.diagnostics().guardianGates[0].anchorX, x);
    const patrol = { ...sourceFrame, enemies: [{ ...sourceFrame.enemies[0], x: 145000, health: 3 }] };
    assert.equal(guardianGateAnchorX(patrol, cap), x,
      'enemy movement and damage never drag the stone architecture around');
    world.update(patrol, .05, .05, { quality: 'low' });
    assert.ok(Math.abs(gate.rotation.y - angleFor(x, sourceFrame.worldWidth)) < 1e-9);
    world.update(patrol, .05, .10, { quality: 'high', reducedMotion: true });
    assert.equal(world.diagnostics().guardianGates[0].anchorX, x,
      'quality rebuild and still-motion presentation reconstruct the same authentic gate');
    assert.equal(JSON.stringify(sourceFrame), original, 'camera/world may not mutate replay snapshots');
    assert.equal(guardianGateAnchorX(frame(), cap), cap.x + cap.width / 2,
      'legacy source with no approach evidence retains its original safe gate center');
  } finally { world.dispose(); }
});
