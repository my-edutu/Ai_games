'use strict';
// Pure camera geometry contract for the actual Three scene. This is not an
// independent real-video LOOKS/FEELS/PLAYS judgment or supported-device FPS.
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
  const scene = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene');
  vm.runInNewContext(scene, context);
  return { THREE, context };
})();

const azimuth = p => Math.atan2(p.x, p.z);
const angularError = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

test('centered, core-clear normal climbing keeps the established route/guardian director untouched', async () => {
  const { THREE, context } = await loaded;
  const camera = new THREE.Vector3(0, 16, 70);
  const gaze = new THREE.Vector3(0, 10, 26);
  const actor = new THREE.Vector3(0, 11, 27);
  const orbit = new THREE.Vector3();
  const before = [camera.clone(), gaze.clone(), actor.clone()];
  const blend = context.recoverTowerActorView(camera, gaze, actor, .12, .22, .5, 390 / 844, 1 / 60, orbit);
  assert.equal(blend, 0, 'routine readable ascent must never receive an artificial recenter');
  assert.ok(camera.equals(before[0]) && gaze.equals(before[1]) && actor.equals(before[2]));
});

test('an observed portrait offscreen climber induces bounded camera AND stage-gaze recovery', async () => {
  const { THREE, context } = await loaded;
  const camera = new THREE.Vector3(0, 18, 72);
  const gaze = new THREE.Vector3(0, 11, 26);
  const actor = new THREE.Vector3(24, 12, 11);
  const originalActor = actor.clone();
  const orbit = new THREE.Vector3();
  const initialCameraGap = angularError(azimuth(camera), azimuth(actor));
  const initialFocusGap = angularError(azimuth(gaze), azimuth(actor));
  const blend = context.recoverTowerActorView(camera, gaze, actor,
    2.01, .43, .7, 390 / 844, 1 / 60, orbit);
  assert.ok(blend > 0 && blend < .28, 'source-observed actor crop should invoke controlled, not instant, recovery');
  assert.ok(angularError(azimuth(camera), azimuth(actor)) < initialCameraGap);
  assert.ok(angularError(azimuth(gaze), azimuth(actor)) < initialFocusGap);
  assert.ok(Math.hypot(camera.x, camera.z) >= 27.35, 'camera must never enter the cylindrical masonry');
  assert.ok(angularError(azimuth(camera), 0) <= .16 + 1e-8, 'single-frame camera turn remains bounded');
  assert.ok(actor.equals(originalActor), 'the fallback cannot alter source position/authority');
});

test('an in-frame actor still trapped behind the tower core moves into a truly clear exterior line of sight', async () => {
  const { THREE, context } = await loaded;
  const camera = new THREE.Vector3(65, 18, -20);
  const gaze = new THREE.Vector3(26, 12, -4);
  const actor = new THREE.Vector3(0, 11, 27);
  const orbit = new THREE.Vector3();
  assert.equal(context.towerCoreSightlineClear(camera, actor, 23.5), false);
  let rescued = 0;
  for (let i = 0; i < 70; i++) {
    const before = azimuth(camera);
    const amount = context.recoverTowerActorView(camera, gaze, actor,
      .1, .1, .5, 390 / 844, 1 / 60, orbit);
    if (amount > 0) rescued++;
    assert.ok(angularError(before, azimuth(camera)) <= .16 + 1e-8,
      'no per-submission camera snap');
    assert.ok(Math.hypot(camera.x, camera.z) >= 27.35, 'no core crossing during any recovery');
  }
  assert.ok(rescued > 0);
  assert.equal(context.towerCoreSightlineClear(camera, actor, 23.5), true,
    'visibility recovery must lead to a genuine unblocked actor sightline');
});

test('paused/invalid camera information cannot invent recovery or corrupt view state', async () => {
  const { THREE, context } = await loaded;
  const camera = new THREE.Vector3(0, 18, 66), gaze = new THREE.Vector3(0, 10, 25);
  const actor = new THREE.Vector3(24, 11, 11), orbit = new THREE.Vector3();
  const old = [camera.clone(), gaze.clone()];
  for (const invalid of [
    [NaN, .2, .6, .46, .016], [2, Infinity, .6, .46, .016],
    [2, .2, .6, 0, .016], [2, .2, .6, .46, 0],
  ]) assert.equal(context.recoverTowerActorView(camera, gaze, actor, ...invalid, orbit), 0);
  assert.ok(camera.equals(old[0]) && gaze.equals(old[1]));
});
