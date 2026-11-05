'use strict';
// Engineering contracts for the SAME authentic traversal-weather/audio slice.
// Green here is a safety veto only: no blind full-motion quality result.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const url = file => pathToFileURL(path.join(ROOT, file)).href;
const modules = Promise.all([
  import(url('node_modules/three/build/three.module.js')),
  import(url('public/infinite-tower-climb/visuals/atmosphere.mjs')),
  import(url('public/infinite-tower-climb/visuals/traversal-kinetics.mjs')),
]);
const source = (player = {}, overrides = {}) => ({
  lifecycle: 'running', runToken: 'kinetic-stage-1', floor: 4,
  tick: 300, theme: 'storm', worldWidth: 480000, chunkBaseY: 1000000,
  player: { x: 240000, y: 1390000, state: 'standing',
    health: 5, maxHealth: 5, vx: 0, vy: 0, ...player },
  enemies: [], ...overrides,
});

test('a present 20Hz airborne velocity, never an intent, authorizes the kinetic stage', async () => {
  const [, , { observedTraversalKinetics: observe }] = await modules;
  const calm = observe(source({ state: 'standing', vy: 20000 }));
  assert.deepEqual(calm, { ascent: 0, descent: 0, airflow: 0, shear: 0,
    launch: 0, apex: 0, landingReadiness: 0 });
  const rise = observe(source({ state: 'airborne', vy: 18000, vx: 6000 }));
  assert.equal(rise.ascent, 1);
  assert.equal(rise.descent, 0);
  assert.equal(rise.airflow, 1);
  assert.equal(rise.shear, .5);
  const fall = observe(source({ state: 'airborne', vy: -18000, vx: -12000 }));
  assert.equal(fall.descent, 1);
  assert.equal(fall.ascent, 0);
  assert.equal(fall.shear, -1);
  assert.equal(observe(source({ state: 'airborne', vy: 600 })).airflow, 0);
  for (const invalid of [
    source({ state: 'airborne', vy: NaN }),
    source({ state: 'airborne', vy: 10000, health: 0 }),
    source({ state: 'airborne', vy: 10000 }, { lifecycle: 'result' }),
    source({ state: 'airborne', vy: 10000 }, { stale: true }),
    source({ state: 'airborne', vy: 10000 }, { tick: -1 }),
    source({ state: 'airborne', vy: 10000 }, { runToken: '' }),
  ]) assert.equal(observe(invalid).airflow, 0);
});

test('existing single-draw 3D weather is now anchored to world altitude rather than glued to the hero', async () => {
  const [THREE, { createTowerAtmosphere }] = await modules;
  const fx = createTowerAtmosphere(THREE);
  try {
    const mesh = fx.group.getObjectByName('SourceBoundBiomeAtmosphere');
    const baseline = source();
    const original = JSON.stringify(baseline);
    fx.update(baseline, { quality: 'low' });
    assert.equal(JSON.stringify(baseline), original);
    assert.equal(mesh.count, 40);
    const y1 = Array.from({ length: 40 }, (_, i) => mesh.instanceMatrix.array[i * 16 + 13]);
    fx.update(source({ y: baseline.player.y + 17000 }), { quality: 'low' });
    const y2 = Array.from({ length: 40 }, (_, i) => mesh.instanceMatrix.array[i * 16 + 13]);
    const retained = y1.filter((y, i) => Math.abs(y - y2[i]) < .002).length;
    assert.ok(retained >= 26, 'most exterior motes remain at physical world Y during hero ascent');
    assert.equal(mesh.material.depthTest, true);
    assert.equal(mesh.material.depthWrite, false);
    assert.equal(fx.diagnostics().drawCallsIfVisible, 1);
    assert.match(fx.diagnostics().verticalParallax, /world-anchored/);
  } finally { fx.dispose(); }
});

test('real upward and downward velocities visibly stretch one bounded near wake without duplicating draws', async () => {
  const [THREE, { createTowerAtmosphere }] = await modules;
  const fx = createTowerAtmosphere(THREE);
  const mesh = fx.group.getObjectByName('SourceBoundBiomeAtmosphere');
  const matrix = new THREE.Matrix4(), scale = new THREE.Vector3();
  const pos = new THREE.Vector3(), q = new THREE.Quaternion();
  function height() {
    mesh.getMatrixAt(0, matrix);
    matrix.decompose(pos, q, scale);
    return scale.y;
  }
  try {
    fx.update(source(), { quality: 'low' });
    const stillHeight = height();
    fx.update(source({ state: 'airborne', vy: 17000 }), { quality: 'low' });
    const riseHeight = height();
    fx.update(source({ state: 'airborne', vy: -17000 }), { quality: 'low' });
    const fallHeight = height();
    assert.ok(riseHeight > stillHeight * 2, 'ascending air has a source-velocity wake');
    assert.ok(fallHeight > stillHeight * 2, 'descending air is equally physical');
    assert.equal(mesh.count, 40);
    fx.update(source({ state: 'airborne', vy: 17000,
      health: 1 }, { enemies: [{ active: true, telegraph: true }] }), { quality: 'low' });
    assert.ok(mesh.material.opacity < .3, 'real combat remains clearer than atmospheric wake');
    fx.update(source({ state: 'airborne', vy: 17000 }), { reducedMotion: true });
    assert.equal(mesh.count, 0);
    assert.equal(mesh.visible, false);
  } finally { fx.dispose(); }
});
