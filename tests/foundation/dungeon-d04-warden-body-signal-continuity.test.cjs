'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

// A tiny retained-geometry fake checks the matrices the real VFX adapter
// actually submits. It does not assert real WebGL playback or audio sync.
function stage(){
 class Vec {
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const d=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=d;this.y/=d;this.z/=d;return this}
 }
 class Geometry{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Material{constructor(values){Object.assign(this,values)}dispose(){}}
 class Object3D {
  constructor(){
   this.position=new Vec();
   this.rotation={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};
   this.matrix={x:0,y:0,z:0};
  }
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 }
 class Mesh{
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;
   this.visible=false;this.matrices=[];
   this.instanceMatrix={setUsage(){},needsUpdate:false};
  }
  setMatrixAt(index,m){this.matrices[index]={...m}}
 }
 const THREE={Object3D,Vector3:Vec,BufferGeometry:Geometry,
  Float32BufferAttribute:class{constructor(data,size){this.array=data;this.itemSize=size}},
  InstancedMesh:Mesh,MeshBasicMaterial:Material,MeshStandardMaterial:Material,
  TorusGeometry:Geometry,TetrahedronGeometry:Geometry,
  IcosahedronGeometry:Geometry,RingGeometry:Geometry,
  CylinderGeometry:Geometry,DoubleSide:2,DynamicDrawUsage:35048};
 const scene={meshes:[],add(m){this.meshes.push(m)},remove(m){
  this.meshes.splice(this.meshes.indexOf(m),1)}};
 return {THREE,scene};
}
const warden=()=>({
 u:{id:'warden',kind:'warden',action:'cast',actionTick:11},
 root:{visible:true,position:{x:-3,y:0,z:-3},rotation:{y:0}}
});
const signal=(kind='warden-release')=>({
 id:'1:1:11:'+kind+':warden:-',sceneKey:'1:1',tick:11,
 kind,visual:kind==='opening'?'opening':'warden',audio:kind==='opening'?'recovery':'warden-release',
 actorId:'warden',targetId:null,from:{x:6,z:6},to:null,verified:true,
 proof:kind==='opening'?'authority-opening-recovery-window':'authority-action',
 duration:.38,severity:0,priority:7
});
const warning=()=>({
 ...signal(),id:'warning',kind:'boss-warning-final',visual:'warning',
 proof:'authority-warning-window',detail:{attackTick:11,cells:[{x:5,z:6}]}
});

test('D04 release signal follows the actual live Warden body within its authoritative cell',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage();
 const body=warden();
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>body});
 const cue=signal();
 assert.equal(fx.emit(cue),true);
 const ring=scene.meshes[4];
 const before=ring.matrices[0].x;
 body.root.position.x+=.31;
 body.root.rotation.y=.45;
 fx.advance(.016,.016);
 assert.ok(ring.matrices[0].x>before+.25,'signal must track the living torso, not its old cell');
 assert.equal(fx.hasDrawableCue(cue.id),true);
 assert.equal(fx.stats().instancesByPool.signal,1);
 fx.dispose();
});

test('D04 opening signal cannot remain as ghost art after a rig or action becomes stale',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 for(const change of [body=>{body.root.visible=false},body=>{body.u.action='idle'},
  body=>{body.u.actionTick=12},body=>{body.root.position.x+=1}]){
  const {THREE,scene}=stage();
  const body=warden();
  const fx=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>body});
  const cue=signal('opening');
  assert.equal(fx.emit(cue),true);
  change(body);fx.advance(.016,.016);
  assert.equal(fx.hasLiveCue(cue.id),false,'stale body effect must be retired before next render');
  assert.equal(fx.hasDrawableCue(cue.id),false);
  assert.equal(fx.stats().instancesByPool.signal,0);
  assert.equal(fx.stats().activeDrawCalls,0);
  assert.equal(fx.stats().retiredUnanchoredBodySignals,1);
  fx.dispose();
 }
});

test('D04 retired body signal cannot be resurrected by reacquiring a later matching actor',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage();
 let body=warden();
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>body});
 const cue=signal();
 assert.equal(fx.emit(cue),true);
 body=null;
 fx.advance(.016,.016);
 body=warden();
 fx.advance(.016,.016);
 assert.equal(fx.hasLiveCue(cue.id),false);
 assert.equal(fx.stats().instancesByPool.signal,0);
 fx.dispose();
});

test('D04 authoritative danger cells stay visible when a Warden body becomes stale',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage();
 let body=warden();
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>body});
 assert.equal(fx.emit(warning()),true);
 body=null;fx.advance(.016,.016);
 assert.equal(fx.stats().instancesByPool.signal,1,'true floor hazard must not depend on Warden art');
 fx.reset();assert.equal(fx.stats().instancesByPool.signal,0);
 fx.dispose();
});
