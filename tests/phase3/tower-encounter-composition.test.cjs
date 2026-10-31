'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { test, after } = require('node:test');

const ROOT = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-composition-regression-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
const loaded = (async () => {
  const THREE = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const context = { THREE, ...coordinates };
  // Evaluate the shipped framing and cue functions with the real projection math.
  // No renderer, browser, alternate scene implementation or authority is started.
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace('export function createTowerScene', 'function createTowerScene'), context);
  const localURL = file => pathToFileURL(path.join(ROOT, file)).href;
  const worldSource = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs'), 'utf8')
    .replace("'/tower/vendor/three.module.js'", JSON.stringify(localURL('node_modules/three/build/three.module.js')))
    .replace("'./coordinates.mjs'", JSON.stringify(localURL('public/infinite-tower-climb/visuals/coordinates.mjs')))
    .replace("'./world-surface.mjs'", JSON.stringify(localURL('public/infinite-tower-climb/visuals/world-surface.mjs')));
  fs.writeFileSync(path.join(scratch, 'world.mjs'), worldSource);
  const { createTowerWorld } = await import(pathToFileURL(path.join(scratch, 'world.mjs')).href);
  const castSource = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/characters.mjs'), 'utf8')
    .replace("'/tower/vendor/three.module.js'", JSON.stringify(localURL('node_modules/three/build/three.module.js')));
  fs.writeFileSync(path.join(scratch, 'characters.mjs'), castSource);
  const { createEnemy } = await import(pathToFileURL(path.join(scratch, 'characters.mjs')).href);
  return { THREE, ...coordinates, context, createTowerWorld, createEnemy };
})();

function snapshot(overrides = {}) {
  return {
    lifecycle: 'running', chunkBaseY: 0, chunkHeight: 360000, worldWidth: 480000,
    player: { x: 169900, y: 124000, halfWidth: 9000, halfHeight: 14000, vx: 0, vy: 0, health: 5, state: 'standing' },
    intent: { mode: 'aligning', targetPlatformId: 'next' },
    platforms: [
      { id: 'current', x: 38030, y: 100000, width: 135000, height: 10000 },
      { id: 'next', x: 267422, y: 150000, width: 125000, height: 10000 },
    ],
    enemies: [{ id: 'sentinel', active: true, x: 122630, y: 122000, halfWidth: 9000, halfHeight: 12000 }],
    hazards: [], projectiles: [], ...overrides,
  };
}

test('landing emphasis follows only a current traversal intent and disappears on contact', async () => {
  const { context } = await loaded;
  const frame = snapshot();
  const before = JSON.stringify(frame);
  assert.equal(context.intendedLanding(frame), frame.platforms[1]);
  for (const mode of ['engaging-enemy', 'evading-hazard', 'evading-projectile', 'recovering', 'waiting']) {
    assert.equal(context.intendedLanding({ ...frame, intent: { ...frame.intent, mode } }), null, mode);
  }
  assert.equal(context.intendedLanding({ ...frame, intent: { mode: 'jumping', targetPlatformId: 'absent' } }), null);
  assert.equal(context.intendedLanding({ ...frame, lifecycle: 'result' }), null);
  assert.equal(context.intendedLanding({ ...frame, player: { ...frame.player, health: 0 } }), null);
  assert.equal(context.intendedLanding({ ...frame, intent: { mode: 'air-control', targetPlatformId: 'current' } }), null,
    'the post-contact snapshot can retain the previous airborne target');
  const airborne = { ...frame, player: { ...frame.player, state: 'airborne', y: 170000 }, intent: { mode: 'air-control', targetPlatformId: 'current' } };
  assert.equal(context.intendedLanding(airborne), frame.platforms[0], 'an actual intended descent is still visible');
  assert.equal(JSON.stringify(frame), before, 'presentation selection never mutates the public snapshot');
});

