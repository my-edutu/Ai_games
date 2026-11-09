'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

// Minimal retained-geometry adapter: a matrix records its world-space
// translation so the test can reject an invented floor-height Warden glyph.
function stageRig(){
 class Vec{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const len=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=len;this.y/=len;this.z/=len;return this}}
 class Geo{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Material{constructor(props){Object.assign(this,props)}dispose(){}}
 class Obj{constructor(){
  this.position=new Vec();
  this.rotation={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};
  this.matrix={x:0,y:0,z:0};
 }updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}}
 class Mesh{constructor(geo,mat,capacity){
  this.geometry=geo;this.material=mat;this.count=capacity;this.visible=false;
  this.matrices=[];this.instanceMatrix={setUsage(){},needsUpdate:false};
 }setMatrixAt(index,matrix){this.matrices[index]={...matrix}}}
 const THREE={Object3D:Obj,Vector3:Vec,BufferGeometry:Geo,
  Float32BufferAttribute:class{constructor(data,size){this.array=data;this.itemSize=size}},
  MeshBasicMaterial:Material,MeshStandardMaterial:Material,InstancedMesh:Mesh,
  TorusGeometry:Geo,TetrahedronGeometry:Geo,IcosahedronGeometry:Geo,
  RingGeometry:Geo,CylinderGeometry:Geo,DoubleSide:2,DynamicDrawUsage:35048};
 const scene={meshes:[],add(m){this.meshes.push(m)},remove(m){
  this.meshes.splice(this.meshes.indexOf(m),1)}};
 return {THREE,scene};
}
const release=(changes={})=>({
 id:'1:1:11:warden-release:warden:-',sceneKey:'1:1',tick:11,
 kind:'warden-release',visual:'warden',audio:'warden-release',
 actorId:'warden',targetId:null,from:{x:6,z:6},to:null,
 verified:true,proof:'authority-action',duration:.38,severity:0,priority:7,...changes
});
const warning=(tick,attackTick)=>({
 ...release({id:`1:1:${tick}:boss-warning-final:warden:-`,tick,
 kind:'boss-warning-final',visual:'warning',audio:'boss-warning-final',
 proof:'authority-warning-window',duration:.32,priority:8}),
 detail:{attackTick,cells:[{x:5,z:6},{x:6,z:5}]}
});
const opening=()=>release({id:'1:1:11:opening:warden:-',
 kind:'opening',visual:'opening',audio:'recovery',
 proof:'authority-opening-recovery-window',priority:6,duration:.34});
const actor=(action='cast',actionTick=11)=>({
 u:{id:'warden',kind:'warden',action,actionTick},
 root:{visible:true,position:{x:-3,y:0,z:-3},rotation:{y:.2}}
});

test('D04: absent boss rig cannot turn a strike into a floor ring; real release still retires spent danger',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stageRig();
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>null});
 assert.equal(effects.emit(warning(10,11)),true,'authoritative danger cells remain visible without a boss model');
 assert.equal(effects.stats().instancesByPool.signal,2);
 assert.equal(effects.emit(release()),false,'a missing body is not a release-signal anchor');
 assert.equal(effects.stats().instancesByPool.signal,0,'spent warning must retire independently of actor art');
 assert.equal(effects.emit(warning(10,11)),false,'old released danger may not reappear');
 assert.equal(effects.emit(warning(12,13)),true,'next attack still has true danger cells');
 assert.equal(effects.stats().instancesByPool.signal,2);
 effects.reset();effects.dispose();
});

test('D04: a stale idle body at the correct cell cannot pose as an active cast release',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stageRig();
 let current=actor('idle',10);
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>current});
 assert.equal(effects.emit(release()),false);
 assert.equal(effects.stats().activeDrawCalls,0);
 current=actor('cast',10);
 assert.equal(effects.emit(release({id:'wrong-tick'})),false,'old cast cannot validate the new release');
 current=actor('cast',11);
 assert.equal(effects.emit(release({id:'fresh-release'})),true);
 const signal=scene.meshes[4]; // signal is the fifth retained pool
 assert.equal(signal.visible,true);
 assert.ok(signal.matrices.some(m=>m.y>.8&&m.y<2),'real signal must be body-height');
 effects.reset();effects.dispose();
});

test('D04: Warden recovery must remain actor-local; valid same-tick cast is still drawable',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stageRig();
 let current=null;
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>current});
 assert.equal(effects.emit(opening()),false,'no character means no recovery-body glyph');
 current=actor('idle',11);
 assert.equal(effects.emit(opening()),false,'idle torso is not a cast recovery pose');
 current=actor('cast',11);
 assert.equal(effects.emit(opening()),true);
 assert.equal(effects.stats().instancesByPool.signal,1);
 const signal=scene.meshes[4];
 assert.ok(signal.matrices.some(m=>m.y>.8&&m.y<2));
 current=actor('cast',12);
 assert.equal(effects.emit({...opening(),id:'stale-opening'}),false,
  'late recovery cannot borrow a newer cast body');
 effects.reset();effects.dispose();
});

test('D04: missing Warden art never suppresses HP-confirmed counter or neutral damage evidence',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stageRig();
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>null});
 const counter=release({id:'real-counter',kind:'counter',visual:'counter',
  proof:'authority-counter-and-HP',actorId:null,targetId:'warden',
  from:null,to:{x:6,z:6},duration:.26});
 const damage=release({id:'real-damage',kind:'damage',visual:'hit',
  proof:'observed-hp-drop',actorId:null,targetId:'warden',
  from:null,to:{x:6,z:6},duration:.23});
 assert.equal(effects.emit(counter),true,'known victim remains known without an attacker');
 assert.equal(effects.emit(damage),true,'genuine HP loss remains visual');
 assert.equal(effects.stats().confirmedFragments>=4,true);
 effects.reset();effects.dispose();
});
