'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');

let batching;
async function moduleUnderTest(){
  if(!batching){
    const source=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/static-batch.js'),'utf8');
    batching=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  }
  return batching;
}
test('static batching preserves world-space positions, materials and finite triangles',async()=>{
  const {batchDistrictGeometry}=await moduleUnderTest();
  const root=new THREE.Group();
  const red=new THREE.MeshStandardMaterial({color:0x663322});
  const green=new THREE.MeshStandardMaterial({color:0x337755});
  const geometry=new THREE.BoxGeometry(.75,.5,.2);
  const nested=new THREE.Group();nested.position.set(3,0,2);root.add(nested);
  for(let i=0;i<24;i++){
    const mesh=new THREE.Mesh(geometry,i%3===0?red:green);
    mesh.position.set(i*.7,1,(i%4)*.3);
    nested.add(mesh);
  }
  const stats=batchDistrictGeometry(THREE,root,{chunkMeters:8});
  assert.equal(stats.sourceMeshes,24);
  assert.ok(stats.batchedMeshes<24,JSON.stringify(stats));
  assert.equal(stats.triangles,24*12);
  assert.equal(root.children.length,stats.batchedMeshes);
  for(const child of root.children){
    assert.match(child.name,/EkoStaticDistrictChunk:/);
    assert.equal(child.userData.disposeGeometryOnRemove,true);
    assert.equal(child.geometry.getAttribute('position').count%3,0);
    assert.ok(child.geometry.boundingSphere.radius>0);
    for(const value of child.geometry.getAttribute('position').array)assert.ok(Number.isFinite(value));
  }
  const expectedRedMeshCount=8;
  const redVertices=root.children.filter(x=>x.material===red).reduce((a,x)=>a+x.geometry.getAttribute('position').count,0);
  assert.equal(redVertices,expectedRedMeshCount*36);
});
test('preserves nested signs and operational lights at the same world position',async()=>{
  const {batchDistrictGeometry}=await moduleUnderTest();
  const root=new THREE.Group();
  const nested=new THREE.Group();nested.position.set(9,0,-4);root.add(nested);
  const light=new THREE.PointLight(0xffaaaa,3,5);light.position.set(.25,4,1);nested.add(light);
  const sign=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffcc66}));
  sign.position.set(1,2,3);nested.add(sign);
  const box=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());
  nested.add(box);
  root.updateMatrixWorld(true);
  const beforeLight=light.getWorldPosition(new THREE.Vector3()).clone();
  const beforeSign=sign.getWorldPosition(new THREE.Vector3()).clone();
  batchDistrictGeometry(THREE,root);
  root.updateMatrixWorld(true);
  assert.ok(root.children.includes(light));
  assert.ok(root.children.includes(sign));
  assert.ok(beforeLight.distanceTo(light.getWorldPosition(new THREE.Vector3()))<.0001);
  assert.ok(beforeSign.distanceTo(sign.getWorldPosition(new THREE.Vector3()))<.0001);
});
test('keeps distinct materials separate to avoid silently recolouring buildings',async()=>{
  const {batchDistrictGeometry}=await moduleUnderTest();
  const root=new THREE.Group();const box=new THREE.BoxGeometry(1,1,1);
  const materials=[new THREE.MeshStandardMaterial({color:0xffbb33}),new THREE.MeshStandardMaterial({color:0x125d7a})];
  for(let i=0;i<20;i++){
    const mesh=new THREE.Mesh(box,materials[i%2]);mesh.position.set(i/3,0,0);root.add(mesh);
  }
  const output=batchDistrictGeometry(THREE,root,{chunkMeters:200});
  assert.equal(output.batchedMeshes,2);
  assert.deepEqual(new Set(root.children.map(x=>x.material)),new Set(materials));
});