function project(THREE, pose, aspect, point) {
  const camera = new THREE.PerspectiveCamera(42, aspect, .2, 1200);
  camera.position.copy(pose.position); camera.lookAt(pose.focus.x, pose.focus.y, pose.focus.z); camera.updateMatrixWorld(true);
  return new THREE.Vector3(point.x, point.y, point.z).project(camera);
}

test('local encounter framing gives the hero readable scale and includes the nearby opponent', async () => {
  const { THREE, pointFor, context } = await loaded;
  const frame = snapshot({ intent: { mode: 'engaging-enemy', targetPlatformId: 'next' } });
  const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, 0, frame.worldWidth);
  for (const aspect of [960 / 600, 390 / 844]) {
    const pose = context.composeFollowView(frame, hero, aspect);
    const feet = project(THREE, pose, aspect, hero);
    const head = project(THREE, pose, aspect, { ...hero, y: hero.y + 2.8 });
    const height = (head.y - feet.y) / 2;
    assert.ok(height >= .16 && height <= .205, `hero projected height ${height} at aspect ${aspect}`);
    for (const enemy of frame.enemies) {
      const body = pointFor(enemy.x, enemy.y, 0, frame.worldWidth);
      const center = project(THREE, pose, aspect, body);
      assert.ok(Math.abs(center.x) < .86 && Math.abs(center.y) < .7, `opponent clipped at aspect ${aspect}`);
    }
  }
});

test('follow framing retains the actual landing corridor across portrait and both route directions', async () => {
  const { THREE, pointFor, context } = await loaded;
  for (const flip of [false, true]) for (const aspect of [1.6, 390 / 844]) {
    const frame = snapshot();
    if (flip) {
      frame.player.x = frame.worldWidth - frame.player.x;
      frame.platforms = frame.platforms.map(p => ({ ...p, x: frame.worldWidth - p.x - p.width }));
      frame.enemies = [];
    }
    const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, 0, frame.worldWidth);
    const pose = context.composeFollowView(frame, hero, aspect);
    assert.equal(pose.targetId, 'next');
    for (const point of [hero, { ...hero, y: hero.y + 2.8 }, pose.landing]) {
      const projected = project(THREE, pose, aspect, point);
      assert.ok(Math.abs(projected.x) <= .86 && Math.abs(projected.y) <= .72,
        `important point ${JSON.stringify(projected)} clipped in ${flip ? 'left' : 'right'} route at aspect ${aspect}`);
    }
    assert.ok(Number.isFinite(pose.distance) && pose.distance > 0 && pose.distance < 100);
  }
});

test('one reused landing bracket tracks moving platform edges and never creates a raised surface', async () => {
  const { THREE, SCALE, ARC, context } = await loaded;
  const geometry = context.createLandingCueGeometry();
  const attribute = geometry.attributes.position;
  const frame = snapshot();
  let disposals = 0;
  geometry.addEventListener('dispose', () => disposals++);
  for (const offset of [0, 17000, -9000, 22000]) {
    const target = { ...frame.platforms[1], x: frame.platforms[1].x + offset, y: frame.platforms[1].y + offset * .2 };
    context.updateLandingCueGeometry(geometry, target, frame);
    assert.equal(geometry.attributes.position, attribute, 'moving decks reuse one bounded vertex buffer');
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity, topVertices = 0;
    const top = (target.y + target.height - frame.chunkBaseY) / SCALE;
    for (let index = 0; index < attribute.count; index++) {
      const point = new THREE.Vector3().fromBufferAttribute(attribute, index);
      const x = (Math.atan2(point.x, point.z) / ARC + .5) * frame.worldWidth;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, point.y);
      if (Math.abs(point.y - top) < 1e-6) topVertices++;
    }
    assert.ok(minX >= target.x - .02 && maxX <= target.x + target.width + .02);
    assert.ok(Math.abs(minX - target.x) < .03 && Math.abs(maxX - target.x - target.width) < .03);
    assert.ok(maxY <= top + 1e-6, 'navigation is surface ink, never an invented raised collision top');
    assert.ok(topVertices >= 32, 'the selected landing needs a top-surface shape distinct from permanent moving trim');
  }
  const colors = geometry.attributes.color;
  assert.ok(colors, 'the selected shape retains a contrasting keyline on pale surfaces');
  const values = Array.from({ length: colors.count }, (_, i) => colors.getX(i) + colors.getY(i) + colors.getZ(i));
  assert.ok(Math.max(...values) > Math.min(...values) * 5, 'the top mark has an intrinsic light/dark silhouette');
  assert.ok(attribute.count <= 160, 'the destination cue has a fixed small geometry budget');
  geometry.dispose(); assert.equal(disposals, 1);
});

