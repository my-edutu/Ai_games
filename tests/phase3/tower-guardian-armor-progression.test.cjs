'use strict';
// This checks a real skinned Three.js guardian, not a promotional render.
// Fixed-step HP remains the sole authority for its visible armor-opening.
// Passing these safety contracts is NOT a Gauntlet visual quality judgment.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const characters = fs.readFileSync(path.join(root,
  'public/infinite-tower-climb/visuals/characters.mjs'), 'utf8');
const threeUrl = pathToFileURL(path.join(root,
  'node_modules/three/build/three.module.js')).href;
const adapted = characters.replace("'/tower/vendor/three.module.js'", JSON.stringify(threeUrl));
assert.notEqual(adapted, characters, 'load actual shipped module with its local Three.js provider');
const loaded = Promise.all([
  import('data:text/javascript;base64,' + Buffer.from(adapted).toString('base64')),
  import(threeUrl),
]);
const frame = (health, maxHealth = 8) => Object.freeze({
  health, maxHealth, active: health > 0, state: 'standing',
  vx: 0, vy: 0, telegraph: false, firing: false,
  halfHeight: 18000, canopyClearance: 4.5,
});
function bone(model, name) {
  const result = model.group.getObjectByName(name);
  assert.ok(result?.isBone, name + ' must be an actual skinned joint');
  return result;
}
function pose(model, state, reducedMotion = false, steps = 45) {
  for (let i = 0; i < steps; i++)
    model.animate(state, 1 / 60, i / 60, { reducedMotion });
}
function vertices(model, name, THREE) {
  model.group.updateMatrixWorld(true);
  const target = bone(model, name), output = [];
  model.group.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    const joint = mesh.skeleton.bones.indexOf(target);
    const bindings = mesh.geometry.attributes.skinIndex;
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count && output.length < 20; i++) {
      if (bindings.getX(i) !== joint) continue;
      const p = new THREE.Vector3().fromBufferAttribute(positions, i);
      output.push(mesh.applyBoneTransform(i, p).applyMatrix4(mesh.matrixWorld));
    }
  });
  assert.ok(output.length >= 10, 'moving original shoulder armor has skinned vertices');
  return output;
}

test('the real guardian peels both heavy shoulder shells as actual HP also powers its gate', async t => {
  const [api, THREE] = await loaded;
  const model = api.createEnemy('guardian'); t.after(() => model.dispose());
  const safe = frame(8);
  const baseline = JSON.stringify(safe), host = [...model.group.position, ...model.group.quaternion, ...model.group.scale];
  pose(model, safe);
  const left = bone(model, 'guardian-armor-seal--1');
  const right = bone(model, 'guardian-armor-seal-1');
  const points = vertices(model, 'guardian-armor-seal--1', THREE);
  assert.ok(Math.abs(left.rotation.z-.1) < .001);
  assert.ok(Math.abs(right.rotation.z+.1) < .001);
  const wounded = frame(2);
  pose(model, wounded);
  assert.ok(left.rotation.z > .48 && right.rotation.z < -.48,
    'severe authentic guardian attrition must visibly peel both plated shoulders');
  assert.ok(left.position.x < -.15 && right.position.x > .15,
    'opened armor exposes a physical underplate, not a flat blinking HUD');
  const exposed = vertices(model, 'guardian-armor-seal--1', THREE);
  assert.ok(exposed.some((point, i) => point.distanceTo(points[i]) > .22),
    'actual GPU-skinned geometry changes shape across the HP-linked encounter');
  assert.equal(JSON.stringify(safe), baseline, 'the renderer must not mutate source HP');
  assert.equal(JSON.stringify(wounded), JSON.stringify(frame(2)));
  assert.deepEqual([...model.group.position, ...model.group.quaternion, ...model.group.scale], host,
    'presentation does not displace authoritative enemy root');
  pose(model, safe);
  assert.ok(Math.abs(left.rotation.z-.1) < .002 && Math.abs(right.rotation.z+.1) < .002,
    'source recovery/restore must physically close the armor on the same model');
  const restored = vertices(model, 'guardian-armor-seal--1', THREE);
  assert.ok(restored.every((point, i) => point.distanceTo(points[i]) < .006),
    'source rewind cannot leave a detached ghost shoulder');
  const skinned = []; model.group.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
  assert.ok(skinned.length > 0 && skinned.length <= 7, 'same material batches, not a draw per armor part');
  assert.ok(skinned[0].skeleton.bones.length <= 16, 'rig fits the existing bounded skin budget');
});

test('reduced-motion retains source-truthful injury shape without a flash or fake hit event', async t => {
  const [api, THREE] = await loaded;
  const model = api.createEnemy('guardian'); t.after(() => model.dispose());
  const left = bone(model, 'guardian-armor-seal--1');
  pose(model, frame(8), true, 1);
  assert.ok(Math.abs(left.rotation.z-.1) < 1e-10);
  pose(model, frame(2), true, 1);
  assert.ok(left.rotation.z > .5, 'one reduced-motion frame reveals authoritative attrition');
  const after = vertices(model, 'guardian-armor-seal--1', THREE);
  assert.ok(after.every(p => [p.x,p.y,p.z].every(Number.isFinite)));
  pose(model, frame(8), true, 1);
  assert.ok(Math.abs(left.rotation.z-.1) < 1e-10, 'full-health replay restores closed geometry immediately');
});
