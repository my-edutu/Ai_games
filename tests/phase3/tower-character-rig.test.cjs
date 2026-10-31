'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const characterFile = path.join(__dirname, '../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL = pathToFileURL(path.join(path.dirname(require.resolve('three')), 'three.module.js')).href;
let modules;

function loadCharacters() {
  if (!modules) {
    // Execute the shipped module. Only the browser's locally served Three.js
    // import changes; geometry, skin binding, animation and disposal stay real.
    const source = fs.readFileSync(characterFile, 'utf8');
    const adapted = source.replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, `from '${threeURL}'`);
    assert.notEqual(adapted, source, 'adapt the browser Three.js import for Node');
    modules = Promise.all([
      import(`data:text/javascript;base64,${Buffer.from(adapted).toString('base64')}`),
      import(threeURL),
    ]);
  }
  return modules;
}

const standing = Object.freeze({ state: 'standing', vx: 0, vy: 0, facing: 1, health: 5, maxHealth: 5, active: true, attacking: false, firing: false, telegraph: false });
const rootTransform = group => [...group.position, ...group.quaternion, ...group.scale];
const joint = (model, name) => {
  const bone = model.group.getObjectByName(name);
  assert.ok(bone?.isBone, `articulated ${name} bone exists`);
  return bone;
};

function advance(model, state, frames, options) {
  for (let frame = 0; frame < frames; frame++) model.animate(state, 1 / 60, frame / 60, options);
}

function posedVertices(model, boneName, THREE) {
  const points = [];
  model.group.updateMatrixWorld(true);
  const bone = joint(model, boneName);
  model.group.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    const index = mesh.skeleton.bones.indexOf(bone);
    const bindings = mesh.geometry.attributes.skinIndex;
    const positions = mesh.geometry.attributes.position;
    for (let vertex = 0; vertex < positions.count && points.length < 16; vertex++) {
      if (bindings.getX(vertex) !== index) continue;
      const point = new THREE.Vector3().fromBufferAttribute(positions, vertex);
      mesh.applyBoneTransform(vertex, point).applyMatrix4(mesh.matrixWorld);
      points.push(point);
    }
  });
  assert.ok(points.length > 0, `${boneName} drives rendered vertices`);
  return points;
}

function posedRegion(model, boneName, THREE, select) {
  const points = [], bone = joint(model, boneName);
  model.group.updateMatrixWorld(true);
  model.group.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    const index = mesh.skeleton.bones.indexOf(bone), attributes = mesh.geometry.attributes;
    for (let vertex = 0; vertex < attributes.position.count; vertex++) {
      if (attributes.skinIndex.getX(vertex) !== index) continue;
      const authored = new THREE.Vector3().fromBufferAttribute(attributes.position, vertex);
      if (!select(authored, mesh.material)) continue;
      points.push(mesh.applyBoneTransform(vertex, authored).applyMatrix4(mesh.matrixWorld));
    }
  });
  assert.ok(points.length > 0, `${boneName} has rendered geometry in the selected region`);
  return points;
}

let followView;
function loadFollowView() {
  if (!followView) followView = (async () => {
    const [, THREE] = await loadCharacters();
    const coordinates = await import(pathToFileURL(path.join(path.dirname(characterFile), 'coordinates.mjs')).href);
    const context = { THREE, ...coordinates };
    vm.runInNewContext(fs.readFileSync(path.join(path.dirname(characterFile), 'scene.mjs'), 'utf8')
      .replace(/^import .*;\n/gm, '')
      .replace('export function createTowerScene', 'function createTowerScene'), context);
    return { THREE, ...coordinates, context };
  })();
  return followView;
}

