'use strict';
const { hydrateTowerSceneVmContext } = require('./tower-scene-vm-bindings.cjs');
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
  const guardianCircuit = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-circuit.mjs')).href);
  const gateIntrusion = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-gate-intrusion.mjs')).href);
  const context = { THREE, ...coordinates, ...guardianCircuit, ...gateIntrusion };
  const source = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene');
  await hydrateTowerSceneVmContext(context);
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


test('actual out-of-frame portrait climber receives a stronger exterior rescue without a camera cut or source mutation', async () => {
  const { THREE, context } = await loaded;
  const actor = new THREE.Vector3(2, 15, 27);
  const initialCamera = new THREE.Vector3(0, 12, 60);
  const initialGaze = new THREE.Vector3(15, 12, 24);
  const run = x => {
    const position = initialCamera.clone(), gaze = initialGaze.clone();
    const orbitTarget = new THREE.Vector3();
    const blend = context.recoverTowerActorView(position, gaze, actor,
      x, -.25, .98, 390 / 844, .17, orbitTarget);
    return { position, gaze, blend };
  };
  const near = run(.89), lost = run(-1.2967);
  assert.ok(lost.blend > near.blend, 'real offscreen portrait evidence must trigger a stronger, bounded correction');
  assert.ok(lost.blend <= .48 && near.blend <= .28, 'camera tracking stays bounded on the tower exterior');
  assert.ok(lost.gaze.distanceTo(actor) < near.gaze.distanceTo(actor),
    'an offscreen explorer should regain the frame before a leisurely follow');
  assert.ok(Math.hypot(lost.position.x, lost.position.z) >= 27.35,
    'rescue must not dive through the opaque masonry');
  assert.deepEqual(actor.toArray(), [2, 15, 27], 'the presentation has no authority to move the real explorer');
});

test('real projected guardian outside a phone crop accelerates its existing exterior follow without a cut', async () => {
  const { context } = await loaded;
  const base = 5.2, portrait = 390 / 844;
  assert.equal(context.towerCameraGuardianSafetyRate(base, .2, .3, portrait), base,
    'centered pre-contact guardian never perturbs calm camera motion');
  const edging = context.towerCameraGuardianSafetyRate(base, .78, .2, portrait);
  const missing = context.towerCameraGuardianSafetyRate(base, 1.6, .2, portrait);
  assert.ok(edging > base && missing > edging && missing <= 17.5,
    'cropped source guardian requires bounded catch-up before the viewer misses the actual attack');
  assert.ok(context.towerCameraGuardianSafetyRate(base, .1, 1.45, portrait) > base,
    'vertical phone crop is also a genuine safety signal');
  assert.equal(context.towerCameraGuardianSafetyRate(base, Infinity, 0, portrait), base,
    'invalid source projection cannot invent a guardian');
  assert.equal(context.towerCameraGuardianSafetyRate(18, 1.4, .4, portrait), 18,
    'guardian recovery cannot override a faster existing hero-safety requirement');
});


test('a genuinely framed guardian duel retains continuous bounded camera AND focus orbit while emergency framing stays unbounded', async () => {
  const { THREE, context } = await loaded;
  const safeHero = {x:.18,y:-.12,z:.4}, safeGuardian={x:-.28,y:.14,z:.5};
  const portrait=390/844, frame=1/60;
  const budget=context.towerDuelOrbitBudget(frame,portrait,safeHero,safeGuardian,true,true);
  assert.ok(budget>.02 && budget<.04,'already readable duel has bounded source-current angular velocity');
  const start=new THREE.Vector3(-44,38,37),target=new THREE.Vector3(44,40,37);
  const camera=start.clone(),focus=new THREE.Vector3(-19,38,14);
  const targetFocus=new THREE.Vector3(19,40,14);
  const cameraAngle=Math.atan2(camera.x,camera.z),focusAngle=Math.atan2(focus.x,focus.z);
  context.followTowerCamera(camera,target,.82,budget);
  context.followTowerFocus(focus,targetFocus,.82,budget);
  const arc=(before,after)=>Math.abs(Math.atan2(Math.sin(after-before),Math.cos(after-before)));
  assert.ok(arc(cameraAngle,Math.atan2(camera.x,camera.z))<=budget+1e-7,
    'one normal-speed frame cannot whip the real camera past the current duel');
  assert.ok(arc(focusAngle,Math.atan2(focus.x,focus.z))<=budget+1e-7,
    'the real gaze must remain angularly connected with its bounded camera');
  assert.ok(Math.hypot(camera.x,camera.z)>=27.35,'camera remains outside real collision core');
  assert.equal(context.towerDuelOrbitBudget(frame,portrait,{x:.95,y:0,z:.4},
    safeGuardian,true,true),Infinity,'cropped hero has priority over aesthetics');
  assert.equal(context.towerDuelOrbitBudget(frame,portrait,safeHero,
    {x:-.8,y:0,z:.4},true,true),Infinity,'cropped guardian triggers genuine rescue');
  assert.equal(context.towerDuelOrbitBudget(frame,portrait,safeHero,
    safeGuardian,true,false),Infinity,'obstructed opponent must not be held in place');
  assert.equal(context.towerDuelOrbitBudget(.2,portrait,safeHero,
    safeGuardian,true,true),Infinity,'slow frames must not accumulate a fake camera hold');
  const free=start.clone();
  context.followTowerCamera(free,target,.82,Infinity);
  assert.ok(arc(Math.atan2(start.x,start.z),Math.atan2(free.x,free.z)) > budget*8,
    'unsafe/restored source shot keeps existing fast camera recovery');
  assert.ok(target.equals(new THREE.Vector3(44,40,37)),
    'camera comfort never changes authoritative target or route');
});
test('the real scene uses one duel budget for both camera and gaze, after recorded body projection', () => {
  const source=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(source,/duelOrbitBudget = towerDuelOrbitBudget\(cameraDt, camera\.aspect, scratch,/);
  assert.match(source,/const cameraDt = sourceSubmittedDoorwayCameraDt\(dt,coldArchLens,snapshot,options\)/);
  assert.doesNotMatch(source,/duelOrbitBudget = towerDuelOrbitBudget\(dt, camera\.aspect, scratch,/,
    'guardian duel must use the bounded source-qualified frame duration');
  assert.match(source,/followTowerCamera\(camera\.position, destination, cameraBlend, duelOrbitBudget\);/);
  assert.match(source,/followTowerFocus\(lookAt, focus, cameraBlend, duelOrbitBudget\);/);
  assert.match(source,/if \(initialized && !overview && !options\.reducedMotion &&/);
});
