'use strict';
// Measured P0: browser->real WebGL render return dominates source Floor9.
// This inspects the ACTUAL assembled world, not a duplicate batch algorithm.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-indexed-upload-'));
test.after(() => fs.rmSync(tmp, {recursive:true, force:true}));
const file = p => pathToFileURL(path.join(ROOT, p)).href;
const three = file('node_modules/three/build/three.module.js');
const src = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs'), 'utf8')
  .replace("'/tower/vendor/three.module.js'", JSON.stringify(three))
  .replace("'./coordinates.mjs'", JSON.stringify(file('public/infinite-tower-climb/visuals/coordinates.mjs')))
  .replace("'./world-surface.mjs'", JSON.stringify(file('public/infinite-tower-climb/visuals/world-surface.mjs')))
  .replace("'./guardian-transmission-layout.mjs'", JSON.stringify(file('public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')))
  .replace("'./mesh-provenance.mjs'", JSON.stringify(file('public/infinite-tower-climb/visuals/mesh-provenance.mjs')))
  .replace("'./scene-hierarchy.mjs'", JSON.stringify(file('public/infinite-tower-climb/visuals/scene-hierarchy.mjs')));
fs.writeFileSync(path.join(tmp, 'world.mjs'), src);
const worldModule = import(pathToFileURL(path.join(tmp, 'world.mjs')).href);
const provenanceModule = import(file('public/infinite-tower-climb/visuals/mesh-provenance.mjs'));
const snapshot = () => ({
  runToken:'immutable-capture-floor9', tick:452, floor:9, lifecycle:'running',
  theme:'void', chunkBaseY:3240000, chunkHeight:360000, worldWidth:480000,
  platforms:[{id:'f9:ground',kind:'ground',x:0,y:3240000,width:480000,height:12000}],
  hazards:[], enemies:[],
  player:{x:324296,y:3266000,grounded:true,groundedPlatformId:'f9:ground',
    health:5,halfWidth:9000,halfHeight:14000,state:'standing'},
});
test('real assembled floor 9 selectively uploads fewer GPU vertex bytes with exact face ownership', async () => {
  const [{createTowerWorld},{sourceTriangleOwner}] = await Promise.all([worldModule,provenanceModule]);
  const world=createTowerWorld(), source=snapshot(), frozen=JSON.stringify(source);
  try {
    world.update(source, .016, 0, {quality:'low'});
    const batches=[];
    world.group.traverse(o => { if (o.isMesh && o.name === 'rigid-material-batch') batches.push(o); });
    assert.ok(batches.length > 0, 'inspect real live scene batches');
    let saved=0, indexed=0, previousBytes=0, currentBytes=0;
    for (const mesh of batches) {
      const g=mesh.geometry, owners=g.userData.originalTriangleOwners, index=g.index;
      assert.ok(Array.isArray(owners) && owners.length > 0, 'original mesh ownership survives batching');
      const count=index ? index.count : g.attributes.position.count;
      assert.equal(count%3,0);
      assert.equal(owners[0].startFace,0);
      assert.equal(owners[owners.length-1].endFace,count/3,
        'provenance retains the exact source triangle ordinals');
      const sourceOwned=sourceTriangleOwner(g,Math.floor(count/6));
      assert.ok(sourceOwned?.authoringPath?.length > 0);
      const positions=g.attributes.position;
      const normals=g.attributes.normal;
      const uvs=g.attributes.uv;
      assert.equal(normals.count,positions.count);
      assert.equal(uvs.count,positions.count);
      const oldBytes=count*8*4;
      const realBytes=positions.count*8*4+(index?.array?.byteLength||0);
      previousBytes+=oldBytes;currentBytes+=realBytes;
      assert.ok(realBytes<=oldBytes, 'never exchange more upload bytes for index overhead');
      if(index) {
        indexed++;
        assert.ok(positions.count < count, 'indexed batch must share genuine vertices');
        assert.ok(index.count/3 === owners[owners.length-1].endFace);
        for(const v of index.array)assert.ok(v>=0 && v<positions.count);
        saved+=oldBytes-realBytes;
      }
    }
    assert.ok(indexed>0 && saved>0, 'large static floor batches must make a measurable upload reduction');
    assert.ok(currentBytes<previousBytes, 'whole floor reduces total static upload payload');
    assert.equal(JSON.stringify(source),frozen,'render optimization never edits authoritative snapshots');
    // Updating the same source cannot allocate another floor or abandon owner metadata.
    const first=batches[0].geometry;
    world.update(source,.016,.016,{quality:'low'});
    assert.equal(batches[0].geometry,first);
  } finally {
    world.dispose();
    assert.equal(world.diagnostics().meshes,0);
  }
});