test('portrait wide jumps retain readable hero scale and the actual usable target width', async () => {
  const { THREE, pointFor, context, createTowerWorld } = await loaded;
  // The genuine default-run tick-379 spatial relationship, expressed locally.
  const frame = snapshot({ runToken: 'portrait-route', floor: 1, theme: 'ruins',
    player: { x: 280000, y: 137800, halfWidth: 9000, halfHeight: 14000, health: 3, vx: -9000, vy: 13800, state: 'airborne' },
    intent: { mode: 'jumping', targetPlatformId: 'moving-destination' },
    platforms: [{ id: 'moving-destination', kind: 'moving', x: 63559, y: 150000, width: 115000, height: 10000 }],
    enemies: [],
  });
  for (const reflected of [false, true]) {
    const input = reflected ? { ...frame, player: { ...frame.player, x: frame.worldWidth - frame.player.x },
      platforms: frame.platforms.map(p => ({ ...p, x: frame.worldWidth - p.x - p.width })) } : frame;
    const hero = pointFor(input.player.x, input.player.y - input.player.halfHeight, 0, input.worldWidth);
    const pose = context.composeFollowView(input, hero, 390 / 844);
    const feet = project(THREE, pose, 390 / 844, hero), head = project(THREE, pose, 390 / 844, { ...hero, y: hero.y + 2.8 });
    assert.ok((head.y - feet.y) / 2 >= .14, 'a wide jump must not shrink the portrait hero to six percent');
    assert.ok(Math.abs(feet.x) <= .69, 'the hero needs side breathing room during the crossing');
    const target = input.platforms[0];
    const topCorners = [[target.x, 24], [target.x + target.width, 24], [target.x + target.width, 27.18], [target.x, 27.18]]
      .map(([x, radius]) => project(THREE, pose, 390 / 844, pointFor(x, target.y + target.height, 0, input.worldWidth, radius)))
      .map(point => ({ x: (point.x + 1) * 195, y: (1 - point.y) * 422 }));
    const topArea = Math.abs(topCorners.reduce((sum, point, index) => {
      const next = topCorners[(index + 1) % topCorners.length]; return sum + point.x * next.y - next.x * point.y;
    }, 0)) / 2;
    assert.ok(topArea >= 2000, `the real landing top must read as area rather than a sliver (${topArea} square pixels)`);
    for (const x of [target.x, target.x + target.width]) {
      const edge = pointFor(x, target.y + target.height, 0, input.worldWidth, 26.7);
      const projected = project(THREE, pose, 390 / 844, edge);
      assert.ok(Math.abs(projected.x) <= .93 && Math.abs(projected.y) <= .7,
        `usable target edge is clipped: ${JSON.stringify(projected)}`);
    }
    const world = createTowerWorld();
    try {
      world.update(input, 0, 0, { quality: 'low', reducedMotion: true }); world.group.updateMatrixWorld(true);
      for (const subject of [{ ...hero, y: hero.y + 1.4 }, { ...pose.landing, y: pose.landing.y + .1 }]) {
        const origin = new THREE.Vector3().copy(pose.position), ray = new THREE.Vector3().copy(subject).sub(origin), length = ray.length();
        const occluders = new THREE.Raycaster(origin, ray.normalize(), 0, length - .05).intersectObject(world.group, true);
        assert.equal(occluders.length, 0, `${reflected ? 'right' : 'left'} crossing: the real tower core blocks the intended action`);
      }
    } finally { world.dispose(); }
  }
});

