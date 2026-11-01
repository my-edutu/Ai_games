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
  // Exercise the shipped camera algorithm with real Three projection math.
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  return { THREE, ...coordinates, context };
})();

function realHit() {
  const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');
  const session = createSession('tower-stream-reference', {
    launchFloor: 8, guardianInterval: 8, upgradeInterval: 4,
    maxTicks: 20000, noProgressTicks: 3000, intermissionTicks: 36,
  }, 'historical-v1');
  for (let i = 0; i < 269; i++) advance(session);
  const snapshot = session.controller.frame(390, 844, { reducedMotion: true, muted: true }).snapshot;
  assert.equal(snapshot.publicChecksum, 'af60b546', 'pin the real GPU artifact 13044256868 hit at tick 269');
  assert.equal(snapshot.tick, 269);
  assert.equal(snapshot.player.attacking, true);
  const guardian = snapshot.enemies.find(enemy => enemy.kind === 'guardian' && enemy.active);
  assert.ok(guardian && guardian.health === 7);
  return { snapshot, guardian };
}

function cameraFor(THREE, context, pointFor, snapshot, width, height) {
  const hero = pointFor(snapshot.player.x, snapshot.player.y - snapshot.player.halfHeight,
    snapshot.chunkBaseY, snapshot.worldWidth);
  const pose = context.composeFollowView(snapshot, hero, width / height);
  const camera = new THREE.PerspectiveCamera(42, width / height, .2, 1200);
  camera.position.copy(pose.position);
  camera.lookAt(pose.focus.x, pose.focus.y, pose.focus.z);
  camera.updateMatrixWorld(true);
  function project(x, y) {
    const point = pointFor(x, y, snapshot.chunkBaseY, snapshot.worldWidth);
    return new THREE.Vector3(point.x, point.y, point.z).project(camera);
  }
  return { pose, project };
}

test('actual floor-8 guardian contact keeps the source, whole hitbox, and climber inside portrait and desktop', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { snapshot, guardian } = realHit();
  const original = JSON.stringify(snapshot);
  for (const [width, height] of [[390, 844], [960, 600]]) {
    const { pose, project } = cameraFor(THREE, context, pointFor, snapshot, width, height);
    const guardianParts = [
      [guardian.x - guardian.halfWidth, guardian.y - guardian.halfHeight],
      [guardian.x - guardian.halfWidth, guardian.y + guardian.halfHeight],
      [guardian.x + guardian.halfWidth, guardian.y - guardian.halfHeight],
      [guardian.x + guardian.halfWidth, guardian.y + guardian.halfHeight],
    ];
    for (const [x, y] of guardianParts) {
      const p = project(x, y);
      assert.ok(Math.abs(p.x) <= (width < height ? .78 : .85) && Math.abs(p.y) <= .72,
        width + 'x' + height + ' guardian contact edge clipped: ' + p.x.toFixed(3) + ', ' + p.y.toFixed(3));
    }
    const body = project(snapshot.player.x, snapshot.player.y);
    assert.ok(Math.abs(body.x) < .78 && Math.abs(body.y) < .72, 'hero must remain in the action frame');
    assert.ok(pose.heroFraction >= .15, 'combat view must not shrink the hero to fit the guardian');
    assert.ok(pose.clear, 'do not place the tower core between camera and encounter');
  }
  assert.equal(JSON.stringify(snapshot), original, 'camera must not mutate authoritative/public state');
});

test('departing guardian projectile cannot outvote the contact, but an incoming shot still influences framing', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { snapshot } = realHit();
  const departing = snapshot.projectiles.find(projectile => projectile.owner === 'enemy');
  assert.ok(departing && departing.x > snapshot.player.x && departing.vx > 0);
  const noShot = { ...snapshot, projectiles: [] };
  const incoming = { ...snapshot, projectiles: snapshot.projectiles.map(projectile => ({ ...projectile, vx: -Math.abs(projectile.vx) })) };
  const without = cameraFor(THREE, context, pointFor, noShot, 390, 844).pose;
  const outgoing = cameraFor(THREE, context, pointFor, snapshot, 390, 844).pose;
  const incomingPose = cameraFor(THREE, context, pointFor, incoming, 390, 844).pose;
  assert.ok(Math.abs(without.focus.x - outgoing.focus.x) < 1e-8,
    'a bolt already flying away should not steal the guardian hit framing');
  assert.ok(Math.abs(incomingPose.focus.x - outgoing.focus.x) > .3,
    'an approaching enemy bolt still receives tactical camera attention');
});

test('portrait guardian engagement retains its camera composition through attack recovery', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { snapshot } = realHit();
  const recovery = { ...snapshot, player: { ...snapshot.player, attacking: false } };
  const hitPose = cameraFor(THREE, context, pointFor, snapshot, 390, 844).pose;
  const recoveredPose = cameraFor(THREE, context, pointFor, recovery, 390, 844).pose;
  for (const axis of ['x', 'y', 'z']) {
    assert.ok(Math.abs(hitPose.position[axis] - recoveredPose.position[axis]) < 1e-8,
      'attack flag alone must not swing the camera on recovery (' + axis + ')');
  }
  assert.equal(hitPose.lean, recoveredPose.lean);
});
