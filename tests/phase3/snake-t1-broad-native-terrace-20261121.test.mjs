import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving, sculptPlantedMasonrySeam } from '../../public/snake-stream/world.mjs';

// Native geometry, not source regex or an image. Every true playable cell stays supported.
test('T1 physical woodland terraces cross the whole former grid as broad continuous original limestone', () => {
  for (const [width,height,budget] of [[8,8,7],[28,16,30],[40,24,64]]) {
    const plan=planCohesiveRuinsPaving(width,height);
    assert.ok(plan.length<=budget,`${width}x${height} has ${plan.length} visible rectangular masses, budget ${budget}`);
    const occupancy=new Uint8Array(width*height);
    let broad=0;
    for(const stone of plan){
      assert.ok(stone.x>=0&&stone.z>=0&&stone.w>=1&&stone.h>=1&&stone.x+stone.w<=width&&stone.z+stone.h<=height);
      if(stone.w>=6&&stone.h>=3)broad++;
      for(let z=stone.z;z<stone.z+stone.h;z++)for(let x=stone.x;x<stone.x+stone.w;x++)occupancy[z*width+x]++;
    }
    assert.ok(occupancy.every(v=>v===1),`exact one physical limestone terrace per playable cell, ${width}x${height}`);
    if(width>=28)assert.ok(broad>=Math.ceil(plan.length*.35),'large terraces must dominate the full scene');
  }
});

test('T1 broader terrain has real untouched full-body support and all original scenery batches',()=>{
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    try{
      assert.equal(world.stats().staticMeshes,13);
      assert.equal(world.stats().textures,4);
      const paving=world.group.children.find(m=>m.isMesh&&m.userData.staticWorld&&m.material?.map?.image?.width===1024);
      assert.ok(paving,'physical 3D limestone render geometry');
      const ray=new THREE.Raycaster();
      for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        for(const [dx,dz] of [[0,0],[-.3,0],[.3,0],[0,-.3],[0,.3]]){
          ray.set(new THREE.Vector3(x+.5-width/2+dx,2,z+.5-height/2+dz),new THREE.Vector3(0,-1,0));
          assert.ok(ray.intersectObject(paving,false).some(h=>h.point.y>=-.025&&h.point.y<=.025),
             `${width}x${height} unsupported at ${x},${z} offset ${dx},${dz}`);
        }
      }
    } finally {world.dispose();}
  }
});

test('T1 organic seam keeps upper crown closer to body contact while retaining weathered lower bank',()=>{
  const slab={x:3,z:4,w:7,h:4};
  for(let edge=0;edge<4;edge++){
    const safe=sculptPlantedMasonrySeam(slab,28,16,edge,true);
    const deep=sculptPlantedMasonrySeam(slab,28,16,edge,false);
    assert.ok(safe.recess<.034&&Math.abs(safe.drift)<.036,`body crown clearance ${edge}`);
    assert.ok(deep.recess>.13&&deep.recess>safe.recess,`visible deeply weathered flank ${edge}`);
  }
});
