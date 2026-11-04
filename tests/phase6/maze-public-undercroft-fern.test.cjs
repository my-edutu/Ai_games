'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Independent physical-geometry critic: import the actual authored world and
// installed Three module, NOT a mocked plant factory or screenshot overlay.
async function loadRealWorld() {
  const root = path.resolve(__dirname, '../..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'maze-undercroft-fern-'));
  try {
    fs.mkdirSync(path.join(tmp, 'vendor'));
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
    for (const file of ['world.js', 'gate-moment.mjs', 'map-view.mjs'])
      fs.copyFileSync(path.join(root, 'public/ai-maze-escape', file), path.join(tmp, file));
    for (const file of ['three.module.js', 'three.core.js'])
      fs.copyFileSync(path.join(root, 'node_modules/three/build', file), path.join(tmp, 'vendor', file));
    return {
      module: await import(pathToFileURL(path.join(tmp, 'world.js')).href),
      THREE: await import(pathToFileURL(path.join(tmp, 'vendor/three.module.js')).href),
      done: () => fs.rmSync(tmp, {recursive:true, force:true}),
    };
  } catch (error) {
    fs.rmSync(tmp, {recursive:true, force:true});
    throw error;
  }
}
const cell = (cellId, overrides = {}) => ({
  cell: cellId, neighbors: [], blocked: false, trap: false,
  checkpoint: false, clue: false, ...overrides,
});
const shot = (cells, overrides = {}) => ({
  runToken: 'public-fern-garden', tick: 1, width: 7, height: 7,
  currentCell: 22, cells, visibleCells: cells.map(c => c.cell),
  doors: [], keys: [], inventory: [], threats: [], exitCell: null,
  result: null, ...overrides,
});
function realRootPositions(world, THREE) {
  const out = [], matrix = new THREE.Matrix4(), point = new THREE.Vector3(), extent = new THREE.Vector3();
  world.group.children[1].traverse(mesh => {
    if (!mesh.isInstancedMesh || mesh.geometry.type !== 'ShapeGeometry'
      || mesh.material.color.getHexString() !== '8caf44') return;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      point.setFromMatrixPosition(matrix);
      extent.setFromMatrixScale(matrix);
      out.push({x: point.x, y: point.y, z: point.z, width: extent.x, length: extent.y});
    }
  });
  return out;
}
test('physical tide-fern mantles hang from the exterior of actual disclosed 3D foundations', async () => {
  const {module, THREE, done} = await loadRealWorld();
  const world = module.createMazeWorld({balanced:true});
  const replay = module.createMazeWorld({balanced:true});
  try {
    const publicShot = shot([cell(22)]);
    const immutable = JSON.stringify(publicShot);
    world.update(publicShot);
    replay.update(shot([cell(22)], {runToken:'different-run', tick:987}));
    const stats = world.stats(), center = module.cellPosition(22,7,7);
    const floor = module.cellHeight(22,7,7);
    assert.equal(stats.hangingFacadeGardens, 2,
      'public cell 22 owns two deterministic, outward-facing undercroft mantles');
    assert.ok(stats.undercroftButtresses >= stats.hangingFacadeGardens);
    const leaves = realRootPositions(world, THREE);
    const east = leaves.filter(p => Math.abs(p.x - (center.x + 1.315)) < .005
      && Math.abs(p.y - (floor - .36)) < .005 && Math.abs(p.z - center.z) < .56);
    const south = leaves.filter(p => Math.abs(p.z - (center.z + 1.315)) < .005
      && Math.abs(p.y - (floor - .36)) < .005 && Math.abs(p.x - center.x) < .56);
    assert.equal(east.length, 3, 'three actual hanging sea-fern blades root on the exterior east facade');
    assert.equal(south.length, 3, 'three actual hanging sea-fern blades root on the exterior south facade');
    assert.ok([...east, ...south].every(p => p.width >= .81 && p.length >= 1.03 && p.length <= 1.37),
      'actual exterior 3D foliage has a substantial sculpted fan silhouette, not a subpixel string');
    assert.ok(stats.geometryCount <= 16 && stats.materialCount <= 26
      && stats.textureCount <= 3, 'no new GPU resource class is introduced');
    assert.equal(stats.instances, replay.stats().instances,
      'the same public cells give deterministic 3D instances, independent of seed or tick');
    assert.equal(JSON.stringify(publicShot), immutable,
      'presentation may not mutate AI public authority');
  } finally { world.dispose(); replay.dispose(); done(); }
});
test('private history never grows scenery, and unsafe/public landmark cells do not wear fern mantles', async () => {
  const {module, done} = await loadRealWorld();
  const world = module.createMazeWorld({balanced:true});
  try {
    world.update(shot([], {privateCells:[cell(22)], hiddenRoute:[22], privateExitCell:22}));
    assert.equal(world.stats().hangingFacadeGardens, 0,
      'zero published cells must give zero modeled foundations');
    world.update(shot([cell(22, {blocked:true})]));
    assert.equal(world.stats().hangingFacadeGardens, 0);
    world.update(shot([cell(22, {trap:true})]));
    assert.equal(world.stats().hangingFacadeGardens, 0);
    world.update(shot([cell(22)], {keys:[{id:'public-key', cell:22, collected:false}]}));
    assert.equal(world.stats().hangingFacadeGardens, 0,
      'physical inventory hardware must remain unobstructed');
    world.update(shot([cell(22)], {exitCell:22}));
    assert.equal(world.stats().hangingFacadeGardens, 0,
      'actual public exit must remain visually unencumbered');
    world.update(shot([cell(22)]));
    assert.equal(world.stats().hangingFacadeGardens, 2);
    world.update(shot([], {runToken:'fresh-empty-run'}));
    assert.equal(world.stats().hangingFacadeGardens, 0,
      'reset must clear the original real instanced geometry');
  } finally { world.dispose(); done(); }
});
