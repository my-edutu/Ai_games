'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const file=path.join(root,'public/ai-dungeon/dungeon-setpieces.js');
const threeFile=path.join(root,'node_modules/three/build/three.module.js');
async function originalModule(){
 const source=fs.readFileSync(file,'utf8');
 const rewritten=source
  .replace("'/dungeon/vendor/three.module.js'",JSON.stringify(pathToFileURL(threeFile).href))
  .replace("'/dungeon/setpiece-plan.js'",JSON.stringify(pathToFileURL(path.join(root,'public/ai-dungeon/setpiece-plan.js')).href));
 assert.notEqual(rewritten,source,'real Three and deterministic original planner required');
 return import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'));
}
const descendants=root=>{const list=[];root.traverse(x=>list.push(x));return list};
const validTriangles=geometry=>(geometry.index?.count??geometry.getAttribute('position').count)/3;
test('all four original niche families retain authentic PBR physical geometry with fewer actual draw units',async()=>{
 const THREE=await import(pathToFileURL(threeFile).href);
 const {createDungeonSetpieces}=await originalModule();
 const {map,exit}=DungeonRuntime.create('gauntlet-corpus-v1-0').publicState();
 for(const floor of [1,2,3,4]){
  const world=new THREE.Group();world.userData.foregroundProps=[];
  const stage=createDungeonSetpieces(world,map,floor,exit);
  const rootGroup=world.children[0],m=stage.metrics.staticBatch;
  assert.ok(stage.metrics.landmarks>=4&&stage.metrics.landmarks<=8);
  assert.equal(rootGroup.children.length,stage.metrics.landmarks);
  assert.equal(world.userData.foregroundProps.length,stage.metrics.landmarks,'source camera cutaways retained');
  assert.equal(m.sourceTriangles,m.retainedTriangles,'no source triangles removed');
  assert.ok(m.sourceMeshes>=m.retainedMeshes*2,'major draw submission consolidation');
  assert.ok(m.retainedMeshes<=stage.metrics.landmarks*6,'one retained geometry per source material');
  assert.ok(m.originalGeometryPreserved);
  const materials=new Set();
  for(const anchor of rootGroup.children){
   assert.match(anchor.name,/-niche$/);
   assert.ok(anchor.position.isVector3&&Number.isFinite(anchor.rotation.y));
   const staticMeshes=anchor.children.filter(x=>x.isMesh&&x.name.startsWith('retained-authored-'));
   assert.ok(staticMeshes.length>=3&&staticMeshes.length<=6);
   assert.equal(staticMeshes.length,new Set(staticMeshes.map(x=>x.material)).size);
   let count=0;
   for(const mesh of staticMeshes){
    assert.ok(mesh.material.isMeshStandardMaterial,'original PBR shaders preserved');
    materials.add(mesh.material);
    assert.equal(mesh.receiveShadow,true);
    for(const name of ['position','normal','uv'])assert.ok(mesh.geometry.getAttribute(name),name);
    const b=mesh.geometry.boundingSphere;assert.ok(b&&Number.isFinite(b.radius)&&b.radius>0);
    assert.equal(mesh.geometry.index,null);
    count+=validTriangles(mesh.geometry);
   }
   assert.ok(count>80,'physical sculpture remains');
  }
  assert.ok(materials.size>=4);
  const moving=floor===2?stage.metrics.landmarks:floor===3?stage.metrics.landmarks*3:0;
  assert.equal(descendants(rootGroup).filter(x=>x.isMesh).length,m.retainedMeshes+moving,'original animated meshes remain');
  const merged=descendants(rootGroup).filter(x=>x.isMesh&&x.name.startsWith('retained-authored-')).map(x=>x.geometry);
  let retired=0;for(const geometry of merged)geometry.addEventListener('dispose',()=>retired++);
  stage.dispose();
  assert.equal(world.children.length,0);
  assert.equal(retired,merged.length,'reused merged buffers retired once per floor');
 }
});
test('original flame and wheel continue authentic time-driven movement',async()=>{
 const THREE=await import(pathToFileURL(threeFile).href);
 const {createDungeonSetpieces}=await originalModule();
 const {map,exit}=DungeonRuntime.create('gauntlet-corpus-v1-0').publicState();
 for(const floor of [2,3]){
  const world=new THREE.Group();const stage=createDungeonSetpieces(world,map,floor,exit);
  assert.equal(stage.metrics.animatedSetpieces,stage.metrics.landmarks);
  const first=world.children[0].children[0];
  const moving=first.children.find(c=>!String(c.name).startsWith('retained-authored-'));
  assert.ok(moving);
  const before=floor===2?moving.scale.y:moving.rotation.y;
  stage.update(2.5);
  assert.notEqual(floor===2?moving.scale.y:moving.rotation.y,before);
  stage.dispose();
 }
});
test('source-level guard keeps cutaway ownership without sim mutations',()=>{
 const source=fs.readFileSync(file,'utf8');
 assert.match(source,/fuseStaticNiche\(anchor,p\.motif,p\.variant\)/);
 assert.match(source,/world\.userData\.foregroundProps\?\.push\(anchor\)/);
 assert.match(source,/child\.updateMatrix\(\)/);
 assert.doesNotMatch(source,/Math\.random|DungeonRuntime|publicState\(\)|setTimeout/);
});
