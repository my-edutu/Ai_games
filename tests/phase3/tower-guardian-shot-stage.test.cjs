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
  assert.equal(lane.length, 37500);
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
  assert.equal(early.markerCount, 8);
  assert.equal(early.extraDraws, 1);
  assert.equal(early.predictedHits, false);
  assert.equal(early.shadowCastingMeshes, 0);
  assert.equal(stage.group.children.length, 1);
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
  assert.equal(stage.diagnostics().markerCount, 12);
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
