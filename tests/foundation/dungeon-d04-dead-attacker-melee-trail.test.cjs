'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=n=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+n)).href);

// Retained Three.js-like scene. No invented blade or actor mesh is rendered:
// genuine D04 modules still select the existing authored wrist and move
// their own pooled instance matrices.
function stage(){
 class Vec{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const n=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=n;this.y/=n;this.z/=n;return this}
 }
 class Geo{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Material{constructor(values){Object.assign(this,values)}dispose(){}}
 class Object3D{
  constructor(){
   this.position=new Vec();
   this.rotation={y:0,set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};
   this.matrix={};
  }
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 }
 class Mesh{
  constructor(){this.visible=false;this.instanceMatrix={setUsage(){},needsUpdate:false}}
  setMatrixAt(){}
 }
 const THREE={Vector3:Vec,Object3D,BufferGeometry:Geo,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh:Mesh,
  TorusGeometry:Geo,TetrahedronGeometry:Geo,IcosahedronGeometry:Geo,
  RingGeometry:Geo,CylinderGeometry:Geo,DoubleSide:2,DynamicDrawUsage:35048};
 const scene={add(){},remove(){}};
 let wristX=-2.84;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(point){point.set(wristX,1.16,-2.84)}};
 const actor={u:{id:'vanguard',kind:'vanguard',faction:'party',
   hp:30,maxHp:30,action:'attack',actionTick:11},
  authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:{x:-3,y:0,z:-3},rotation:{y:0}}};
 const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'swing',visual:'trail',audio:'whoosh',
  actorId:'vanguard',from:{x:6,z:6},to:null,
  proof:'authority-attempt-not-hit',verified:true,
  duration:.35,priority:5,severity:0};
 return {THREE,scene,actor,cue,shiftWrist:()=>{wristX-=.12}};
}

test('dead attacker cannot start another measured sword trail on a stale attack action',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const h=stage();h.actor.u.hp=0;
 const visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:()=>h.actor});
 assert.equal(visuals.emit(h.cue),false,
  'death invalidates an old attack tick even if the rig is still posed to swing');
 assert.equal(visuals.hasLiveCue(h.cue.id),false);
 assert.equal(visuals.stats().activeDrawCalls,0);
 visuals.dispose();
});

test('a formerly drawable sword trail is silenced and retired on observed death',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {classifySubmittedCombatAudio}=await load('physical-feedback-frame-gate.js');
 const h=stage();
 const visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:()=>h.actor});
 assert.equal(visuals.emit(h.cue),true);
 visuals.advance(.016,.016);
 h.shiftWrist();visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),true,
  'authored living wrist motion earns a brief air streak, not a claimed hit');
 h.actor.u.hp=0;h.shiftWrist();visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),false,
  'the dead character must not keep submitting a physical sword streak');
 assert.equal(visuals.hasLiveCue(h.cue.id),false,
  'release the now-invalid retained slot promptly, without using its full lifetime');
 assert.equal(visuals.stats().activeDrawCalls,0);
 assert.equal(visuals.stats().retiredDeadTrails,1,
  'one observed death promptly returns its retained sword slot');
 assert.equal(classifySubmittedCombatAudio({
  sceneMatches:true,observedFrameVerified:true,elapsedSeconds:.05,
  submissionSeconds:.002,visualAccepted:true,
  visualAlive:visuals.hasLiveCue(h.cue.id),
  visualDrawable:visuals.hasDrawableCue(h.cue.id),
  requiresMeasuredBlade:true
 }), 'expired-visual','the frame receipt must never authorize a posthumous whoosh');
 assert.equal(visuals.stats().reservedInstances,102);
 assert.equal(visuals.stats().drawCalls,7);
 visuals.dispose();
});

test('missing rig is suppressed without claiming a death; real health loss keeps its own proof',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const h=stage();
 const visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:id=>id==='vanguard'?h.actor:null});
 h.actor.authored=false;
 assert.equal(visuals.emit(h.cue),false,'procedural actor has no certified melee blade');
 const damage={...h.cue,id:'hp-loss',kind:'damage',visual:'hit',audio:'impact',
  actorId:null,targetId:'vanguard',from:null,to:{x:6,z:6},
  proof:'observed-hp-drop',severity:.4};
 assert.equal(visuals.emit(damage),true,'HP loss remains independent of sword ownership');
 assert.equal(visuals.stats().confirmedFragments>=4,true);
 visuals.dispose();
});

test('D04 actual controller frame receipt rejects posthumous authored swing audio',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const h=stage(),sounds=[];
 const visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:()=>h.actor});
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(cue){sounds.push(cue.audio);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}
 });
 const shot=(tick,action)=>({run:1,floor:1,tick,events:[],
  units:[{id:'vanguard',kind:'vanguard',faction:'party',x:6,z:6,
   hp:30,maxHp:30,action,actionTick:tick}]});
 const initial=shot(10,'idle'),attack=shot(11,'attack');
 assert.equal(director.enableAudioFromGesture(),true);
 h.actor.u=initial.units[0];director.acceptSnapshot(initial);
 h.actor.u=attack.units[0];director.acceptSnapshot(attack);
 director.advance(.016,.016);
 h.shiftWrist();director.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),true);
 h.actor.u={...attack.units[0],hp:0};
 h.shiftWrist();director.advance(.016,.016);
 assert.equal(director.acknowledgePresentedFrame(1,.002),0);
 assert.deepEqual(sounds,[],'frame receipt cannot authenticate sound from a dead sword arm');
 assert.equal(director.stats().recentDeliveryReceipts.at(-1)?.decision,'expired-visual');
 assert.equal(visuals.stats().retiredDeadTrails,1);
 director.dispose();
});
