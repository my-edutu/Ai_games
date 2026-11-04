'use strict';
// Safety contract for the visible guardian arena: a real, source-authored
// crusher must exist as an OPEN mechanical landmark before its 12-tick charge.
// This test does not replace normal-speed human/critic video evaluation.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root,
    'public/infinite-tower-climb/visuals/hazard-pressure.mjs')).href),
]);
function frame(tick, chargeTicksRemaining = 0, active = false, patch = {}) {
  const base = {
    lifecycle: 'running', runToken: 'tower-guardian-source', floor: 8, tick,
    worldWidth: 480000, chunkBaseY: 200000,
    player: { x: 214000, y: 349000, halfWidth: 8000,
      halfHeight: 14000, health: 5, state:'standing' },
    intent: { mode:'engaging-enemy' },
    platforms: [
      { id:'f8:cap', x:128000, y:310000, width:240000, height:20000 },
    ],
    enemies: [
      { id:'f8:guardian', kind:'guardian', x:253000, y:349000,
        active:true, health:8, maxHealth:8, telegraph:false },
    ],
    hazards: [
      { id:'f8:guardian-shutter', kind:'crusher', x:201000,
        y:330000, width:26000, height:9000, active, chargeTicksRemaining },
    ],
  };
  return { ...base, ...patch };
}
function pose(mesh, index = 0) {
  const matrix = [...mesh.instanceMatrix.array.slice(index*16, index*16+16)];
  return matrix;
}
test('installed shutter is strictly backed by the current real guardian-cap collision source', async () => {
  const [, { observedInstalledGuardianShutter }] = await loaded;
  const valid = frame(11), untouched = JSON.stringify(valid);
  assert.equal(observedInstalledGuardianShutter(valid, valid.hazards[0]), true);
  assert.equal(JSON.stringify(valid), untouched);
  assert.equal(observedInstalledGuardianShutter(valid, valid.hazards[0]), true);
  const variants = [
    { ...valid, stale:true }, { ...valid, lifecycle:'result' },
    { ...valid, runToken:'' }, { ...valid, tick:-1 },
    { ...valid, enemies:[] }, { ...valid, enemies:[{...valid.enemies[0],health:0}] },
    { ...valid, platforms:[] }, { ...valid, floor:7 },
    { ...valid, hazards:[{...valid.hazards[0], id:'f8:unrelated'}] },
    { ...valid, hazards:[{...valid.hazards[0], kind:'heat'}] },
    { ...valid, hazards:[{...valid.hazards[0], y:340000}] },
    { ...valid, hazards:[{...valid.hazards[0], x:400000}] },
  ];
  for (const candidate of variants) {
    assert.equal(observedInstalledGuardianShutter(candidate, candidate.hazards[0]), false,
      'an unrelated, stale, unsupported or unoccupied source may not create an arena');
  }
});
test('real cap crusher stays visibly OPEN at rest, then CLOSES, HITS and physically releases', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE);
  t.after(() => stage.dispose());
  const mesh = stage.group.getObjectByName('SourceTimedHazardChargingShutters');
  const atRest = frame(20), untouched = JSON.stringify(atRest);
  stage.update(atRest, { quality:'low' });
  assert.equal(JSON.stringify(atRest), untouched);
  assert.equal(stage.diagnostics().phase,'installed-open');
  assert.equal(stage.diagnostics().restingHazards,1);
  assert.equal(stage.diagnostics().chargingHazards,0);
  assert.equal(stage.diagnostics().extraDraws,1);
  assert.equal(mesh.count,16);
  const restPose = pose(mesh);
  const restColor = [...mesh.instanceColor.array.slice(0, 3)];
  assert.ok(restPose.every(Number.isFinite));
  stage.update(frame(30,12),{quality:'low'});
  assert.equal(stage.diagnostics().phase,'charging');
  assert.equal(stage.diagnostics().restingHazards,0);
  assert.notDeepEqual(pose(mesh),restPose, 'physical jaw must move from clearly open idle pose');
  const startCharge = pose(mesh);
  stage.update(frame(41,1),{quality:'low'});
  assert.notDeepEqual(pose(mesh),startCharge);
  const lockedPose = pose(mesh);
  stage.update(frame(42,0,true),{quality:'low'});
  assert.equal(stage.diagnostics().phase,'active');
  assert.deepEqual(pose(mesh),lockedPose,
    'source contact cannot jump the final physical closure pose');
  assert.notDeepEqual([...mesh.instanceColor.array.slice(0,3)],restColor);
  stage.update(frame(43),{quality:'low'});
  assert.equal(stage.diagnostics().phase,'release');
  stage.update(frame(50),{quality:'low'});
  assert.equal(stage.diagnostics().phase,'installed-open');
  assert.deepEqual(pose(mesh),restPose,
    'same real crusher is a stable navigation landmark again after observed unload');
});
test('non-guardian hazards and invalid source never show resting danger; lifecycle cleanup is bounded', async t => {
  const [THREE,{createTowerHazardPressure}]=await loaded;
  const stage=createTowerHazardPressure(THREE);t.after(()=>stage.dispose());
  const installed=frame(10), noGuardian={...installed,enemies:[]};
  stage.update(noGuardian);
  assert.equal(stage.diagnostics().instances,0);
  const unrelated={...installed,hazards:[{...installed.hazards[0],id:'f8:heat'}]};
  stage.update(unrelated);
  assert.equal(stage.diagnostics().instances,0);
  stage.update(installed,{quality:'low'});
  assert.equal(stage.diagnostics().instances,16);
  stage.update({...installed,stale:true});
  assert.equal(stage.diagnostics().instances,0);
  stage.update({...installed,lifecycle:'result'});
  assert.equal(stage.diagnostics().instances,0);
  stage.update({...installed,runToken:'next-run',floor:9,platforms:[],
    hazards:[],enemies:[]});
  assert.equal(stage.diagnostics().instances,0);
  stage.update(installed,{reducedMotion:true,quality:'low'});
  assert.equal(stage.diagnostics().phase,'installed-open',
    'accessibility option retains shape and location of the real trap');
  stage.clear();
  assert.equal(stage.diagnostics().instances,0);
  assert.equal(stage.diagnostics().restingHazards,0);
});
