'use strict';
// Contract for the actual source-backed guardian/actor/gate camera relationship.
// These are safe deterministic geometry checks; only blind full-motion review
// can judge whether the experience is substantially improved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const loaded = (async () => {
  const THREE = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const context = { THREE, ...coordinates };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  return { THREE, ...coordinates, context };
})();
function observedHit() {
  const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');
  const session = createSession('tower-stream-reference', {
    launchFloor: 8, guardianInterval: 8, upgradeInterval: 4,
    maxTicks: 20000, noProgressTicks: 3000, intermissionTicks: 36,
  }, 'historical-v1');
  for (let i = 0; i < 269; i++) advance(session);
  const snapshot = session.controller.frame(390, 844, { reducedMotion: true, muted: true }).snapshot;
  assert.equal(snapshot.publicChecksum, 'af60b546', 'real historical guardian-contact state');
  return snapshot;
}
function project(THREE, pointFor, frame, pose, aspect, x, y, radius = 25) {
  const camera = new THREE.PerspectiveCamera(42, aspect, .2, 1200);
  camera.position.copy(pose.position);
  camera.lookAt(pose.focus.x, pose.focus.y, pose.focus.z);
  camera.updateMatrixWorld(true);
  const world = pointFor(x, y, frame.chunkBaseY, frame.worldWidth, radius);
  return new THREE.Vector3(world.x, world.y, world.z).project(camera);
}
test('source-observed wounded guardian, actual cap and climber share a stable portrait combat story', async () => {
  const { THREE, pointFor, context } = await loaded;
  const historical = observedHit();
  const cap = historical.platforms.find(platform => platform.id.endsWith(':cap'));
  assert.ok(cap, 'real floor-8 source must contain the guardian gate cap');
  const frame = {
    ...historical,
    player: { ...historical.player, state: 'standing', attacking: false },
    intent: { mode: 'aligning', targetPlatformId: cap.id },
    enemies: historical.enemies.map(enemy => enemy.kind === 'guardian'
      ? { ...enemy, health: 2, maxHealth: 8, active: true, telegraph: false } : enemy),
  };
  const guardian = frame.enemies.find(enemy => enemy.kind === 'guardian' && enemy.active);
  const before = JSON.stringify(frame);
  for (const aspect of [390 / 844, 960 / 600]) {
    const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight,
      frame.chunkBaseY, frame.worldWidth);
    const view = context.composeFollowView(frame, hero, aspect);
    assert.equal(view.guardianStaged, true, 'genuine continuing HP attrition must keep its enemy on stage');
    assert.equal(view.guardianFramed, true, 'full source guardian collision silhouette must fit');
    assert.ok(view.clear, 'combat actors must not disappear behind the tower core');
    assert.ok(view.heroFraction >= .15, 'camera must retain a readable full-height climber');
    const crown = project(THREE, pointFor, frame, view, aspect,
      guardian.x, guardian.y + guardian.halfHeight);
    assert.ok(Math.abs(crown.x) < .85 && Math.abs(crown.y) < .78,
      'the real guardian crown must remain inside the screen');
    const lock = project(THREE, pointFor, frame, view, aspect,
      cap.x + cap.width / 2, cap.y + cap.height + 25000, 21.8);
    assert.ok(Math.abs(lock.x) <= .99 && Math.abs(lock.y) <= .9,
      'the source-powered gate needs a visible physical point of reference');
  }
  assert.equal(JSON.stringify(frame), before, 'camera is a read-only consumer of the immutable public game state');
});
test('a genuine airborne route does not become a forced boss cutaway', async () => {
  const { pointFor, context } = await loaded;
  const historical = observedHit();
  const cap = historical.platforms.find(platform => platform.id.endsWith(':cap'));
  const frame = {
    ...historical,
    player: { ...historical.player, state: 'airborne', attacking: false },
    intent: { mode: 'jumping', targetPlatformId: cap.id },
    enemies: historical.enemies.map(enemy => enemy.kind === 'guardian' ? { ...enemy, health: 2 } : enemy),
  };
  const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, frame.chunkBaseY, frame.worldWidth);
  const view = context.composeFollowView(frame, hero, 390 / 844);
  assert.equal(view.guardianStaged, false, 'do not steal the landing camera while airborne');
  assert.equal(view.targetId, cap.id, 'the actual required platform remains readable');
});