// Projection-relevant facts from unmodified tower-stream-reference snapshots.
// Checksums identify the original full snapshots, rather than these excerpts.
const capturedAscents = [
  { tick: 379, publicChecksum: 'cdb269d8', authorityChecksum: '98a3f7e2', lifecycle: 'running', worldWidth: 480000, chunkBaseY: 360000,
    player: { x: 280000, y: 497800, vx: -9000, vy: 13800, halfWidth: 9000, halfHeight: 14000, facing: -1, health: 3, maxHealth: 5, state: 'airborne', attacking: false },
    intent: { mode: 'jumping', targetPlatformId: 'f1:p3' },
    platforms: [{ id: 'f1:p3', kind: 'moving', x: 63559, y: 510000, width: 115000, height: 10000 }],
    enemies: [{ id: 'f1:enemy:0', kind: 'sentinel', x: 335377, y: 482000, halfWidth: 9000, halfHeight: 12000, health: 0, active: false, telegraph: false }, { id: 'f1:enemy:1', kind: 'shooter', x: 323467, y: 582000, halfWidth: 8500, halfHeight: 12000, health: 2, active: true, telegraph: true }],
    hazards: [{ id: 'f1:h0', kind: 'heat', x: 272660, y: 372000, width: 32000, height: 9000, active: true }], projectiles: [] },
  { tick: 234, publicChecksum: '7a87ca02', authorityChecksum: '71ff0549', lifecycle: 'running', worldWidth: 480000, chunkBaseY: 0,
    player: { x: 176500, y: 237800, vx: 9000, vy: 13800, halfWidth: 9000, halfHeight: 14000, facing: 1, health: 4, maxHealth: 5, state: 'airborne', attacking: false },
    intent: { mode: 'jumping', targetPlatformId: 'f0:p5' },
    platforms: [{ id: 'f0:p5', kind: 'oneway', x: 271171, y: 250000, width: 125000, height: 10000 }],
    enemies: [{ id: 'f0:enemy:0', kind: 'sentinel', x: 149030, y: 122000, halfWidth: 9000, halfHeight: 12000, health: 0, active: false, telegraph: false }],
    hazards: [{ id: 'f0:h0', kind: 'spikes', x: 265483, y: 62000, width: 32000, height: 9000, active: true }], projectiles: [] },
];

function placeInFollowView(model, frame, width, height, projection, dt = 1 / 60, reducedMotion = true) {
  const { THREE, pointFor, context } = projection, p = frame.player;
  const mapped = pointFor(p.x, p.y - p.halfHeight, frame.chunkBaseY, frame.worldWidth);
  model.group.position.copy(mapped);
  model.group.rotation.y = mapped.angle + (Math.abs(p.vx) > 500 || p.state === 'dashing' ? p.facing * Math.PI / 2 : p.facing * .32);
  model.group.scale.setScalar(p.halfHeight * 2 / 10000 / 2.8);
  const pose = context.composeFollowView(frame, mapped, width / height);
  const camera = new THREE.PerspectiveCamera(42, width / height, .2, 1200);
  camera.position.copy(pose.position); camera.lookAt(pose.focus.x, pose.focus.y, pose.focus.z); camera.updateMatrixWorld(true);
  const target = context.intendedLanding(frame);
  const viewAzimuth = Math.atan2(pose.position.x - mapped.x, pose.position.z - mapped.z) - model.group.rotation.y;
  model.animate(Object.freeze({ ...p, targetDx: target ? target.x + target.width / 2 - p.x : 0, targetDy: target ? target.y + target.height - p.y : 0 }), dt, 0, Object.freeze({ reducedMotion, viewAzimuth }));
  model.group.updateMatrixWorld(true);
  return { camera, pose, viewAzimuth };
}

function projectedBounds(points, camera, width, height, THREE) {
  return new THREE.Box3().setFromPoints(points.map(point => {
    const projected = point.clone().project(camera);
    return new THREE.Vector3((projected.x + 1) * width / 2, (1 - projected.y) * height / 2, projected.z);
  }));
}

