'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
test('quarry slabs have contained sculpted 3D corner lips with no new GPU resource or authority change', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[28,16],[8,8]]) {
    const world = createWorld(THREE,{width,height});
    try {
      const court = world.group.children.find(o => o.isMesh && o.material?.map?.image?.width === 1024 && o.material.map.image.height === 512);
      assert.ok(court,'inspect actual merged 3D court geometry');
      const v = court.geometry.getAttribute('position');
      assert.equal(v.count,width*height*54,'same original 18 triangles per slab');
      const originalTop = .487*.994;
      let chipped = 0, untouched = 0, minimum = Infinity, maximum = -Infinity;
      for (let z=0;z<height;z++) for (let x=0;x<width;x++) {
        const centreX=x-(width-1)/2,centreZ=z-(height-1)/2,elevations=[];
        for (let j=0;j<6;j++) {
          const n=(z*width+x)*54+j;
          const insetX=originalTop-Math.abs(v.getX(n)-centreX), insetZ=originalTop-Math.abs(v.getZ(n)-centreZ), y=v.getY(n);
          assert.ok(insetX>=-.0002 && insetZ>=-.0002,'no lip may enter neighbouring cell');
          assert.ok(insetX<=.077 && insetZ<=.058,'bounded original corner silhouettes');
          assert.ok(Math.abs(y)<=.00901,'slab rise stays below belly clearance');
          minimum=Math.min(minimum,y);maximum=Math.max(maximum,y);elevations.push(y);
          if(insetX>.018&&insetZ>.012)chipped++;
          if(insetX<.005&&insetZ<.005)untouched++;
        }
        assert.ok(Math.max(...elevations)-Math.min(...elevations)<.00001,'top remains flat per playable cell');
      }
      assert.ok(chipped>width*height*.45,'visible physical chipping across board');
      assert.ok(untouched>width*height*.45,'clean corners are retained for natural diversity');
      assert.ok(maximum-minimum>.009,'uneven real 3D slab heights, not just more stripes');
      const start=world.stats();
      assert.equal(start.staticMeshes,13);assert.equal(start.textures,4);
      const snapshot={obstacles:[3],hazards:[{cell:15,active:true}],portals:[{entry:18,exit:24}],food:{cell:6}};
      const frozen=JSON.stringify(snapshot);
      world.update(snapshot,{time:1,reducedMotion:false});
      world.update(snapshot,{time:2,reducedMotion:true});
      assert.equal(JSON.stringify(snapshot),frozen,'immutable public snapshot');
      for(const key of ['staticMeshes','drawObjects','geometries','materials','textures'])
        assert.equal(world.stats()[key],start[key],'bounded resources '+key);
    } finally {world.dispose();assert.equal(world.group.children.length,0);}
  }
});
