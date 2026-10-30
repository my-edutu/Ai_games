'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
    assert.ok(meshes.length > 0 && meshes.length <= 16, 'material batching prevents a draw per armor detail');
    assert.equal(skeletons.size, 1, 'all material batches share one owned skeleton');
    assert.ok(meshes.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3, 0) < 50000, 'bounded cast geometry');
    const skeleton = [...skeletons][0];
    assert.ok(skeleton.bones.length >= 10 && skeleton.bones.length <= 32, 'bounded articulated rig');
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
