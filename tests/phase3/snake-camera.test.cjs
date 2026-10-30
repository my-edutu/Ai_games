'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
let THREE;
const load = () => import('../../public/snake-stream/camera.mjs');

function cameraFor(plan, aspect) {
  const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 240);
  camera.position.set(plan.target.x + plan.offset.x, plan.target.y + plan.offset.y, plan.target.z + plan.offset.z);
  camera.lookAt(new THREE.Vector3(plan.target.x, plan.target.y, plan.target.z));
  camera.updateMatrixWorld();
  return camera;
}

test('overview keeps every board corner visible in landscape and uses portrait height', async () => {
  THREE = await import('three');
  const { cameraComposition } = await load();
  for (const aspect of [16 / 9, 368 / 598]) {
    const plan = cameraComposition({ width: 28, height: 16, aspect });
    const camera = cameraFor(plan, aspect);
    const corners = [-14, 14].flatMap(x => [-8, 8].map(z => new THREE.Vector3(x, 0, z).project(camera)));
    for (const point of corners) {
      assert.ok(Math.abs(point.x) < 0.94 && Math.abs(point.y) < 0.94, 'whole board must fit without clipping');
    }
    if (aspect < 1) assert.ok(Math.max(...corners.map(p => p.y)) - Math.min(...corners.map(p => p.y)) > 1, 'portrait board should occupy at least half the stage height');
  }
});

test('character framing centers the moving head in each direction and exposes facial detail', async () => {
  THREE = await import('three');
  const { cameraComposition } = await load();
  for (const direction of [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }]) {
    const plan = cameraComposition({ width: 28, height: 16, aspect: 16 / 9, mode: 'detail', head: { x: 10, z: -5 }, direction });
    const camera = cameraFor(plan, 16 / 9);
    const head = new THREE.Vector3(10, 0.4, -5).project(camera);
    assert.ok(Math.abs(head.x) < 0.01 && Math.abs(head.y) < 0.01);
    const diameterPixels = 0.66 * 900 / (2 * Math.tan(Math.PI / 10) * Math.hypot(plan.offset.x, plan.offset.y, plan.offset.z));
    assert.ok(diameterPixels >= 200, 'facial model needs enough pixels to judge at 900px stage height');
  }
});
