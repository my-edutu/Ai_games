'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const THREE = require('three');
const modulePromise = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-shot-stage.mjs')).href);

function snapshot(overrides = {}) {
  return {
    lifecycle: 'running', runToken: 'original-duel-a', floor: 8, tick: 150,
    chunkBaseY: 0, worldWidth: 480000,
    player: { x: 180000, y: 930000, halfWidth: 9000,
      halfHeight: 14000, health: 3, state: 'standing' },
    enemies: [{
      id: 'f8:guardian', kind: 'guardian', active: true,
      x: 125000, y: 930000, health: 8, maxHealth: 8,
      halfHeight: 18000, facing: 1, telegraph: true,
      telegraphTicksRemaining: 8,
    }],
    ...overrides,
  };
}

test('guardian lane only witnesses a real source-facing, vertically threatening telegraph', async () => {
  const { observedGuardianShotCorridor: observed } = await modulePromise;
  const source = snapshot(), unchanged = JSON.stringify(source);
  const lane = observed(source);
  assert.equal(lane.guardianId, 'f8:guardian');
  assert.equal(lane.remainingChargeTicks, 8);
  assert.equal(lane.charge, 0);
  assert.equal(lane.length, 40300,
    'source-present guardian/player separation determines the real corridor length');
  assert.equal(lane.worldWidth, 480000);
  assert.equal(JSON.stringify(source), unchanged, 'view projection cannot mutate fixed-step authority');

  const late = observed(snapshot({ tick: 155,
    enemies: [{ ...source.enemies[0], telegraphTicksRemaining: 1 }] }));
  assert.equal(late.charge, 1);
  assert.equal(observed(snapshot({ player: { ...source.player, y: source.player.y + 22000 } })), null,
    'a horizontally fired bolt cannot touch a player outside its actual y hitband');
  assert.equal(observed(snapshot({ enemies: [{ ...source.enemies[0], facing: -1 }] })), null,
    'a guardian firing away from the climber is not a current player-facing lane');
  assert.equal(observed(snapshot({ enemies: [{ ...source.enemies[0], telegraph: false }] })), null,
    'a resting guardian must not emit speculative danger');
  assert.equal(observed(snapshot({ enemies: [{ ...source.enemies[0], active: false }] })), null);
  assert.equal(observed(snapshot({ lifecycle: 'result' })), null);
  assert.equal(observed(snapshot({ runToken: '' })), null);
  assert.equal(observed(snapshot({ enemies: [] })), null);
});

test('3D warning remains one bounded outboard draw, source-timed and disposable', async () => {
  const { createTowerGuardianShotStage } = await modulePromise;
  const stage = createTowerGuardianShotStage(THREE);
  const mesh = stage.group.getObjectByName('ActualGuardianProjectileFacing');
  const original = snapshot();
  let geoDisposals = 0, matDisposals = 0;
  mesh.geometry.addEventListener('dispose', () => geoDisposals++);
  mesh.material.addEventListener('dispose', () => matDisposals++);
  stage.update(original, { quality: 'low' });
  const early = stage.diagnostics();
  assert.equal(early.visible, true);
  assert.equal(early.markerCount, 3,
    'a real 37,500-unit close-combat lane has three legible spaced vanes');
  assert.equal(early.extraDraws, 1);
  assert.equal(early.predictedHits, false);
  assert.equal(early.shadowCastingMeshes, 0);
  assert.equal(stage.group.children.length, 2, 'one bounded authentic guardian lane plus dormant sourced hero pulse mesh');
  assert.equal(mesh.material.depthTest, true);
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(0, matrix);
  const initial = new THREE.Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(Math.hypot(initial.x, initial.z) - 27.75) < 1e-4,
    'phone-readable markers must remain on the OUTSIDE of the solid tower');
  const oldScale = new THREE.Vector3();
  matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), oldScale);
  const charged = snapshot({ tick: 157,
    enemies: [{ ...original.enemies[0], telegraphTicksRemaining: 1 }] });
  stage.update(charged, { quality: 'low' });
  const newScale = new THREE.Vector3();
  mesh.getMatrixAt(0, matrix);
  matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), newScale);
  assert.ok(newScale.y > oldScale.y * 1.3,
    'real charge countdown makes an existing world-space signal materially bolder');
  assert.equal(stage.diagnostics().remainingChargeTicks, 1);

  stage.update(original, { reducedMotion: true, quality: 'high' });
  const still = [...mesh.instanceMatrix.array];
  stage.update(snapshot({ tick: 151 }), { reducedMotion: true, quality: 'high' });
  assert.deepEqual([...mesh.instanceMatrix.array], still,
    'reduced-motion stage never oscillates between identical authoritative poses');
  assert.equal(stage.diagnostics().markerCount, 3,
    'HD does not squeeze twelve overlapping arrows into a short real lane');
  stage.update(snapshot({ tick: 152 }), { stale: true });
  assert.equal(stage.diagnostics().markerCount, 0, 'transport loss cannot keep a fictitious firing lane');
  stage.update(snapshot({ tick: 1, runToken: 'new-run' }), { quality: 'low' });
  assert.equal(stage.diagnostics().runToken, 'new-run');
  stage.update(snapshot({ lifecycle: 'intermission' }));
  assert.equal(stage.group.visible, false);
  stage.dispose();
  stage.dispose();
  assert.equal(geoDisposals, 1);
  assert.equal(matDisposals, 1);
  assert.equal(stage.group.children.length, 0);
  stage.update(original);
  assert.equal(stage.group.visible, false);
});