function visibleHandFraction(model, name, points, camera, THREE) {
  model.group.updateMatrixWorld(true);
  model.group.traverse(mesh => { if (mesh.isSkinnedMesh) mesh.computeBoundingSphere(); });
  const ray = new THREE.Raycaster(); let seen = 0, samples = 0;
  for (let index = 0; index < points.length; index += Math.max(1, Math.floor(points.length / 12))) {
    ray.set(camera.position, points[index].clone().sub(camera.position).normalize());
    const hit = ray.intersectObject(model.group, true)[0]; samples++;
    if (!hit?.face) continue;
    const attributes = hit.object.geometry.attributes;
    const bone = hit.object.skeleton.bones[attributes.skinIndex.getX(hit.face.a)];
    if (bone?.name === name && attributes.position.getY(hit.face.a) < 1.1) seen++;
  }
  return seen / samples;
}

for (const kind of ['climber', 'sentinel', 'shooter', 'guardian']) {
  test(`${kind} keeps bounded material batches, valid rigid skinning and exact-once owned disposal`, async t => {
    const [api, THREE] = await loadCharacters();
    const model = kind === 'climber' ? api.createClimber() : api.createEnemy(kind);
    t.after(() => model.dispose());
    const meshes = [], geometries = new Set(), materials = new Set(), skeletons = new Set();
    model.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      assert.ok(mesh.isSkinnedMesh, 'authored detail uses articulated material batches');
      meshes.push(mesh); geometries.add(mesh.geometry); materials.add(mesh.material); skeletons.add(mesh.skeleton);
      const { position, normal, skinIndex, skinWeight } = mesh.geometry.attributes;
      assert.equal(position.count, normal.count);
      assert.equal(position.count, skinIndex.count);
      assert.equal(position.count, skinWeight.count);
      let invalidGeometry = 0, invalidNormals = 0, invalidWeights = 0, invalidBindings = 0;
      for (let vertex = 0; vertex < position.count; vertex++) {
        if (![position.getX(vertex), position.getY(vertex), position.getZ(vertex)].every(Number.isFinite)) invalidGeometry++;
        const normalLength = Math.hypot(normal.getX(vertex), normal.getY(vertex), normal.getZ(vertex));
        if (!Number.isFinite(normalLength) || Math.abs(normalLength - 1) >= 1e-4) invalidNormals++;
        let total = 0, influences = 0;
        for (let influence = 0; influence < 4; influence++) {
          const weight = skinWeight.getComponent(vertex, influence);
          const boneIndex = skinIndex.getComponent(vertex, influence);
          if (!Number.isFinite(weight) || weight < 0 || weight > 1) invalidWeights++;
          if (!Number.isInteger(boneIndex) || boneIndex < 0 || boneIndex >= mesh.skeleton.bones.length) invalidBindings++;
          total += weight; if (weight > 0) influences++;
        }
        if (Math.abs(total - 1) >= 1e-6 || influences !== 1) invalidWeights++;
      }
      assert.equal(invalidGeometry, 0, 'all shell/limb vertices are finite');
      assert.equal(invalidNormals, 0, 'all surface normals are finite and normalized');
      assert.equal(invalidWeights, 0, 'all panels have normalized, rigid one-joint weights');
      assert.equal(invalidBindings, 0, 'all skin indices bind valid bones');
    });
    assert.ok(meshes.length > 0 && meshes.length <= (kind === 'climber' ? 10 : 7), 'cast refinement retains the material draw budget');
    assert.equal(skeletons.size, 1, 'all material batches share one owned skeleton');
    assert.ok(meshes.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3, 0) < 26000, 'cast geometry stays near the measured 22–24k baseline');
    const skeleton = [...skeletons][0];
    assert.ok(skeleton.bones.length >= 10 && skeleton.bones.length <= 16, 'bounded articulated rig');
    const bounds = new THREE.Box3().setFromObject(model.group);
    assert.ok(Math.abs(bounds.min.y) < .025, 'native soles meet the origin');
    assert.ok(Math.abs(bounds.max.y - (kind === 'guardian' ? 5.6 : 2.8)) < .2, 'native model height respects host scaling');

    model.group.position.set(8, 11, -7); model.group.rotation.set(.12, -.6, .08); model.group.scale.set(1.2, .9, 1.1);
    const host = rootTransform(model.group);
    for (const reducedMotion of [false, true]) {
      for (const state of ['standing', 'airborne', 'dashing', 'hurt', 'dead']) {
        const snapshot = Object.freeze({ ...standing, state, vx: 3300, vy: state === 'airborne' ? 4500 : -3000, health: state === 'dead' ? 0 : 3, active: state !== 'dead', attacking: true, firing: true, telegraph: true });
        advance(model, snapshot, 4, Object.freeze({ reducedMotion }));
        assert.deepEqual(rootTransform(model.group), host, 'only the host moves/orients/scales the root');
        model.group.traverse(object => assert.ok([...object.position, ...object.quaternion, ...object.scale].every(Number.isFinite), 'finite animated transform'));
      }
    }

    // Material-batched meshes share a bone texture. Creating it explicitly
    // exercises the same owned resource that the WebGL renderer allocates.
    skeleton.computeBoneTexture();
    const resources = [...geometries, ...materials, skeleton.boneTexture];
    const disposalCounts = new Map(resources.map(resource => [resource, 0]));
    for (const resource of resources) resource.addEventListener('dispose', () => disposalCounts.set(resource, disposalCounts.get(resource) + 1));
    model.dispose(); model.dispose();
    for (const count of disposalCounts.values()) assert.equal(count, 1, 'every owned geometry/material/bone texture disposes exactly once');
    assert.equal(model.group.children.length, 0, 'retired cast detaches its render/rig graph');
    assert.doesNotThrow(() => model.animate(standing, 1 / 60, 0, {}));
    assert.deepEqual(rootTransform(model.group), host);
  });
}