test('the nearby guardian face is not buried inside the upper cap beam', async () => {
  const { THREE, pointFor, context, createTowerWorld } = await loaded;
  const frame = snapshot({ runToken: 'nearby-guardian', floor: 8, theme: 'clockwork',
    player: { x: 205800, y: 358000, halfWidth: 9000, halfHeight: 14000, health: 3, vx: 0, vy: 0, state: 'airborne' },
    intent: { mode: 'recovering', targetPlatformId: 'f8:p6' },
    platforms: [
      { id: 'f8:cap', kind: 'oneway', x: 115200, y: 332000, width: 249600, height: 12000 },
      { id: 'f8:p6', kind: 'oneway', x: 40387, y: 300000, width: 125000, height: 10000 },
    ],
    enemies: [{ id: 'f8:guardian', kind: 'guardian', x: 149387, y: 328000, halfWidth: 16000, halfHeight: 18000, active: true }],
  });
  const world = createTowerWorld();
  try {
    world.update(frame, 0, 0, { quality: 'low', reducedMotion: true }); world.group.updateMatrixWorld(true);
    const cap = world.group.getObjectByName('platform:f8:cap');
    assert.ok(Math.abs(new THREE.Box3().setFromObject(cap).max.y - 34.4) < 1e-6, 'thinning preserves the exact collision top');
    const hero = pointFor(frame.player.x, frame.player.y - frame.player.halfHeight, 0, frame.worldWidth);
    const enemy = frame.enemies[0], foot = pointFor(enemy.x, enemy.y - enemy.halfHeight, 0, frame.worldWidth);
    // Actual armored-head height (2.27) and forward visor (0.415), scaled by
    // the authored double-size rig and its authoritative 3.6-unit body height.
    const scale = 2 * 3.6 / 5.6, yaw = foot.angle + 1.12;
    const face = new THREE.Vector3(foot.x + Math.sin(yaw) * .415 * scale,
      foot.y + 2.27 * scale, foot.z + Math.cos(yaw) * .415 * scale);
    for (const aspect of [1.6, 390 / 844]) {
      const pose = context.composeFollowView(frame, hero, aspect);
      const origin = new THREE.Vector3().copy(pose.position), ray = face.clone().sub(origin), length = ray.length();
      const occluders = new THREE.Raycaster(origin, ray.normalize(), 0, length - .025).intersectObject(world.group, true);
      assert.equal(occluders.length, 0, `${aspect}: ${occluders[0]?.object.parent.name} hides the real guardian face`);
    }
  } finally { world.dispose(); }
});


test('active guardian has a finite overhead cap clearance only inside its true horizontal span', async () => {
  const { context } = await loaded;
  const frame = snapshot({ floor: 8, theme: 'clockwork',
    platforms: [{ id: 'f8:cap', kind: 'oneway', x: 115200, y: 332000, width: 249600, height: 12000 }],
    enemies: [{ id: 'f8:guardian', kind: 'guardian', x: 149387, y: 328000,
      halfWidth: 16000, halfHeight: 18000, active: true }],
  });
  const before = JSON.stringify(frame), enemy = frame.enemies[0];
  const clearance = context.guardianCanopyClearance(frame, enemy);
  assert.ok(clearance > 3.1 && clearance < 3.34, 'one-way cap clearance includes the real visible underside, not just its collision top');
  assert.equal(context.guardianCanopyClearance({ ...frame, platforms: [] }, enemy), Infinity);
  assert.equal(context.guardianCanopyClearance(frame, { ...enemy, kind: 'sentinel' }), Infinity);
  assert.equal(context.guardianCanopyClearance(frame, { ...enemy, active: false }), Infinity);
  assert.equal(context.guardianCanopyClearance(frame, { ...enemy, x: 400000 }), Infinity);
  assert.equal(JSON.stringify(frame), before, 'the presentation rule never mutates authoritative facts');
});

