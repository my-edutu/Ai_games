'use strict';
const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const SOURCE = path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-world-regression-'));
const threeURL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const surfaceURL = pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const coordinatesURL = pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
// Exercise the shipped module. Only its browser import URLs are adapted.
const source = fs.readFileSync(SOURCE, 'utf8')
  .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeURL))
  .replace("'./coordinates.mjs'", JSON.stringify(coordinatesURL))
  .replace("'./world-surface.mjs'", JSON.stringify(surfaceURL));
const localModule = path.join(scratch, 'world.mjs');
fs.writeFileSync(localModule, source);
const loaded = Promise.all([import(threeURL), import(pathToFileURL(localModule).href), import(coordinatesURL), import(surfaceURL)]);
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function fixture(theme, floor = 0, withPlatforms = true, allHazards = false) {
  const base = floor * 360000;
  const widths = [480000, 115000, 125000, 135000, 125000, 115000, 135000, 249600];
  return freeze({
    runToken: `geometry-run-${Math.floor(floor / 5)}`, floor, theme,
    worldWidth: 480000, chunkBaseY: base, chunkHeight: 360000,
    platforms: withPlatforms ? widths.map((width, index) => ({
      id: `p${index}`, kind: index === 3 ? 'moving' : 'oneway',
      x: index === 0 ? 0 : index === 7 ? 115200 : index % 2 ? 50000 : 270000,
      y: base + index * 43000, width, height: index === 0 || index === 7 ? 12000 : 10000,
    })) : [],
    hazards: (allHazards ? ['spikes', 'heat', 'crusher', 'lightning', 'void'] : ['heat']).map((kind, index) => ({
      id: `h${index}`, kind, x: 200000, y: base + 120000, width: 32000, height: 9000, active: true,
    })),
  });
}

function named(group, name) {
  let found;
  group.traverse(object => { if (object.name === name) found = object; });
  assert.ok(found, `Missing scene object ${name}`);
  return found;
}

function vertices(THREE, root, visit) {
  root.updateWorldMatrix(true, true);
  const position = new THREE.Vector3(), matrix = new THREE.Matrix4(), instance = new THREE.Matrix4();
  root.traverse(object => {
    if (!object.isMesh) return;
    const attribute = object.geometry.attributes.position;
    for (let copy = 0; copy < (object.isInstancedMesh ? object.count : 1); copy++) {
      if (object.isInstancedMesh) {
        object.getMatrixAt(copy, instance);
        matrix.multiplyMatrices(object.matrixWorld, instance);
      } else matrix.copy(object.matrixWorld);
      for (let index = 0; index < attribute.count; index++) {
        position.fromBufferAttribute(attribute, index).applyMatrix4(matrix);
        assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z));
        visit(position, object);
      }
    }
  });
}

test('tower architecture keeps the complete cylindrical traversal corridor clear', async () => {
  const [THREE, { createTowerWorld, THEMES }] = await loaded;
  const world = createTowerWorld();
  const ambient = new Set(['distant-atmosphere', 'ambient-clouds', 'ambient-particles']);
  try {
    for (const [floor, theme] of Object.keys(THEMES).entries()) {
      const input = fixture(theme, floor, false);
      world.update(freeze({ ...input, hazards: [] }), 0, 0, {});
      let radius = 0, inspected = 0;
      vertices(THREE, world.group, (vertex, object) => {
        if (ambient.has(object.material.name)) return;
        radius = Math.max(radius, Math.hypot(vertex.x, vertex.z));
        inspected++;
      });
      assert.ok(inspected > 1000, `${theme}: clearance assertion must inspect actual architecture`);
      assert.ok(radius <= 23.4, `${theme}: tower radius ${radius} enters the traversal corridor`);
    }
  } finally { world.dispose(); }
});