test('climber attacks deform the rendered fist, preserve airborne legs and recover in both motion modes', async t => {
  const [api, THREE] = await loadCharacters();
  const model = api.createClimber(); t.after(() => model.dispose());
  for (const reducedMotion of [false, true]) {
    const options = Object.freeze({ reducedMotion });
    advance(model, standing, 20, options);
    const shoulder = joint(model, '1-shoulder'), elbow = joint(model, '1-elbow');
    const rest = shoulder.rotation.x, neutral = posedVertices(model, '1-elbow', THREE);
    advance(model, Object.freeze({ ...standing, attacking: true }), 5, options);
    assert.ok(shoulder.rotation.x < rest - 1, 'strike extends the shoulder');
    assert.ok(elbow.rotation.x > -.3, 'strike extends the elbow');
    const punching = posedVertices(model, '1-elbow', THREE);
    assert.ok(punching.some((point, index) => point.distanceTo(neutral[index]) > .25), 'bone animation moves actual skinned forearm/fist geometry');
    advance(model, standing, 24, options);
    assert.ok(Math.abs(shoulder.rotation.x - rest) < .01, 'punch returns to locomotion');

    const rising = Object.freeze({ ...standing, state: 'airborne', vy: 4000, targetDx: 50000, targetDy: 40000 });
    advance(model, rising, 1, options);
    const hip = joint(model, '-1-hip').rotation.x;
    assert.ok(shoulder.rotation.x < -1.8, 'one hand reaches clearly during ascent');
    assert.ok(joint(model, 'expressive-helmet').rotation.x < -.2, 'head attends to the higher target');
    advance(model, Object.freeze({ ...rising, attacking: true }), 4, options);
    assert.equal(joint(model, '-1-hip').rotation.x, hip, 'punch retains the real airborne leg pose');
    advance(model, Object.freeze({ ...rising, vy: -4000, targetDy: -40000, attacking: false }), 20, options);
    assert.ok(joint(model, 'expressive-helmet').rotation.x > .2, 'head attends to a lower landing');
    advance(model, standing, 1, options);
    assert.ok(joint(model, '-1-knee').rotation.x > .6, 'actual air-to-standing transition absorbs landing');
    advance(model, standing, 20, options);
    assert.ok(Math.abs(joint(model, '-1-knee').rotation.x) < .01, 'landing compression recovers');
  }
});