test('guardian cap sightline softens a real occluding deck and restores its solid appearance when clear', async () => {
  const { THREE, pointFor, createTowerWorld } = await loaded;
  const frame = snapshot({ runToken: 'cap-sightline', floor: 8, theme: 'clockwork',
    player: { x: 205800, y: 358000, halfWidth: 9000, halfHeight: 14000, health: 3, vx: 0, vy: 0, state: 'airborne' },
    intent: { mode: 'recovering', targetPlatformId: 'f8:p6' },
    platforms: [
      { id: 'f8:cap', kind: 'oneway', x: 115200, y: 332000, width: 249600, height: 12000 },
      { id: 'f8:p6', kind: 'oneway', x: 40387, y: 300000, width: 125000, height: 10000 },
    ],
    enemies: [{ id: 'f8:guardian', kind: 'guardian', x: 149387, y: 328000,
      halfWidth: 16000, halfHeight: 18000, active: true }],
  });
  const before = JSON.stringify(frame), world=createTowerWorld();
  try {
    world.update(frame, 0, 0, { quality: 'low', reducedMotion: true });
    world.group.updateMatrixWorld(true,true);
    const cap=world.group.getObjectByName('platform:f8:cap');
    const capTop=new THREE.Box3().setFromObject(cap).max.y;
    const resources=world.diagnostics().materials;
    const enemy=frame.enemies[0],feet=pointFor(enemy.x, enemy.y-enemy.halfHeight, 0, frame.worldWidth,25);
    const crest=new THREE.Vector3(feet.x, feet.y+2.9, feet.z);
    const outer=pointFor(enemy.x, 0, 0, frame.worldWidth,36);
    const camera=new THREE.PerspectiveCamera(42, 390/844, .2, 1200);
    camera.position.set(outer.x,41.8,outer.z);camera.lookAt(crest);camera.updateMatrixWorld(true);
    const ray=new THREE.Raycaster(camera.position,crest.clone().sub(camera.position).normalize(),
      0,camera.position.distanceTo(crest)-.05);
    assert.ok(ray.intersectObject(cap,true).length>0, 'this witness ray genuinely crosses the physical cap in front of the guardian crest');
    assert.equal(typeof world.revealGuardianSightlines,'function');
    world.revealGuardianSightlines(camera,[crest]);
    const faded=new Set();
    cap.traverse(mesh=>{if(mesh.isMesh&&mesh.material.opacity<.75)faded.add(mesh.material);});
    assert.ok(faded.size>=2, 'cap face and trim soften rather than hiding or moving the platform');
    assert.ok([...faded].every(material=>material.transparent&&!material.depthWrite),
      'transparent cap pixels do not overwrite the guardian depth surface');
    assert.equal(world.diagnostics().occludedGuardianCaps,1);
    world.revealGuardianSightlines(camera,[]);
    for(const material of faded){
      assert.equal(material.opacity,1,'an unobstructed cap returns to full opacity');
      assert.equal(material.depthWrite,true,'normal solid cap depth writes return');
    }
    assert.equal(world.diagnostics().occludedGuardianCaps,0);
    assert.equal(world.diagnostics().materials,resources,'ray checks allocate no new floor materials');
    assert.equal(new THREE.Box3().setFromObject(cap).max.y,capTop,'the cap collision-aligned walking top cannot move');
    assert.equal(JSON.stringify(frame),before,'the entire public authoritative snapshot stays immutable');
  } finally { world.dispose(); }
});


