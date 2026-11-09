'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

/** Matrix-preserving, deterministic Three.js fixture; no pretending this is WebGL. */
function fakeThree(){
 class Vector3{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}
 }
 class Geometry{
  setAttribute(name,value){(this.attributes??={})[name]=value}
  setIndex(indices){this.indices=indices}
  computeVertexNormals(){}
  dispose(){this.disposed=true}
 }
 class Object3D{
  constructor(){
   this.position=new Vector3();
   this.rotation=new Vector3();
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(v){this.x=this.y=this.z=v},
    set(x,y,z){this.x=x;this.y=y;this.z=z}};
   this.matrix={};
  }
  updateMatrix(){
   this.matrix={position:{...this.position},rotation:{...this.rotation},
    scale:{...this.scale}};
  }
 }
 class Material{
  constructor(props){Object.assign(this,props)}
  dispose(){this.disposed=true}
 }
 class InstancedMesh{
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;
   this.visible=false;this.matrices=[];
   this.instanceMatrix={setUsage(){},needsUpdate:false};
  }
  setMatrixAt(index,matrix){
   this.matrices[index]=JSON.parse(JSON.stringify(matrix));
  }
 }
 class RingGeometry extends Geometry {}
 const THREE={Object3D,Vector3,BufferGeometry:Geometry,RingGeometry,
  TorusGeometry:Geometry,TetrahedronGeometry:Geometry,
  CylinderGeometry:Geometry,IcosahedronGeometry:Geometry,
  Float32BufferAttribute:class{constructor(array,itemSize){
   this.array=array;this.itemSize=itemSize}},
  MeshBasicMaterial:Material,MeshStandardMaterial:Material,InstancedMesh,
  DoubleSide:2,DynamicDrawUsage:35048};
 const scene={meshes:[],add(m){this.meshes.push(m)},
  remove(m){this.meshes.splice(this.meshes.indexOf(m),1)}};
 return {THREE,scene,ring:()=>scene.meshes.find(m=>m.geometry instanceof RingGeometry)};
}
const baseCue=(kind,visual,extra={})=>({
 id:'1:1:23:'+kind+':warden:-',sceneKey:'1:1',tick:23,kind,visual,
 actorId:'warden',targetId:null,from:{x:4,z:4},to:null,
 proof:'authority-action',verified:true,priority:7,duration:.35,
 severity:0,delay:0,...extra
});
async function createRigStage(withActor=true){
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene,ring}=fakeThree();
 const actor={u:{id:'warden',kind:'warden',action:'cast',actionTick:23},
  authored:false,root:{visible:true,position:{x:-5,y:0,z:-5},rotation:{y:1.2}}};
 const stage=createPhysicalFeedbackVisuals(THREE,scene,{
  actorById:id=>withActor&&id==='warden'?actor:null
 });
 return {stage,ring:ring(),scene};
}
const firstMatrix=ring=>ring.matrices[ring.matrices.findIndex(m=>
 m?.position?.y>-400)];

test('actual Warden danger cell keeps horizontal, ground-level warning ring',async()=>{
 const {stage,ring}=await createRigStage();
 const warning=baseCue('boss-warning-final','warning',{
  id:'1:1:22:boss-warning-final:warden:-',tick:22,
  proof:'authority-warning-window',priority:8,
  detail:{attackTick:23,cells:[{x:4,z:4}]}
 });
 assert.equal(stage.emit(warning),true);
 const matrix=firstMatrix(ring);
 assert.equal(matrix.position.y,.075);
 assert.equal(matrix.position.x,-5);
 assert.equal(matrix.position.z,-5);
 assert.equal(matrix.rotation.x,-Math.PI/2);
 stage.dispose();
});

test('Warden release preserves authentic actor height and faces its heading',async()=>{
 const {stage,ring}=await createRigStage();
 assert.equal(stage.emit(baseCue('warden-release','warden')),true);
 const matrix=firstMatrix(ring);
 assert.equal(matrix.position.y,1);
 assert.equal(matrix.position.x,-5);
 assert.equal(matrix.position.z,-5);
 assert.equal(matrix.rotation.x,0,'vertical signal, not a second danger tile');
 assert.equal(matrix.rotation.y,1.2);
 stage.dispose();
});

test('recovery and earned HP-confirmed counter have different restrained body-level envelopes',async()=>{
 const {stage,ring}=await createRigStage();
 assert.equal(stage.emit(baseCue('opening','opening',{proof:'authority-event'})),true);
 const recovery=firstMatrix(ring);
 stage.reset();
 assert.equal(stage.emit(baseCue('warden-release','warden')),true);
 const release=firstMatrix(ring);
 stage.reset();
 assert.equal(stage.emit(baseCue('counter','counter',{
  id:'1:1:23:counter:-:warden',actorId:null,targetId:'warden',
  from:null,to:{x:4,z:4},proof:'authority-counter-and-HP'
 })),true);
 const counter=firstMatrix(ring);
 for(const m of [recovery,release,counter]){
  assert.equal(m.position.y,1);
  assert.equal(m.rotation.x,0);
 }
 assert.ok(recovery.scale.x>release.scale.x&&release.scale.x>counter.scale.x,
  'the recovered opening, strike release and counter do not share one pulse');
 stage.dispose();
});

test('missing art suppresses actor-local Warden release glyph instead of drawing a false floor hazard',async()=>{
 const {stage,ring}=await createRigStage(false);
 assert.equal(stage.emit(baseCue('warden-release','warden')),false);
 assert.equal(stage.stats().instancesByPool.signal,0);
 assert.equal(stage.stats().unanchoredWardenSignals,1);
 assert.equal(ring.visible,false);
 stage.dispose();
});

test('seven retained pools, 102 reserved instances, and reset/disposal are unchanged',async()=>{
 const {stage}=await createRigStage();
 for(let i=0;i<24;i++){
  const cue=baseCue('warden-release','warden',{
   id:'1:1:'+String(23+i)+':warden-release:warden:-',
   tick:23+i
  });
  stage.emit(cue);
 }
 const stats=stage.stats();
 assert.equal(stats.reservedInstances,102);
 assert.equal(stats.drawCalls,7);
 assert.ok(stats.active<=102);
 assert.ok(stats.instancesByPool.signal<=8);
 assert.ok(stats.activeDrawCalls<=7);
 stage.reset();
 assert.equal(stage.stats().active,0);
 assert.equal(stage.stats().activeDrawCalls,0);
 stage.dispose();
 assert.equal(stage.stats().disposed,true);
});
