'use strict';
const { hydrateTowerSceneVmContext } = require('./tower-scene-vm-bindings.cjs');
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
  const guardianCircuit = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-circuit.mjs')).href);
  const gateIntrusion = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-gate-intrusion.mjs')).href);
  const context = { THREE, ...coordinates, ...guardianCircuit, ...gateIntrusion };
  // Exercise the shipped camera algorithm with real Three projection math.
  await hydrateTowerSceneVmContext(context);
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

// Source-aware anticipation must never drop the phone's guardian silhouette
// when the AI enters its new authentic early-charge defensive pose.
test('portrait guardian remains in frame throughout observed charge and evasive intent', async () => {
  const {THREE,pointFor,context}=await loaded;
  const {snapshot,guardian}=realHit();
  for(const mode of ['engaging-enemy','bracing-telegraph','evading-telegraph']){
    const frame={...snapshot,intent:{...snapshot.intent,mode}};
    const {pose,project}=cameraFor(THREE,context,pointFor,frame,390,844);
    assert.ok(pose.clear && pose.heroFraction>=.15,mode+' must keep a readable hero and open sightline');
    for(const x of [guardian.x-guardian.halfWidth,guardian.x+guardian.halfWidth]){
      const top=project(x,guardian.y+guardian.halfHeight);
      assert.ok(Math.abs(top.x)<.86&&Math.abs(top.y)<.75,mode+' must keep the real guardian crown in view');
    }
  }
});


test('camera shot continuity retains a safe prior guardian lens but never hides danger', async () => {
  const { context } = await loaded;
  const score = shot => shot.score;
  const best = { lean: .7, score: 102, clear: true, guardianFramed: true, heroFraction: .19 };
  const prior = { lean: .22, score: 101.1, clear: true, guardianFramed: true, heroFraction: .21 };
  assert.equal(context.retainGuardianCameraShot(best, prior, score), prior,
    'a small aesthetic score swing cannot whip a safe established guardian shot');
  assert.equal(context.retainGuardianCameraShot(best, { ...prior, clear: false }, score), best,
    'core-occluded guardian must never be retained for continuity');
  assert.equal(context.retainGuardianCameraShot(best, { ...prior, guardianFramed: false }, score), best,
    'the real guardian silhouette outranks smoothing');
  assert.equal(context.retainGuardianCameraShot(best, { ...prior, heroFraction: .12 }, score), best,
    'readable climber height is mandatory even on a narrow portrait');
  assert.equal(context.retainGuardianCameraShot({ ...best, score: 106 }, prior, score).lean, .7,
    'a genuine large visibility/composition win must override prior framing');
  assert.equal(context.retainGuardianCameraShot(best, null, score), best);
});

test('actual guardian encounter can retain its prior safe exterior shot across duplicate snapshots', async () => {
  const { pointFor, context } = await loaded;
  const { snapshot } = realHit();
  const hero = pointFor(snapshot.player.x, snapshot.player.y - snapshot.player.halfHeight,
    snapshot.chunkBaseY, snapshot.worldWidth);
  const before = JSON.stringify(snapshot);
  for (const aspect of [390 / 844, 960 / 600]) {
    const first = context.composeFollowView(snapshot, hero, aspect);
    const repeated = context.composeFollowView(snapshot, hero, aspect, 0, 1, first.lean);
    assert.equal(repeated.clear, true);
    assert.equal(repeated.guardianFramed, true);
    assert.ok(repeated.heroFraction >= .15);
    assert.ok(Math.abs(repeated.lean - first.lean) < .001,
      'identical source action cannot change the selected source-safe guardian lens');
  }
  assert.equal(JSON.stringify(snapshot), before,
    'camera continuity may neither modify a source frame nor advance gameplay');
});


