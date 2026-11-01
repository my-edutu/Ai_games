'use strict';
const {stripR52Canopy} = require('../helpers/snake-r52-canopy-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const { stripR50Stone } = require('../helpers/snake-stone-archive.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

test('the 3D garden has bounded raised landscape silhouettes in every camera heading', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    try {
      const sectors = new Set();
      world.group.traverse(mesh => {
        if (!mesh.isMesh || !mesh.userData.staticWorld) return;
        const p = mesh.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          if (y < 3) continue;
          if (x < -width / 2 - 8) sectors.add('west');
          if (x > width / 2 + 8) sectors.add('east');
          if (z < -height / 2 - 8) sectors.add('north');
          if (z > height / 2 + 8) sectors.add('south');
          assert.ok(Math.abs(x) < width / 2 + 48 && Math.abs(z) < height / 2 + 48 && y < 12,
            'landscape remains inside the declared scene envelope');
        }
      });
      assert.deepEqual([...sectors].sort(), ['east', 'north', 'south', 'west'],
        `detail camera must not turn toward an empty horizon on ${width}x${height}`);
      const stats = world.stats();
      assert.ok(stats.staticMeshes <= 13, 'reuse existing material batches');
      assert.equal(stats.textures, 4, 'no new downloaded or generated texture allocations');
      assert.ok(stats.geometries <= 37, 'one shared continuous cliff primitive, not per-island allocation');
    } finally { world.dispose(); }
  }
});

test('horizon and sculpt preserve the exact historic court baseline and all other stonework vertices', async () => {
  const THREE = await import('three');
  const fs = require('node:fs'), path = require('node:path');
  const { createHash } = require('node:crypto');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  // R32 intentionally sculpts only bounded original court top corners.
  // Preserve the old baseline's exact previous model and fixed historical
  // digests instead of weakening the original provenance assertion.
  const { restorePreR42Water } = require('../helpers/snake-water-flow-archive.cjs');
  // Only archive the five later R42 water-shader edits for this R31/R32
  // historical SHA; the live world below still uses the new shader.
  const latestWithDrainage = stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/world.mjs'), 'utf8')))));
  const r41Begin = '      // BEGIN R41 COURTYARD ROOT CHANNELS\n';
  const r41End = '      // END R41 COURTYARD ROOT CHANNELS\n';
  const r41A = latestWithDrainage.indexOf(r41Begin), r41B = latestWithDrainage.indexOf(r41End);
  assert.ok(r41A >= 0 && r41B > r41A, 'reversible color-only R41 addition');
  const latest = latestWithDrainage.slice(0, r41A) + latestWithDrainage.slice(r41B + r41End.length);
  // The later R35 color-atlas patina is deliberately absent from the
  // historical geometry source hash; it changes no vertex and is separately tested.
  const lichenBegin='      // BEGIN R35 PERIMETER LICHEN\n';
  const lichenEnd='      // END R35 PERIMETER LICHEN\n';
  const la=latest.indexOf(lichenBegin),lb=latest.indexOf(lichenEnd);
  assert.ok(la>=0&&lb>la,'isolated later texture treatment');
  const historic=latest.slice(0,la)+latest.slice(lb+lichenEnd.length);
  const startMarker = '          // BEGIN R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const endMarker = '          // END R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const a = historic.indexOf(startMarker), b = historic.indexOf(endMarker);
  assert.ok(a >= 0 && b > a && historic.indexOf(startMarker,a + 1) < 0, 'one bounded cosmetic geometry insertion');
  const normalInsert = '\n    if (sourceMaterial === tileMat) merged.computeVertexNormals();';
  assert.equal(historic.split(normalInsert).length, 2, 'matching normal update must be stripped from the historical model');
  const original = (historic.slice(0, a) + historic.slice(b + endMarker.length)).replace(normalInsert,'');
  const sourceGitBlob = createHash('sha1').update('blob ' + Buffer.byteLength(original))
    .update(Buffer.from([0])).update(original).digest('hex');
  assert.equal(sourceGitBlob, '4c50160ffb9c78b822cf2cb8d670e29baf994fea', 'historical model is exact parent Git blob');
  const { createWorld: baselineWorld } = await import('data:text/javascript;base64,' + Buffer.from(original).toString('base64'));
  // Captured from c086716's actual model before distant landscape construction.
  const fixtures = [[8, 8, '04f2ae8f27ea38d45ca700bd0a582475be0b90c9d9eb67cfdb228643c80f3977'],
    [28, 16, '277c7d660f88c2c90a9956b096919d5a1e3c5eaede155d0bd4642acd8ea8f55b'],
    [40, 24, '587de9395e35166688cbdc109be5509b2c733e45f3dfe0dbd1c47b2b11f238c5']];
  for (const [width,height,expected] of fixtures) {
    const baseline = baselineWorld(THREE,{width,height});
    const world = createWorld(THREE,{width,height});
    try {
      const values = [];
      baseline.group.traverse(mesh => {
        if (!mesh.isMesh || !mesh.userData.staticWorld) return;
        const p=mesh.geometry.attributes.position;
        for(let i=0;i<p.count;i++)
          if(Math.abs(p.getX(i))<=width/2+1 && Math.abs(p.getZ(i))<=height/2+1)
            values.push(p.getX(i),p.getY(i),p.getZ(i));
      });
      const digest=createHash('sha256').update(Buffer.from(new Float32Array(values).buffer)).digest('hex');
      assert.equal(digest,expected,'original playable court and coping remain exact to historical fixture');
      const oldMeshes=baseline.group.children.filter(mesh=>mesh.isMesh&&mesh.userData.staticWorld);
      const newMeshes=world.group.children.filter(mesh=>mesh.isMesh&&mesh.userData.staticWorld);
      assert.equal(oldMeshes.length,13);
      assert.equal(newMeshes.length,oldMeshes.length,'original static material batches remain');
      let compared=0,foundCourt=false;
      for(let i=0;i<oldMeshes.length;i++){
        const previous=oldMeshes[i],current=newMeshes[i];
        assert.equal(current.name,previous.name,'static material batch and order unchanged');
        const before=previous.geometry.attributes.position.array;
        const after=current.geometry.attributes.position.array;
        assert.equal(after.length,before.length,'no extra vertex allocations');
        const isCourt=previous.material?.map?.image?.width===1024&&previous.material.map.image.height===512;
        if(isCourt){foundCourt=true;continue;}
        assert.equal(Buffer.compare(Buffer.from(before.buffer,before.byteOffset,before.byteLength),
          Buffer.from(after.buffer,after.byteOffset,after.byteLength)),0,
          'all non-court cliffs, coping and flora retain exact geometry bytes: '+current.name);
        compared++;
      }
      assert.ok(foundCourt&&compared===12,'only the individually tested playable slab corners may move');
    } finally {baseline.dispose();world.dispose();}
  }
});
