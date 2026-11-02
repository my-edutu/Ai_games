'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/route-intent.mjs')).href),
]);
const landing = Object.freeze({ id: 'floor-7:bridge', x: 205000,
  y: 143000, width: 62000, height: 1800 });
function snapshot(overrides = {}) {
  return {
    lifecycle: 'running', tick: 121, runToken: 'run-7', floor: 7,
    worldWidth: 480000, chunkBaseY: 0,
    player: { x: 95000, y: 110000, health: 4, attacking: false },
    intent: { mode: 'aligning', targetPlatformId: landing.id },
    enemies: [],
    ...overrides,
  };
}

test('real authoritative route selects bounded exterior world markers, not predicted physics', async () => {
  const [THREE, { createTowerRouteIntent }] = await loaded;
  const effect = createTowerRouteIntent(THREE);
  try {
    const source = snapshot();
    const unchanged = JSON.stringify(source);
    effect.update(source, landing, { reducedMotion: false });
    const d = effect.diagnostics();
    assert.equal(effect.group.visible, true);
    assert.equal(d.sourceBound, true);
    assert.equal(d.runToken, 'run-7');
    assert.equal(d.targetPlatformId, landing.id);
    assert.equal(d.simulatedFlight, false, 'the glyph is a choice, not a promised trajectory');
    assert.equal(d.extraDraws, 1);
    assert.ok(d.markers >= 5 && d.markers <= 12);
    assert.equal(effect.group.children.length, 2, 'bounded intent and moving-deck echo batches; no per-stone meshes');
    const stones = effect.group.children[0];
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < d.markers; i++) {
      stones.getMatrixAt(i, matrix);
      const point = new THREE.Vector3().setFromMatrixPosition(matrix);
      assert.ok(Math.abs(Math.hypot(point.x, point.z) - 27.55) < 1e-5,
        'every projected choice lies on the exterior visible tower annulus');
      assert.ok(Number.isFinite(point.y));
    }
    assert.equal(JSON.stringify(source), unchanged, 'renderer cannot mutate authority');
  } finally { effect.dispose(); }
});

test('threat, attack, lost route, terminal and restart retire old intentions immediately', async () => {
  const [THREE, { createTowerRouteIntent }] = await loaded;
  const effect = createTowerRouteIntent(THREE);
  try {
    effect.update(snapshot(), landing);
    assert.equal(effect.group.visible, true);
    effect.update(snapshot({ enemies: [{ active: true, telegraph: true }] }), landing);
    assert.equal(effect.group.visible, false, 'actual windups own the viewer attention');
    effect.update(snapshot({ player: { x: 95000, y: 110000, health: 4, attacking: true } }), landing);
    assert.equal(effect.group.visible, false, 'do not obscure a real attack');
    effect.update(snapshot({ lifecycle: 'result', result: { kind: 'game', reason: 'fall' } }), landing);
    assert.equal(effect.group.visible, false, 'result cannot show a future route');
    effect.update(snapshot({ runToken: 'run-8', tick: 0 }), null);
    assert.equal(effect.diagnostics().runToken, null);
    assert.equal(effect.diagnostics().markers, 0);
    effect.update(snapshot({ runToken: 'run-8', tick: 1 }), landing);
    assert.equal(effect.diagnostics().runToken, 'run-8');
    effect.update(snapshot({ runToken: 'run-8', tick: 2 }), landing, { stale: true });
    assert.equal(effect.group.visible, false, 'lost transport never promises navigation');
  } finally { effect.dispose(); }
});

test('reduced motion has stable instanced positions and graphics resources dispose once', async () => {
  const [THREE, { createTowerRouteIntent }] = await loaded;
  const effect = createTowerRouteIntent(THREE);
  const mesh = effect.group.children[0];
  const echoes = effect.group.children[1];
  let echoGeometryDisposed = 0, echoMaterialDisposed = 0;
  echoes.geometry.addEventListener('dispose', () => echoGeometryDisposed++);
  echoes.material.addEventListener('dispose', () => echoMaterialDisposed++);
  let geometryDisposed = 0, materialDisposed = 0;
  mesh.geometry.addEventListener('dispose', () => geometryDisposed++);
  mesh.material.addEventListener('dispose', () => materialDisposed++);
  effect.update(snapshot(), landing, { reducedMotion: true });
  const first = Array.from(mesh.instanceMatrix.array);
  effect.update(snapshot({ tick: 168 }), landing, { reducedMotion: true });
  assert.deepEqual(Array.from(mesh.instanceMatrix.array), first,
    'time must not pulse route markers when reduced motion is enabled');
  effect.dispose();
  effect.dispose();
  assert.equal(geometryDisposed, 1);
  assert.equal(materialDisposed, 1);
  assert.equal(echoGeometryDisposed, 1);
  assert.equal(echoMaterialDisposed, 1);
  assert.equal(effect.group.children.length, 0);
  assert.equal(effect.diagnostics().disposed, true);
});

