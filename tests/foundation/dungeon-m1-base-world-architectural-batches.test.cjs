'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8')).toString('base64'));
function createFamily(world,count,geometries,materials){
 return Array.from({length:count},(_,i)=>{
  const root=new THREE.Group();root.position.set(i*1.25,0,i*.65);root.rotation.y=(i%2)*Math.PI/2;world.add(root);
  geometries.forEach((g,k)=>{const mesh=new THREE.Mesh(g,materials[k]);mesh.position.y=.3+k*.4;mesh.receiveShadow=true;root.add(mesh)});
  return root;
 });
}
const point=(mesh,i)=>{const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);return new THREE.Vector3().setFromMatrixPosition(m)};
test('base-world original columns, arches and shrines retain geometry, physical receding and bounded GPU batches',async()=>{
 const {createBaseWorldArchitecturalBatches}=await load();
 const world=new THREE.Group(),stone=new THREE.MeshStandardMaterial(),gold=new THREE.MeshStandardMaterial();
 const cube=new THREE.BoxGeometry(.4,.5,.4),ribs=new THREE.TorusGeometry(.5,.1,7,15);
 const columns=createFamily(world,7,[cube,cube,cube],[stone,gold,stone]);
 const arches=createFamily(world,4,[cube,cube,ribs,cube],[stone,stone,gold,gold]);
 const shrines=createFamily(world,2,[cube,cube,ribs],[stone,gold,gold]);
 const sourceBounds=new THREE.Box3().setFromObject(columns[3]);
 const manager=createBaseWorldArchitecturalBatches(THREE,world,{columns,arches,shrines});
 assert.equal(manager.sourceDrawCalls,43);
 assert.equal(manager.drawCalls,10);
 assert.equal(manager.savedDrawCalls,33);
 assert.equal(manager.instances,13);
 assert.equal(world.children.filter(o=>o.isInstancedMesh).length,10);
 assert(columns.every(r=>r.children.every(m=>!m.visible)));
 assert(new THREE.Box3().setFromObject(columns[3]).equals(sourceBounds),'physical camera source box remains');
 const before=point(manager.meshes[0],3);
 columns[3].position.y=-2.1;columns[3].rotation.y=.65;
 const changed=manager.sync();assert(changed.matrixWrites>=3);
 assert(point(manager.meshes[0],3).y<before.y-2.09,'real original column descends with cutaway');
 columns[2].visible=false;manager.sync();
 assert.equal(new THREE.Matrix4().copy((()=>{const m=new THREE.Matrix4();manager.meshes[0].getMatrixAt(2,m);return m})()).determinant(),0);
 columns[2].visible=true;columns[2].position.y=0;manager.sync();
 assert.notEqual((()=>{const m=new THREE.Matrix4();manager.meshes[0].getMatrixAt(2,m);return m.determinant()})(),0);
 assert.equal(manager.sync().matrixWrites,0,'unchanged transforms do not upload to GPU each frame');
 manager.dispose();manager.dispose();
 assert.equal(world.children.filter(o=>o.isInstancedMesh).length,0);
 assert([...columns,...arches,...shrines].every(r=>r.children.every(m=>m.visible)),'restores original source meshes on scene retirement');
});
test('one mismatched carved arch fails closed without losing independent original column savings',async()=>{
 const {createBaseWorldArchitecturalBatches}=await load();
 const world=new THREE.Group(),geometry=new THREE.BoxGeometry(),a=new THREE.MeshStandardMaterial(),b=new THREE.MeshStandardMaterial();
 const columns=createFamily(world,3,[geometry,geometry],[a,b]);
 const arches=createFamily(world,2,[geometry,geometry],[a,a]);
 arches[1].children[0].geometry=new THREE.SphereGeometry();
 const batch=createBaseWorldArchitecturalBatches(THREE,world,{columns,arches,shrines:[]});
 assert.equal(batch.savedDrawCalls,4);
 assert(arches.every(x=>x.children.every(m=>m.visible)),'failed family remains independently drawable');
 assert(columns.every(x=>x.children.every(m=>!m.visible)));
 batch.dispose();
});
