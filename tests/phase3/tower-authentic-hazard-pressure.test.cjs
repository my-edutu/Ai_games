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
  // The opaque stone tower occupies the 24-unit radial core. World-space
  // pressure jaws must actually inhabit the visible exterior 3D layer,
  // yet stay behind the 28-unit climber, not block the playable silhouette.
  for (const index of [0, 4, 8, 12, 15]) {
    const transform = new THREE.Matrix4();
    mesh.getMatrixAt(index, transform);
    const radial = Math.hypot(transform.elements[12], transform.elements[14]);
    assert.ok(radial >= 26.7 && radial <= 27.85,
      `physical chamber member ${index} should clear opaque tower but sit behind actor: ${radial}`);
  }
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
    [snapshot(1, { enemies: [{ id: 'guardian', kind: 'guardian',
      x: 175000, y: 320000, health: 5, active: true, telegraph: true }] }), {}],
    [snapshot(1), { stale: true }],
    [snapshot(1, { hazards: [{ ...snapshot(1).hazards[0], active: false, chargeTicksRemaining: 13 }] }), {}],
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

test('live trap closure persists into authentic activation instead of vanishing on contact', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE); t.after(() => stage.dispose());
  const mesh = stage.group.getObjectByName('SourceTimedHazardChargingShutters');
  const ready = snapshot(1), engaged = snapshot(0, {
    hazards: [{ ...snapshot(0).hazards[0], active: true }],
  });
  const unchanged = JSON.stringify(engaged);
  stage.update(ready);
  const before = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  const warningColors = Array.from(mesh.instanceColor.array.slice(0, 16 * 3));
  stage.update(engaged);
  assert.equal(mesh.count, 16, 'the real attack must keep its physically closed chamber');
  assert.equal(stage.diagnostics().activeHazards, 1);
  assert.equal(stage.diagnostics().chargingHazards, 0);
  assert.equal(stage.diagnostics().phase, 'active');
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16)), before,
    'last charged jaw frame and first actual attack frame share the same physical pose');
  assert.notDeepEqual(Array.from(mesh.instanceColor.array.slice(0, 16 * 3)),
    warningColors, 'actual danger remains distinct in color AND a physically locked shape');
  assert.equal(mesh.material.depthTest, true);
  assert.equal(stage.diagnostics().extraDraws, 1);
  assert.equal(JSON.stringify(engaged), unchanged, 'presentation never mutates simulation truth');
});
test('source-proven deactivation unloads pressure machinery gradually, never fakes a safe phase', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE); t.after(() => stage.dispose());
  const mesh = stage.group.getObjectByName('SourceTimedHazardChargingShutters');
  const active = snapshot(0, { hazards: [{ ...snapshot(0).hazards[0], active: true }] });
  const inactive = tick => snapshot(0, { tick, hazards: [{
    ...active.hazards[0], active: false,
  }] });
  stage.update(active);
  const closed = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  stage.update(inactive(active.tick + 1));
  assert.equal(stage.diagnostics().releasingHazards, 1);
  assert.equal(mesh.count, 16);
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16)), closed,
    'release begins at the observed real active-to-inactive tick');
  stage.update(inactive(active.tick + 3));
  const opening = Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16));
  assert.notDeepEqual(opening, closed, 'the actual neutral phase unloads its chamber');
  stage.update(inactive(active.tick + 3));
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 16 * 16)), opening,
    'duplicate render frames cannot advance the mechanism');
  stage.update(inactive(active.tick + 8));
  assert.equal(mesh.count, 0, 'safe inactive phase removes the old stage after bounded recovery');
  assert.equal(stage.diagnostics().releasingHazards, 0);
  const neverSeen = createTowerHazardPressure(THREE); t.after(() => neverSeen.dispose());
  neverSeen.update(inactive(active.tick + 1));
  assert.equal(neverSeen.diagnostics().instances, 0,
    'a first-frame inactive hazard is not allowed to invent a prior activation');
  neverSeen.update(snapshot(12));
  neverSeen.update(snapshot(0, { tick: 9999, hazards: inactive(9999).hazards }));
  assert.equal(neverSeen.diagnostics().releasingHazards, 0,
    'disconnected source ticks cannot manufacture a release event');
});
test('actual lethal trap outranks warnings in low quality and survives simultaneous boss cues', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE); t.after(() => stage.dispose());
  const charging = Array.from({ length: 6 }, (_,i) => ({
    ...snapshot(8).hazards[0], id: 'charge-' + i, x: 130000 + 11000*i,
  }));
  const actual = { ...charging[0], id: 'actual', x: 175000,
    active: true, chargeTicksRemaining: 0 };
  const group = snapshot(8, { hazards: [...charging,actual] });
  stage.update(group, {quality:'low'});
  assert.equal(stage.diagnostics().activeHazards, 1,
    'a source-active attack is never silently lost behind six warnings');
  assert.equal(stage.diagnostics().chargingHazards, 2);
  assert.equal(stage.diagnostics().instances, 48);
  assert.equal(stage.diagnostics().extraDraws, 1);
  stage.update({ ...group, enemies: [{active:true, telegraph:true}] }, {quality:'low'});
  assert.equal(stage.diagnostics().chargingHazards, 2,
    'an untyped telegraph cannot erase actual authored shutter anticipation');
  stage.update({ ...group, enemies: [{ id:'nearby-source-guardian',
    kind:'guardian', x:175000, y:320000, health:8,
    active:true, telegraph:true }] }, {quality:'low'});
  assert.equal(stage.diagnostics().activeHazards, 1,
    'a guardian windup cannot make a separate active trap become invisible');
  assert.equal(stage.diagnostics().chargingHazards, 0,
    'suppress lower-priority anticipation while the guardian is winding up');
  assert.equal(stage.diagnostics().instances, 16);
  stage.update({ ...group, stale:true }, {quality:'low'});
  assert.equal(stage.diagnostics().instances, 0);
  stage.update({ ...group, lifecycle:'result' }, {quality:'low'});
  assert.equal(stage.diagnostics().instances, 0);
  stage.update({ ...group, runToken:'another-run', tick:group.tick+1,
    hazards:charging.map(h=>({ ...h, active:false, chargeTicksRemaining:0 }))},
    {quality:'low'});
  assert.equal(stage.diagnostics().instances, 0,
    'a new run must not resurrect old active or releasing hazards');
});

test('source-attested quiet mechanical disengagement cannot be forged or replayed', async () => {
  const { witnessedPressureRelease } = await import(pathToFileURL(path.join(root,
    'public/infinite-tower-climb/visuals/audio.mjs')).href);
  assert.equal(witnessedPressureRelease(true,false,true), true);
  for(const args of [
    [undefined,false,true],[false,false,true],[true,true,true],
    [true,false,false],[true,false,undefined],[true,0,true],
    [1,false,true],[false,true,true],[true,false,null],
  ]) assert.equal(witnessedPressureRelease(...args), false);
  const audio = fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/audio.mjs'), 'utf8');
  assert.match(audio, /witnessedPressureRelease\(wasActive,active,adjacentCharge\)/);
  assert.match(audio, /nearbyHazardReleased/);
  assert.match(audio, /actor\.health\s*>\s*0/);
});
