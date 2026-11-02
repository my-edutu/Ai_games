'use strict';
// The passage is triggered by REAL adjacent fixed-step source observations.
// These are safety/geometry checks, NEVER LOOKS/FEELS/PLAYS quality votes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href),
]);
function frames() {
  const previous = Object.freeze({
    runToken: 'authentic-run', floor: 8, tick: 200, lifecycle: 'running',
    enemies: Object.freeze([{ id: 'f8:guardian', kind: 'guardian', active: true, health: 1 }]),
  });
  const next = Object.freeze({
    runToken: 'authentic-run', floor: 9, tick: 201, lifecycle: 'running',
    enemies: Object.freeze([]),
  });
  return { previous, next };
}
const anchor = Object.freeze({ x: 8.2, y: 17.5, z: 19.8, angle: .24 });

test('a witnessed living guardian and exact next-floor source are required; no fake clearance', async () => {
  const [, { observedGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  assert.equal(observedGuardianPassage(previous, next), true);
  for (const source of [
    { ...next, runToken: 'second-run' },
    { ...next, floor: 8 },
    { ...next, floor: 10 },
    { ...next, tick: 200 },
    { ...next, tick: 199 },
    { ...next, lifecycle: 'intermission' },
  ]) assert.equal(observedGuardianPassage(previous, source), false);
  assert.equal(observedGuardianPassage({ ...previous, lifecycle: 'result' }, next), false);
  assert.equal(observedGuardianPassage({ ...previous, enemies: [] }, next), false);
  assert.equal(observedGuardianPassage({ ...previous,
    enemies: [{kind: 'guardian', active: false}] }, next), false);
  assert.equal(observedGuardianPassage({ ...previous,
    enemies: [{kind: 'sentinel', active: true}] }, next), false);
  assert.equal(JSON.stringify(previous).includes('guardian'), true,
    'the frozen public input must remain unmodified');
});

test('the real event creates a separated 3D bronze passage with bounded resources, never a collider', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  try {
    assert.equal(effect.group.visible, false);
    assert.equal(effect.begin(previous, { ...next, floor: 11 }, anchor), false);
    assert.equal(effect.group.visible, false);
    assert.equal(effect.begin(previous, next, anchor), true);
    assert.deepEqual(effect.group.position.toArray(), [anchor.x, anchor.y, anchor.z]);
    assert.equal(effect.group.rotation.y, anchor.angle);
    effect.update(0);
    const left = effect.group.getObjectByName('ClearedPassageLeftLeaf');
    const right = effect.group.getObjectByName('ClearedPassageRightLeaf');
    const crest = effect.group.getObjectByName('ClearedPassageObservedLock');
    assert.ok(left && right && crest);
    assert.equal(left.position.x, -1.46);
    assert.equal(right.position.x, 1.46);
    assert.equal(crest.isMesh, true);
    const shards=effect.group.getObjectByName('WitnessedLockSplinters');
    assert.ok(shards?.isInstancedMesh, 'source-bound lock debris uses a single reusable draw');
    assert.equal(shards.count,8);
    const first=new THREE.Matrix4(),opened=new THREE.Matrix4();
    shards.getMatrixAt(0,first);
    effect.update(.5);
    shards.getMatrixAt(0,opened);
    assert.notDeepEqual(first.elements,opened.elements,
      'the physical splinters advance only through witnessed presentation time');
    assert.ok(left.position.x < -3 && right.position.x > 3,
      'genuine floor advance must drive a large, visible mechanical opening');
    assert.equal(effect.diagnostics().sourceTick, next.tick);
    assert.deepEqual(effect.diagnostics().anchorPosition, [anchor.x, anchor.y, anchor.z],
      'full-motion provenance reports the exact source-bound gate anchor and elevation');
    assert.deepEqual(effect.diagnostics().focusPosition, [anchor.x, anchor.y + 2.6, anchor.z]);
    assert.equal(effect.diagnostics().floor, next.floor);
    assert.ok(effect.cameraWeight() > 0 && effect.cameraWeight() < 1);
    let meshCount = 0;
    effect.group.traverse(object => {
      if (!object.isMesh) return;
      meshCount++;
      assert.equal(object.castShadow, false);
      assert.equal(object.receiveShadow, false);
      assert.equal(object.userData.collider, undefined);
    });
    assert.equal(meshCount, 13);
    assert.equal(effect.diagnostics().fragmentInstances, 8);
    assert.ok(effect.focusPoint()?.y > anchor.y + 2);
    assert.equal(effect.diagnostics().shadows, 0);
    for(let step=0;step<11;step++)effect.update(.25);
    assert.equal(effect.group.visible, false, 'the passage retires without a run/authority mutation');
    assert.equal(effect.diagnostics().runToken, null);
    assert.equal(effect.cameraWeight(), 0);
  } finally { effect.dispose(); }
});

test('stale transport and reduced motion cannot animate fake progress; context recovery disposes once', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  const disposed = [];
  effect.group.traverse(object => {
    if (object.geometry) object.geometry.addEventListener('dispose', () => disposed.push(object.geometry.uuid));
  });
  assert.equal(effect.begin(previous, next, anchor), true);
  effect.update(.5, { stale: true });
  assert.equal(effect.diagnostics().ageSeconds, 0);
  effect.update(.1, { reducedMotion: true });
  const left = effect.group.getObjectByName('ClearedPassageLeftLeaf');
  const x = left.position.x;
  assert.ok(x < -3.4, 'motion preference shows a stable open shape, not a closed/ambiguous gate');
  assert.equal(effect.group.getObjectByName('WitnessedLockSplinters').visible,false,
    'reduced motion does not animate flying debris');
  effect.update(.2, { reducedMotion: true });
  assert.equal(left.position.x, x);
  assert.equal(effect.diagnostics().ageSeconds, .30000000000000004);
  effect.clear();
  assert.equal(effect.group.visible, false);
  effect.dispose();
  effect.dispose();
  assert.equal(effect.diagnostics().disposed, true);
  assert.equal(effect.group.children.length, 0);
  assert.equal(new Set(disposed).size, 5, 'all owned geometries including instanced fragments are released');
});

test('the actual scene consumes source transitions and owns passage lifecycle on recovery', () => {
  const source = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(source, /observedGuardianPassage\(previous, next\)/);
  assert.match(source, /const guardianCap = clearedGuardian && previous\.platforms\?\.find/);
  assert.match(source, /platform\.id === `f\$\{previous\.floor\}:cap`/);
  assert.match(source, /const gateAnchorX = guardianGateAnchorX\(previous, guardianCap\)/);
  assert.match(source, /passage\.begin\(previous, next, pointFor\(gateAnchorX/);
  assert.match(source, /guardianCap\.y \+ guardianCap\.height, next\.chunkBaseY/);
  assert.doesNotMatch(source, /passage\.begin\(previous, next, pointFor\(next\.player\.x/);
  // A world-space continuity cue must come from the defeated SOURCE gate,
  // never from the new player's arbitrary location after a floor transition.
  assert.match(source, /scene\.remove\(world\.group, climber\.group, finale\.group, passage\.group\)/);
  assert.match(source, /passage\.dispose\(\)/);
  assert.match(source, /passage\.update\(dt, options\)/);
  assert.match(source, /passage: passage\.diagnostics\(\)/);
});
