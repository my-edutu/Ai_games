'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=(name)=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

const snapshot=tick=>({run:1,floor:1,tick,events:[],units:[{
 id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
 hp:30,maxHp:30,action:tick===10?'idle':'attack',actionTick:tick
}]});
function fixture({reducedMotion=false,speed=4.5}={}){
 const heard=[],ctx={state:'running'};
 const visuals={
  emit(){return !reducedMotion},advance(){},reset(){},dispose(){},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  hasAuthenticatedSwingPose(){return true},
  hasAuthenticatedSwingAction(){return true},
  measuredSwingSpeed(){return speed}
 };
 const audio={
  enable(){return true},emit(cue){heard.push(cue);return true},
  disable(){},flush(){},cleanup(){},dispose(){}
 };
 return {heard,ctx,visuals,audio};
}
async function trial(options={}){
 const {createPhysicalCombatFeedback}=await source('physical-combat-feedback.js');
 const f=fixture(options);
 const director=createPhysicalCombatFeedback({
  ctx:f.ctx,visualAdapter:f.visuals,audioAdapter:f.audio,
  reducedMotion:options.reducedMotion===true,requirePresentedFrame:true
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10));
 director.acceptSnapshot(snapshot(11));
 director.advance(.016,.016);
 assert.equal(director.acknowledgePresentedFrame(1,.001),1);
 director.dispose();
 return f.heard[0];
}
test('a genuinely submitted and pose-authenticated drawn swing transports its measured hand speed only as foley metadata',async()=>{
 const sound=await trial({speed:4.5});
 assert.equal(sound.audio,'whoosh');
 assert.equal(sound.detail?.measuredHandMetersPerSecond,4.5);
 assert.equal(sound.kind,'swing');
 assert.equal(sound.proof,'authority-attempt-not-hit');
 assert.equal(sound.targetId,null,'a measured wrist never invents contact');
});
test('reduced-motion sound-only swing does not invent a blade measurement',async()=>{
 const sound=await trial({reducedMotion:true,speed:4.5});
 assert.equal(sound.audio,'whoosh');
 assert.equal(sound.detail?.measuredHandMetersPerSecond,undefined);
});
test('invalid or absent renderer speed never authorizes a synthetic physical value',async()=>{
 for(const speed of [NaN,Infinity,-3,null,0]){
  const sound=await trial({speed});
  assert.equal(sound.detail?.measuredHandMetersPerSecond,undefined);
 }
});
test('original procedural whoosh attenuates slower witnessed hand motion but never exceeds existing peak',async()=>{
 const {createOriginalCombatFoley}=await source('original-combat-foley.js');
 function fixtureAudio(){
  const gains=[];
  const param=()=>({value:0,ramps:[],setValueAtTime(v){this.value=v},
   exponentialRampToValueAtTime(v){this.ramps.push(v)}});
  const node=()=>({gain:param(),frequency:param(),Q:{value:0},
   connect(){},disconnect(){},start(){},stop(){}});
  const ctx={state:'running',currentTime:0,destination:node(),
   createGain(){const g=node();gains.push(g);return g},
   createBiquadFilter:node,createOscillator:node,createBufferSource:node,
   createBuffer(channels,length,rate){return {length,sampleRate:rate,
    duration:length/rate,getChannelData:()=>new Float32Array(length)}}};
  return {ctx,gains};
 }
 const seen=[];
 for(const speed of [1,3,8,null,Number.POSITIVE_INFINITY]){
  const f=fixtureAudio(),engine=createOriginalCombatFoley(f.ctx);
  assert.equal(engine.enable(),true);
  const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
   kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
   actorId:'vanguard',targetId:null,priority:2,
   detail:speed===null?null:{measuredHandMetersPerSecond:speed}};
  assert.equal(engine.emit(cue),true);
  seen.push(f.gains[1].gain.ramps[0]);
  engine.dispose();
 }
 assert.ok(seen[0]<seen[1]&&seen[1]<seen[2],
  'a faster REAL wrist passage earns a modestly stronger air sound');
 assert.ok(seen[2]<=seen[3]+1e-10,'measurement may not exceed original envelope peak');
 assert.equal(seen[4],seen[3],'invalid metadata retains original sound recipe');
});

function realVisualStage(){
 class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}}
 class Geometry{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Material{dispose(){}}
 class Object3D{constructor(){
  this.position=new Vector3();this.rotation={y:0,set(){}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};this.matrix={};
 }updateMatrix(){}}
 class InstancedMesh{constructor(){this.visible=false;this.instanceMatrix={setUsage(){}}}
  setMatrixAt(){}}
 return {THREE:{Vector3,Object3D,BufferGeometry:Geometry,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh,TorusGeometry:Geometry,
  TetrahedronGeometry:Geometry,RingGeometry:Geometry,
  CylinderGeometry:Geometry,IcosahedronGeometry:Geometry,
  DoubleSide:2,DynamicDrawUsage:35048},
  scene:{add(){},remove(){}}};
}
test('production retained visual stage measures frame-local wrist speed, not a fictional contact',async()=>{
 const {createPhysicalFeedbackVisuals}=await source('physical-feedback-visuals.js');
 const {THREE,scene}=realVisualStage();
 let wristX=-6.8;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)}};
 const actor={authored:true,assetRoot:{},
  rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}},
  u:{id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
   action:'attack',actionTick:11,hp:30}};
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>actor});
 const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'swing',visual:'trail',audio:'whoosh',
  proof:'authority-attempt-not-hit',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},
  duration:.22,priority:2,severity:.2};
 assert.equal(effects.emit(cue),true);
 assert.equal(effects.measuredSwingSpeed(cue),null,'one wrist sample is not travel');
 effects.advance(.016,.016);
 assert.equal(effects.measuredSwingSpeed(cue),null);
 wristX-=.12;
 effects.advance(.016,.016);
 assert.equal(effects.hasDrawableCue(cue.id),true);
 assert.ok(Math.abs(effects.measuredSwingSpeed(cue)-7.5)<1e-8);
 assert.equal(effects.stats().reservedInstances,102);
 assert.equal(effects.stats().drawCalls,7);
 wristX+=.20;
 assert.equal(effects.measuredSwingSpeed(cue),null,
  'unsampled mid-frame movement cannot inherit the last sound energy');
 effects.advance(.016,.016);
 assert.ok(effects.measuredSwingSpeed(cue)>0,'fresh physical motion restores a witness');
 actor.rigMeleeBones=[{part:'wrist',bone:{...bone}}];
 assert.equal(effects.measuredSwingSpeed(cue),null,'replacement wrist revokes source');
 effects.dispose();
});
test('a retained, formerly measured ribbon cannot replay old energy after a stationary frame',async()=>{
 const {createPhysicalFeedbackVisuals}=await source('physical-feedback-visuals.js');
 const {THREE,scene}=realVisualStage();
 let wristX=-6.8;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)}};
 const actor={authored:true,assetRoot:{},
  rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}},
  u:{id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
   action:'attack',actionTick:11,hp:30}};
 const effects=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>actor});
 const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
  actorId:'vanguard',from:{x:2,z:2},duration:.22,priority:2,verified:true};
 effects.emit(cue);effects.advance(.016,.016);
 wristX-=.12;effects.advance(.016,.016);
 assert.ok(effects.measuredSwingSpeed(cue)>0);
 effects.advance(.016,.016);
 assert.equal(effects.hasDrawableCue(cue.id),true,'short retained trail remains drawable');
 assert.equal(effects.measuredSwingSpeed(cue),null,'no new travel means no new velocity');
 effects.dispose();
});
