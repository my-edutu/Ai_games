'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

function lowestHeadPoint(THREE, serpent) {
  serpent.group.updateMatrixWorld(true);
  let bottom = Infinity;
  const point = new THREE.Vector3();
  const instanceLocal = new THREE.Matrix4();
  const instanceWorld = new THREE.Matrix4();
  serpent.group.getObjectByName('Expressive head').traverseVisible(mesh => {
    if (!mesh.isMesh) return;
    const p = mesh.geometry.attributes.position;
    // An InstancedMesh's geometry is a shared unit sphere. Its visible vertex
    // positions include the per-instance matrix before mesh.matrixWorld.
    // Checking only mesh.matrixWorld treats all batches as giant unscaled balls
    // at their parent origin and falsely reports underground eye highlights.
    const instances = mesh.isInstancedMesh ? mesh.count : 1;
    for (let instance = 0; instance < instances; instance++) {
      if (mesh.isInstancedMesh) {
        mesh.getMatrixAt(instance, instanceLocal);
        instanceWorld.multiplyMatrices(mesh.matrixWorld, instanceLocal);
      } else instanceWorld.copy(mesh.matrixWorld);
      for (let i = 0; i < p.count; i++) {
        point.fromBufferAttribute(p, i).applyMatrix4(instanceWorld);
        bottom = Math.min(bottom, point.y);
      }
    }
  });
  return bottom;
}

function bodyRingBottoms(serpent, detail) {
  const p = serpent.group.getObjectByName('Continuous sculpted serpent body').geometry.attributes.position;
  const stride = detail === 'low' ? 9 : 21;
  const bottoms = [];
  for (let r = 0; r < serpent.stats().bodyRings; r++) {
    let y = Infinity, z = 0;
    for (let k = 0; k < stride; k++) { y = Math.min(y, p.getY(r * stride + k)); z += p.getZ(r * stride + k) / stride; }
    if (z < -1) bottoms.push(y); // The buried head-end is not a ground-contact surface.
  }
  return bottoms;
}

test('body and tapered tail follow the floor instead of levitating above it', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const paths = [Array.from({ length: 9 }, (_, i) => ({ x: 0, z: -i }))];
  const original = JSON.stringify(paths);
  try {
    for (const detail of ['high', 'low']) {
      serpent.update(paths, { detail, reducedMotion: true, direction: { x: 0, z: 1 } });
      const bottoms = bodyRingBottoms(serpent, detail);
      assert.ok(bottoms.length > 12);
      for (const y of bottoms) assert.ok(y >= .01 && y <= .05, `belly-to-floor gap ${y} must stay within .01–.05 units, including the tapered tail`);
      const headBottom = lowestHeadPoint(THREE, serpent);
      assert.ok(headBottom >= .005 && headBottom <= .06, `head/neck needs convincing contact, got ${headBottom}`);
    }
    assert.equal(JSON.stringify(paths), original, 'grounding must not rewrite the public path');
  } finally { serpent.dispose(); }
});

test('eating, danger, turning and blinking never push the grounded model through the floor', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const paths = [Array.from({ length: 9 }, (_, i) => ({ x: 0, z: -i }))];
  try {
    const before = serpent.stats();
    for (let n = 0; n < 48; n++) {
      const detail = n % 2 ? 'high' : 'low';
      const angle = n * .47;
      serpent.update(paths, { detail, time: n * .19, delta: 1 / 60,
        eating: n % 7 / 6, danger: n % 3 / 2, direction: { x: Math.sin(angle), z: Math.cos(angle) } });
      assert.ok(lowestHeadPoint(THREE, serpent) >= 0, 'head intersects the stone surface during its pose');
      for (const y of bodyRingBottoms(serpent, detail)) assert.ok(y >= .01 && y <= .05, `animated belly gap ${y} lost floor contact`);
    }
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes']) assert.equal(serpent.stats()[key], before[key]);
  } finally { serpent.dispose(); }
});

test('an isolated portal tail stays grounded without joining the remote body', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  try {
    for (const detail of ['high', 'low']) {
      serpent.update([[{ x: 0, z: 0 }, { x: 0, z: 1 }], [{ x: 8, z: -5 }]],
        { detail, reducedMotion: true, direction: { x: 0, z: -1 } });
      const bottoms = bodyRingBottoms(serpent, detail);
      assert.equal(bottoms.length, 3, 'singleton portal tail retains its three capped rings');
      for (const y of bottoms) assert.ok(y >= .01 && y <= .05, `isolated tail gap ${y} is not grounded`);
      const body = serpent.group.getObjectByName('Continuous sculpted serpent body').geometry;
      const point = new THREE.Vector3(), previous = new THREE.Vector3();
      for (let n = 0; n < body.drawRange.count; n += 3) {
        previous.fromBufferAttribute(body.attributes.position, body.index.getX(n));
        for (let k = 1; k < 3; k++) {
          point.fromBufferAttribute(body.attributes.position, body.index.getX(n + k));
          assert.ok(point.distanceTo(previous) < 2, 'grounding bridged the portal discontinuity');
        }
      }
    }
  } finally { serpent.dispose(); }
});