test('a live moving landing reveals ONLY previously observed source positions, never future deck positions', async () => {
  const [THREE, { createTowerRouteIntent }] = await loaded;
  const effect = createTowerRouteIntent(THREE);
  const moving = { ...landing, kind: 'moving' };
  try {
    effect.update(snapshot({ tick: 121 }), moving);
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0,
      'no past position exists on first source observation');
    const displaced = { ...moving, x: moving.x + 7500 };
    effect.update(snapshot({ tick: 122 }), displaced);
    const state = effect.diagnostics();
    assert.equal(state.observedMovingDeckEchoes, 1);
    assert.equal(state.observedDeckDeltaX, 7500);
    assert.equal(state.echoedSourcePositionsOnly, true);
    assert.equal(state.extraDraws, 2, 'only one extra instanced batch for all actual historical deck locations');
    effect.update(snapshot({ tick: 123, intent: { mode: 'aligning', targetPlatformId: 'floor-7:forged' } }), displaced);
    assert.equal(effect.group.visible, false,
      'presentational options cannot label another platform as the AI-selected target');
    effect.update(snapshot({ tick: 121 }), moving);
    effect.update(snapshot({ tick: 122 }), displaced);
    const echo = effect.group.children[1];
    const matrix = new THREE.Matrix4();
    echo.getMatrixAt(0, matrix);
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    const historicCenter = moving.x + moving.width * .5;
    const historicAngle = (historicCenter / 480000 - .5) * 2.2;
    assert.ok(Math.abs(position.x - Math.sin(historicAngle) * 27.12) < 1e-5);
    assert.ok(Math.abs(position.z - Math.cos(historicAngle) * 27.12) < 1e-5);
    assert.ok(Math.abs(position.y - (moving.y + moving.height) / 10000 - .18) < 1e-5);
    assert.equal(effect.group.visible, true);
    // Repeated packets and a zero-displacement tick never fabricate motion.
    effect.update(snapshot({ tick: 122 }), displaced);
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 1);
    effect.update(snapshot({ tick: 123 }), displaced);
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 1);
    // Changing the autonomous choice clears previous platform history.
    effect.update(snapshot({ tick: 124, intent: { mode: 'aligning', targetPlatformId: 'floor-7:other' } }), { ...displaced, id: 'floor-7:other' });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0);
    effect.update(snapshot({ tick: 125, intent: { mode: 'aligning', targetPlatformId: 'floor-7:other' } }), { ...displaced, id: 'floor-7:other', x: displaced.x + 7400 },
      { reducedMotion: true });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0,
      'reduced-motion viewers get the stable current objective, not moving ghosts');
    assert.equal(effect.diagnostics().extraDraws, 1);
    effect.update(snapshot({ tick: 126, lifecycle: 'intermission' }), displaced);
    assert.equal(effect.diagnostics().markers, 0);
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0);
    effect.update(snapshot({ tick: 127 }), displaced, { stale: true });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0);
    effect.update(snapshot({ tick: 128, runToken: 'run-8' }), displaced);
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0,
      'a fresh run cannot inherit old deck motion evidence');
  } finally { effect.dispose(); }
});

test('large gaps between actual source ticks never join unrelated moving-platform positions', async () => {
  const [THREE, { createTowerRouteIntent }] = await loaded;
  const effect = createTowerRouteIntent(THREE);
  try {
    const moving = { ...landing, kind: 'moving' };
    effect.update(snapshot({ tick: 12 }), moving);
    effect.update(snapshot({ tick: 15 }), { ...moving, x: moving.x + 3000 });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 1);
    effect.update(snapshot({ tick: 40 }), { ...moving, x: moving.x + 22000 });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0,
      'a disconnected spectator cannot infer intermediate source positions');
    effect.update(snapshot({ tick: 41 }), { ...moving, x: moving.x + 23000 });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 1);
    effect.update(snapshot({ tick: 42, enemies: [{ active: true, telegraph: true }] }),
      { ...moving, x: moving.x + 24000 });
    assert.equal(effect.diagnostics().observedMovingDeckEchoes, 0,
      'real enemy windup takes priority over route cosmetics');
  } finally { effect.dispose(); }
});
