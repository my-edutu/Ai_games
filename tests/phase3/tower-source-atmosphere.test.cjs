'use strict';
// Source-level engineering safety for the actual Tower atmosphere. This does
// NOT prove that normal-speed full-motion WebGL is better on desktop or phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const THREE_URL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const MODULE_URL = pathToFileURL(path.join(ROOT,
  'public/infinite-tower-climb/visuals/atmosphere.mjs')).href;
const loaded = Promise.all([import(THREE_URL), import(MODULE_URL)]);
function source(overrides = {}) {
  return {
    lifecycle: 'running', runToken: 'tower-run-001', floor: 3,
    tick: 253, theme: 'storm', worldWidth: 480000, chunkBaseY: 1000000,
    player: { x: 240000, y: 1400000, health: 5 },
    enemies: [], ...overrides,
  };
}
function instances(volume) {
  return volume.group.getObjectByName('SourceBoundBiomeAtmosphere');
}

test('actual 3D instance budget is one transparent depth-tested draw, never a camera overlay', async () => {
  const [THREE, { createTowerAtmosphere }] = await loaded;
  const effect = createTowerAtmosphere(THREE);
  try {
    assert.equal(effect.group.children.length, 1);
    const mesh = instances(effect);
    assert.ok(mesh.isInstancedMesh);
    assert.equal(mesh.material.depthTest, true);
    assert.equal(mesh.material.depthWrite, false);
    assert.equal(mesh.castShadow, false);
    assert.equal(mesh.frustumCulled, false);
    effect.update(source(), { quality: 'low' });
    assert.equal(mesh.count, 40);
    assert.equal(effect.diagnostics().drawCallsIfVisible, 1);
    effect.update(source(), { quality: 'high' });
    assert.equal(mesh.count, 96);
    assert.equal(effect.diagnostics().drawCallsIfVisible, 1);
  } finally { effect.dispose(); }
});

test('weather follows only genuine public-source floor/player/tick with no hidden RNG or mutation', async () => {
  const [THREE, { createTowerAtmosphere }] = await loaded;
  const effect = createTowerAtmosphere(THREE);
  try {
    const frame = source();
    const baseline = JSON.stringify(frame);
    effect.update(frame, { quality: 'low' });
    const mesh = instances(effect);
    const first = Array.from(mesh.instanceMatrix.array.slice(0, 40 * 16));
    effect.update(frame, { quality: 'low' });
    assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 40 * 16)), first);
    assert.equal(JSON.stringify(frame), baseline, 'rendering may not mutate authoritative snapshots');
    effect.update(source({ tick: frame.tick + 10 }), { quality: 'low' });
    assert.notDeepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 40 * 16)), first);
    effect.update(source({ floor: frame.floor + 1 }), { quality: 'low' });
    assert.notDeepEqual(Array.from(mesh.instanceMatrix.array.slice(0, 40 * 16)), first);
    assert.equal(effect.diagnostics().lastFloor, frame.floor + 1);
  } finally { effect.dispose(); }
});

test('all five game biomes have a distinct atmospheric material identity', async () => {
  const [THREE, { createTowerAtmosphere }] = await loaded;
  const effect = createTowerAtmosphere(THREE);
  try {
    const colors = [];
    for (const theme of ['foundry', 'ruins', 'storm', 'clockwork', 'void']) {
      effect.update(source({ theme }), { quality: 'low' });
      const mesh = instances(effect);
      assert.ok(mesh.instanceColor, 'each biome must tint the actual instanced volume');
      colors.push([...mesh.instanceColor.array.slice(0, 3)].map(x => x.toFixed(4)).join(':'));
    }
    assert.equal(new Set(colors).size, 5);
  } finally { effect.dispose(); }
});

test('real guardian windup yields visibility priority; replay, phone reduced motion and recovery clear completely', async () => {
  const [THREE, { createTowerAtmosphere }] = await loaded;
  const effect = createTowerAtmosphere(THREE);
  const mesh = instances(effect);
  try {
    effect.update(source(), { quality: 'low' });
    const calmOpacity = mesh.material.opacity;
    // Use a genuine nearby guardian source, not an enemy with no coordinates.
    // A distant telegraph must NOT extinguish unrelated weather.
    effect.update(source({ enemies: [{ kind:'guardian', active:true,
      telegraph:true, x:240000, y:1400000, health:8, maxHealth:8 }] }),
      { quality: 'low' });
    assert.ok(mesh.material.opacity < calmOpacity);
    for (const [frame, settings] of [
      [source(), { reducedMotion: true }],
      [source(), { stale: true }],
      [source({ lifecycle: 'result' }), {}],
      [source({ player: { x: 10, y: 10, health: 0 } }), {}],
      [source({ tick: -1 }), {}],
      [source({ theme: 'unknown' }), {}],
    ]) {
      effect.update(frame, settings);
      assert.equal(mesh.visible, false);
      assert.equal(mesh.count, 0);
      assert.equal(effect.diagnostics().lastSourceTick, null);
    }
    effect.update(source({ runToken: 'fresh-run', tick: 0 }), { quality: 'low' });
    assert.equal(effect.diagnostics().lastSourceTick, 0);
    assert.equal(mesh.count, 40);
    effect.clear();
    assert.equal(mesh.count, 0);
  } finally { effect.dispose(); }
  assert.equal(effect.group.children.length, 0, 'dispose releases the instance owner');
  effect.update(source(), {});
  assert.equal(effect.diagnostics().visible, false);
});
