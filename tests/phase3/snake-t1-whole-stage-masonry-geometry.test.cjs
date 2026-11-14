'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Real, unmocked pinned Three 0.186 geometry is required. The original scene
// has one complete box per authoritative cell. The T1 integrated world must
// create fewer genuine stone surfaces, not just repaint the original grid.
// This is a native geometry/clearance regression, NOT a screenshot/quality win.
test('T1 integrated courtyard uses coherent multi-cell THREE meshes while retaining all genuine playable stone contacts',async()=>{
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const ray=new THREE.Raycaster();ray.far=3;
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    try {
      const stone=world.group.getObjectByName('Ruins / c3c4ad');
      assert.ok(stone?.isMesh,'inspect physical production masonry, not a mock');
      const triangles=stone.geometry.index.count/3;
      const legacyTriangles=18*width*height;
      assert.ok(triangles < legacyTriangles*.80,
        `the whole court must not retain one separate 18-triangle box per cell: ${triangles}/${legacyTriangles}`);
      assert.equal(world.stats().staticMeshes,13);
      assert.equal(world.stats().textures,4);
      stone.updateWorldMatrix(true,true);
      let checked=0;
      for(let row=0;row<height;row++)for(let col=0;col<width;col++){
        const x=col-(width-1)/2,z=row-(height-1)/2;
        ray.set(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObject(stone,false)[0];
        assert.ok(hit && Math.abs(hit.point.y)<.035,`no broken playable stone cell ${col},${row}`);
        checked++;
      }
      console.log(`${width}x${height}: original ${legacyTriangles} tiny-box tris -> candidate ${triangles} real coalesced stone tris; ${checked} authoritative cells physically supported`);
    } finally { world.dispose(); }
  }
});
