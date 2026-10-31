'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');
const ROOT = path.resolve(__dirname, '../..');
const loaded = (async () => {
  const THREE = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const context = { THREE, ...coordinates };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  return { THREE, ...coordinates, context };
})();
function snapshot() {
  return { chunkBaseY: 360000, worldWidth: 480000, platforms: [
    { id: 'current', x: 38030, y: 460000, width: 135000, height: 10000 },
    { id: 'next', x: 267422, y: 510000, width: 125000, height: 10000 },
  ] };
}

test('landing beacon is a bounded double-chevron rather than another collectible or platform', async () => {
  const { THREE, context } = await loaded;
  assert.equal(typeof context.createLandingBeaconGeometry, 'function', 'the selected deck needs a distinct elevated navigation glyph');
  const geometry = context.createLandingBeaconGeometry();
  const positions = geometry.attributes.position, colors = geometry.attributes.color;
  assert.equal(positions.count, 32, 'two outlined chevrons use one fixed 32-vertex buffer');
  assert.equal(geometry.index.count, 48, 'navigation adds exactly sixteen triangles');
  for (let i = 0; i < positions.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(positions, i);
    assert.ok([p.x, p.y, p.z].every(Number.isFinite));
    assert.ok(Math.abs(p.x) <= 1.1 && p.y >= 0 && p.y <= 2.1);
  }
  const luminances = Array.from({ length: colors.count }, (_, i) => colors.getX(i)*.2126 + colors.getY(i)*.7152 + colors.getZ(i)*.0722);
  assert.ok(Math.max(...luminances) / Math.min(...luminances) > 10, 'intrinsic light/dark outline survives pale and dark biomes');
  geometry.dispose();
});

test('one landing beacon follows effective moving-deck positions and clears stale intentions', async () => {
  const { THREE, pointFor, context } = await loaded;
  assert.equal(typeof context.updateLandingBeacon, 'function');
  const beacon = new THREE.Mesh(), camera = new THREE.PerspectiveCamera();
  camera.rotation.set(.1, -.6, 0);
  const frame = snapshot(), original = JSON.stringify(frame);
  for (const offset of [0, 12000, -9000]) {
    const platform = { ...frame.platforms[1], x: frame.platforms[1].x + offset, width: offset ? 1000 : 125000 };
    const expected = pointFor(platform.x + platform.width/2, platform.y + platform.height, frame.chunkBaseY, frame.worldWidth, 27.24);
    context.updateLandingBeacon(beacon, platform, frame, camera);
    assert.equal(beacon.visible, true);
    assert.equal(beacon.userData.targetPlatformId, platform.id);
    assert.ok(Math.abs(beacon.position.x-expected.x)<1e-8 && Math.abs(beacon.position.z-expected.z)<1e-8);
    assert.ok(Math.abs(beacon.position.y-expected.y-.65)<1e-8, 'glyph points to a real surface without inventing collision geometry');
    assert.ok(beacon.quaternion.equals(camera.quaternion), 'glyph stays readable from both oblique views');
  }
  context.updateLandingBeacon(beacon, null, frame, camera);
  assert.equal(beacon.visible, false); assert.equal(beacon.userData.targetPlatformId, null);
  assert.equal(JSON.stringify(frame), original, 'never mutates public state');
});
