'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

function fakeScene(){
 class V{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}
 }
 class G{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class M{dispose(){}}
 class Obj{
  constructor(){
   this.position=new V();this.rotation={y:0,set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};this.matrix={};
  }
  updateMatrix(){}
 }
 class Mesh{constructor(){this.visible=false;this.instanceMatrix={setUsage(){}}}
  setMatrixAt(){}}
 class Q{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}}
 const THREE={Vector3:V,Quaternion:Q,Object3D:Obj,BufferGeometry:G,
  Float32BufferAttribute:class{},MeshBasicMaterial:M,MeshStandardMaterial:M,
  InstancedMesh:Mesh,TorusGeometry:G,TetrahedronGeometry:G,RingGeometry:G,
  CylinderGeometry:G,IcosahedronGeometry:G,DoubleSide:2,DynamicDrawUsage:35048};
 let parentLeanX=0,localWristShiftX=0;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){return v.set(-6.8+parentLeanX+localWristShiftX,1.17,-6.8)},
  getWorldQuaternion(q){q.x=0;q.y=0;q.z=0;q.w=1;return q}};
 const assetRoot={
  matrixWorld:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},
  updateWorldMatrix(){},
  worldToLocal(v){v.x-=parentLeanX;return v}
 };
 const unit=(tick,action)=>({id:'vanguard',kind:'vanguard',faction:'party',
  x:2,z:2,hp:30,maxHp:30,action,actionTick:tick});
 const actor={authored:true,assetRoot,rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new V(-7,0,-7),rotation:{y:0}},
  u:unit(11,'attack')};
 return {THREE,scene:{add(){},remove(){}},actor,unit,
  lean(m){parentLeanX=m},moveWrist(m){localWristShiftX=m}};
}
test('D04 real retained pool: parent-only body lean cannot deliver a physically unwitnessed sword whoosh',async()=>{
 const {createPhysicalCombatFeedback}=await load(),f=fakeScene(),heard=[];
 const d=createPhysicalCombatFeedback({
  THREE:f.THREE,scene:f.scene,actorById:()=>f.actor,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){heard.push(c);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}
 });
 const snapshot=(tick,action)=>({run:1,floor:1,tick,events:[],units:[f.unit(tick,action)]});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,'idle'));
  d.acceptSnapshot(snapshot(11,'attack'));
  d.advance(.016,.016); // First wrist sample at staged trail.
  f.lean(.14);d.advance(.016,.016); // Whole parent moved, local wrist did not.
  assert.equal(d.stats().visuals.measuredTrailFrames,0);
  assert.equal(d.acknowledgePresentedFrame(1,.001),0);
  assert.equal(heard.length,0,'no sound from the whole-body lean');
  assert.equal(d.stats().awaitingPresentation,1,
   'valid action may await a genuine later sword-hand movement');
  f.moveWrist(.12);d.advance(.016,.016);
  assert.equal(d.acknowledgePresentedFrame(2,.001),1);
  assert.equal(heard.length,1);
  assert.equal(heard[0].audio,'whoosh');
  assert.equal(heard[0].proof,'authority-attempt-not-hit');
  assert.equal(d.stats().visuals.bodyLocalTrailFrames,1,
   'source-level telemetry distinguishes real authored-space rig proof from yaw fallback');
  assert.equal(d.stats().visuals.yawFallbackTrailFrames,0);
  assert.equal(d.stats().visuals.drawCalls,7);
  assert.equal(d.stats().visuals.reservedInstances,102);
 }finally{d.dispose()}
});
