'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const originalPath = path.join(root, 'tests/fixtures/snake-t1-before-eroded-island-99b.mjs');
const original = fs.readFileSync(originalPath, 'utf8');
const gitBlob = str => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(str) + '\0').update(str).digest('hex');

test('T1 island negative control is the EXACT prior 99b world source', () => {
  assert.equal(gitBlob(original), '795395e2361bd309bee5b9bff7268ec7d3003a49');
  assert.doesNotMatch(original, /export function buildErodedIslandShelfGeometry/);
  const current = fs.readFileSync(path.join(root, 'public/snake-stream/world.mjs'), 'utf8');
  assert.match(current, /export function buildErodedIslandShelfGeometry/);
  assert.match(current, /const erodedCliff = geometry\(buildErodedIslandShelfGeometry/);
  assert.doesNotMatch(current, /add\(cube,cliff,0,-1\.6,0,width\+2\.3/);
  const strict = fs.readFileSync(path.join(root, 'tests/browser/snake-stream.spec.cjs'), 'utf8');
  assert.match(strict, /expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});

test('T1 weathered coast physically replaces the two entire rectangular island foundation boxes with stable safe 3D strata', async () => {
  const THREE = await import('three');
  const { createWorld, buildErodedIslandShelfGeometry } = await import('../../public/snake-stream/world.mjs');
  const prior = (await import('data:text/javascript;base64,' + Buffer.from(original).toString('base64'))).createWorld;
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const oldWorld = prior(THREE, {width, height});
    const newWorld = createWorld(THREE, {width, height});
    try {
      const a = oldWorld.stats(), b = newWorld.stats();
      for (const key of ['staticInstances','staticMeshes','drawObjects','materials','textures'])
        assert.equal(b[key], a[key], key + ' full original art/material/static draw preserved');
      assert.equal(b.geometries, a.geometries + 2, 'two new bounded native original geometry buffers, no lost old resources');
      for (const layer of ['cliff','moss']) {
        const geo = buildErodedIslandShelfGeometry(THREE, width, height, layer);
        const repeat = buildErodedIslandShelfGeometry(THREE, width, height, layer);
        try {
          const p = geo.getAttribute('position'), q = repeat.getAttribute('position');
          assert.equal(p.count, 1 + 4 * 96);
          assert.equal(geo.index.count, 3 * 96 * (1 + 2 * 3));
          assert.deepEqual(p.array, q.array, 'no random or gameplay-state terrain jitter');
          const W=width/2,H=height/2;
          let stepVariance=0;
          for (let i=0;i<p.count;i++) {
            const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
            assert.ok([x,y,z].every(Number.isFinite), 'finite full-environment geometry');
            assert.ok(y<=-.2, 'the entire new coastal landform stays beneath true public playable floor');
            if (i>0 && i<=96) {
              assert.ok(Math.abs(x)>W+.89 || Math.abs(z)>H+.89, 'unbroken landward top always outboard');
              stepVariance+=Math.abs(Math.hypot(x,z)-Math.hypot(
                p.getX(i===96?1:i+1),p.getZ(i===96?1:i+1)));
            }
            if (i>=1+3*96) assert.ok(y < -.7, 'the outer foundation is physically sculpted below the foliage mantle');
          }
          assert.ok(stepVariance>.4,'continuous coast is genuinely irregular rather than another four-sided box');
        } finally {geo.dispose();repeat.dispose();}
      }
      // Presentational geometries cannot alter simulation or public-only state.
      const frame = Object.freeze({obstacles:Object.freeze([3]),portals:Object.freeze([{entry:1,exit:width*height-2}]),
        hazards:Object.freeze([{cell:7,active:true}]),food:Object.freeze({cell:9,kind:'normal'})});
      oldWorld.update(frame,{time:3,reducedMotion:false});
      newWorld.update(frame,{time:3,reducedMotion:false});
      assert.equal(newWorld.stats().portalEnds,oldWorld.stats().portalEnds);
      assert.equal(newWorld.stats().hazards,oldWorld.stats().hazards);
      assert.equal(newWorld.stats().obstacles,oldWorld.stats().obstacles);
      assert.deepEqual(frame.portals,[{entry:1,exit:width*height-2}]);
    } finally {oldWorld.dispose();newWorld.dispose();}
  }
});