test('live scene integrates guardian warning across snapshot, restart, renderer recovery and final disposal', () => {
  const scene = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /guardianShotStage\.update\(snapshot, options\)/);
  assert.match(scene, /entry\.threatLane\.visible = e\.active && e\.telegraph && !options\.stale && e\.kind !== 'guardian'/,
    'do not draw duplicate near-core guardian threat strip under the real exterior signal');
  assert.match(scene, /guardianShotStage\.clear\(\)/);
  assert.match(scene, /guardianShotStage = createTowerGuardianShotStage\(THREE\)/);
  assert.match(scene, /guardianShotStage\.dispose\(\)/);
  assert.match(scene, /guardianShotStage: guardianShotStage\.diagnostics\(\)/);
  assert.match(scene, /enemy\.id === threatenedGuardianId/,
    'only the currently witnessed real shot can promote an airborne guardian into camera focus');
  assert.match(scene, /!options\.stale && guardianWarning\.visible \? guardianWarning\.guardianId : null/,
    'stale or absent shot must not pull airborne camera away from the genuine route');
  assert.match(scene, /duelFocus \? sourceGuardian\.x - p\.x/,
    'the existing skinned visor must acknowledge the live dueling enemy');
  assert.match(scene, /incomingGuardianCharge: witnessedShot/,
    'the same source shot charge must drive the climber instead of cosmetic timers');
  const characters = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/characters.mjs'), 'utf8');
  assert.match(characters, /incomingGuardian > 0/);
  assert.match(characters, /reducedMotion \? incomingGuardian \* \.42/,
    'full and reduced-motion guardian defensive animation remain distinct');
});

