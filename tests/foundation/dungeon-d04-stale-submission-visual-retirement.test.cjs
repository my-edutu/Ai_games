'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,
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
  constructor(){this.visible=false;this.instanceMatrix={setUsage(){},needsUpdate:false}}
  setMatrixAt(){}
 }
 const THREE={Vector3,Object3D,BufferGeometry:Geometry,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh,TorusGeometry:Geometry,
  TetrahedronGeometry:Geometry,RingGeometry:Geometry,
  CylinderGeometry:Geometry,IcosahedronGeometry:Geometry,
  DoubleSide:2,DynamicDrawUsage:35048};
 return {THREE,scene:{add(){},remove(){}}};
}
const injury=(id,targetId='enemy-1-0')=>({
 id,sceneKey:'1:1',tick:11,kind:'damage',visual:'hit',audio:'impact',
 proof:'observed-hp-drop',verified:true,actorId:null,targetId,
 to:{x:2,z:2},from:{x:2,z:2},severity:.2,duration:.28,priority:4
});
test('a >400ms submitted WebGL frame retires ONLY stale transient hit fragments, never another cue',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=stage(),v=createPhysicalFeedbackVisuals(THREE,scene);
 const a=injury('1:1:11:damage:-:enemy-1-0');
 const b=injury('1:1:11:damage:-:enemy-1-1','enemy-1-1');
 try{
  assert.equal(v.emit(a),true);assert.equal(v.emit(b),true);
  const before=v.stats();
  assert.ok(before.instancesByPool.hit>=8);
  assert.equal(v.retireStaleCue(a.id,'stale-frame'),4);
  assert.equal(v.hasLiveCue(a.id),false);
  assert.equal(v.hasLiveCue(b.id),true);
  assert.equal(v.stats().instancesByPool.hit,before.instancesByPool.hit-4);
  assert.equal(v.retireStaleCue(a.id,'stale-frame'),0,'deduplicated retirement');
  assert.equal(v.stats().retiredStaleFrameInstances,4);
  assert.equal(v.stats().drawCalls,7);
  assert.ok(v.stats().reservedInstances<=104);
 }finally{v.dispose()}
});
test('an older warning remains authoritative and cannot be erased by the audio deadline',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=stage(),v=createPhysicalFeedbackVisuals(THREE,scene);
 const warning={id:'1:1:11:threat-warning:-:-',sceneKey:'1:1',tick:11,
  kind:'threat-warning',visual:'warning',audio:'threat-warning',
  verified:true,proof:'authority-warning-window',detail:{cells:[{x:2,z:2},{x:3,z:2}]},
  severity:.5,duration:.6,priority:5};
 try{
  assert.equal(v.emit(warning),true);
  const prior=v.stats().instancesByPool.signal;
  assert.ok(prior>0);
  assert.equal(v.retireStaleCue(warning.id,'stale-frame'),0);
  assert.equal(v.stats().instancesByPool.signal,prior);
  assert.equal(v.hasLiveCue(warning.id),true,
   'frame/audio deadline is not authority to revoke live danger cells');
  assert.equal(v.retireStaleCue(warning.id,'delivered'),0);
 }finally{v.dispose()}
});
test('authentic HP loss with a stalled submitted frame cannot retain next-frame ghost fragments or emit delayed impact',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=stage(),sounds=[];
 const d=createPhysicalCombatFeedback({THREE,scene,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){sounds.push(c);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}});
 const snapshot=(tick,hp)=>({run:1,floor:1,tick,events:[],units:[{
  id:'enemy-1-0',kind:'revenant',faction:'enemy',x:2,z:2,hp,maxHp:30,
  action:hp<30?'hurt':'idle',actionTick:tick
 }]});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,30));d.acceptSnapshot(snapshot(11,20));
  d.advance(.016,.016);
  assert.ok(d.stats().visuals.instancesByPool.hit>0);
  assert.equal(d.acknowledgePresentedFrame(1,.88),0);
  assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,'stale-frame');
  assert.deepEqual(sounds,[]);
  assert.equal(d.stats().visuals.instancesByPool.hit,0,
   'the late rendered impact cannot persist into a later, unrelated frame');
  assert.ok(d.stats().visuals.retiredStaleFrameInstances>0);
  assert.equal(d.stats().visuals.drawCalls,7);
 }finally{d.dispose()}
});
