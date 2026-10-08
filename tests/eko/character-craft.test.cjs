'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
let createTayoActor;
async function factory(){
  if(!createTayoActor){
    const js=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/character-craft.js'),'utf8');
    ({createTayoActor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64')));
  }
  return createTayoActor(THREE);
}
function characterMeshStats(actor){
  let nodes=0,meshes=0,invalid=0;
  actor.root.traverse(obj=>{
    nodes++;
    if(obj.isMesh){
      meshes++;
      if(!obj.geometry||!obj.material||!Number.isFinite(obj.position.y))invalid++;
    }
  });
  return {nodes,meshes,invalid};
}
const runFrame=(state,positionY=0)=>({
 tick:126,position:{x:5,y:positionY},velocity:{x:6,y:0},movementState:state
});
test('Tayo has an original articulated body and a developed face, limbs, shoes and outfits',async()=>{
  const actor=await factory();
  assert.ok(actor.articulatedJoints>=14);
  const stats=characterMeshStats(actor);
  assert.ok(stats.meshes>=60,JSON.stringify(stats));
  const instances=[];actor.root.traverse(x=>{if(x.isInstancedMesh)instances.push(x)});
  assert.equal(actor.instancedDetails,23);
  assert.equal(instances.length,3);
  assert.equal(instances.reduce((n,x)=>n+x.count,0),23,
    'all original curls/fingers must survive render batching');
  assert.equal(stats.invalid,0);
  let shadowCasters=0;
  actor.root.traverse(node=>{if(node.isMesh&&node.castShadow)shadowCasters++;});
  assert.ok(shadowCasters>=10,'major character silhouette must cast shadows');
  assert.ok(shadowCasters<=32,'individual hair details and fingers must not dominate shadow pass');
  assert.ok(actor.root.getObjectByName('head'));
  assert.ok(actor.root.getObjectByName('left-shoulder'));
  assert.ok(actor.root.getObjectByName('right-hip'));
  assert.ok(actor.root.getObjectByName('running shoe'));
  assert.equal(actor.availableOutfits.length,4);
});
test('all four original costumes retain one collision-agnostic rig',async()=>{
  const actor=await factory();const originalCount=characterMeshStats(actor).meshes;
  for(const id of actor.availableOutfits){
    actor.setOutfit(id);
    const costume=actor.root.getObjectByName('costume-'+id);
    assert.ok(costume.visible,id);
    for(const other of actor.availableOutfits)
      assert.equal(actor.root.getObjectByName('costume-'+other).visible,other===id);
    assert.equal(characterMeshStats(actor).meshes,originalCount);
  }
});
test('jump, run, slide and failure change separate articulated joints without mutating inputs',async()=>{
  const actor=await factory();const shoulder=actor.root.getObjectByName('left-shoulder');
  const torso=actor.root.getObjectByName('pelvis / torso');
  const initial=runFrame('grounded');const frozen=JSON.stringify(initial);
  actor.pose(initial,1000,false);
  const runShoulder=shoulder.rotation.z;
  actor.pose(runFrame('rising',.5),1016,false);
  assert.notEqual(shoulder.rotation.z,runShoulder);
  actor.pose(runFrame('sliding'),1040,false);
  assert.ok(torso.position.y<-.2);
  actor.pose(runFrame('dead'),1060,false);
  assert.ok(torso.rotation.z<-.7);
  assert.equal(JSON.stringify(initial),frozen);
});
