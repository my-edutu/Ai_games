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
    assert.equal(effect.group.children.length, 1, 'all markers are one instanced draw');
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
  assert.equal(effect.group.children.length, 0);
  assert.equal(effect.diagnostics().disposed, true);
});
