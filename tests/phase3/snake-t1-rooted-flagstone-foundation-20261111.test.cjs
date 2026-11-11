'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

// Real pinned Three 0.186 geometry: the rectangular buried stone plinth must
// become one connected eroded apron with intact, lower-than-floor playable
// support, non-rectilinear exposed coastal terraces and bounded resources.
// Native structural evidence is NOT a visual or GPU performance acceptance.
test('the complete playable stone court rests on a connected organic bank rather than a straight-walled rectangular box',async()=>{
 const THREE=await import('three');
 const {buildRootedFlagstoneFoundationGeometry,createWorld}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const foundation=buildRootedFlagstoneFoundationGeometry(THREE,width,height);
  const world=createWorld(THREE,{width,height});
  try{
   const pos=foundation.getAttribute('position'),idx=foundation.index;
   assert.ok(pos.count>=300&&pos.count<=600,`bounded original mesh vertices: ${pos.count}`);
   assert.ok(idx.count/3<=850,`bounded physical terrain tris: ${idx.count/3}`);
   assert.ok(pos.array.every(Number.isFinite),'no invalid real vertex');
   const W=width/2,H=height/2,edge=[];
   for(let i=1;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    if(Math.abs(x)>W+.18||Math.abs(z)>H+.18){edge.push([x,y,z]);}
   }
   assert.ok(edge.length>160,'continuous physical coastal fringe, not painted-on water');
   assert.ok(edge.some(([x,y,z])=>Math.abs(x)>W+.72&&y<-.35),'connected eroded western/eastern soil terrace');
   assert.ok(edge.some(([x,y,z])=>Math.abs(z)>H+.72&&y<-.35),'connected eroded northern/southern soil terrace');
   const ray=new THREE.Raycaster();ray.far=4;
   const foundationMesh=new THREE.Mesh(foundation,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
   for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    ray.set(new THREE.Vector3(x-(width-1)/2,1,z-(height-1)/2),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(foundationMesh,false)[0];
    assert.ok(hit&&hit.point.y<-.029&&hit.point.y>-.09,`never lose protected inboard stone substrate at ${x},${z}`);
   }
   // Inspect the actual merged PRODUCTION cliff material batch, not merely
   // an exported helper that could have been left unintegrated.
   const cliff=world.group.getObjectByName('Ruins / 75816b');
   assert.ok(cliff?.isMesh,'existing native stone batch remains visible');
   for(const [x,z] of [[0,0],[(width-1)/2,(height-1)/2],[-(width-1)/2,0]]){
    ray.set(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(cliff,false)[0];
    assert.ok(hit&&Math.abs(hit.point.y+.045)<.004,'original full playable courtyard actually rests on the continuous new physical apron');
   }
   // The original 13 world scene batches and four authored atlas materials
   // are retained; this is a replacement substrate, not a scene deletion.
   assert.equal(world.stats().staticMeshes,13);assert.equal(world.stats().textures,4);
  }finally{foundation.dispose();world.dispose();}
 }
});