test('climber visor attends to the real destination and focuses on a strike without sticking after recovery', async t => {
  const [api, THREE] = await loadCharacters();
  const model = api.createClimber(); t.after(() => model.dispose());
  for (const reducedMotion of [false, true]) {
    const options = Object.freeze({ reducedMotion });
    advance(model, standing, 30, options);
    const eyes = [joint(model, 'left-eye'), joint(model, 'right-eye')];
    const neutral = eyes.map(eye => ({ x: eye.position.x, y: eye.position.y, scaleY: eye.scale.y }));
    const upward = Object.freeze({ ...standing, targetDx: 60000, targetDy: 70000 });
    advance(model, upward, 2, options);
    assert.ok(eyes.every((eye, index) => eye.position.x > neutral[index].x && eye.position.y > neutral[index].y), 'visor looks toward the supplied higher destination');
    const upwardVertices = posedVertices(model, 'left-eye', THREE);
    advance(model, Object.freeze({ ...standing, targetDx: -60000, targetDy: -70000 }), 2, options);
    assert.ok(eyes.every((eye, index) => eye.position.x < neutral[index].x && eye.position.y < neutral[index].y), 'visor follows a lower destination on the other side');
    const downwardVertices = posedVertices(model, 'left-eye', THREE);
    assert.ok(upwardVertices.some((point, index) => point.distanceTo(downwardVertices[index]) > .03), 'attention deforms the rendered face');
    advance(model, Object.freeze({ ...standing, attacking: true }), 5, options);
    assert.ok(eyes.every((eye, index) => eye.scale.y < neutral[index].scaleY * .8), 'actual attack has a focused expression');
    advance(model, standing, 30, options);
    for (const [index, eye] of eyes.entries()) {
      assert.equal(eye.position.x, neutral[index].x);
      assert.equal(eye.position.y, neutral[index].y);
      assert.equal(eye.scale.y, neutral[index].scaleY);
    }
  }
});

test('real leftward and rightward ascents expose a raised hand through the actual oblique follow camera', async t => {
  const [api, THREE] = await loadCharacters();
  const projection = await loadFollowView();
  const model = api.createClimber(); t.after(() => model.dispose());
  for (const frame of capturedAscents) for (const [width, height] of [[390, 844], [960, 600]]) for (const reducedMotion of [true, false]) {
    const before = JSON.stringify(frame);
    const { camera } = placeInFollowView(model, frame, width, height, projection, 1 / 60, reducedMotion);
    const candidates = [-1, 1].map(side => {
      const points = posedRegion(model, `${side}-elbow`, THREE, authored => authored.y < 1.1);
      const shoulder = joint(model, `${side}-shoulder`).getWorldPosition(new THREE.Vector3());
      return { side, points, shoulder, rise: new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()).y - shoulder.y };
    });
    const reach = candidates.sort((a, b) => b.rise - a.rise)[0];
    assert.ok(visibleHandFraction(model, `${reach.side}-elbow`, reach.points, camera, THREE) >= .6,
      `tick ${frame.tick}: the raised hand is not hidden by its own body at ${width}×${height}`);
    const hand = projectedBounds(reach.points, camera, width, height, THREE);
    const helmet = projectedBounds(posedRegion(model, 'expressive-helmet', THREE, () => true), camera, width, height, THREE);
    const pack = projectedBounds(posedRegion(model, 'articulated-body', THREE, authored => authored.z < -.28 && authored.y > 1.05), camera, width, height, THREE);
    const gap = (a, b) => Math.max(a.min.x - b.max.x, b.min.x - a.max.x, a.min.y - b.max.y, b.min.y - a.max.y);
    assert.ok(gap(hand, helmet) > 2 && gap(hand, pack) > 2, 'reach has actual negative space from helmet and pack');
    assert.ok(reach.rise > .35, 'the visible hand reaches clearly above the shoulder');
    assert.equal(JSON.stringify(frame), before, 'camera and pose leave the captured authority facts unchanged');
  }
});

