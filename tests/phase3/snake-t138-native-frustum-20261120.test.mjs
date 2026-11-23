import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../../public/snake-stream/world.mjs';

function shot(position, target) {
  const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 180);
  camera.position.set(...position);
  camera.lookAt(...target);
  camera.updateMatrixWorld();
  return camera;
}

test('T4 original garden has genuinely fine visibility units across both close camera flanks while keeping the COMPLETE authored scene and sun shadow', () => {
  const world = createWorld(THREE, { width: 28, height: 16 });
  try {
    const meshes = world.group.children.filter(mesh => mesh.isMesh && mesh.userData.staticWorld);
    assert.equal(meshes.length, 13, 'do not split material batches into extra draw objects');
    const original = meshes.map(mesh => ({
      positions: mesh.geometry.attributes.position.array.slice(),
      normalCount: mesh.geometry.attributes.normal.count,
      indices: mesh.geometry.index.array.slice(),
      material: mesh.material,
    }));
    const full = original.reduce((sum, mesh) => sum + mesh.indices.length, 0);
    assert.ok(full > 250000, 'retain complete, nontrivial 3D garden, forest, ruin and coast');
    const checks = [
      // A tree-side shot currently draws much of the offscreen north and east banks.
      { position: [0, 6, -4], target: [0, 0, 0], maxRatio: 0.35 },
      // The east close follow shot previously submits distant western scenery.
      { position: [14, 5, -4], target: [9, 0, 0], maxRatio: 0.52 },
      { position: [0, 4, 10], target: [0, 1, 0], maxRatio: 0.72 },
    ];
    for (const { position, target, maxRatio } of checks) {
      const camera = shot(position, target);
      const result = world.updateStaticCameraVisibility(camera);
      assert.ok(result.drawnIndices <= full * maxRatio,
        `camera ${position}: ${result.drawnIndices}/${full} native indices, expected <=${maxRatio}`);
      assert.ok(result.testedBlocks > 300 && result.testedBlocks < 750,
        'bounded fine-grained visibility partitions, without new meshes');
      const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4()
        .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      for (const mesh of meshes) for (const block of mesh.userData.visibilityBlocks) {
        if (!frustum.intersectsBox(block.box)) continue;
        const range = mesh.geometry.drawRange;
        assert.ok(range.start <= block.start && range.start + range.count >= block.start + block.count,
          'never lose a frustum-visible triangle');
      }
    }
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i], previous = original[i];
      assert.equal(mesh.material, previous.material, 'no shading/material downgrades');
      assert.equal(mesh.geometry.attributes.normal.count, previous.normalCount);
      assert.deepEqual(mesh.geometry.index.array, previous.indices, 'do not delete or simplify authored triangles');
      assert.deepEqual(mesh.geometry.attributes.position.array, previous.positions, 'do not alter landscape');
      mesh.onBeforeShadow();
      assert.equal(mesh.geometry.drawRange.start, 0);
      assert.equal(mesh.geometry.drawRange.count, previous.indices.length,
        'every original sun caster must remain during genuine shadow rendering');
    }
    const overview = world.updateStaticCameraVisibility(shot([0, 36, 38], [0, 0, 0]));
    assert.ok(overview.drawnIndices > full * 0.99, 'full wide overview must keep complete island');
    const restored = world.updateStaticCameraVisibility(shot([0, 36, 38], [0, 0, 0]), { forceAll: true });
    assert.equal(restored.drawnIndices, full);
  } finally { world.dispose(); }
});
