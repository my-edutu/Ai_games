'use strict';
// Contracts for a SOURCE-EARNED impact in the real Tower scene, not an
// experience vote or proof that software WebGL meets supported-device FPS.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const scene = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const start = scene.indexOf('function observedPhysicalTouchdown(');
const end = scene.indexOf('// End observed physical touchdown.', start);
assert.ok(start >= 0 && end > start, 'source must own the observable landing predicate');
const observe = vm.runInNewContext(
  scene.slice(start, end) + '\nobservedPhysicalTouchdown',
  { Number, Math },
);

function source(tick = 30, patch = {}) {
  return {
    runToken: 'real-expedition', floor: 7, tick, lifecycle: 'running',
    worldWidth: 480000, chunkBaseY: 0,
    platforms: [{ id: 'f7:deck', kind: 'moving',
      x: 80000, y: 210000, width: 115000, height: 10000 }],
    player: { x: 124000, y: 246000, halfWidth: 9000,
      halfHeight: 14000, state: 'airborne', vy: -16000, health: 5 },
    ...patch,
  };
}
function realPair() {
  const before = source();
  const after = source(31, { player: {
    ...before.player, state: 'standing', y: 234000, vy: 0,
  } });
  return { before, after };
}

test('the real airborne to standing collision earns a bounded material impact', () => {
  const { before, after } = realPair();
  const original = JSON.stringify([before, after]);
  const event = observe(before, after);
  assert.equal(event.platformId, 'f7:deck');
  assert.equal(event.kind, 'moving');
  assert.equal(event.floor, 7);
  assert.equal(event.tick, 31);
  assert.equal(event.top, 220000);
  assert.equal(event.x, 124000);
  assert.equal(event.observedOnly, true);
  assert.ok(event.strength >= .4 && event.strength <= 1);
  assert.equal(JSON.stringify([before, after]), original,
    'cosmetic impact must never modify authenticated game state');
});

test('no remote deck, absent source, jump without contact, or imagined recovery creates impact', () => {
  const { before, after } = realPair();
  for (const invalid of [
    null,
    { ...after, platforms: [] },
    { ...after, platforms: [{ ...after.platforms[0], x: 310000 }] },
    { ...after, platforms: [{ ...after.platforms[0], y: 320000 }] },
    { ...after, platforms: [{ ...after.platforms[0], width: 0 }] },
    { ...after, player: { ...after.player, state: 'airborne' } },
    { ...after, player: { ...after.player, vy: -1000 } },
    { ...after, player: { ...after.player, health: 0 } },
    { ...after, player: { ...after.player, x: NaN } },
    { ...after, worldWidth: 0 },
  ]) assert.equal(observe(before, invalid), null);
  assert.equal(observe({ ...before, player: { ...before.player, vy: 2000 } }, after), null);
});

test('restarts, stale/out of order ticks, phase changes and source gaps cannot replay a landing', () => {
  const { before, after } = realPair();
  for (const invalid of [
    { ...after, runToken: 'another-run' },
    { ...after, floor: 8 },
    { ...after, tick: 30 },
    { ...after, tick: 29 },
    { ...after, tick: 39 },
    { ...after, lifecycle: 'result' },
  ]) assert.equal(observe(before, invalid), null);
  assert.equal(observe({ ...before, lifecycle: 'result' }, after), null);
  assert.equal(observe({ ...before, player: { ...before.player, state: 'standing' } }, after), null);
});

test('one original depth-tested instanced impact belongs to the real Tower scene and cleanup', () => {
  assert.match(scene, /new THREE\.InstancedMesh\([\s\S]*?new THREE\.IcosahedronGeometry\(\.26, 0\)[\s\S]*?\), 16\)/);
  assert.match(scene, /touchdownDebris\.name = 'WitnessedPhysicalDeckImpact'/);
  assert.match(scene, /touchdownDebris\.castShadow = false/);
  assert.match(scene, /touchdownDebris\.receiveShadow = false/);
  assert.match(scene, /physicalTouchdown = observedPhysicalTouchdown\(previous, next\)/);
  assert.match(scene, /actual\.runToken === snapshot\.runToken && actual\.floor === snapshot\.floor/);
  assert.match(scene, /snapshot\.platforms\?\.some\(deck => deck\.id === actual\.platformId/);
  assert.match(scene, /const count = quiet \? 4 : options\.quality === 'low' \? 8 : 16/);
  assert.match(scene, /touchdownDebris\.instanceMatrix\.needsUpdate = true/);
  assert.match(scene, /physicalTouchdown = null; touchdownDebris\.count = 0/);
  assert.match(scene, /fragmentInstances: touchdownDebris\.count/);
  assert.match(scene, /depthTest: true, depthWrite: true/);
});
