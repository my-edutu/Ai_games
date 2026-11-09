'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=()=>fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src()).toString('base64'));
function mockThree(){
 class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.values=[x,y,z];return this}}
 class Quaternion{setFromAxisAngle(axis,angle){this.angle=angle;this.axis=axis.values.slice();return this}}
 class Matrix4{compose(pos,rot,scale){this.snapshot={position:pos.values.slice(),angle:rot.angle,scale:scale.values.slice()};return this}}
 class InstancedMesh{
  constructor(geometry,material,count){Object.assign(this,{geometry,material,count,matrices:[],instanceMatrix:{},userData:{},disposed:0})}
  setMatrixAt(index,matrix){this.matrices[index]={...matrix.snapshot}}
  dispose(){this.disposed++}
 }
 return {Vector3,Quaternion,Matrix4,InstancedMesh};
}
function group(){return {children:[],rotation:{y:0},scale:{x:1,y:1,z:1},add(m){this.children.push(m)},remove(m){this.children.splice(this.children.indexOf(m),1)}}}
const glyph=(material,index)=>({material,position:[index,.10,-index],scale:[.09,.028,.055],rotationY:index*Math.PI/3});
test('real source-colored Warden court: twelve original glyph transforms become two retained draws, inheriting the rotating parent',async()=>{
 const {createRetainedStaticDetailBatches}=await load();const t=mockThree(),parent=group(),geometry={id:'original-cube'},gold={id:'gold'},teal={id:'teal'};
 const entries=Array.from({length:12},(_,i)=>glyph(i%3===0?gold:teal,i));
 const result=createRetainedStaticDetailBatches(t,parent,geometry,entries,{castShadow:true});
 assert.equal(result.instances,12);assert.equal(result.drawCalls,2);assert.equal(result.savedDraws,10);
 assert.equal(parent.children.length,2);
 assert.deepEqual(result.meshes.map(x=>x.count),[4,8]);
 assert.equal(result.meshes[0].material,gold);assert.equal(result.meshes[1].material,teal);
 assert.deepEqual(result.meshes[0].matrices[1],{position:[3,.10,-3],angle:Math.PI,scale:[.09,.028,.055]});
 assert.equal(result.meshes.every(x=>x.geometry===geometry&&x.castShadow&&x.receiveShadow&&x.userData.sharedAssetGeometry),true);
 parent.rotation.y=.035;assert.equal(parent.children.length,2,'the real court parent still owns its original motion');
 result.dispose();result.dispose();assert.equal(parent.children.length,0);
 assert.deepEqual(result.meshes.map(x=>x.disposed),[1,1],'GPU instance storage disposed once');
 assert.equal(geometry.id,'original-cube');assert.equal(gold.id,'gold');
});
test('each real trap retains disarm-parent scaling, material distinction, and all six marks while using only two draws',async()=>{
 const {createRetainedStaticDetailBatches}=await load();const t=mockThree(),parent=group(),gold={id:'gold'},warning={id:'warning'};
 const entries=Array.from({length:6},(_,k)=>glyph(k%2?gold:warning,k));
 const result=createRetainedStaticDetailBatches(t,parent,{id:'shared-geo'},entries,{castShadow:false});
 assert.deepEqual(result.meshes.map(m=>m.count),[3,3]);
 assert.equal(result.savedDraws,4);assert.equal(result.drawCalls,2);
 parent.scale.x=parent.scale.y=parent.scale.z=.67;
 assert.equal(parent.children.length,2,'disarming a real trap still scales both batches');
 result.dispose();assert.equal(parent.children.length,0);
});
test('malformed or unbounded static detail entries fail closed; empty batches allocate nothing',async()=>{
 const {createRetainedStaticDetailBatches}=await load(),t=mockThree(),p=group();
 assert.equal(createRetainedStaticDetailBatches(t,p,{},[]).drawCalls,0);
 assert.throws(()=>createRetainedStaticDetailBatches(t,p,{},Array(257).fill({})),/size/);
 assert.throws(()=>createRetainedStaticDetailBatches(t,p,{},[{material:{},position:[0,0,0],scale:[0,1,1]}]),/transform/);
 assert.throws(()=>createRetainedStaticDetailBatches(t,p,{},[{material:{},position:[0,NaN,0],scale:[1,1,1]}]),/transform/);
 assert.equal(p.children.length,0);
});
test('the production build uses the batch only for original static court glyphs and trap markings, not actor/hazard authority',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(code,/const courtGlyphs=Array\.from\(\{length:12\}/);
 assert.match(code,/const trapGlyphs=Array\.from\(\{length:6\}/);
 assert.match(code,/world\.userData\.staticDetailBatches\.push\(createRetainedStaticDetailBatches\(/);
 assert.match(code,/for\(const batch of world\.userData\.staticDetailBatches\|\|\[\]\)batch\.dispose\(\)/);
 assert.match(code,/marker\.scale\.setScalar\(trap\.disarmed\?\.67:1\)/);
});
test('real Three.js geometry and parent transform: no skeletal, trap, or authored material alteration',async()=>{
 const THREE=await import('three');
 const {createRetainedStaticDetailBatches}=await load();
 const parent=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1);
 const material=new THREE.MeshStandardMaterial({color:'#df9d79'});
 parent.position.set(4,.018,7);parent.scale.setScalar(.67);parent.rotation.y=.13;
 const batch=createRetainedStaticDetailBatches(THREE,parent,geometry,[
  {material,position:[.3,.1,0],rotationY:.2,scale:[.09,.028,.055]},
  {material,position:[-.3,.1,0],rotationY:-.2,scale:[.09,.028,.055]}
 ]);
 parent.updateMatrixWorld(true);
 assert.equal(batch.drawCalls,1);assert.equal(batch.savedDraws,1);
 const m=new THREE.Matrix4();batch.meshes[0].getMatrixAt(0,m);
 const actual=new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(parent.matrixWorld,m));
 const desired=new THREE.Vector3(.3,.1,0).applyMatrix4(parent.matrixWorld);
 assert.ok(actual.distanceTo(desired)<1e-6,'instanced markings follow exact disarmed parent geometry');
 assert.equal(batch.meshes[0].material,material);
 assert.equal(batch.meshes[0].geometry,geometry);
 batch.dispose();
 assert.equal(geometry.attributes.position.count,24,'original source geometry was not destroyed by batch disposal');
 assert.equal(material.color.getHexString(),'df9d79');
 geometry.dispose();material.dispose();
});