test('sentinel and guardian guards separate their maul heads from the gripping hands', async t => {
  const [api, THREE] = await loadCharacters();
  for (const kind of ['sentinel', 'guardian']) {
    const model = api.createEnemy(kind); t.after(() => model.dispose());
    const nativeScale = kind === 'guardian' ? 2 : 1;
    for (const reducedMotion of [false, true]) {
    advance(model, standing, 40, Object.freeze({ reducedMotion }));
    // The only emissive part on this forearm is the maul's inset striking head.
    // The lower authored forearm region contains the glove and proximal grip.
    const head = new THREE.Box3().setFromPoints(posedRegion(model, '1-elbow', THREE, (authored, material) => material.emissiveIntensity > 0));
    const hand = new THREE.Box3().setFromPoints(posedRegion(model, '1-elbow', THREE, (authored, material) => authored.y < 1.1 * nativeScale && authored.z < .3 * nativeScale && material.emissiveIntensity === 0));
    assert.ok((head.min.y - hand.max.y) / nativeScale > .24, `${kind}: a readable length of shaft separates the held head from the glove`);
    const guard = joint(model, '1-shoulder').quaternion.clone();
    advance(model, standing, 40, Object.freeze({ reducedMotion }));
    assert.ok(guard.angleTo(joint(model, '1-shoulder').quaternion) < 1e-6, 'an idle guard does not invent an attack');
    }
  }
});

test('the real 118-to-119 attack edge exposes its fist at 100ms and returns by 300ms', async t => {
  const [api, THREE] = await loadCharacters(), projection = await loadFollowView();
  const model = api.createClimber(); t.after(() => model.dispose());
  const frame = tick => ({ tick, lifecycle: 'running', worldWidth: 480000, chunkBaseY: 0,
    player: { x: tick === 118 ? 169900 : 160900, y: 124000, vx: -9000, vy: 0, halfWidth: 9000, halfHeight: 14000, facing: -1, health: 5, maxHealth: 5, state: 'standing', attacking: tick === 119 },
    intent: { mode: tick === 118 ? 'air-control' : 'engaging-enemy', targetPlatformId: 'f0:p2' },
    platforms: [{ id: 'f0:p2', kind: 'oneway', x: 38030, y: 100000, width: 135000, height: 10000 }],
    enemies: [{ id: 'f0:enemy:0', kind: 'sentinel', x: tick === 118 ? 122630 : 123830, y: 122000, halfWidth: 9000, halfHeight: 12000, health: tick === 118 ? 3 : 2, active: true, telegraph: false }],
    hazards: [{ id: 'f0:h0', kind: 'spikes', x: 265483, y: 62000, width: 32000, height: 9000, active: true }], projectiles: [] });
  for (const reducedMotion of [true, false]) {
    const before = frame(118), attack = frame(119);
    for (let i = 0; i < 20; i++) placeInFollowView(model, before, 960, 600, projection, 1 / 60, reducedMotion);
    // Production scene may pass a .5s step after a held callback. The shipped
    // model wrapper caps that at .1s, so ONE such callback samples extension.
    const { camera } = placeInFollowView(model, attack, 960, 600, projection, .5, reducedMotion);
    const fist = posedRegion(model, '1-elbow', THREE, authored => authored.y < 1.1);
    assert.ok(visibleHandFraction(model, '1-elbow', fist, camera, THREE) >= .6, 'the true 100ms fist is visible in the actual encounter view');
    const fistView = projectedBounds(fist, camera, 960, 600, THREE);
    const torso = projectedBounds(posedRegion(model, 'articulated-body', THREE, authored => authored.y > 1.05 && authored.y < 1.9 && authored.z > -.28), camera, 960, 600, THREE);
    assert.ok(torso.min.x - fistView.max.x > 2, 'the visible fist projects ahead of the torso toward the real sentinel');
    const peakY = new THREE.Box3().setFromPoints(fist).getCenter(new THREE.Vector3()).y;
    placeInFollowView(model, attack, 960, 600, projection, .5, reducedMotion);
    placeInFollowView(model, attack, 960, 600, projection, .5, reducedMotion);
    const returned = posedRegion(model, '1-elbow', THREE, authored => authored.y < 1.1);
    assert.ok(new THREE.Box3().setFromPoints(returned).getCenter(new THREE.Vector3()).y < peakY - .35, 'holding the true attack flag does not hold a fake permanent strike');
  }
});

