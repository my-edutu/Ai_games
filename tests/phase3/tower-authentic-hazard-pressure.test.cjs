'use strict';
// Real source-scheduled hazard pressure, not a rendered fake threat or a Gauntlet vote.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const snapshotSource = fs.readFileSync(path.join(root,
  'games/infinite-tower-climb/src/presentation/snapshot.ts'), 'utf8');
const begin = snapshotSource.indexOf('export function observedHazardChargeTicks(');
const end = snapshotSource.indexOf('// Legacy/default snapshots', begin);
assert.ok(begin > 0 && end > begin,
  'published source schedule must provide its own bounded warning period');
const charge = vm.runInNewContext(
  snapshotSource.slice(begin, end).replace('export function ', 'function ') +
  '\nobservedHazardChargeTicks', { Number, Math },
);
const THREE_URL = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const MODULE_URL = pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/hazard-pressure.mjs')).href;
const loaded = Promise.all([import(THREE_URL), import(MODULE_URL)]);
const hazard = { id: 'f5:hot-vent', kind: 'heat', x: 150000, y: 300000,
  width: 54000, height: 15000, activeFromTick: 40, activeEvery: 80, activeFor: 24 };
const snapshot = (remaining, more = {}) => ({
  runToken: 'source-run', floor: 5, tick: 110, lifecycle: 'running',
  worldWidth: 480000, chunkBaseY: 200000, player: {
    x: 175000, y: 320000, health: 5,
  },
  enemies: [], hazards: [{
    id: hazard.id, kind: hazard.kind, x: hazard.x, y: hazard.y,
    width: hazard.width, height: hazard.height,
    active: false, chargeTicksRemaining: remaining,
  }], ...more,
});
test('fixed-step authored hazard cycle announces real future activation only in its final 12 ticks', () => {
  assert.equal(charge(hazard, 0), 0);
  assert.equal(charge(hazard, 27), 0);
  assert.equal(charge(hazard, 28), 12);
  assert.equal(charge(hazard, 39), 1);
  assert.equal(charge(hazard, 40), 0);
  assert.equal(charge(hazard, 60), 0);
  assert.equal(charge(hazard, 107), 0);
  assert.equal(charge(hazard, 108), 12);
  assert.equal(charge(hazard, 119), 1);
  assert.equal(charge(hazard, 120), 0);
  assert.equal(charge({ ...hazard, activeEvery: 0 }, 39), 0);
  assert.equal(charge({ ...hazard, activeFor: 80 }, 39), 0);
  assert.equal(charge(hazard, -1), 0);
  assert.equal(charge(hazard, NaN), 0);
  assert.match(snapshotSource, /\.\.\.\(options\.includeWindupTicks\?\{chargeTicksRemaining:observedHazardChargeTicks\(h,state\.tick\)\}:\{\}\)/,
    'historical/default source snapshots keep their prior keys/checksum');
});
test('real gameplay uses one bounded depth-tested instance stage and never mutates public authority', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const effect = createTowerHazardPressure(THREE); t.after(() => effect.dispose());
  const mesh = effect.group.getObjectByName('SourceTimedHazardChargingShutters');
  assert.ok(mesh?.isInstancedMesh);
  assert.equal(mesh.material.depthTest, true);
  assert.equal(mesh.material.depthWrite, true);
  assert.equal(mesh.castShadow, false);
  assert.equal(effect.diagnostics().extraDraws, 0);
  const frame = snapshot(12), unchanged = JSON.stringify(frame);
  effect.update(frame, { quality: 'normal' });
  assert.equal(JSON.stringify(frame), unchanged);
  assert.equal(mesh.count, 8);
  assert.equal(effect.diagnostics().chargingHazards, 1);
  assert.equal(effect.diagnostics().extraDraws, 1);
  const early = Array.from(mesh.instanceMatrix.array.slice(0, 8 * 16));
  effect.update(snapshot(1), { quality: 'normal' });
  const late = Array.from(mesh.instanceMatrix.array.slice(0, 8 * 16));
  assert.notDeepEqual(late, early, 'the shutter rig physically closes during authentic charge');
  assert.ok(late.every(Number.isFinite));
  effect.update(snapshot(1), { quality: 'normal' });
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 8 * 16)), late,
    'render schedule is idempotent at the same source tick');
});
test('reduced motion shows static legible pressure; invalid/stale/result/guardian signals clear instantly', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const effect = createTowerHazardPressure(THREE); t.after(() => effect.dispose());
  const mesh = effect.group.getObjectByName('SourceTimedHazardChargingShutters');
  effect.update(snapshot(12), { reducedMotion: true });
  const a = Array.from(mesh.instanceMatrix.array.slice(0, 8 * 16));
  effect.update(snapshot(1), { reducedMotion: true });
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 8 * 16)), a);
  for (const [frame, options] of [
    [snapshot(0), {}], [snapshot(1, { lifecycle: 'result' }), {}],
    [snapshot(1, { player: { x: 175000, y: 320000, health: 0 } }), {}],
    [snapshot(1, { worldWidth: 0 }), {}],
    [snapshot(1, { enemies: [{ active: true, telegraph: true }] }), {}],
    [snapshot(1), { stale: true }],
    [snapshot(1, { hazards: [{ ...snapshot(1).hazards[0], active: true }] }), {}],
    [snapshot(1, { hazards: [{ ...snapshot(1).hazards[0], x: 900000 }] }), {}],
  ]) {
    effect.update(frame, options);
    assert.equal(mesh.count, 0);
    assert.equal(effect.diagnostics().extraDraws, 0);
  }
});
test('stage is integrated with the real world renderer, graphics recovery, audio and diagnostics', () => {
  const scene = fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  const audio = fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/audio.mjs'), 'utf8');
  assert.match(scene, /createTowerHazardPressure\(THREE\)/);
  assert.match(scene, /hazardPressure\.update\(snapshot, options\)/);
  assert.match(scene, /hazardPressure\.clear\(\)/);
  assert.match(scene, /hazardPressure\.dispose\(\)/);
  assert.match(scene, /hazardPressure: hazardPressure\.diagnostics\(\)/);
  assert.match(audio, /hazardChargeStates/);
  assert.match(audio, /hazard\.chargeTicksRemaining/);
  assert.match(audio, /nearbyChargeRaised/);
});