test('earned player projectile makes a source-bounded 3D guardian duel readable without inventing an impact', async () => {
  const { observedGuardianPulseFlight: observed, createTowerGuardianShotStage } = await modulePromise;
  const base = snapshot(), input = snapshot({
    enemies: [{ ...base.enemies[0], telegraph: false }],
    projectiles: [{ id: 'hero:shot:150', owner: 'player',
      x: 160000, y: 930000, vx: -12000 }],
  });
  const unchanged = JSON.stringify(input);
  const flight = observed(input);
  assert.equal(flight?.projectileId, 'hero:shot:150');
  assert.equal(flight?.guardianId, 'f8:guardian');
  assert.equal(flight?.vx, -12000);
  assert.equal(JSON.stringify(input), unchanged, 'source frame must stay immutable');

  const stage = createTowerGuardianShotStage(THREE);
  const pulse = stage.group.getObjectByName('RealPlayerPulseGuardianFlight');
  let disposed = 0;
  pulse.geometry.addEventListener('dispose', () => disposed++);
  stage.update(input, { quality: 'low' });
  assert.equal(stage.diagnostics().markerCount, 0,
    'an uncharged guardian must not create a fake hostile warning');
  assert.equal(stage.diagnostics().pulseMarkerCount, 4);
  assert.equal(stage.diagnostics().extraDraws, 1);
  assert.equal(stage.diagnostics().predictedHits, false);
  assert.equal(stage.focusPoint(), null, 'hero shot is not an incoming guardian warning');
  assert.ok(stage.pulseFocusPoint(), 'camera can frame the real current projectile');
  assert.ok(pulse.material.depthTest, 'world depth and opponents occlude the plume');

  const matrix = new THREE.Matrix4();
  pulse.getMatrixAt(0, matrix);
  const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(Math.hypot(pos.x, pos.z) - 27.82) < 1e-4,
    'the recorded bolt travels on the outside tower combat lane');
  const charged = { ...input, tick: 151,
    enemies: [{ ...base.enemies[0], telegraphTicksRemaining: 4 }] };
  stage.update(charged, { quality: 'low' });
  assert.equal(stage.diagnostics().extraDraws, 2,
    'a real counter-shot and simultaneous real guardian warning remain distinct');
  assert.equal(stage.diagnostics().pulseMarkerCount, 4);
  assert.ok(stage.diagnostics().markerCount > 0);
  stage.update({ ...input, projectiles: [] });
  assert.equal(stage.diagnostics().pulseMarkerCount, 0);
  assert.equal(stage.group.visible, false);
  stage.update(input, { quality: 'high' });
  assert.equal(stage.diagnostics().pulseMarkerCount, 6);
  stage.update(input, { stale: true });
  assert.equal(stage.group.visible, false, 'a stalled transport must not hold fictional shots');
  stage.dispose();
  stage.dispose();
  assert.equal(disposed, 1, 'all new real geometry must release on teardown/recovery');
  assert.equal(stage.group.children.length, 0);
});

test('hero pulse staging refuses wrong owner, shot direction, height, dead boss and false run states', async () => {
  const { observedGuardianPulseFlight: observed } = await modulePromise;
  const base = snapshot();
  const input = snapshot({
    enemies: [{ ...base.enemies[0], telegraph: false }],
    projectiles: [{ id: 'source:real-shot', owner: 'player',
      x: 160000, y: 930000, vx: -12000 }],
  });
  function reject(edit) {
    const copy = structuredClone(input);
    edit(copy);
    assert.equal(observed(copy), null);
  }
  reject(s => { s.projectiles = []; });
  reject(s => { s.projectiles[0].owner = 'enemy'; });
  reject(s => { s.projectiles[0].vx = 12000; });
  reject(s => { s.projectiles[0].y += 33000; });
  reject(s => { s.enemies[0].health = 0; });
  reject(s => { s.enemies[0].active = false; });
  reject(s => { s.enemies[0].kind = 'shooter'; });
  reject(s => { s.player.state = 'airborne'; });
  reject(s => { s.player.health = 0; });
  reject(s => { s.lifecycle = 'result'; });
  reject(s => { s.runToken = ''; });
  reject(s => { s.floor = Number.NaN; });
  reject(s => { s.projectiles[0].x = 450000; });
  assert.equal(observed(null), null);
});

test('camera and articulated climber share the actual 3D hero pulse, not autonomous predictions', () => {
  const scene = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /rangedGuardianId === contactGuardian\.guardianId/);
  assert.match(scene, /witnessedRangedDuel \? 135000 : 90000/);
  assert.match(scene, /guardianShotStage\.pulseFocusPoint\(\)/);
  assert.match(scene, /guardianWarning\.pulseGuardianId === sourceGuardian\.id/);
  assert.match(scene, /p\.state === 'standing' && !options\.stale/);
  assert.match(scene, /duelFocus \? sourceGuardian\.x - p\.x/);
});