test('enemy damage reacts once to an authoritative health loss and preserves root ownership', async t => {
  const [api, THREE] = await loadCharacters();
  for (const kind of ['sentinel', 'shooter', 'guardian']) {
    const model = api.createEnemy(kind); t.after(() => model.dispose());
    model.group.position.set(7, 2, -4); model.group.rotation.y = .7; model.group.scale.setScalar(.85);
    const host = rootTransform(model.group);
    for (const reducedMotion of [false, true]) {
      const options = Object.freeze({ reducedMotion });
      advance(model, standing, 40, options);
      const head = joint(model, 'armored-head'), rig = joint(model, 'articulated-enemy');
      const rest = [...head.quaternion, ...rig.quaternion];
      const beforeHit = posedVertices(model, 'armored-head', THREE);
      // Enemy snapshots carry health, rather than a presentation-owned hurt flag.
      const damaged = Object.freeze({ ...standing, health: 4 });
      advance(model, damaged, 1, options);
      const afterHit = posedVertices(model, 'armored-head', THREE);
      assert.ok(afterHit.some((point, index) => point.distanceTo(beforeHit[index]) > .04), `${kind} visibly recoils from the actual health edge`);
      assert.deepEqual(rootTransform(model.group), host, 'damage never moves the collision-owned root');
      advance(model, damaged, 45, options);
      const recovered = [...head.quaternion, ...rig.quaternion];
      recovered.forEach((value, index) => assert.ok(Math.abs(value - rest[index]) < .001, 'unchanged low health does not replay a hurt animation'));
      advance(model, Object.freeze({ ...damaged, state: 'hurt' }), 1, options);
      assert.ok(Math.abs(head.rotation.z) > .1, 'an explicit hurt state also remains readable');
      advance(model, damaged, 45, options);
      assert.ok(Math.abs(head.rotation.z) < .01, 'hurt state clears when the actor recovers');
    }
  }
});

test('enemy telegraph, firing and defeat poses remain distinct and reset for active state', async t => {
  const [api] = await loadCharacters();
  for (const kind of ['sentinel', 'shooter', 'guardian']) {
    const model = api.createEnemy(kind); t.after(() => model.dispose());
    for (const reducedMotion of [false, true]) {
      const options = Object.freeze({ reducedMotion });
      advance(model, standing, 40, options);
      const arm = joint(model, '1-shoulder'), rig = joint(model, 'articulated-enemy');
      const rest = arm.rotation.x;
      advance(model, Object.freeze({ ...standing, telegraph: true }), 20, options);
      assert.ok(Math.abs(arm.rotation.x - rest) > .15, `${kind} anticipates its attack`);
      advance(model, standing, 40, options);
      advance(model, Object.freeze({ ...standing, firing: true }), 1, options);
      assert.ok(Math.abs(arm.rotation.x - rest) > .08, `${kind} responds to an actual attack edge`);
      advance(model, standing, 40, options);
      assert.ok(Math.abs(arm.rotation.x - rest) < .01, `${kind} firing pose recovers`);
      const materials = new Map();
      model.group.traverse(mesh => { if (mesh.isMesh) materials.set(mesh.material, mesh.material.color.clone()); });
      advance(model, Object.freeze({ ...standing, state: 'dead', health: 0, active: false }), 30, options);
      assert.ok(Math.abs(rig.rotation.z) > 1, 'defeat changes the full silhouette');
      assert.ok([...materials].some(([material, color]) => material.color.r < color.r * .85), 'defeat dims the cast');
      advance(model, standing, 40, options);
      assert.ok(Math.abs(rig.rotation.z) < .01, 'active state clears collapse');
      for (const [material, color] of materials) assert.ok(Math.hypot(material.color.r - color.r, material.color.g - color.g, material.color.b - color.b) < 1e-6, 'active state restores material colors');
    }
  }
});


