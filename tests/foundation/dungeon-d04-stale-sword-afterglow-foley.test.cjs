'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

function stage(){
 class Vector3{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}
 }
 class Geometry{
  setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}
 }
 class Material{dispose(){}}
 class Object3D{
  constructor(){
   this.position=new Vector3();this.rotation={y:0,set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};this.matrix={};
  }
  updateMatrix(){}
 }
 class InstancedMesh{
  constructor(){this.visible=false;this.instanceMatrix={setUsage(){}}}
  setMatrixAt(){}
 }
 const THREE={Vector3,Object3D,BufferGeometry:Geometry,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh,TorusGeometry:Geometry,
  TetrahedronGeometry:Geometry,RingGeometry:Geometry,
  CylinderGeometry:Geometry,IcosahedronGeometry:Geometry,
  DoubleSide:2,DynamicDrawUsage:35048};
 const scene={add(){},remove(){}};
 let wristX=-6.8;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)}};
 const actor={authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new Vector3(-7,0,-7),rotation:{y:0}},
  u:{id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
   action:'attack',actionTick:11,hp:30}};
 const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
  actorId:'vanguard',targetId:null,from:{x:2,z:2},verified:true,
  duration:.22,priority:2,severity:.2};
 return {THREE,scene,actor,cue,setWristX(x){wristX=x}};
}
test('stationary wrist retains a short visual afterglow but cannot certify a new sound',async()=>{
 const {createPhysicalFeedbackVisuals}=await source('physical-feedback-visuals.js');
 const f=stage();
 const v=createPhysicalFeedbackVisuals(f.THREE,f.scene,{actorById:()=>f.actor});
 assert.equal(v.emit(f.cue),true);
 v.advance(.016,.016);
 f.setWristX(-6.92);v.advance(.016,.016);
 assert.equal(v.hasDrawableCue(f.cue.id),true);
 assert.equal(v.hasAuthenticatedSwingPose(f.cue),true,
  'a fresh same-bone measured passage is receipt-authorized');
 v.advance(.016,.016); // No further wrist passage: the afterglow is still visible.
 assert.equal(v.hasDrawableCue(f.cue.id),true,
  'cosmetic fading does not have to abruptly cut off');
 assert.equal(v.measuredSwingSpeed(f.cue),null,
  'stale afterglow already has no fresh speed');
 assert.equal(v.hasAuthenticatedSwingPose(f.cue),false,
  'a static afterglow must not authorize an original whoosh');
 assert.equal(v.stats().reservedInstances,102);
 assert.equal(v.stats().drawCalls,7);
 v.dispose();
});
test('frame receipt must not play old measured sword movement once only afterglow remains',async()=>{
 const {createPhysicalCombatFeedback}=await source('physical-combat-feedback.js');
 const f=stage(),heard=[];
 const visualContext={state:'running'};
 const d=createPhysicalCombatFeedback({THREE:f.THREE,scene:f.scene,
  actorById:()=>f.actor,ctx:visualContext,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(cue){heard.push(cue);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  const unit=(tick,action)=>({id:'vanguard',kind:'vanguard',faction:'party',
   hp:30,maxHp:30,x:2,z:2,action,actionTick:tick});
  d.acceptSnapshot({run:1,floor:1,tick:10,events:[],units:[unit(10,'idle')]});
  d.acceptSnapshot({run:1,floor:1,tick:11,events:[],units:[unit(11,'attack')]});
  d.advance(.016,.016); // D04 admission, hidden until measured
  d.advance(.016,.016); // First previous joint sample
  f.setWristX(-6.92);d.advance(.016,.016); // Actual moving joint, visible trail
  d.advance(.016,.016); // Stationary: still-drawable 55ms fading ribbon
  assert.equal(d.acknowledgePresentedFrame(1,.001),0);
  assert.deepEqual(heard,[],
   'do not generate a delayed air sound from a stationary cosmetic remnant');
 }finally{d.dispose()}
});
test('same genuinely moving wrist can still authorize original whoosh on immediate receipt',async()=>{
 const {createPhysicalFeedbackVisuals}=await source('physical-feedback-visuals.js');
 const f=stage();
 const v=createPhysicalFeedbackVisuals(f.THREE,f.scene,{actorById:()=>f.actor});
 try{
  v.emit(f.cue);v.advance(.016,.016);
  f.setWristX(-6.92);v.advance(.016,.016);
  assert.equal(v.hasAuthenticatedSwingPose(f.cue),true);
  assert.ok(v.measuredSwingSpeed(f.cue)>0);
 }finally{v.dispose()}
});
