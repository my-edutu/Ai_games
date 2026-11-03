'use strict';
// A native 390x844 source-capture regression for the real Tower follow-camera
// geometry. It does NOT certify visible full-motion quality or device FPS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const loaded = (async () => {
  const THREE = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const context = { THREE, ...coordinates };
  const source = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene');
  vm.runInNewContext(source, context);
  return { THREE, context };
})();
function rig(THREE, aspect = 390 / 844) {
  const camera = new THREE.PerspectiveCamera(42, aspect, .2, 1200);
  camera.position.set(0, 16, 62);
  const gaze = new THREE.Vector3(-6, 11, 25);
  const actor = new THREE.Vector3(0, 11, 27);
  const scratch = new THREE.Vector3(), orbit = new THREE.Vector3();
  const previousCamera = new THREE.Vector3(), previousGaze = new THREE.Vector3();
  camera.lookAt(gaze); camera.updateMatrixWorld(true);
  return { camera, gaze, actor, scratch, orbit, previousCamera, previousGaze };
}
function projection(r) {
  r.camera.lookAt(r.gaze); r.camera.updateMatrixWorld(true);
  return r.actor.clone().project(r.camera);
}
function pressure(ndc) { return Math.max(0, Math.abs(ndc.x) / .78 - 1, Math.abs(ndc.y) / .78 - 1); }

test('the recorded native portrait action crop requests a modest *verified* after-smoothing recovery', async () => {
  const { THREE, context } = await loaded;
  const r = rig(THREE);
  // Camera/gaze and actor are all current physical 3D geometry, not fabricated
  // source positions. 58904b4 source-pinned candidate danger captured four
  // samples outside the portrait 0.78 safe frame, including |x|=0.8706.
  const before = projection(r);
  assert.ok(pressure(before) > 0, 'test should genuinely start with a clipped safe margin');
  const actorBefore = r.actor.clone(), turnBefore = Math.atan2(r.camera.position.x, r.camera.position.z);
  const blend = context.refineTowerActorSafeFrame(r.camera, r.gaze, r.actor, 1 / 60,
    r.scratch, r.orbit, r.previousCamera, r.previousGaze);
  const after = projection(r);
  assert.ok(blend > 0 && blend < .10, 'only a bounded short second pass, never a camera cut');
  assert.ok(pressure(after) + 0.0005 < pressure(before),
    'the actual projected actor must move measurably into the native phone safe area');
  const turnAfter = Math.atan2(r.camera.position.x, r.camera.position.z);
  assert.ok(Math.abs(Math.atan2(Math.sin(turnAfter-turnBefore),Math.cos(turnAfter-turnBefore))) < .10);
  assert.ok(Math.hypot(r.camera.position.x, r.camera.position.z) >= 27.35);
  assert.ok(r.actor.equals(actorBefore), 'presentation must not move or edit source actor state');
});

test('normal centered ascent, wide landscape and invalid/stale updates do not trigger rescue', async () => {
  const { THREE, context } = await loaded;
  for (const aspect of [390 / 844, 960 / 600]) {
    const r = rig(THREE, aspect);
    r.gaze.set(0, 11, 27);
    const original = r.camera.position.clone();
    assert.equal(context.refineTowerActorSafeFrame(r.camera,r.gaze,r.actor,1/60,
      r.scratch,r.orbit,r.previousCamera,r.previousGaze),0);
    assert.ok(r.camera.position.equals(original), 'centered or wide scene unchanged');
  }
  const r = rig(THREE);
  for (const dt of [0, -1, NaN]) {
    const old = r.camera.position.clone(), gaze = r.gaze.clone();
    assert.equal(context.refineTowerActorSafeFrame(r.camera,r.gaze,r.actor,dt,
      r.scratch,r.orbit,r.previousCamera,r.previousGaze),0);
    assert.ok(r.camera.position.equals(old) && r.gaze.equals(gaze));
  }
});

test('after-smoothing correction must not sacrifice safe exterior tower sightlines', async () => {
  const { THREE, context } = await loaded;
  const r = rig(THREE);
  const first = projection(r);
  assert.ok(pressure(first)>0);
  for (let i=0;i<50;i++) {
    context.refineTowerActorSafeFrame(r.camera,r.gaze,r.actor,1/60,
      r.scratch,r.orbit,r.previousCamera,r.previousGaze);
    assert.ok(Math.hypot(r.camera.position.x, r.camera.position.z)>=27.35);
    assert.equal(context.towerCoreSightlineClear(r.camera.position,r.actor,23.5),true);
    const now = projection(r);
    assert.ok(Number.isFinite(now.x) && Number.isFinite(now.y));
    assert.ok(Math.abs(now.x)<=1 && Math.abs(now.y)<=1,'rescue must never hide the actor');
  }
  assert.ok(pressure(projection(r)) < pressure(first),'repeated source-driven frames converge toward safety');
});


test('a final portrait rescue cannot push an already readable actual guardian away', async () => {
  const { THREE, context } = await loaded;
  const r = rig(THREE);
  const guardian = new THREE.Vector3(-2, 11, 27);
  const guardedProjection = new THREE.Vector3();
  const before = projection(r), guardianBefore = guardian.clone().project(r.camera);
  assert.ok(pressure(before) > 0, 'real climber must start beyond portrait margin');
  assert.ok(Math.abs(guardianBefore.x) < .82 && Math.abs(guardianBefore.y) < .8);
  const actorOriginal = r.actor.clone(), guardianOriginal = guardian.clone();
  context.refineTowerActorSafeFrame(r.camera,r.gaze,r.actor,1/60,
    r.scratch,r.orbit,r.previousCamera,r.previousGaze,guardian,guardedProjection);
  const after = projection(r), guardianAfter = guardian.clone().project(r.camera);
  assert.ok(pressure(after) <= pressure(before) + 1e-6);
  assert.ok(Math.abs(guardianAfter.x) <= .82 && Math.abs(guardianAfter.y) <= .8);
  assert.equal(context.towerCoreSightlineClear(r.camera.position,guardian,23.5),true);
  assert.ok(guardian.equals(guardianOriginal) && r.actor.equals(actorOriginal));
});

test('source-real mobile guardian and touchdown offsets precede final actor framing', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  const guardian = source.indexOf('guardianRescueBlend = step;');
  const contact = source.indexOf('camera.position.y+=(contactHero?-.24:.18)');
  const final = source.indexOf('const verified = refineTowerActorSafeFrame(');
  const reveal = source.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints)');
  assert.ok(guardian > 0 && guardian < contact && contact < final && final < reveal,
    'the final physical submitted camera must protect the actor AFTER live guardian/impact');
  assert.match(source, /protectGuardian \? guardianRescuePoint : null/);
});
