'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../../public/snake-stream/camera.mjs');
const width = 28, height = 16, head = Object.freeze({ x: -5.5, z: -7.5 });
const heading = Object.freeze({ x: 0, z: -1 });
const obstructingArch = Object.freeze([
  Object.freeze({ x: -4.8, y: 1.25, z: -10.05, radius: 1.05 }),
  Object.freeze({ x: 1.4, y: 1.25, z: -10.05, radius: 1.05 }),
]);
const args = Object.freeze({ width, height, aspect: 16 / 9, mode: 'detail', head, direction: heading });
const norm = plan => {
  const d = Math.hypot(...Object.values(plan.offset));
  return { distance: d, outward: Object.fromEntries(Object.entries(plan.offset).map(([k, v]) => [k, v / d])) };
};
// Independent geometric probe: this first test failed against the original
// camera because the close shot intersected the real rear arch/pillar.
const cost = (plan, volumes) => {
  const { distance, outward } = norm(plan);
  return volumes.reduce((sum, v) => {
    const rel = { x: v.x - plan.target.x, y: v.y - plan.target.y, z: v.z - plan.target.z };
    const along = rel.x * outward.x + rel.y * outward.y + rel.z * outward.z;
    if (along <= .55 || along > distance + v.radius) return sum;
    const at = Math.min(distance, along);
    const gap = Math.hypot(rel.x - outward.x * at, rel.y - outward.y * at, rel.z - outward.z * at);
    return sum + Math.max(0, v.radius + .12 - gap) / (v.radius + .12);
  }, 0);
};

test('detail camera clears real arch-pillar silhouette while retaining head center and facial scale', async () => {
  const { cameraComposition } = await load();
  const noGuard = cameraComposition(args);
  const guarded = cameraComposition({ ...args, occluders: obstructingArch });
  const initial = cost(noGuard, obstructingArch), final = cost(guarded, obstructingArch);
  assert.ok(initial > .35, 'fixture must reproduce a genuinely occluded close-camera ray: ' + initial);
  assert.ok(final < initial * .25, 'close-up should clear the foreground pillar: ' + final + ' / ' + initial);
  assert.deepEqual(guarded.target, noGuard.target, 'camera never moves the authoritative head/face');
  assert.ok(Math.abs(norm(noGuard).distance - norm(guarded).distance) < 1e-10, 'face zoom stays constant');
  for (const v of Object.values(guarded.offset)) assert.ok(Number.isFinite(v));
});

test('only detail views with foreground mass alter the prior composition', async () => {
  const { cameraComposition } = await load();
  const far = { ...args, head: { x: 0, z: 0 } };
  assert.deepEqual(cameraComposition({ ...far, occluders: obstructingArch }), cameraComposition(far), 'central close-up unchanged');
  for (const mode of ['overview', 'follow'])
    assert.deepEqual(cameraComposition({ ...args, mode, occluders: obstructingArch }), cameraComposition({ ...args, mode }), 'safe cameras unchanged');
  const behind = [{ x: head.x, z: head.z + 2, y: 1, radius: 1 }];
  assert.deepEqual(cameraComposition({ ...args, occluders: behind }), cameraComposition(args), 'mass behind the face cannot steer the camera');
  const invalid = [{ x: NaN, y: 1, z: 1, radius: 1 }, { x: 0, y: 0, z: 0, radius: -1 }];
  assert.deepEqual(cameraComposition({ ...args, occluders: invalid }), cameraComposition(args), 'invalid volumes ignored');
});

test('foreground guard works in portrait without moving fruit or fixed public positions', async () => {
  const { cameraComposition } = await load();
  const food = Object.freeze({ x: head.x, z: head.z - 1 });
  for (const aspect of [16 / 9, 390 / 844]) {
    const before = cameraComposition({ ...args, aspect, food });
    const after = cameraComposition({ ...args, aspect, food, occluders: obstructingArch });
    assert.ok(cost(after, obstructingArch) <= cost(before, obstructingArch), 'stone cannot obscure face more');
    assert.deepEqual(after.target, before.target);
    assert.ok(Math.abs(norm(after).distance - norm(before).distance) < 1e-9);
    assert.equal(food.x, head.x);
    assert.equal(food.z, head.z - 1);
  }
});

test('real world supplies deterministic finite architectural volumes with no new GPU resources', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    const before = world.stats();
    try {
      const volumes = world.cameraOccluders;
      assert.ok(Array.isArray(volumes) && volumes.length >= 20 && volumes.length <= 28, 'fixed bounded foreground proxies');
      assert.ok(Object.isFrozen(volumes));
      for (const volume of volumes) {
        assert.ok(Object.isFrozen(volume));
        assert.ok(Object.values(volume).every(Number.isFinite));
        assert.ok(volume.radius > 0 && volume.radius < 3);
      }
      if (width === 28) {
        const { cameraComposition } = await load();
        const baseline = cameraComposition(args);
        const guarded = cameraComposition({ ...args, occluders: volumes });
        assert.ok(cost(baseline, volumes) > .35, 'physical world has a close-up pillar occlusion');
        assert.ok(cost(guarded, volumes) < cost(baseline, volumes) * .3, 'camera clears authored rear ruins');
      }
      for (const name of ['textures', 'geometries', 'materials', 'staticMeshes', 'staticInstances'])
        assert.equal(world.stats()[name], before[name], 'camera volumes cannot allocate GPU content');
    } finally {
      world.dispose();
    }
    assert.equal(world.stats().disposed, true);
  }
});
