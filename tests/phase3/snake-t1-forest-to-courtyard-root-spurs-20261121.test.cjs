'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

test('T1 true-world eight four-shore woodland root spurs join existing static cliff and moss geometry, not gameplay',async()=>{
 const THREE=await import('three');
 const {buildFourShoreWoodlandSpurs,createWorld}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const world=createWorld(THREE,{width,height});const before=world.stats();
  for(const layer of ['bedrock','moss']){
   const geometry=buildFourShoreWoodlandSpurs(THREE,width,height,layer),stat=geometry.userData;
   assert.equal(stat.shoreRootTies,8,'two original continuous landward spurs per each of four shores');
   assert.equal(stat.shoreRootStrips,8,'real full-body 3D strips are mandatory');
   assert.ok(stat.shoreRootTriangles>=64,'substantial terrain geometry not a painted decal');
   const p=geometry.attributes.position;let exterior=0,below=0,inner=0;
   const sideMouths=[new Set(),new Set(),new Set(),new Set()];
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    assert.ok([x,y,z].every(Number.isFinite),'every original rock vertex is finite');
    if(Math.abs(x)>width/2+.5||Math.abs(z)>height/2+.5){
     exterior++;
     if(y<-.3)below++;
     if(z< -height/2-.5)sideMouths[0].add(Math.sign(x));
     if(z>height/2+.5)sideMouths[1].add(Math.sign(x));
     if(x< -width/2-.5)sideMouths[2].add(Math.sign(z));
     if(x>width/2+.5)sideMouths[3].add(Math.sign(z));
    }
    if(Math.abs(x)<width/2-.5 && Math.abs(z)<height/2-.5 && y>-.1)inner++;
   }
   assert.ok(exterior>=80 && below>=32,'real exterior-rooted stone traverses the island bank in depth');
   for(let side=0;side<4;side++)assert.equal(sideMouths[side].size,2,'roots must be dispersed on both halves of every shore');
   assert.equal(inner,0,'never create an elevated phantom path in real playable cells');
   const same=buildFourShoreWoodlandSpurs(THREE,width,height,layer);
   assert.deepEqual(geometry.attributes.position.array,same.attributes.position.array,'public-only immutable source determinism');
   same.dispose();geometry.dispose();
  }
  assert.equal(world.stats().drawObjects,before.drawObjects,'world remains entirely static and batched');
  assert.equal(world.stats().textures,before.textures,'reuse existing official scene materials');
  world.dispose();
 }
});
