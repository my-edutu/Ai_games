'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SOURCE = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/recovery-transfer.mjs'), 'utf8');
const observedHealthRecovery = vm.runInNewContext(
  SOURCE.replace(/^export /gm, '') + '\nobservedHealthRecovery', {});
const scene = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const route = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/route-intent.mjs'), 'utf8');

function snapshot(changes = {}) {
  return {
    runToken: 'the-real-run', floor: 8, tick: 100, lifecycle: 'running',
    worldWidth: 480000, chunkBaseY: 0,
    player: { x: 51000, y: 106000, halfWidth: 7000, halfHeight: 12000,
      health: 2, maxHealth: 5, state: 'standing' },
    pickups: [{ id: 'f8:aid', kind: 'health', x: 52000, y: 106000, value: 1 }],
    ...changes,
  };
}
function pair() {
  const old = snapshot();
  const next = snapshot({ tick: 101, player: { ...old.player, health: 3 }, pickups: [] });
  return { old, next };
}
test('actual nearby consumed health item and genuine health gain earn one rescue transfer', () => {
  const { old, next } = pair();
  const freeze = JSON.stringify([old, next]);
  const actual = observedHealthRecovery(old, next);
  assert.equal(actual.pickupId, 'f8:aid');
  assert.equal(actual.fromHealth, 2);
  assert.equal(actual.toHealth, 3);
  assert.equal(actual.runToken, 'the-real-run');
  assert.equal(actual.tick, 101);
  assert.equal(JSON.stringify([old, next]), freeze, 'presentation must never mutate the game snapshot');
});
test('floor rewards, upgrades, missing items, and distant items cannot impersonate rescue', () => {
  const { old, next } = pair();
  assert.equal(observedHealthRecovery(old, { ...next, floor: 9 }), null);
  assert.equal(observedHealthRecovery(old, { ...next, player: { ...next.player, maxHealth: 6 } }), null);
  assert.equal(observedHealthRecovery(old, { ...next, pickups: old.pickups }), null);
  assert.equal(observedHealthRecovery({ ...old, pickups: [{ ...old.pickups[0], x: 260000 }] }, next), null);
  assert.equal(observedHealthRecovery(old, { ...next, pickups: [], player: { ...next.player, health: 2 } }), null);
  assert.equal(observedHealthRecovery(old, { ...next, player: { ...next.player, health: 6 } }), null);
  assert.equal(observedHealthRecovery({ ...old, pickups: [...old.pickups,
    { ...old.pickups[0], id: 'f8:another' }] }, next), null, 'ambiguous vanished pickups fail closed');
});
test('restart, duplicate, stale tick, terminal and invalid source identity never earn a new visual event', () => {
  const { old, next } = pair();
  for (const candidate of [
    { ...next, runToken: 'another-run' }, { ...next, tick: old.tick },
    { ...next, tick: old.tick + 9 }, { ...next, lifecycle: 'intermission' },
    { ...next, worldWidth: 0 }, { ...next, player: { ...next.player, halfWidth: NaN } },
  ]) assert.equal(observedHealthRecovery(old, candidate), null);
  assert.equal(observedHealthRecovery({ ...old, lifecycle: 'result' }, next), null);
  assert.equal(observedHealthRecovery(null, next), null);
});
test('same recovery target feeds on-deck world route, portrait camera, real transfer and cleanup', () => {
  assert.match(route, /export function witnessedHealthPickup\(/);
  assert.match(scene, /witnessedHealthPickup\(snapshot, recoverySupport\)/);
  assert.match(scene, /observedHealthRecovery\(previous, next\)/);
  assert.match(scene, /recoveryTransfer\.begin\(/);
  assert.match(scene, /recoveryTransfer\.update\(/);
  assert.match(scene, /recoveryTransfer\.clear\(/);
  assert.match(scene, /recoveryTransfer\.dispose\(/);
  assert.match(scene, /recoveryTransfer: recoveryTransfer\.diagnostics\(\)/);
  assert.match(SOURCE, /new THREE\.InstancedMesh\(geometry, material, LIMIT\)/);
  assert.match(SOURCE, /options\.reducedMotion === true/);
  assert.match(SOURCE, /depthTest: true, depthWrite: false/);
});