test('guardian crown contour detects the actual desktop cap interruption, not only its unobstructed center', async () => {
  const { THREE, pointFor, context, createTowerWorld, createEnemy } = await loaded;
  // Exact Gauntlet 20 GPU witness: floor 8, tick 258, desktop 960×600,
  // checksum 87440ff6. The old center and center+.24 rays miss this cap.
  const frame = snapshot({ runToken: 'guardian-desktop-87440ff6', floor: 8, theme: 'clockwork',
    chunkBaseY: 2880000, chunkHeight: 360000,
    platforms: [{ id: 'f8:cap', kind: 'oneway', x: 115200, y: 3212000, width: 249600, height: 12000 }],
    enemies: [{ id: 'f8:guardian', kind: 'guardian', x: 151973, y: 3208000,
      halfWidth: 16000, halfHeight: 18000, health: 8, maxHealth: 8,
      active: true, telegraph: true, facing: 1 }],
  });
  const original = JSON.stringify(frame), enemy = frame.enemies[0];
  const world = createTowerWorld(), guardian = createEnemy('guardian');
  try {
    world.update(frame, 0, 0, { quality: 'low', reducedMotion: true });
    world.group.updateWorldMatrix(true, true);
    const cap = world.group.getObjectByName('platform:f8:cap');
    const foot = pointFor(enemy.x, enemy.y - enemy.halfHeight, frame.chunkBaseY, frame.worldWidth);
    guardian.group.position.set(foot.x, foot.y, foot.z);
    guardian.group.rotation.y = foot.angle + enemy.facing * 1.12;
    guardian.group.scale.setScalar(enemy.halfHeight * 2 / 10000 / 5.6);
    guardian.animate({ ...enemy, canopyClearance: 3.28, firing: false }, 0, 0, { reducedMotion: true });
    const head = guardian.group.getObjectByName('armored-head');
    assert.ok(head, 'use the real articulated skinned guardian, not a stand-in cube');
    const camera = new THREE.PerspectiveCamera(42, 960 / 600, .2, 1200);
    camera.position.set(-6.025937139491097, 37.390183939171564, 44.97943390483519);
    camera.updateWorldMatrix(true, true);
    const intersectsCap = (point) => {
      const direction = point.clone().sub(camera.position), distance = direction.length();
      return new THREE.Raycaster(camera.position, direction.normalize(), 0, distance - .05)
        .intersectObject(cap, true).length > 0;
    };
    const center = head.getWorldPosition(new THREE.Vector3());
    assert.ok(!intersectsCap(center) && !intersectsCap(center.clone().add(new THREE.Vector3(0, .24, 0))),
      'this precise desktop viewport must reproduce the previously undetected obstruction');
    world.revealGuardianSightlines(camera, [center, center.clone().add(new THREE.Vector3(0, .24, 0))]);
    assert.equal(world.diagnostics().occludedGuardianCaps, 0, 'the old two-point sightline really misses');
    const samples = context.sampleGuardianCrownSightlines(head, []);
    assert.ok(samples.length >= 7 && samples.length <= 12, 'bounded contour samples, not a new mesh or per-pixel pass');
    assert.ok(samples.some(intersectsCap), 'the real desktop camera must hit the physical cap ahead of a crown contour');
    world.revealGuardianSightlines(camera, samples);
    assert.equal(world.diagnostics().occludedGuardianCaps, 1, 'the cap becomes see-through only on real crown occlusion');
    const reused = context.sampleGuardianCrownSightlines(head, samples);
    assert.strictEqual(reused, samples, 'sample array is reused every frame');
    assert.equal(reused.length, samples.length);
    world.revealGuardianSightlines(camera, []);
    assert.equal(world.diagnostics().occludedGuardianCaps, 0, 'no visible guardian restores solid deck');
    assert.equal(JSON.stringify(frame), original, 'camera visibility cannot mutate gameplay authority');
  } finally { guardian.dispose(); world.dispose(); }
});