test('rendered platform tops match current authoritative bounds including moving decks', async () => {
  const [THREE, { createTowerWorld, THEMES }, { SCALE, ARC }] = await loaded;
  const world = createTowerWorld();
  function check(snapshot) {
    for (const platform of snapshot.platforms) {
      const root = named(world.group, `platform:${platform.id}`);
      const top = (platform.y + platform.height - snapshot.chunkBaseY) / SCALE;
      let minX = Infinity, maxX = -Infinity, maxY = -Infinity, topVertices = 0;
      vertices(THREE, root, vertex => {
        maxY = Math.max(maxY, vertex.y);
        if (Math.abs(vertex.y - top) > 1e-6) return;
        const x = (Math.atan2(vertex.x, vertex.z) / ARC + .5) * snapshot.worldWidth;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); topVertices++;
      });
      assert.ok(topVertices > 5, `${platform.id}: missing rendered landing surface`);
      assert.ok(Math.abs(maxY - top) < 1e-6, `${platform.id}: rendered top ${maxY} differs from ${top}`);
      assert.ok(Math.abs(minX - platform.x) < .03, `${platform.id}: incorrect left landing edge ${minX}`);
      assert.ok(Math.abs(maxX - platform.x - platform.width) < .03, `${platform.id}: incorrect right landing edge ${maxX}`);
    }
  }
  try {
    for (const [floor, theme] of Object.keys(THEMES).entries()) {
      const snapshot = fixture(theme, floor);
      world.update(snapshot, .016, 0, {}); check(snapshot);
      const counts = world.diagnostics();
      assert.ok(counts.meshes + counts.shadowCasterMeshes <= 100, `${theme}: representative world submission budget exceeded`);
      const moved = freeze({ ...snapshot, platforms: snapshot.platforms.map(platform => platform.kind === 'moving'
        ? { ...platform, x: platform.x + 17000, y: platform.y + 2300 } : platform) });
      world.update(moved, .016, 1, {}); check(moved);
    }
  } finally { world.dispose(); }
});

test('active hazard geometry stays inside its authoritative arc and height throughout animation', async () => {
  const [THREE, { createTowerWorld }, { SCALE, ARC }] = await loaded;
  const world = createTowerWorld();
  try {
    for (const [floor, kind] of ['spikes', 'heat', 'crusher', 'lightning', 'void'].entries()) {
      const input = fixture('foundry', floor, false);
      const hazard = { ...input.hazards[0], kind };
      const snapshot = freeze({ ...input, hazards: [hazard] });
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let sample = 0; sample <= 40; sample++) {
        world.update(snapshot, .016, sample * .5, {});
        const live = named(world.group, `hazard:${hazard.id}`).children.find(object => object.isGroup);
        assert.ok(live?.visible, `${kind}: active danger must be rendered`);
        vertices(THREE, live, vertex => {
          const x = (Math.atan2(vertex.x, vertex.z) / ARC + .5) * snapshot.worldWidth;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, vertex.y); maxY = Math.max(maxY, vertex.y);
        });
      }
      const bottom = (hazard.y - snapshot.chunkBaseY) / SCALE;
      const top = (hazard.y + hazard.height - snapshot.chunkBaseY) / SCALE;
      assert.ok(minX >= hazard.x - .02 && maxX <= hazard.x + hazard.width + .02,
        `${kind}: rendered danger x ${minX}..${maxX} exceeds ${hazard.x}..${hazard.x + hazard.width}`);
      assert.ok(minY >= bottom - 1e-6 && maxY <= top + 1e-6,
        `${kind}: rendered danger y ${minY}..${maxY} exceeds ${bottom}..${top}`);
      world.update(freeze({ ...snapshot, hazards: [{ ...hazard, active: false }] }), 0, 0, {});
      assert.equal(named(world.group, `hazard:${hazard.id}`).children.find(object => object.isGroup).visible, false);
    }
  } finally { world.dispose(); }
});