test('the live two-body lens ranks both real character silhouettes, not a big hero with a tiny boss', async () => {
  const { context } = await loaded;
  const rect = (left,right,bottom,top,depth) => [
    [left,bottom,depth],[left,top,depth],[right,bottom,depth],[right,top,depth]
  ];
  const hero = rect(-.35,-.1,-.24,.24,20);
  const fullBoss = rect(.13,.35,-.22,.22,21);
  const miniatureBoss = rect(.13,.35,-.055,.055,21);
  const full = context.observedGuardianDuelLegibility(hero,fullBoss);
  const tiny = context.observedGuardianDuelLegibility(hero,miniatureBoss);
  assert.ok(full.score > tiny.score + 10,
    'a source-visible guardian reduced to a thumbnail cannot win the shared action shot');
  assert.ok(full.guardianFraction > tiny.guardianFraction);
  assert.equal(context.observedGuardianDuelLegibility(hero,[[NaN,0,3]]).score,0);
});

test('real source guardian duel respects both full-body crop and immutable landing across lenses', async () => {
  const { pointFor, context } = await loaded;
  const { snapshot } = realHit();
  const initial = JSON.stringify(snapshot);
  const hero = pointFor(snapshot.player.x,
    snapshot.player.y-snapshot.player.halfHeight,
    snapshot.chunkBaseY,snapshot.worldWidth);
  for (const aspect of [390/844,960/600]) {
    const view = context.composeFollowView(snapshot,hero,aspect);
    assert.ok(view.guardianStaged && view.guardianFramed && view.actorFramed && view.clear,
      'source fight must keep both full 3D bodies and the physical tower unobstructed');
    assert.ok(view.guardianFraction > 0 && view.duelLegibility > 0);
    assert.ok(view.lensScale >= .91 && view.lensScale <= 1);
    const repeated = context.composeFollowView(snapshot,hero,aspect,0,1,view.lean);
    assert.ok(repeated.actorFramed && repeated.guardianFramed && repeated.clear,
      'a repeated authoritative tick may not make either participant disappear');
  }
  assert.equal(JSON.stringify(snapshot),initial,
    'the shared exterior lens cannot mutate combat, progression or replay authority');
});


test('a wounded, still-living source guardian stays in the real airborne duel between individual warning ticks', async () => {
  const { THREE, pointFor, context } = await loaded;
  const { snapshot, guardian } = realHit();
  // Source-derived contact pose with the transient action/warning flags off.
  // This is a controlled transition regression, NOT a recorded gameplay tick.
  const betweenShots = {
    ...snapshot,
    player: { ...snapshot.player, state: 'airborne', attacking: false },
    intent: { ...snapshot.intent, mode: 'recovering' },
    enemies: snapshot.enemies.map(enemy =>
      enemy.id === guardian.id ? { ...enemy, telegraph: false } : enemy),
    projectiles: [],
  };
  const before = JSON.stringify(betweenShots);
  for (const [width, height] of [[390, 844], [960, 600]]) {
    const shot = cameraFor(THREE, context, pointFor, betweenShots, width, height);
    assert.equal(shot.pose.guardianStaged, true,
      'an already-wounded, nearby living guardian cannot disappear during an airborne recovery');
    assert.ok(shot.pose.clear && shot.pose.actorFramed && shot.pose.guardianFramed,
      'the unchanged combatants must share an unobstructed full-body exterior shot');
    assert.ok(shot.pose.heroFraction >= .15,
      'the restored guardian shot must not reduce the climber to a thumbnail');
  }
  const untouched = {
    ...betweenShots,
    enemies: betweenShots.enemies.map(enemy =>
      enemy.id === guardian.id ? { ...enemy, health: enemy.maxHealth } : enemy),
  };
  assert.equal(cameraFor(THREE, context, pointFor, untouched, 390, 844).pose.guardianStaged,
    false, 'an unwounded untelegraphed airborne encounter cannot steal an ordinary landing');
  const defeated = {
    ...betweenShots,
    enemies: betweenShots.enemies.map(enemy =>
      enemy.id === guardian.id ? { ...enemy, active: false, health: 0 } : enemy),
  };
  assert.equal(cameraFor(THREE, context, pointFor, defeated, 390, 844).pose.guardianStaged,
    false, 'defeat must immediately retire the living boss camera subject');
  assert.equal(JSON.stringify(betweenShots), before,
    'the shot continuity policy cannot mutate the source state or replay');
});
