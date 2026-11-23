import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as THREE from 'three';
import { createWorld } from '../../public/snake-stream/world.mjs';

// SHA256 of the complete original bbce17c public authored stone/forest atlas.
const baselines = [
 [8,8,'aff853d9159055de8ba45f08d685a8a5bbae1ccd9dc63d2425e510a1021cffa6',3986],
 [28,16,'d6d2d9a6fef410a6e37e3567bbad16de08ab923c236e0815067038035b3cbbd4',6950],
 [40,24,'73fc9796010a007d43b9a92163b8baac18b8eddf4db1ed4ae5aed24945bc47fd',7718],
];
const atlas = world => {
 let data=null;
 world.group.traverse(obj=>{
  if(!obj.isMesh)return;
  for(const material of Array.isArray(obj.material)?obj.material:[obj.material]){
   const image=material?.map?.image;
   if(image?.width===1024&&image?.height===512)data=image.data;
  }
 });
 assert.ok(data instanceof Uint8Array);
 return data;
};
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');

for(const [width,height,expected,instances] of baselines){
 test(`T4 real ${width}x${height} original native 3D world rebuild preserves byte-exact artwork and recovers without a repeated expensive atlas bake`,()=>{
  const first=createWorld(THREE,{width,height});
  const second=createWorld(THREE,{width,height});
  try{
   const x=atlas(first),y=atlas(second);
   assert.equal(hash(x),expected);assert.equal(hash(y),expected,
      '3D terrain texture may not change under any cache/recovery path');
   assert.notStrictEqual(x,y,'retained CPU pixels are copied, never shared between live/recovered GPU textures');
   assert.equal(first.stats().staticInstances,instances);
   for(const s of [first.stats(),second.stats()]){
    assert.equal(s.staticMeshes,13);assert.equal(s.drawObjects,33);
    assert.equal(s.textures,4);assert.equal(s.obstacles,0);assert.equal(s.hazards,0);
    assert.equal(s.terrainAtlasRecovery?.maxEntries,3,
      'recovery may only retain THREE deterministic CPU atlases (bounded ~6MB)');
    assert.ok(s.terrainAtlasRecovery?.entries<=3);
   }
   assert.equal(second.stats().terrainAtlasRecovery?.reused,true,
      'identical authoritative/public board builds should reuse a complete validated original atlas');
   const original=y[0];x[0]^=0xff;assert.equal(y[0],original,
      'recovery texture is not aliasing the old material or an active GPU source');
  }finally{first.dispose();second.dispose();}
 });
}

test('T4 deterministic context recovery keeps at most three 2 MiB terrain atlases, evicts by public board dimensions and never survives as a live GPU texture',()=>{
 const fourth=createWorld(THREE,{width:12,height:10});
 try {
  const memory=fourth.stats().terrainAtlasRecovery;
  assert.equal(memory.entries,3);
  assert.equal(memory.retainedCpuBytes,3*1024*512*4);
  assert.equal(memory.reused,false,'first legitimate new size is freshly authored');
 }finally{fourth.dispose();}
 // Same public board as the first test: oldest original pixels must be evicted,
 // regenerated exactly and held in a new independent live GPU texture.
 const recovered=createWorld(THREE,{width:8,height:8});
 try{
  assert.equal(recovered.stats().terrainAtlasRecovery?.reused,false,
   'oldest 8x8 world was evicted; no unbounded CPU art or GPU-resource retention');
  assert.equal(hash(atlas(recovered)),baselines[0][2]);
  assert.equal(recovered.stats().terrainAtlasRecovery?.retainedCpuBytes,3*1024*512*4);
 }finally{recovered.dispose();}
});
