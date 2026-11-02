'use strict';
// Source-bound engineering regression for the real Three follow camera.
// This does not substitute for real normal-speed desktop/portrait video.
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
  return { THREE, ...coordinates, context };
})();

test('transitioning between opposite valid 3D viewpoints orbits the tower rather than clipping through its core', async () => {
  const { THREE, context } = await loaded;
  const current = new THREE.Vector3(-62, 12, 16);
  const target = new THREE.Vector3(62, 26, 16);
  const original = target.clone();
  const samples = [];
  for (let i = 0; i < 36; i++) {
    const beforeAngle = Math.atan2(current.x, current.z);
    assert.equal(context.followTowerCamera(current, target, .14), current,
      'reuses the existing camera vector with no per-frame instance');
    const radius = Math.hypot(current.x, current.z);
    samples.push(radius);
    assert.ok(radius >= 27.35 - 1e-8, 'every rendered intermediate view stays outside the real tower deck');
    const afterAngle = Math.atan2(current.x, current.z);
    const step = Math.abs(Math.atan2(Math.sin(afterAngle - beforeAngle), Math.cos(afterAngle - beforeAngle)));
    assert.ok(step < .4, 'smoothing may not whip across a half turn in one presentation frame');
  }
  assert.ok(Math.abs(current.x - target.x) < 1 && Math.abs(current.z - target.z) < 1,
    'the camera reaches the designed combat view, not an unrelated orbit');
  assert.ok(Math.abs(current.y - target.y) < .1);
  assert.ok(Math.min(...samples) > 27.34);
  assert.ok(current.distanceTo(target) < 1.1);
  assert.ok(target.equals(original), 'following may never mutate its target pose');
});

test('the actual focus target tracks the cylindrical action stage instead of looking through the tower center', async () => {
  const { THREE, context } = await loaded;
  const from = new THREE.Vector3(-24, 14, 8);
  const to = new THREE.Vector3(24, 20, 8);
  const original = to.clone();
  assert.equal(context.followTowerFocus(from, to, .5), from);
  assert.ok(Math.hypot(from.x, from.z) > 25,
    'a combat or traversal focus change must not interpolate across the solid core');
  assert.ok(Math.abs(from.y - 17) < 1e-9);
  context.followTowerFocus(from, to, 1);
  assert.ok(from.distanceTo(to) < 1e-9, 'the source-selected camera focus remains exact');
  assert.ok(to.equals(original), 'the presentation target is immutable');
});

test('seam crossing uses the short angular arc and reduced-motion camera can settle immediately', async () => {
  const { THREE, context } = await loaded;
  const r = 55, toVec = a => new THREE.Vector3(Math.sin(a) * r, 18, Math.cos(a) * r);
  const current = toVec(Math.PI - .04);
  const target = toVec(-Math.PI + .04);
  context.followTowerCamera(current, target, .5);
  assert.ok(current.z < -54 && Math.abs(current.x) < 1,
    'the +-pi crossing stays near the exterior back of the tower');
  context.followTowerCamera(current, target, 1);
  assert.ok(current.distanceTo(target) < 1e-8, 'instant/reduced-motion settling preserves the chosen final view');
});

test('real guardian contact increases catch-up while routine ascent keeps the calmer cinematic speed', async () => {
  const { THREE, context } = await loaded;
  const current = new THREE.Vector3(-60, 21, 20), target = new THREE.Vector3(60, 23, 20);
  assert.equal(context.towerCameraRate(current, target, false, false), 3.5);
  assert.equal(context.towerCameraRate(current, target, true, true), 3.5);
  const urgent = context.towerCameraRate(current, target, true, false);
  assert.ok(urgent > 5.2 && urgent <= 13.5);
  const close = context.towerCameraRate(target, target, true, false);
  assert.ok(close >= 5.2 && close < urgent, 'the camera settles rather than continuously whipping during combat');
});

test('projected gate cannot earn a visible-viewpoint preference while a tower-core segment blocks it', async () => {
  const { context } = await loaded;
  const gate = { x: 0, y: 5, z: 21.8 };
  assert.equal(context.towerCoreSightlineClear({ x: 0, y: 8, z: 65 }, gate), true);
  assert.equal(context.towerCoreSightlineClear({ x: 65, y: 8, z: 0 }, gate), false,
    'a narrow phone crop alone is not proof of an unobscured recessed lock');
  assert.equal(context.towerCoreSightlineClear({ x: 0, y: 8, z: 65 }, { x: 0, y: 5, z: 25 }, 23.5), true);
  assert.equal(context.towerCoreSightlineClear({ x: 65, y: 8, z: 0 }, { x: 0, y: 5, z: 25 }, 23.5), false);
});

