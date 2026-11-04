'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const sourceModule = pathToFileURL(path.join(ROOT,
  'public/infinite-tower-climb/visuals/moving-deck-suspension.mjs')).href;
const loaded = Promise.all([
  import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href),
  import(sourceModule),
]);
function frame(tick = 20, deckX = 80000, overrides = {}) {
  const deck = { id: 'f7:p2', kind: 'moving', x: deckX,
    y: 210000, width: 115000, height: 10000 };
  return {
    runToken: 'observed-real-carriage', lifecycle: 'running', floor: 7, tick,
    worldWidth: 480000, chunkBaseY: 0,
    platforms: [deck, { id: 'f7:p4', kind: 'normal', x: 260000,
      y: 260000, width: 100000, height: 10000 }],
    enemies: [], hazards: [],
    intent: { mode: 'aligning', targetPlatformId: deck.id },
    player: { state: 'standing', x: deckX + 40000, y: 234000,
      halfWidth: 9000, halfHeight: 14000, health: 5 },
    ...overrides,
  };
}
test('only a real occupied or explicitly selected moving deck earns a physical carriage stage', async () => {
  const [, { observedMovingDeckSuspension }] = await loaded;
  const source = frame(), pristine = JSON.stringify(source);
  const selected = observedMovingDeckSuspension(source);
  assert.equal(selected.platformId, 'f7:p2');
  assert.equal(selected.loaded, true, 'physical occupied footing outranks route selection');
  assert.equal(JSON.stringify(source), pristine, 'render cannot mutate authoritative source');
  const airborne = frame(21, 90000, {
    player: { ...frame().player, x: 20000, state: 'airborne' },
  });
  assert.equal(observedMovingDeckSuspension(airborne).loaded, false,
    'explicit source target remains a recognizable moving carriage, not an occupied one');
  assert.equal(observedMovingDeckSuspension(frame(21, 90000, {
    intent: { mode: 'air-control', targetPlatformId: 'f7:p4' },
    player: { ...frame().player, state: 'airborne' },
  })), null, 'ordinary deck cannot summon an invented moving chassis');
  assert.equal(observedMovingDeckSuspension(frame(22, 90000, {
    intent: { mode: 'attacking', targetPlatformId: 'f7:p2' },
    player: { ...frame().player, state: 'airborne' },
  })), null, 'combat intent does not create a fake route');
  assert.equal(observedMovingDeckSuspension(frame(23, 90000, {
    enemies: [{ id: 'live-guardian', active: true, telegraph: true }],
  })), null, 'real incoming attacks have priority over decorative chassis');
});
test('one bounded world-space instanced truss follows actual source movement and physical rider', async () => {
  const [THREE, { createTowerMovingDeckSuspension }] = await loaded;
  const truss = createTowerMovingDeckSuspension(THREE);
  try {
    const original = frame(20), pristine = JSON.stringify(original);
    truss.update(original, { quality: 'low' });
    let state = truss.diagnostics();
    assert.equal(state.visible, true);
    assert.equal(state.pieces, 12);
    assert.equal(state.drawCalls, 1);
    assert.equal(state.extraShadowPasses, 0);
    assert.equal(state.loadedByRealFootContact, true);
    assert.equal(truss.group.getObjectByName('AuthenticMovingDeckUndercarriageTruss').isInstancedMesh, true);
    assert.equal(JSON.stringify(original), pristine);
    const mesh = truss.group.children[0];
    assert.equal(mesh.castShadow, false);
    assert.equal(mesh.receiveShadow, false);
    const before = new THREE.Matrix4();
    mesh.getMatrixAt(0, before);
    truss.update(original);
    const duplicate = new THREE.Matrix4();
    mesh.getMatrixAt(0, duplicate);
    assert.ok(before.equals(duplicate), 'same fixed-step source cannot move the carriage');
    truss.update(frame(21, 92000, {
      player: { ...original.player, x: original.player.x + 12000 },
    }));
    const after = new THREE.Matrix4();
    mesh.getMatrixAt(0, after);
    assert.ok(!after.equals(before), 'real source carriage movement updates geometry');
    state = truss.diagnostics();
    assert.equal(state.sourceTick, 21);
    assert.equal(state.loadedByRealFootContact, true);
    assert.equal(state.platformId, 'f7:p2');
    truss.update(frame(22, 92000, { lifecycle: 'result' }));
    assert.equal(truss.diagnostics().visible, false);
    assert.equal(mesh.count, 0);
    truss.update(frame(0, 100000, { runToken: 'fresh-run' }));
    assert.equal(truss.diagnostics().runToken, 'fresh-run',
      'new run rehydrates only its actual selected moving deck');
    truss.update(frame(1, 102000), { stale: true });
    assert.equal(truss.diagnostics().visible, false);
    truss.update(frame(2, 104000, { player: { ...original.player, health: 0 } }));
    assert.equal(truss.diagnostics().visible, false);
  } finally { truss.dispose(); truss.dispose(); }
});
test('real scene integrates the chassis across graphics recovery, diagnostics and disposal', () => {
  const src = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(src, /import \{ createTowerMovingDeckSuspension \} from '\.\/moving-deck-suspension\.mjs'/);
  assert.match(src, /movingDeckSuspension\.update\(snapshot, options\)/);
  assert.equal((src.match(/movingDeckSuspension = createTowerMovingDeckSuspension\(THREE\)/g)||[]).length,2,
    'fresh construction AND graphics-context rehydration');
  assert.match(src, /movingDeckSuspension: movingDeckSuspension\.diagnostics\(\)/);
  assert.ok((src.match(/movingDeckSuspension\.dispose\(\)/g)||[]).length>=2,
    'renderer recovery and final cleanup dispose GPU resources');
});
