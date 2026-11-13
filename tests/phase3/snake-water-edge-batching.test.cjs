'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('live water-edge decoration uses two draw objects without losing a vertex or a cue', async () => {
  const THREE = await import('three');
  const { createWorld, bakeWaterEdgeGeometry, buildNativeFourShoreWaterfallGeometry } = await import('../../public/snake-stream/world.mjs');
  assert.equal(typeof bakeWaterEdgeGeometry, 'function');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    const W = width / 2, H = height / 2;
    const sources = [
      { name: 'Baked live foam contours', count: 6, shape: new THREE.TorusGeometry(1, .025, 3, 28),
        matrix: i => {
          const obj = new THREE.Object3D();
          obj.position.set((i < 3 ? -1 : 1) * (W + 1.4), -3.59, (i % 3 - 1) * height * .32);
          obj.rotation.x = -Math.PI / 2; obj.scale.set(1.4 + (i % 3) * .2, .7, 1);
          obj.updateMatrix(); return obj.matrix;
        } },

    ];
    try {
      const before = world.stats();
      assert.ok(before.drawObjects <= 33, 'eight former live objects should now be just two');
      for (const item of sources) {
        const mesh = world.group.getObjectByName(item.name);
        assert.ok(mesh?.isMesh, item.name);
        assert.equal(mesh.parent, world.group, 'single live-layer mesh, not cached scenery');
        assert.equal(mesh.userData.staticWorld, undefined);
        assert.equal(mesh.userData.cachedProp, undefined);
        assert.equal(mesh.material.transparent, true);
        assert.equal(mesh.material.depthWrite, false);
        const baked = mesh.geometry, reference = item.shape;
        assert.equal(baked.attributes.position.count, item.count * reference.attributes.position.count);
        assert.equal(baked.index.count, item.count * reference.index.count);
        for (let i = 0; i < item.count; i++) {
          const expected = reference.clone().applyMatrix4(item.matrix(i));
          const offset = i * reference.attributes.position.count;
          const faceOffset = i * reference.index.count;
          for (const name of ['position', 'normal', 'uv']) {
            const a = baked.getAttribute(name), b = expected.getAttribute(name);
            for (let v = 0; v < b.count; v++) {
              for (let c = 0; c < b.itemSize; c++) {
                assert.ok(Math.abs(a.array[(offset + v) * a.itemSize + c] - b.array[v * b.itemSize + c]) < 1e-5,
                  `${item.name} copy ${i} ${name} vertex ${v} channel ${c}`);
              }
            }
          }
          for (let v = 0; v < reference.index.count; v++) {
            assert.equal(baked.index.getX(faceOffset + v), offset + reference.index.getX(v));
          }
          expected.dispose();
        }
      }
      // The old two unsupported flat panels have been rebuilt into FOUR
      // shore-connected multi-course cataracts in the SAME waterfall mesh.
      // Preserve the historical one-draw lifecycle/resource assertions and
      // make the geometry assertion stronger than the old two-panel test:
      // compare EVERY actual vertex, UV, normal and index to the independent
      // source-native physical course builder on all three board sizes.
      const falls=world.group.getObjectByName('Baked live edge falls');
      assert.ok(falls?.isMesh);
      assert.equal(falls.parent,world.group);
      assert.equal(falls.userData.staticWorld,undefined);
      assert.equal(falls.material.transparent,true);
      assert.equal(falls.material.depthWrite,false);
      const expectedFalls=buildNativeFourShoreWaterfallGeometry(THREE,width,height);
      for(const name of ['position','uv','normal']){
        const actual=falls.geometry.getAttribute(name),reference=expectedFalls.getAttribute(name);
        assert.equal(actual.count,reference.count);
        for(let v=0;v<reference.array.length;v++)
          assert.ok(Math.abs(actual.array[v]-reference.array[v])<1e-5,`four falls real ${name} byte ${v}`);
      }
      assert.deepEqual(Array.from(falls.geometry.index.array),Array.from(expectedFalls.index.array));
      expectedFalls.dispose();
      const water = world.group.getObjectByName('Flowing water');
      assert.ok(water?.material.uniforms.waterField.value);
      assert.equal(falls.material.map,water.material.uniforms.waterField.value,'same original water texture, no new texture resource');
      const publicFrame = Object.freeze({obstacles:Object.freeze([]),portals:Object.freeze([]),hazards:Object.freeze([]),food:null});
      world.update(publicFrame, {time:3.5,reducedMotion:false});
      assert.equal(water.material.uniforms.time.value, 3.5);
      assert.ok(falls.material.map.offset.y>0,'four true falls flow with the same public time');
      world.update(publicFrame, {time:9,reducedMotion:true});
      assert.equal(water.material.uniforms.time.value, 0);
      assert.equal(falls.material.map.offset.y,0,'reduced-motion suppresses waterfall animation');
      for (const key of ['drawObjects','staticMeshes','geometries','materials','textures']) {
        assert.equal(world.stats()[key], before[key], 'no repeated resources or invisible prop disappearance: '+key);
      }
    } finally {
      sources.forEach(item => item.shape.dispose());
      world.dispose();
    }
    assert.equal(world.group.children.length, 0);
  }
});
