'use strict';
// Genuine guardian+shutter crossfire has to be a *visible physical scene*,
// not just a camera/audio cue. Engineering safety, NOT an experience vote.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root,
    'public/infinite-tower-climb/visuals/hazard-pressure.mjs')).href),
]);
function frame(tick, remaining, active = false, overrides = {}) {
  return {
    lifecycle: 'running', runToken: 'crossfire-run', floor: 7, tick,
    chunkBaseY: 200000, worldWidth: 480000,
    player: { x: 175000, y: 320000, halfWidth: 8000,
      halfHeight: 14000, health: 5, state: 'standing' },
    intent: { mode: 'evading-hazard' },
    enemies: [{ id: 'guardian', kind: 'guardian', active: true,
      telegraph: true, x: 194000, y: 320000,
      health: 6, maxHealth: 8 }],
    hazards: [{ id: 'near-jaws', x: 150000, y: 300000, width: 54000,
      height: 15000, active, chargeTicksRemaining: remaining }],
    ...overrides,
  };
}
function matrices(mesh, pieces = 16) {
  return [...mesh.instanceMatrix.array.slice(0, pieces * 16)];
}
test('real crossfire keeps source-counted charging jaws visible, then locked through guardian impact', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE);
  t.after(() => stage.dispose());
  const mesh = stage.group.getObjectByName('SourceTimedHazardChargingShutters');
  const warning = frame(100, 5);
  const unchanged = JSON.stringify(warning);
  stage.update(warning, { quality: 'low' });
  assert.equal(JSON.stringify(warning), unchanged);
  assert.equal(mesh.count, 16);
  assert.equal(stage.diagnostics().crossfireWarnings, 1);
  assert.equal(stage.diagnostics().chargingHazards, 1);
  const early = matrices(mesh);
  stage.update(frame(101, 4), { quality: 'low' });
  assert.notDeepEqual(matrices(mesh), early,
    'real countdown must physically close the jaw, even while the boss winds up');
  stage.update(frame(105, 0, true), { quality: 'low' });
  assert.equal(stage.diagnostics().activeHazards, 1);
  assert.equal(stage.diagnostics().crossfireWarnings, 0);
  assert.equal(mesh.count, 16, 'impact keeps the closed physical shutter');
});
test('source-proven disengagement stays present during the same guardian confrontation', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE);
  t.after(() => stage.dispose());
  const mesh = stage.group.getObjectByName('SourceTimedHazardChargingShutters');
  stage.update(frame(105, 0, true), { quality: 'low' });
  const closed = matrices(mesh);
  stage.update(frame(106, 0), { quality: 'low' });
  assert.equal(stage.diagnostics().crossfireReleases, 1);
  assert.deepEqual(matrices(mesh), closed, 'release begins at source deactivation');
  stage.update(frame(109, 0), { quality: 'low' });
  assert.notDeepEqual(matrices(mesh), closed);
  stage.update(frame(112, 0), { quality: 'low' });
  assert.equal(mesh.count, 0, 'no fabricated permanent chamber');
});
test('near-contact source warning outranks unrelated warning without leaking future hazards', async t => {
  const [THREE, { createTowerHazardPressure }] = await loaded;
  const stage = createTowerHazardPressure(THREE);
  t.after(() => stage.dispose());
  const source = frame(100, 5);
  const elsewhere = { id: 'far', x: 260000, y: 300000,
    width: 54000, height: 15000, active: false, chargeTicksRemaining: 2 };
  stage.update({ ...source, hazards: [elsewhere, ...source.hazards] },
    { quality: 'low' });
  assert.equal(stage.diagnostics().chargingHazards, 1);
  assert.equal(stage.diagnostics().crossfireWarnings, 1);
  const physicalJaws = matrices(
    stage.group.getObjectByName('SourceTimedHazardChargingShutters'));
  stage.update(source, { quality: 'low' });
  assert.deepEqual(matrices(
    stage.group.getObjectByName('SourceTimedHazardChargingShutters')),
    physicalJaws, 'the first physical chamber must be the genuine close threat');
  stage.update(frame(101, 11), { quality: 'low' });
  assert.equal(stage.diagnostics().chargingHazards, 0,
    '11-tick speculative crossfire must not displace the guardian');
  stage.update({ ...frame(102, 5), intent: {mode: 'aligning'} },
    { quality: 'low' });
  assert.equal(stage.diagnostics().chargingHazards, 0,
    'without observed evasion, only the boss earns cinematic attention');
  stage.update({ ...source, stale: true });
  assert.equal(stage.diagnostics().instances, 0);
  assert.equal(stage.diagnostics().crossfireWarnings, 0);
});