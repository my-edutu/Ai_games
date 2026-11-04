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
  snapshotSource.slice(begin, end)
    .replace('export function ', 'function ')
    .replace('h:{activeFromTick:number;activeEvery:number;activeFor:number}', 'h')
    .replace('tick:number,window=12', 'tick,window=12')
    .replace('):number{', '){') +
  '\nobservedHazardChargeTicks', { Number, Math },
);
const THREE_URL = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const MODULE_URL = pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/hazard-pressure.mjs')).href;
const loaded = Promise.all([import(THREE_URL), import(MODULE_URL)]);
const hazard = { id: 'f5:hot-vent', kind: 'heat', x: 150000, y: 300000,
  width: 54000, height: 15000, activeFromTick: 40, activeEvery: 80, activeFor: 24 };
const snapshot = (remaining, more = {}) => ({
  runToken: 'source-run', floor: 5, tick: 120 - remaining, lifecycle: 'running',
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
  assert.equal(mesh.count, 16);
  assert.equal(effect.diagnostics().chargingHazards, 1);
  assert.equal(effect.diagnostics().extraDraws, 1);
  const early = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  effect.update(snapshot(1), { quality: 'normal' });
  const late = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  assert.notDeepEqual(late, early, 'the shutter rig physically closes during authentic charge');
  assert.ok(late.every(Number.isFinite));
  effect.update(snapshot(1), { quality: 'normal' });
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16)), late,
    'render schedule is idempotent at the same source tick');
});
test('reduced motion shows static legible pressure; invalid/stale/result/guardian signals clear instantly', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const effect = createTowerHazardPressure(THREE); t.after(() => effect.dispose());
  const mesh = effect.group.getObjectByName('SourceTimedHazardChargingShutters');
  effect.update(snapshot(12), { reducedMotion: true });
  const a = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  effect.update(snapshot(1), { reducedMotion: true });
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16)), a);
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
  assert.match(scene, /observedConcurrentHazardCluster\(snapshot\)/);
  assert.match(scene, /hazard\.chargeTicksRemaining <= 12/);
  assert.match(scene, /hazardPressure\.update\(snapshot, options\)/);
  assert.match(scene, /hazardPressure\.clear\(\)/);
  assert.match(scene, /hazardPressure\.dispose\(\)/);
  assert.match(scene, /hazardPressure: hazardPressure\.diagnostics\(\)/);
  assert.match(audio, /hazardChargeStates/);
  assert.match(audio, /hazard\.chargeTicksRemaining/);
  assert.match(audio, /nearbyChargeRaised/);
  assert.match(audio, /witnessedPressureRatchet\(previousCharge, charge, adjacentCharge\)/);
  assert.match(audio, /nearbyRatchetRaised/);
});

test('simultaneous real pressure warnings make one bounded camera subject, not a safe-route promise', async () => {
  const [, { observedConcurrentHazardCluster }] = await loaded;
  const one=snapshot(12,{player:{x:175000,y:320000,health:5,state:'standing'},
    intent:{mode:'evading-hazard'}});
  const two={...one,hazards:[...one.hazards,{...one.hazards[0],
    id:'f5:other',x:202000,width:49000,chargeTicksRemaining:9}]};
  const untouched=JSON.stringify(two), cluster=observedConcurrentHazardCluster(two);
  assert.equal(cluster.count,2);
  assert.equal(cluster.x,(150000+251000)/2);
  assert.equal(cluster.halfWidth,(251000-150000)/2);
  assert.equal(JSON.stringify(two),untouched);
  assert.deepEqual(observedConcurrentHazardCluster(two),cluster);
  for(const frame of [one,{...two,stale:true},
    {...two,lifecycle:'result'}, {...two,intent:{mode:'aligning'}},
    {...two,player:{...two.player,state:'airborne'}},
    {...two,hazards:[two.hazards[0],{...two.hazards[1],x:380000}]}])
    assert.equal(observedConcurrentHazardCluster(frame),null);
});
test('source pressure chambers are pooled to one draw with bounded graphics tiers', async t => {
  const [THREE,{createTowerHazardPressure}]=await loaded;
  const effect=createTowerHazardPressure(THREE);t.after(()=>effect.dispose());
  const frame=snapshot(9,{hazards:Array.from({length:8},(_,i)=>({
    ...snapshot(9).hazards[0],id:'trap-'+i,x:130000+i*11000,
  }))});
  const untouched=JSON.stringify(frame);
  effect.update(frame,{quality:'normal'});
  assert.equal(effect.diagnostics().chargingHazards,6);
  assert.equal(effect.diagnostics().instances,96);
  assert.equal(effect.diagnostics().extraDraws,1);
  effect.update(frame,{quality:'low',reducedMotion:true});
  assert.equal(effect.diagnostics().chargingHazards,3);
  assert.equal(effect.diagnostics().instances,48);
  effect.clear();assert.equal(effect.diagnostics().instances,0);
  assert.equal(JSON.stringify(frame),untouched);
});

test('final pressure chamber ratchet is source-authenticated, bounded, and never first-frame or replayed', async () => {
  const { witnessedPressureRatchet } = await import(pathToFileURL(path.join(root,
    'public/infinite-tower-climb/visuals/audio.mjs')).href);
  assert.equal(witnessedPressureRatchet(12,4,true),true);
  assert.equal(witnessedPressureRatchet(5,4,true),true);
  for(const [before,after,adjacent] of [
    [undefined,4,true],[0,4,true],[4,4,true],[3,2,true],
    [12,0,true],[14,4,true],[9,4,false],[4,5,true],
    [5,4,undefined],[NaN,4,true],[5,Infinity,true],
  ]) assert.equal(witnessedPressureRatchet(before,after,adjacent),false);
});