test('floor rebuilds remain bounded and dispose every observed owned resource exactly once', async () => {
  const [THREE, { createTowerWorld, THEMES }] = await loaded;
  const resources = { geometry: new Map(), material: new Map(), instance: new Map() };
  const restorers = [];
  function observe(prototype, method, kind, disposing = false) {
    const original = prototype[method];
    prototype[method] = function (...args) {
      const seen = resources[kind];
      if (!seen.has(this)) seen.set(this, 0);
      if (disposing) seen.set(this, seen.get(this) + 1);
      return original.apply(this, args);
    };
    restorers.push(() => { prototype[method] = original; });
  }
  observe(THREE.BufferGeometry.prototype, 'setAttribute', 'geometry');
  observe(THREE.BufferGeometry.prototype, 'dispose', 'geometry', true);
  observe(THREE.Material.prototype, 'setValues', 'material');
  observe(THREE.Material.prototype, 'dispose', 'material', true);
  observe(THREE.InstancedMesh.prototype, 'setMatrixAt', 'instance');
  observe(THREE.InstancedMesh.prototype, 'dispose', 'instance', true);
  const world = createTowerWorld(), baseline = new Map(), themes = Object.keys(THEMES);
  try {
    for (let floor = 0; floor < 15; floor++) {
      const theme = themes[floor % themes.length], snapshot = fixture(theme, floor, true, true);
      world.update(snapshot, .016, floor, {});
      const diagnostics = world.diagnostics();
      assert.equal(diagnostics.surfaceTexture.ownedTextures, 1, 'One surface texture is shared across floors');
      const counts = ['meshes', 'instances', 'triangles', 'geometries', 'materials'].map(key => diagnostics[key]);
      if (floor >= 10) assert.deepEqual(counts, baseline.get(theme), `${theme}: resource growth after primitive warm-up`);
      baseline.set(theme, counts);
      world.group.traverse(object => {
        for (const value of object.geometry?.attributes.normal?.array || []) assert.ok(Number.isFinite(value));
      });
    }
    world.dispose(); world.dispose();
    const empty = world.diagnostics();
    assert.deepEqual(['meshes', 'instances', 'triangles', 'geometries', 'materials'].map(key => empty[key]), [0, 0, 0, 0, 0]);
    assert.equal(empty.surfaceTexture.ownedTextures, 0);
    for (const [kind, observed] of Object.entries(resources)) {
      assert.ok(observed.size > 20, `Must observe constructed ${kind} resources`);
      for (const count of observed.values()) assert.equal(count, 1, `Every ${kind} must be disposed exactly once`);
    }
  } finally {
    world.dispose();
    for (const restore of restorers.reverse()) restore();
  }
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
const surfaceResponse = () => ({ ok: true, blob: async () => new Uint8Array([1]) });
const surfaceBitmap = () => ({ width: 128, height: 96, closes: 0, close() { this.closes++; } });

test('one decoded stone surface is shared and released exactly once', async () => {
  const [THREE, , , { createStoneSurfaceAsset }] = await loaded;
  const bitmap = surfaceBitmap();
  let requests = 0, disposes = 0;
  const asset = createStoneSurfaceAsset(THREE, {
    request: async () => { requests++; return surfaceResponse(); }, decode: async () => bitmap,
  });
  asset.texture.addEventListener('dispose', () => { disposes++; });
  assert.equal(await asset.settled, true);
  assert.equal(asset.available.value, 1);
  assert.equal(asset.texture.image, bitmap);
  assert.equal(requests, 1);
  assert.equal(asset.diagnostics().ownedTextures, 1);
  asset.dispose(); asset.dispose();
  assert.equal(disposes, 1);
  assert.equal(bitmap.closes, 1);
  assert.equal(asset.texture.image, null);
  assert.equal(asset.diagnostics().ownedTextures, 0);
});

test('a failed stone request preserves the plain-material fallback', async () => {
  const [THREE, , , { createStoneSurfaceAsset }] = await loaded;
  let decoded = false;
  const asset = createStoneSurfaceAsset(THREE, {
    request: async () => ({ ok: false }), decode: async () => { decoded = true; return surfaceBitmap(); },
  });
  assert.equal(await asset.settled, false);
  assert.equal(asset.diagnostics().state, 'failed');
  assert.equal(asset.available.value, 0);
  assert.equal(asset.texture.version, 0);
  assert.equal(decoded, false);
  asset.dispose();
});

test('a late stone decode is closed without reviving a disposed GPU resource', async () => {
  const [THREE, , , { createStoneSurfaceAsset }] = await loaded;
  const pending = deferred(), started = deferred(), bitmap = surfaceBitmap();
  let disposes = 0;
  const asset = createStoneSurfaceAsset(THREE, {
    request: async () => surfaceResponse(), decode: () => { started.resolve(); return pending.promise; },
  });
  asset.texture.addEventListener('dispose', () => { disposes++; });
  await started.promise;
  asset.dispose(); pending.resolve(bitmap);
  assert.equal(await asset.settled, false);
  assert.equal(bitmap.closes, 1);
  assert.equal(asset.available.value, 0);
  assert.equal(asset.texture.image, null);
  assert.equal(asset.texture.version, 0);
  assert.equal(asset.diagnostics().state, 'disposed');
  assert.equal(disposes, 1);
});

test('disposing a pending stone request aborts it before decoding', async () => {
  const [THREE, , , { createStoneSurfaceAsset }] = await loaded;
  const pending = deferred();
  let signal, decoded = false;
  const asset = createStoneSurfaceAsset(THREE, {
    request: (_url, options) => { signal = options.signal; return pending.promise; },
    decode: async () => { decoded = true; return surfaceBitmap(); },
  });
  asset.dispose();
  assert.equal(signal.aborted, true);
  // Deliberately resolve a request that ignored abort to exercise the late guard.
  pending.resolve(surfaceResponse());
  assert.equal(await asset.settled, false);
  assert.equal(decoded, false);
  assert.equal(asset.texture.version, 0);
});
