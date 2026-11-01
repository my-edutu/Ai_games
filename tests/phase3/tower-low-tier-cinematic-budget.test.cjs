'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-low-world-'));
const threeURL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const coordinatesURL = pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
const surfaceURL = pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const source = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs'), 'utf8')
  .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeURL))
  .replace("'./coordinates.mjs'", JSON.stringify(coordinatesURL))
  .replace("'./world-surface.mjs'", JSON.stringify(surfaceURL));
const moduleFile = path.join(scratch, 'world.mjs');
fs.writeFileSync(moduleFile, source);
const loaded = Promise.all([import(threeURL), import(pathToFileURL(moduleFile).href)]);
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

const themes = ['foundry', 'ruins', 'storm', 'clockwork', 'void'];
function frame(theme, floor) {
  const chunkBaseY = floor * 360000;
  return Object.freeze({
    runToken: 'budgeted-expedition', floor, theme,
    worldWidth: 480000, chunkBaseY, chunkHeight: 360000,
    platforms: [{ id: 'departure', kind: 'oneway', x: 110000,
      y: chunkBaseY + 32000, width: 110000, height: 12000 }],
    hazards: [{ id: 'moving-hazard', kind: 'heat', x: 250000,
      y: chunkBaseY + 88000, width: 32000, height: 9000, active: true }],
  });
}
function lowSkyline(root) {
  const skyline = [];
  root.traverse(object => {
    if (object.isMesh && object.material?.name === 'distant-atmosphere') skyline.push(object);
  });
  return skyline;
}
function deck(root) {
  return root.getObjectByName('platform:departure');
}
test('five biomes keep a real 3D supported skyline and the full active route in low tier', async () => {
  const [THREE, { createTowerWorld }] = await loaded;
  const world = createTowerWorld();
  try {
    for (let floor = 0; floor < themes.length; floor++) {
      const snapshot = frame(themes[floor], floor);
      world.update(snapshot, .016, floor, { quality: 'high' });
      const high = world.diagnostics();
      const richSkyline = lowSkyline(world.group);
      assert.ok(richSkyline.length >= 1, 'high tier retains original distant architecture');
      assert.ok(richSkyline.some(item => item.material.type === 'MeshStandardMaterial'),
        'high tier keeps material-rich original skyline');
      world.update(snapshot, .016, floor, { quality: 'low' });
      const low = world.diagnostics();
      const skyline = lowSkyline(world.group);
      assert.equal(skyline.length, 1, 'low tier merges original stepped skyline into one draw');
      assert.equal(skyline[0].material.type, 'MeshBasicMaterial', 'far scenery avoids per-pixel PBR');
      assert.equal(skyline[0].material.fog, true);
      assert.equal(skyline[0].castShadow, false, 'far mountains/citadels never enter shadow atlas');
      assert.ok(skyline[0].geometry.attributes.position.count > 100,
        'original low-tier skyline remains a genuine 3D structure, not a billboard');
      skyline[0].geometry.computeBoundingSphere();
      assert.ok(skyline[0].geometry.boundingSphere.radius > 60,
        'low-tier architectural silhouette retains monumental world scale');
      assert.ok(low.triangles < high.triangles,
        'low tier must actually reduce total rendered geometry in ' + snapshot.theme);
      assert.ok(low.instances < high.instances,
        'low tier eliminates translucent far-field clouds and motes');
      assert.equal(low.vistaLayers, 3, 'canyon depth and fog layers survive low tier');
      assert.equal(low.platforms, high.platforms, 'all route decks are unchanged');
      assert.equal(low.hazards, high.hazards, 'all active hazards remain visible');
      assert.ok(deck(world.group), 'authoritative deck remains present');
      assert.ok(world.group.getObjectByName('hazard:moving-hazard'), 'danger remains modeled');
      assert.ok(high.triangles > low.triangles * 1.1,
        'budget reduction must be measurable, not merely a shader rename');
    }
  } finally { world.dispose(); }
});
test('live graphics-quality switching rebuilds only the presentational floor and restores full art', async () => {
  const [, { createTowerWorld }] = await loaded;
  const world = createTowerWorld(), snapshot = frame('ruins', 0);
  try {
    world.update(snapshot, .016, 0, {quality:'low'});
    const first = world.diagnostics();
    assert.equal(first.quality, 'low');
    world.update(snapshot, .016, .5, {quality:'low'});
    const retained = world.diagnostics();
    assert.deepEqual([retained.meshes,retained.triangles],[first.meshes,first.triangles]);
    world.update(snapshot, .016, 1, {quality:'high'});
    const restored = world.diagnostics();
    assert.equal(restored.quality, 'high');
    assert.ok(restored.triangles > first.triangles, 'high-tier skyline restored after graphics change');
    assert.ok(lowSkyline(world.group).some(o => o.material.type === 'MeshStandardMaterial'));
    world.update(snapshot, .016, 2, {quality:'low'});
    const again = world.diagnostics();
    assert.deepEqual([again.meshes,again.triangles,again.instances],
      [first.meshes,first.triangles,first.instances], 'low-tier resources do not accumulate');
  } finally {
    world.dispose();
    assert.equal(world.diagnostics().meshes, 0);
    assert.equal(world.diagnostics().surfaceTexture.ownedTextures, 0);
  }
});
