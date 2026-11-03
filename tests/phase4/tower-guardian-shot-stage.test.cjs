'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const THREE = require('three');
const modulePromise = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-shot-stage.mjs')).href);

function snapshot(dx = 18000, overrides = {}) {
  return {
    lifecycle: 'running', runToken: 'shot-run', tick: 91, floor: 8,
    worldWidth: 480000, chunkBaseY: 0,
    player: { health: 4, x: 150000 + dx, y: 900000, halfHeight: 14000 },
    enemies: [{ id: 'guardian-8', kind: 'guardian', active: true,
      x: 150000, y: 900000, facing: 1, health: 8, maxHealth: 8,
      telegraph: true, telegraphTicksRemaining: 8 }],
    ...overrides,
  };
}

test('actual close-range guardian attack makes one spatial vane rather than overlapping eight', async () => {
  const { observedGuardianShotCorridor, createTowerGuardianShotStage } = await modulePromise;
  const source = snapshot(13000);
  const original = JSON.stringify(source);
  const observed = observedGuardianShotCorridor(source);
  assert.ok(observed && observed.length > 0 && observed.startGap < 10500);
  assert.ok(observed.x + observed.startGap + observed.length < source.player.x,
    'the warning must remain before the present live climber');
  const stage = createTowerGuardianShotStage(THREE);
  try {
    stage.update(source, { quality: 'low' });
    const arrows = stage.group.getObjectByName('ActualGuardianProjectileFacing');
    assert.ok(arrows?.isInstancedMesh);
    assert.equal(arrows.count, 1);
    assert.equal(arrows.material.depthTest, true);
    assert.equal(arrows.castShadow, false);
    assert.equal(stage.diagnostics().extraDraws, 1);
    assert.ok(stage.focusPoint());
    assert.ok(Math.hypot(stage.focusPoint().x, stage.focusPoint().z) > 27.7,
      'the camera focus must be a real outside-core physical warning point');
    assert.equal(JSON.stringify(source), original,
      'presentation may not modify authoritative attack snapshots');
    stage.update(source, { stale: true });
    assert.equal(stage.diagnostics().visible, false);
    assert.equal(stage.focusPoint(), null);
    stage.update({ ...source, lifecycle: 'intermission' });
    assert.equal(stage.focusPoint(), null);
  } finally { stage.dispose(); }
  assert.equal(stage.group.children.length, 0);
});

test('wide genuine warning stays low-tier bounded, spatially spaced, and clears across restart', async () => {
  const { createTowerGuardianShotStage, observedGuardianShotCorridor } = await modulePromise;
  const source = snapshot(170000);
  assert.ok(observedGuardianShotCorridor(source)?.length >= 100000);
  const stage = createTowerGuardianShotStage(THREE);
  try {
    stage.update(source, { quality: 'low' });
    const vanes = stage.group.getObjectByName('ActualGuardianProjectileFacing');
    assert.equal(vanes.count, 8);
    const first = new THREE.Matrix4(), last = new THREE.Matrix4();
    vanes.getMatrixAt(0, first);
    vanes.getMatrixAt(vanes.count - 1, last);
    assert.ok(new THREE.Vector3().setFromMatrixPosition(first).distanceTo(
      new THREE.Vector3().setFromMatrixPosition(last)) > 6,
      'source-spaced hazard markers must occupy distinct physical positions');
    stage.update({ ...source, tick: 92, enemies: [{ ...source.enemies[0],
      telegraphTicksRemaining: 2 }] }, { quality: 'high' });
    assert.equal(vanes.count, 12);
    assert.equal(stage.diagnostics().remainingChargeTicks, 2);
    stage.update({ ...source, runToken: 'next-run', tick: 1,
      enemies: [{ ...source.enemies[0], telegraph: false }] });
    assert.equal(stage.diagnostics().markerCount, 0);
    assert.equal(stage.focusPoint(), null);
    stage.update({ ...source, tick: 93 }, { reducedMotion: true, quality: 'low' });
    assert.equal(vanes.count, 8, 'reduced motion retains static danger geometry');
    assert.equal(stage.diagnostics().predictedHits, false);
  } finally { stage.dispose(); }
});

test('scene camera accepts ONLY the real matching guardian shot and keeps actor and guardian guards', () => {
  const scene = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /guardianShotStage\.focusPoint\(\)/);
  assert.match(scene, /contactGuardian && threatenedGuardianId === contactGuardian\.guardianId/);
  assert.match(scene, /!view\.guardianFramed \|\| view\.heroFraction < \.15/);
  assert.match(scene, /view\.shotFramed \? 11 : 0/);
});
