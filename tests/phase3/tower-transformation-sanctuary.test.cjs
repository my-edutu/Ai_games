'use strict';
// Source-bound tests for the first transformation-first environment vertical slice.
// A geometry PASS is not an art-quality PASS: judge real paired GPU screenshots separately.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-transform-'));
const srcPath = path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs');
const threeURL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const source = fs.readFileSync(srcPath, 'utf8')
 .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeURL))
 .replace("'./coordinates.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href))
 .replace("'./world-surface.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/world-surface.mjs')).href));
const localPath = path.join(fixtureDir, 'world.mjs');
fs.writeFileSync(localPath, source);
const loaded = Promise.all([import(threeURL), import(pathToFileURL(localPath).href)]);
test.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

function fixture(theme, floor) {
 return Object.freeze({runToken:'transformation-regression', floor, theme,
 worldWidth:480000, chunkBaseY:floor * 360000, chunkHeight:360000, platforms:[], hazards:[] });
}

test('monumental carved sanctuary has real through-openings rather than wall decals', async () => {
 const [THREE, worldModule] = await loaded;
 assert.equal(typeof worldModule.createRuinsSanctuaryArchGeometry, 'function');
 const geometry=worldModule.createRuinsSanctuaryArchGeometry(THREE);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 try {
  const mesh=new THREE.Mesh(geometry,material); mesh.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  ray.set(new THREE.Vector3(0,5,4),new THREE.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(mesh).length,0,'the central opening must be genuinely hollow');
  ray.set(new THREE.Vector3(3.6,5,4),new THREE.Vector3(0,0,-1));
  assert.ok(ray.intersectObject(mesh).length>0,'the limestone outer pier must be solid');
  geometry.computeBoundingBox();
  assert.ok(geometry.boundingBox.max.y>12 && geometry.boundingBox.min.y<=0,
    'a monumental facade establishes architectural human-to-robot scale');
 } finally { geometry.dispose();material.dispose(); }
});

test('Ruins flagship shows multi-layer architecture and vegetation without crowding gameplay or leaking biomes', async () => {
 const [THREE, {createTowerWorld}]=await loaded;
 const world=createTowerWorld();
 try {
  world.update(fixture('ruins',1),.016,0,{});
  const d=world.diagnostics();
  assert.ok(d.ruinsSanctuaryArches>=3,'at least three architecturally distinct depth landmarks');
  assert.ok(d.ruinsSanctuaryPlants>=50,'garden silhouettes are actual geometry');
  assert.ok(d.ruinsSanctuaryCascadePanels>=2,'layered cascades distinguish ruins from bare tower');
  assert.ok(d.meshes+d.shadowCasterMeshes<=100,'art transformation cannot abandon the draw budget');
  assert.ok(d.triangles<350000,'detail must respect geometry budget');
  const stone=[];world.group.traverse(x=>{if(x.isMesh && x.material?.name==='ruins-sanctuary-stone')stone.push(x);});
  assert.equal(stone.length,1,'masonry should be batched into a single textured material');
  world.update(fixture('foundry',2),.016,1,{});
  const foundry=world.diagnostics();
  assert.equal(foundry.ruinsSanctuaryArches,0,'ruins architecture cannot leak to Foundry');
  assert.equal(foundry.ruinsSanctuaryCascadePanels,0,'cascade resources are floor owned');
 } finally { world.dispose(); }
});
