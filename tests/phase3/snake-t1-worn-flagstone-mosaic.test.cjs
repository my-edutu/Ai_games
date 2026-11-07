'use strict';
// T1 physical native acceptance: change the complete visible traversable stone
// field, not only distant masonry, without changing a single gameplay cell.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'public/snake-stream/world.mjs'), 'utf8');
const originalHash = 'bdb874dd4d75c7cc2bffddac0176c6d51b627765';

test('T1 original court is an independently identified pre-mosaic source, not a false baseline', () => {
  const frozen = fs.readFileSync(path.join(root, 'tests/fixtures/snake-t1-before-forest-mosaic-3c48.mjs'), 'utf8');
  assert.equal(crypto.createHash('sha1').update(frozen).digest('hex'), originalHash);
  assert.doesNotMatch(frozen, /export function sculptForestMosaicTile/);
  assert.match(source, /export function sculptForestMosaicTile/);
  assert.match(fs.readFileSync(path.join(root, 'tests/browser/snake-stream.spec.cjs'), 'utf8'), /expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});

test('T1 physically breaks the repeated bright grid at true cell centres without losing native visual resources or cues', async () => {
  const THREE = await import('three');
  const { createWorld, sculptForestMosaicTile, planCohesiveRuinsPaving } = await import('../../public/snake-stream/world.mjs');
  const before = await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(
    path.join(root, 'tests/fixtures/snake-t1-before-forest-mosaic-3c48.mjs'), 'utf8'
  )).toString('base64'));
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    const previous=before.createWorld(THREE,{width,height}), candidate=createWorld(THREE,{width,height});
    try {
      const a=previous.stats(),b=candidate.stats();
      for(const key of ['staticMeshes','drawObjects','geometries','materials','textures'])
        assert.equal(b[key],a[key],`retain old GPU materials, geometry and draw batches ${width}x${height} ${key}`);
      const actualSlabs=planCohesiveRuinsPaving(width,height).length;
      assert.equal(b.staticInstances,a.staticInstances-(width*height-actualSlabs),
        'all non-paving trees, forest, coastal sculpture and cues remain; only duplicate per-cell stone pieces become cohesive masses');
      const scales=[],angles=[],chips=[];
      for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
        const stone=sculptForestMosaicTile(x,z,width,height);
        assert.deepEqual(Object.keys(stone).sort(),['chip','rotation','scale'].sort());
        assert.ok(Object.values(stone).every(Number.isFinite),'deterministic finite geometry');
        assert.ok(stone.scale>=.86 && stone.scale<=.99,'sculpted surface remains a real safe walking stone');
        assert.ok(stone.chip>=.02 && stone.chip<=.13,'organic corners instead of repeated square tiles');
        // The 3D decorative slab must never enter a neighbour's true cell.
        assert.ok(stone.scale * (Math.cos(stone.rotation)+Math.abs(Math.sin(stone.rotation)))<=.995,
          'rotated stone stays within its true cell, keeping reliable food/hazard/portal positions');
        scales.push(stone.scale);angles.push(stone.rotation);chips.push(stone.chip);
      }
      assert.ok(Math.max(...scales)-Math.min(...scales)>.055,'materially varied physical moss seams');
      assert.ok(Math.max(...angles)-Math.min(...angles)>.07,'fragmented stone layout, not an orthogonal grid');
      assert.ok(Math.max(...chips)-Math.min(...chips)>.05,'organic broken stone silhouette across the board');
      const originalSnapshot=Object.freeze({obstacles:Object.freeze([width+1]),hazards:Object.freeze([{cell:5,active:true}]),
        portals:Object.freeze([{entry:2,exit:width*height-2}]),food:Object.freeze({cell:width+2,kind:'normal'})});
      candidate.update(originalSnapshot,{time:1,reducedMotion:false});previous.update(originalSnapshot,{time:1,reducedMotion:false});
      assert.equal(candidate.stats().portalEnds,previous.stats().portalEnds);
      assert.equal(candidate.stats().hazards,previous.stats().hazards);
      assert.equal(candidate.stats().obstacles,previous.stats().obstacles);
      const field = candidate.group.children.find(mesh => mesh.isMesh && mesh.userData.staticWorld
        && mesh.material?.map?.image?.width===1024);
      const previousField= previous.group.children.find(mesh => mesh.isMesh && mesh.userData.staticWorld
        && mesh.material?.map?.image?.width===1024);
      assert.ok(field && previousField,'true indexed GPU traversable field exists in original static batch');
      assert.ok(field.geometry.index.count<previousField.geometry.index.count,
        'genuine complete courtyard triangle reduction, not shader-only cosmetic change');
      assert.ok(field.geometry.attributes.position.count<previousField.geometry.attributes.position.count,
        'retain complete safe cell coverage using fewer native top vertices');
      assert.notDeepEqual(Array.from(field.geometry.attributes.position.array.slice(0,100)),
        Array.from(previousField.geometry.attributes.position.array.slice(0,100)),
        'existing rendered world field actually changes its 3D geometry, not only a tiny pixel recolor');
    } finally {previous.dispose();candidate.dispose();}
  }
});