test('real historical guardian contact can recover toward its true source-driven combat frame in both aspect ratios', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');
  const session = createSession('tower-stream-reference', {
    launchFloor: 8, guardianInterval: 8, upgradeInterval: 4,
    maxTicks: 20000, noProgressTicks: 3000, intermissionTicks: 36,
  }, 'historical-v1');
  for (let i = 0; i < 269; i++) advance(session);
  const frame = session.controller.frame(390, 844, { reducedMotion: true, muted: true }).snapshot;
  assert.equal(frame.publicChecksum, 'af60b546');
  const guardian = frame.enemies.find(enemy => enemy.active && enemy.kind === 'guardian');
  const original = JSON.stringify(frame);
  for (const aspect of [390 / 844, 960 / 600]) {
    const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight,
      frame.chunkBaseY, frame.worldWidth);
    const desired = context.composeFollowView(frame, hero, aspect);
    assert.equal(desired.guardianFramed, true, 'the actual source guardian has a valid destination composition');
    const r = Math.hypot(desired.position.x, desired.position.z);
    const azimuth = Math.atan2(desired.position.x, desired.position.z) - 1.1;
    const current = new THREE.Vector3(Math.sin(azimuth) * r, desired.position.y, Math.cos(azimuth) * r);
    for (let i = 0; i < 32; i++) {
      const rate = context.towerCameraRate(current, desired.position, true, false);
      context.followTowerCamera(current, new THREE.Vector3(
        desired.position.x, desired.position.y, desired.position.z), 1 - Math.exp(-rate / 60));
      assert.ok(Math.hypot(current.x, current.z) >= 27.35 - 1e-8);
    }
    const camera = new THREE.PerspectiveCamera(42, aspect, .2, 1200);
    camera.position.copy(current);
    camera.lookAt(desired.focus.x, desired.focus.y, desired.focus.z);
    camera.updateMatrixWorld(true);
    const center = pointFor(guardian.x, guardian.y, frame.chunkBaseY, frame.worldWidth);
    const onScreen = new THREE.Vector3(center.x, center.y, center.z).project(camera);
    assert.ok(Math.abs(onScreen.x) < .9 && Math.abs(onScreen.y) < .85 &&
      onScreen.z > -1 && onScreen.z < 1,
    'the source-observed antagonist returns to the portrait/desktop picture without a cut');
  }
  assert.equal(JSON.stringify(frame), original, 'camera cannot mutate replay/public game state');
});

test('observed real portrait dash and floor transitions accelerate tracking only when climber is leaving the image', async () => {
  const { context } = await loaded;
  const rate = 3.5;
  assert.equal(context.towerCameraActorSafetyRate(rate, .12, .24, 390 / 844), rate,
    'routine centered ascent preserves cinematic motion');
  assert.ok(context.towerCameraActorSafetyRate(rate, .69, .3, 390 / 844) > rate,
    'camera begins to catch up before losing the actual climber');
  // Source-pinned run 41367442477 measured x=2.01,1.68,1.25 NDC in
  // authentic phone danger gameplay; do not normalize this off-screen defect.
  for (const x of [2.01, 1.68, 1.25]) {
    const urgent = context.towerCameraActorSafetyRate(rate, x, .62, 390 / 844);
    assert.ok(urgent >= 12 && urgent <= 18,
      'observed off-screen actor demands fast but bounded exterior recovery');
  }
  assert.equal(context.towerCameraActorSafetyRate(6, NaN, .2, .46), 6,
    'unavailable prior projected frame cannot invent a correction');
  assert.equal(context.towerCameraActorSafetyRate(6, .2, Infinity, .46), 6);
  assert.ok(context.towerCameraActorSafetyRate(13.5, .94, .2, .46) <= 18,
    'real boss contact cannot compound into unbounded camera rotation');
});

test('a wide jump blends the actual route focus around the tower rather than through its opaque core', async () => {
  const { context } = await loaded;
  const center = { x: -24, y: 10, z: 8 }, destination = { x: 24, y: 14, z: 8 };
  const untouched = { ...destination };
  assert.equal(context.blendTowerStageFocus(center, destination, .5), center);
  assert.ok(Math.hypot(center.x, center.z) > 25, 'wide ascent keeps the focus on the exterior stone');
  assert.ok(Math.abs(center.y - 12) < 1e-8);
  assert.deepEqual(destination, untouched, 'source waypoint must remain immutable');
  const one = { x: Math.sin(Math.PI - .04) * 25, y: 4, z: Math.cos(Math.PI - .04) * 25 };
  const two = { x: Math.sin(-Math.PI + .04) * 25, y: 7, z: Math.cos(-Math.PI + .04) * 25 };
  context.blendTowerStageFocus(one, two, .5);
  assert.ok(one.z < -24.9 && Math.abs(one.x) < .01, 'seam follows the short arc');
  assert.ok(Math.abs(one.y - 5.5) < 1e-8);
});

test('existing nearby source-led ascent retains proven camera screen-space composition', async () => {
  const { context } = await loaded;
  const stage = { x: 0, y: 7, z: 25 };
  const waypoint = { x: 8, y: 12, z: 23.5 };
  context.blendTowerStageFocus(stage, waypoint, .38);
  assert.ok(Math.abs(stage.x - 3.04) < 1e-9);
  assert.ok(Math.abs(stage.z - (25 + (23.5 - 25) * .38)) < 1e-9);
  assert.ok(Math.abs(stage.y - 8.9) < 1e-9);
  // Prior actual native-camera geometry regression tests protect the nearby
  // glyph and hero. This pure assertion must not be treated as a visual win.
});
