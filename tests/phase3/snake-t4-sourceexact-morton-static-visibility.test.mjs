import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorld} from '../../public/snake-stream/world.mjs';

function staticMeshes(world) {
  return world.group.children.filter(m=>m.isMesh&&m.userData.staticWorld);
}
function totalIndices(meshes) {
  return meshes.reduce((sum,m)=>sum+(m.geometry.getIndex()?.count??0),0);
}
test('a faithful detail camera can restrict complete static world draw ranges without removing any scenery',()=>{
 const world=createWorld(THREE,{width:28,height:16});
 try {
  const meshes=staticMeshes(world),full=totalIndices(meshes);
  assert.equal(meshes.length,13,'keep original 13 material batches');
  assert.equal(typeof world.updateStaticCameraVisibility,'function', 'camera-aware culling must exist on the real world');
  const cam=new THREE.PerspectiveCamera(36,960/540,.1,180);
  cam.position.set(0,4,10);cam.lookAt(0,1,0);cam.updateMatrixWorld();
  const result=world.updateStaticCameraVisibility(cam);
  const drawn=meshes.reduce((sum,m)=>sum+m.geometry.drawRange.count,0);
  assert.ok(result?.testedBlocks>13,'only original indexed static geometry can be culled');
  assert.ok(drawn<=full*.80,`detail still spends on ${drawn}/${full} static indices`);
  // Every retained geometry stays the full original data, including occluded parts;
  // no scene objects or vertices vanish and all resource ownership remains.
  assert.equal(totalIndices(meshes),full);
  world.updateStaticCameraVisibility(cam,{forceAll:true});
  assert.equal(meshes.reduce((sum,m)=>sum+m.geometry.drawRange.count,0),full);
 } finally {world.dispose();}
});
test('conservative full-world visibility is safe for an overview and near/far camera traversal',()=>{
 const world=createWorld(THREE,{width:28,height:16});
 try {
  const meshes=staticMeshes(world);
  assert.equal(typeof world.updateStaticCameraVisibility,'function');
  for(const position of [[0,36,38],[-15,6,-4],[15,6,4],[0,3,9]]){
   const cam=new THREE.PerspectiveCamera(36,16/9,.1,180);
   cam.position.set(...position);cam.lookAt(0,0,0);cam.updateMatrixWorld();
   world.updateStaticCameraVisibility(cam);
   const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
   for(const mesh of meshes){
    for(const block of mesh.userData.visibilityBlocks??[]){
     if(frustum.intersectsBox(block.box)) {
      const range=mesh.geometry.drawRange;
      assert.ok(range.start<=block.start&&range.start+range.count>=block.start+block.count,
       `camera ${position}, ${mesh.name}: visible chunk lost`);
     }
    }
   }
  }
 } finally {world.dispose();}
});
