'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(__dirname, '../..');

test('T1 physical mortar and true rooted mineral basins integrate across all public boards without extra resources', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const { createCourtyardEcology } = await import('../../public/snake-stream/courtyard-ecology.mjs');
  const worldCode = fs.readFileSync(path.join(repo, 'public/snake-stream/world.mjs'), 'utf8');
  const ecologyCode = fs.readFileSync(path.join(repo, 'public/snake-stream/courtyard-ecology.mjs'), 'utf8');
  // Do not move or conceal live cells; restore natural stone substrate instead
  // of painting dark rectangular mortar over the authored coastal geology.
  assert.match(worldCode, /add\(cube,cliff,0,-\.27,0,width\+\.18,\.46,height\+\.18\)/);
  assert.doesNotMatch(worldCode, /add\(cube,darkStone,0,-\.27,0,width\+\.18,\.46,height\+\.18\)/);
  assert.match(worldCode, /const underCanopy=1-fade\(\.045,\.255,/);
  assert.match(ecologyCode, /const forestReach = 1 - smooth\(\.03, \.235,/);
  const snapshots = [];
  for (const [width, height] of [[8,8], [28,16], [40,24]]) {
    const world = createWorld(THREE,{width,height});
    const duplicateWorld = createWorld(THREE,{width,height});
    const ecology = createCourtyardEcology(THREE,{width,height,world});
    const duplicateEcology = createCourtyardEcology(THREE,{width,height,world:duplicateWorld});
    try {
      const s = world.stats(), ec = ecology.stats();
      assert.equal(s.textures, 4);
      assert.equal(s.staticMeshes, 13);
      assert.equal(s.materials, 22);
      assert.equal(ec.meshCount, 1);
      assert.equal(ec.textures, 0);
      assert.equal(ec.publicCellsMoved, 0);
      assert.deepEqual(ecology.stats(),duplicateEcology.stats());
      assert.ok(ec.stoneAtlas.groveFraction >= .30 && ec.stoneAtlas.groveFraction <= .43,
        'planted gullies must not consume the whole original quarry');
      let data;
      world.group.traverse(o => { if (!data && o.isMesh && o.material?.map?.image?.width === 1024 && o.material.map.image.height === 512) data = o.material.map.image.data; });
      assert.ok(data instanceof Uint8Array);
      let deep=0,warm=0,green=0,total=0;
      for(let y=72;y<440;y+=6) for(let x=74;x<950;x+=6) {
        const i=(y*1024+x)*4,r=data[i],g=data[i+1],b=data[i+2];
        deep+=(r+g+b)/3<93; warm+=r>g+17; green+=g>r+25;total++;
      }
      assert.ok(deep/total>.24 && warm/total>.12 && green/total>.30,
        'native rooted fern shadow, honest exposed limestone and vegetation must ALL read in the complete playing field');
      snapshots.push([...data]);
      const fixed = Object.freeze({tick:240,width,height,food:Object.freeze({cell:1}),
        hazards:Object.freeze([{cell:2,active:true}]),portals:Object.freeze([{entry:0,exit:width*height-1}]),
        obstacles:Object.freeze([3])});
      const frozen=JSON.stringify(fixed);
      world.update(fixed,{time:4,reducedMotion:false});
      world.update(fixed,{time:4,reducedMotion:true});
      assert.equal(JSON.stringify(fixed),frozen);
    } finally {ecology.dispose();duplicateEcology.dispose();world.dispose();duplicateWorld.dispose();}
  }
  assert.equal(snapshots.length,3);
  const browser = fs.readFileSync(path.join(repo,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(browser,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/,
    'the real complete-desktop 1s gate is unchanged');
});
