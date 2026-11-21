'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

// This is a real 3D material/immutable-world contract, not a screenshot,
// whole-game quality acceptance, strict WebGL renderer gate or device FPS.
test('T1 natural leaf/stone ecotone reaches original 3D stone, rooted relief and owned material atlas without adding render resources',async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const world=createWorld(THREE,{width,height}),eco=createCourtyardEcology(THREE,{width,height,world});
  try{
   const ws=world.stats(),es=eco.stats();
   assert.equal(ws.staticMeshes,13);assert.equal(ws.textures,4);
   assert.equal(es.meshCount,1);assert.equal(es.textures,0);
   assert.ok(es.triangles<3100);assert.equal(es.publicCellsMoved,0);
   assert.equal(es.interstitialFernClumps,{8:40,28:130,40:71}[width]);
   assert.ok(es.fernCanopyHeight>.175 && es.fernCanopyHeight<=.185);
   const court=world.group.children.find(o=>o.isMesh && o.material?.map?.image?.width===1024);
   assert.ok(court,'the original limestone map is still owned by the existing world');
   const data=court.material.map.image.data;
   let moss=0,leaves=0,dark=0,all=0;
   for(let y=72;y<440;y+=6)for(let x=74;x<950;x+=6){
    const at=(y*1024+x)*4,r=data[at],g=data[at+1],b=data[at+2];
    moss+=g>r+25;leaves+=r>g+17;dark+=(r+g+b)/3<93;all++;
    assert.equal(data[at+3],255,'no deceptive transparent route overlay');
   }
   assert.ok(moss/all>.30 && moss/all<.52,`${width}x${height} moss ${moss/all}`);
   assert.ok(leaves/all>.24,`${width}x${height} limestone/leaf litter ${leaves/all}`);
   assert.ok(dark/all>.26,`${width}x${height} true under-canopy shade ${dark/all}`);
   // No per-frame mutation. All existing hazard, food and portal gameplay
   // positions remain public authoritative values even when garden updated.
   const snapshot=Object.freeze({tick:83,width,height,food:Object.freeze({cell:1}),
    hazards:Object.freeze([{cell:2,active:true}]),portals:Object.freeze([{entry:0,exit:width*height-1}]),obstacles:Object.freeze([3])});
   const json=JSON.stringify(snapshot);
   world.update(snapshot,{time:4,reducedMotion:false});
   world.update(snapshot,{time:4,reducedMotion:true});
   assert.equal(JSON.stringify(snapshot),json);
  }finally{eco.dispose();world.dispose();}
 }
});
