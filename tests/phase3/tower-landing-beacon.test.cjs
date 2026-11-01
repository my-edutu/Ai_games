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

test('navigation glyph remains over the walking deck, rather than hanging beyond its outer rim', async () => {
  const { THREE, context } = await loaded;
  const deck = snapshot().platforms[1], frame = snapshot();
  const beacon = new THREE.Mesh(), camera = new THREE.PerspectiveCamera();
  // The landing top is a real annular strip: 22.4..27.18. Keep its marker
  // well within it, whether the camera uses the center or a nearer lane.
  const safeInner = 22.75, safeOuter = 26.85;
  for (const offset of [0, 12000, -9000]) {
    context.updateLandingBeacon(beacon, { ...deck, x: deck.x + offset }, frame, camera);
    const radius = Math.hypot(beacon.position.x, beacon.position.z);
    assert.ok(radius >= safeInner && radius <= safeOuter,
      `beacon is outside the usable landing band (radius ${radius})`);
  }
});

test('one landing beacon follows effective moving-deck positions and clears stale intentions', async () => {
  const { THREE, pointFor, context } = await loaded;
  assert.equal(typeof context.updateLandingBeacon, 'function');
  const beacon = new THREE.Mesh(), camera = new THREE.PerspectiveCamera();
  camera.rotation.set(.1, -.6, 0);
  const frame = snapshot(), original = JSON.stringify(frame);
  for (const offset of [0, 12000, -9000]) {
    const platform = { ...frame.platforms[1], x: frame.platforms[1].x + offset, width: offset ? 1000 : 125000 };
    const expected = pointFor(platform.x + platform.width/2, platform.y + platform.height, frame.chunkBaseY, frame.worldWidth, 26.5);
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


// Pinned to a real immutable host tick and the 960x600 GPU image in Tower
// Landing Evidence artifact 13031761634. At that moment the depth-tested
// chevron's right arm overlaps the foreground upright above x≈183; moving
// the entire marker off the deck to radius 27.24 would be a false fix.
test('desktop Ruins destination clears the observed upright without escaping the physical landing', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');
  const session = createSession('tower-stream-reference', undefined, 'historical-v1');
  for (let tick = 0; tick < 379; tick++) advance(session);
  const frame = session.controller.frame(960, 600, { reducedMotion: true, muted: true }).snapshot;
  assert.equal(frame.publicChecksum, 'cdb269d8', 'fixture must match the inspected GPU screenshot');
  const deck = frame.platforms.find(platform => platform.id === frame.intent.targetPlatformId);
  assert.equal(deck?.id, 'f1:p3');
  const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, frame.chunkBaseY, frame.worldWidth);
  const view = context.composeFollowView(frame, hero, 960 / 600);
  const camera = new THREE.PerspectiveCamera(42, 960 / 600, .2, 1200);
  camera.position.set(view.position.x, view.position.y, view.position.z);
  camera.lookAt(view.focus.x, view.focus.y, view.focus.z);
  camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
  const geometry = context.createLandingBeaconGeometry(), beacon = new THREE.Mesh(geometry);
  try {
    context.updateLandingBeacon(beacon, deck, frame, camera);
    const position = new THREE.Vector3();
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      position.fromBufferAttribute(geometry.attributes.position, i)
        .applyQuaternion(beacon.quaternion).add(beacon.position);
      const radius = Math.hypot(position.x, position.z);
      assert.ok(radius >= 22.4 && radius <= 27.18, 'glyph arm floats beyond deck at radius ' + radius);
      const pixelX = (position.clone().project(camera).x + 1) * 480;
      minX = Math.min(minX, pixelX); maxX = Math.max(maxX, pixelX);
    }
    assert.ok(minX >= 80 && maxX <= 183,
      'right arrow arm enters upright silhouette: screen span ' + minX.toFixed(1) + '..' + maxX.toFixed(1) + ' px');
  } finally { geometry.dispose(); }
});

test('both portrait traversal directions keep the complete destination glyph inside the view', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');
  for (const [tick, checksum] of [[379, 'cdb269d8'], [234, '7a87ca02']]) {
    const session = createSession('tower-stream-reference', undefined, 'historical-v1');
    for (let step = 0; step < tick; step++) advance(session);
    const frame = session.controller.frame(390, 844, { reducedMotion: true, muted: true }).snapshot;
    assert.equal(frame.publicChecksum, checksum);
    const deck = frame.platforms.find(platform => platform.id === frame.intent.targetPlatformId);
    const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, frame.chunkBaseY, frame.worldWidth);
    const view = context.composeFollowView(frame, hero, 390 / 844);
    const camera = new THREE.PerspectiveCamera(42, 390 / 844, .2, 1200);
    camera.position.set(view.position.x, view.position.y, view.position.z);
    camera.lookAt(view.focus.x, view.focus.y, view.focus.z);
    camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
    const geometry = context.createLandingBeaconGeometry(), beacon = new THREE.Mesh(geometry);
    try {
      context.updateLandingBeacon(beacon, deck, frame, camera);
      const position = new THREE.Vector3();
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        position.fromBufferAttribute(geometry.attributes.position, i)
          .applyQuaternion(beacon.quaternion).add(beacon.position);
        const projected = position.clone().project(camera);
        const screenX = (projected.x + 1) * 195, screenY = (1 - projected.y) * 422;
        assert.ok(screenX >= 24 && screenX <= 366 && screenY >= 105 && screenY <= 720,
          'tick ' + tick + ': glyph lost from portrait reading area at ' + screenX + ',' + screenY);
      }
    } finally { geometry.dispose(); }
  }
});