test('guardian crouches its rendered crown below the upper cap and restores full-height profile in open air', async t => {
  const [api, THREE] = await loadCharacters();
  const model = api.createEnemy('guardian'); t.after(() => model.dispose());
  model.group.scale.setScalar(3.6 / 5.6);
  const head = joint(model, 'armored-head');
  const enclosed = Object.freeze({ ...standing, halfHeight: 18000, canopyClearance: 3.28 });
  const open = Object.freeze({ ...enclosed, canopyClearance: Infinity });
  for (const reducedMotion of [true, false]) {
    const options = Object.freeze({ reducedMotion });
    for (let frame = 0; frame < 45; frame++) model.animate(enclosed, 1 / 60, frame / 60, options);
    const crown = posedRegion(model, 'armored-head', THREE, () => true);
    const highest = Math.max(...crown.map(point => point.y));
    assert.ok(highest < 3.25, 'the guardian skinned crest must clear the 3.28-unit visible cap underside: ' + highest);
    assert.ok(head.position.y < 2.04, 'the head has visibly crouched without moving the authoritative root');
    for (let frame = 0; frame < 45; frame++) model.animate(open, 1 / 60, frame / 60, options);
    assert.ok(Math.abs(head.position.y - 2.27) < .002, 'guardian opens its original tall silhouette away from the cap');
  }
});

test('a real strike displays a skinned contact pose after a 500ms frame gap, then clears obsolete recovery', async t => {
  const [api, THREE] = await loadCharacters();
  for (const reducedMotion of [false, true]) {
    const model = api.createClimber(); t.after(() => model.dispose());
    const options = Object.freeze({ reducedMotion });
    model.animate(standing, 1 / 60, 0, options);
    const shoulder = joint(model, '1-shoulder');
    const restAngle = shoulder.rotation.x;
    const idleFist = posedVertices(model, '1-elbow', THREE);
    const initialRoot = rootTransform(model.group);
    model.animate(Object.freeze({ ...standing, attacking: true }), .5, .5, options);
    assert.ok(shoulder.rotation.x < -1.25,
      'the first genuine attack snapshot must display an extended arm even when rendering was stalled');
    const strikeFist = posedVertices(model, '1-elbow', THREE);
    assert.ok(strikeFist.some((point, index) => point.distanceTo(idleFist[index]) > .35),
      'the rendered skinned fist, not just an indicator, conveys the action');
    assert.deepEqual(rootTransform(model.group), initialRoot,
      'presentation cannot move the authoritative player root');
    model.animate(standing, .5, 1, options);
    assert.ok(Math.abs(shoulder.rotation.x - restAngle) < .01,
      'stalled rendering must not leave an obsolete attack pose latched');
    model.animate(Object.freeze({ ...standing, state: 'dead', health: 0, attacking: true }), .5, 1.5, options);
    assert.ok(shoulder.rotation.x > -1.25, 'death overrides any buffered attack pose');
  }
});

test('normal-cadence attacks retain their existing recoil and recovery timeline', async t => {
  const [api] = await loadCharacters();
  const model = api.createClimber(); t.after(() => model.dispose());
  const shoulder = joint(model, '1-shoulder');
  model.animate(standing, 1 / 60, 0, {});
  const neutral = shoulder.rotation.x;
  model.animate(Object.freeze({ ...standing, attacking: true }), 1 / 60, 1 / 60, {});
  model.animate(standing, 1 / 60, 2 / 60, {});
  const earlyRecovery = shoulder.rotation.x;
  assert.ok(Math.abs(earlyRecovery - neutral) > .025,
    'real-time frames still display the anticipation/strike after the attack flag falls');
  for (let i = 3; i < 25; i++) model.animate(standing, 1 / 60, i / 60, {});
  assert.ok(Math.abs(shoulder.rotation.x - neutral) < .01,
    'normal cadence still returns the shoulder to its actual locomotion pose');
});
