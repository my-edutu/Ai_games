'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {pathToFileURL} = require('node:url');

// Real installed Three.js world and real instance transforms, not screenshots,
// mock renderer counts or a lowered browser acceptance threshold.
async function loadWorld() {
  const root = path.resolve(__dirname, '../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'maze-pressure-stair-'));
  try {
    fs.mkdirSync(path.join(temp, 'vendor'));
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    for (const filename of ['world.js', 'map-view.mjs', 'gate-moment.mjs'])
      fs.copyFileSync(path.join(root, 'public/ai-maze-escape', filename),
        path.join(temp, filename));
    for (const filename of ['three.module.js', 'three.core.js'])
      fs.copyFileSync(path.join(root, 'node_modules/three/build', filename),
        path.join(temp, 'vendor', filename));
    const THREE = await import(pathToFileURL(path.join(temp, 'vendor/three.module.js')).href);
    const game = await import(pathToFileURL(path.join(temp, 'world.js')).href);
    return {THREE, world: game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp, {recursive:true,force:true})};
  } catch(error) {
    fs.rmSync(temp, {recursive:true,force:true});
    throw error;
  }
}
function frame(pressure = false, extra = {}) {
  return {
    runToken:'known-reciprocal-stair', tick:1, width:3, height:3, currentCell:4,
    // Cell 4 is the lower court, and 1 is a genuinely published higher
    // reciprocal neighbor. Its complete playable staircase must survive.
    cells:[
      {cell:4, neighbors:[1], blocked:false, trap:pressure, checkpoint:false, clue:false},
      {cell:1, neighbors:[4], blocked:false, trap:false, checkpoint:false, clue:false}
    ],
    visibleCells:[4,1], keys:[], doors:[], inventory:[], threats:[],
    exitCell:null, result:null, ...extra
  };
}
function physicalRails(world, THREE) {
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(),
    rotation = new THREE.Quaternion(), scale = new THREE.Vector3(), rails = [];
  // Actual world THREE.InstancedMesh transforms from the published terrace,
  // filtered to the TWO sloping continuous rail segments at this stair.
  world.group.traverse(object => {
    if (!object.isInstancedMesh) return;
    for (let i=0; i<object.count; i++) {
      object.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);
      const expectedLength = Math.hypot(1.12, 1.40);
      if (Math.abs(Math.abs(position.x) - .99) < 1e-5
        && Math.abs(position.z + .64) < 1e-5
        && Math.abs(scale.x - .19) < 1e-5
        && Math.abs(scale.y - .17) < 1e-5
        && Math.abs(scale.z - expectedLength) < 1e-5)
        rails.push({x:position.x, y:position.y});
    }
  });
  return rails.sort((a,b)=>a.x-b.x);
}
test('public pressure court lowers real reciprocal stair handrails while preserving every step, privacy and GPU pool', async()=>{
  const {THREE,world,cleanup} = await loadWorld();
  try {
    const ordinary = frame(), frozen = JSON.stringify(ordinary);
    world.update(ordinary);
    const baseline = world.stats(), high = physicalRails(world, THREE);
    assert.equal(high.length,2,'original real stair retains two distinct raised solid rails');
    assert.equal(baseline.stairBalustrades,1,'published reciprocal stair exists');
    assert.deepEqual(baseline.stairEdges,[[4,1]],'real playable staircase is present');

    const pressure = frame(true), pressureFrozen = JSON.stringify(pressure);
    world.update(pressure);
    const cleared = world.stats(), low = physicalRails(world, THREE);
    assert.equal(low.length,2,'cutaway retains BOTH physically connected stair barriers');
    assert.equal(cleared.stairBalustrades,1,'same genuine published stair remains');
    assert.deepEqual(cleared.stairEdges,baseline.stairEdges,'stairs and public navigation unchanged');
    for (let i=0; i<2; i++) {
      assert.ok(Math.abs(low[i].x-high[i].x)<1e-8,'side clearances unchanged');
      // InstancedMesh writes its model transforms into Float32Array, so the
      // exact 0.38-unit design drop cannot be compared with double-precision
      // 1e-8 epsilon (2.80 -> 2.42 rounds to 0.379999876 in WebGL).
      // Assert BOTH actual GPU matrix values exactly against the intended
      // authored heights. This is stricter than widening an image threshold.
      assert.equal(high[i].y, Math.fround(2.80),
        'published normal stair has the authored high physical rail');
      assert.equal(low[i].y, Math.fround(2.42),
        'real pressure stair rail is exactly 0.38 lower in GPU geometry');
    }
    for (const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(cleared[key],baseline[key],key+' must not grow');
    assert.equal(JSON.stringify(ordinary),frozen,'ordinary public state immutable');
    assert.equal(JSON.stringify(pressure),pressureFrozen,'published danger state immutable');

    const secret = frame(false,{runToken:'secret-only-trap', privateTrapCells:[4],
      privateMap:{4:'unpublished pressure'}});
    world.update(secret);
    const hiddenRails = physicalRails(world, THREE);
    assert.equal(hiddenRails.length,2,'secret-only data cannot hide rail pieces');
    for (let i=0; i<2; i++)
      assert.ok(Math.abs(hiddenRails[i].y-high[i].y)<1e-8,
        'private-only trap cannot cut away a public stair or reveal a hazard');
    assert.equal(world.stats().responsiveTrapSignals,0,
      'private-only trap cannot make a physical hazard');
  } finally {world.dispose();cleanup();}
});
