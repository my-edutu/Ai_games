'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('facial micro-details preserve both ellipsoids with three fewer live draw objects', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const accents = [];
  const getMeshes = () => {
    const meshes = [];
    serpent.group.traverse(node => { if (node.isMesh) meshes.push(node); });
    return meshes;
  };
  const expectPose = (mesh, index, values) => {
    const actual = new THREE.Matrix4(), expected = new THREE.Matrix4();
    mesh.getMatrixAt(index, actual);
    expected.compose(
      new THREE.Vector3(...values.slice(0, 3)),
      new THREE.Quaternion(),
      new THREE.Vector3(...values.slice(3))
    );
    for (let component = 0; component < 16; component++) {
      assert.ok(Math.abs(actual.elements[component] - expected.elements[component]) < 1e-6,
        `${mesh.name} #${index} changed original ellipsoid transform at ${component}`);
    }
  };
  const nostrilPoses = [
    [-0.116, 0.081, 0.415, 0.018, 0.012, 0.010],
    [ 0.116, 0.081, 0.415, 0.018, 0.012, 0.010],
  ];
  const glintPoses = [
    [-0.017,  0.025, 0.027, 0.014, 0.017, 0.006],
    [ 0.017, -0.024, 0.027, 0.006, 0.007, 0.004],
  ];
  try {
    const meshes = getMeshes();
    assert.equal(meshes.length, 21, 'prior separate glints and nostrils used 24 mesh draw objects');
    serpent.group.traverse(node => {
      if (node.name === 'Paired recessed nostrils' || node.name === 'Paired eye catchlights') accents.push(node);
    });
    assert.equal(accents.filter(node => node.name === 'Paired recessed nostrils').length, 1);
    assert.equal(accents.filter(node => node.name === 'Paired eye catchlights').length, 2);
    for (const mesh of accents) {
      assert.equal(mesh.isInstancedMesh, true, 'must really batch the draw, not just group children');
      assert.equal(mesh.count, 2);
      assert.equal(mesh.material.transparent, false);
      const expected = mesh.name === 'Paired recessed nostrils' ? nostrilPoses : glintPoses;
      for (let i = 0; i < 2; i++) expectPose(mesh, i, expected[i]);
    }
    const high = accents.map(node => node.geometry);
    const paths = [[{x:5,z:5}, {x:4,z:5}, {x:3,z:5}, {x:2,z:5}], [{x:10,z:8}]];
    serpent.update(paths, {detail:'low',time:0,delta:1/60,direction:{x:1,z:0}});
    const low = accents.map(node => node.geometry);
    for (let i = 0; i < accents.length; i++)
      assert.notStrictEqual(low[i], high[i], 'low-detail instances must use the preallocated lower-poly sphere');
    const budget = serpent.stats();
    for (let i = 0; i < 120; i++) {
      const detail = i % 2 ? 'high' : 'low';
      serpent.update(paths, {detail, time:i/60, delta:1/60, direction:{x:1,z:0}, reducedMotion:i%7===0});
      for (let j = 0; j < accents.length; j++) {
        const mesh = accents[j];
        assert.strictEqual(mesh.geometry, detail === 'high' ? high[j] : low[j],
          'LODs must use preallocated shared accent geometry');
        const expected = mesh.name === 'Paired recessed nostrils' ? nostrilPoses : glintPoses;
        for (let k = 0; k < 2; k++) expectPose(mesh, k, expected[k]);
      }
      assert.equal(getMeshes().length, 21, 'no new live draw objects across expression frames');
      for (const key of ['geometries', 'materials', 'textures', 'bufferBytes'])
        assert.equal(serpent.stats()[key], budget[key], 'resource growth: '+key);
      assert.equal(serpent.stats().paths, 2, 'portal-separated body paths must remain separate');
    }
    const pupils = [];
    serpent.group.traverse(node => { if(node.name === 'Deep pupil') pupils.push(node); });
    assert.equal(pupils.length, 2, 'the original expressive pupils must remain separate');
    assert.equal(serpent.stats().truncated, false);
  } finally {
    serpent.dispose();
    serpent.dispose();
  }
  assert.equal(serpent.stats().disposed, true);
});
