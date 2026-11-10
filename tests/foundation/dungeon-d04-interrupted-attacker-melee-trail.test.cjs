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


test('an observed guard interruption retires measured sword art and returns its slot',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {classifySubmittedCombatAudio}=await load('physical-feedback-frame-gate.js');
 const h=stage();
 const visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,{actorById:()=>h.actor});
 assert.equal(visuals.emit(h.cue),true);
 visuals.advance(.016,.016);h.shiftWrist();visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),true);
 h.actor.u.action='guard';h.actor.u.actionTick=12;
 visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),false);
 assert.equal(visuals.hasLiveCue(h.cue.id),false,
  'a confirmed replacement action must permanently retire, not temporarily hide, the prior swing');
 assert.equal(visuals.stats().instancesByPool.trail,0);
 assert.equal(visuals.stats().retiredInterruptedTrails,1);
 assert.equal(classifySubmittedCombatAudio({
  sceneMatches:true,observedFrameVerified:true,elapsedSeconds:.05,
  submissionSeconds:.002,visualAccepted:true,
  visualAlive:visuals.hasLiveCue(h.cue.id),
  visualDrawable:visuals.hasDrawableCue(h.cue.id),
  requiresMeasuredBlade:true
 }),'expired-visual');
 // A stale animation state must never resurrect this already revoked cue.
 h.actor.u.action='attack';h.actor.u.actionTick=11;
 h.shiftWrist();visuals.advance(.016,.016);
 h.shiftWrist();visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),false);
 assert.equal(visuals.stats().reservedInstances,102);
 assert.equal(visuals.stats().drawCalls,7);
 visuals.dispose();
});

test('a new attack tick revokes a previous blade without interpreting it as a hit',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const h=stage(),visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:()=>h.actor});
 assert.equal(visuals.emit(h.cue),true);
 h.actor.u.action='attack';h.actor.u.actionTick=12;
 visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(h.cue.id),false);
 assert.equal(visuals.stats().retiredInterruptedTrails,1);
 assert.equal(visuals.stats().confirmedFragments,0,
  'interruption is not confirmation that any actor took damage');
 visuals.dispose();
});

test('temporary missing/unloaded wrist is hidden, not misidentified as an action interrupt',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const h=stage(),visuals=createPhysicalFeedbackVisuals(h.THREE,h.scene,
  {actorById:()=>h.actor});
 assert.equal(visuals.emit(h.cue),true);
 h.actor.authored=false;
 visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(h.cue.id),true,
  'without affirmative identity-matched action change, do not claim an interrupt');
 assert.equal(visuals.hasDrawableCue(h.cue.id),false);
 assert.equal(visuals.stats().retiredInterruptedTrails,0);
 h.actor.authored=true;
 visuals.advance(.016,.016);h.shiftWrist();visuals.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),true,
  'same legitimate attack may become visible again after its own rig returns');
 visuals.dispose();
});

test('interrupted swing cannot release its delayed whoosh on the next frame receipt',async()=>{
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
 assert.equal(director.enableAudioFromGesture(),true);
 const initial=shot(10,'idle'),attack=shot(11,'attack');
 h.actor.u=initial.units[0];director.acceptSnapshot(initial);
 h.actor.u=attack.units[0];director.acceptSnapshot(attack);
 director.advance(.016,.016);
 h.shiftWrist();director.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(h.cue.id),true);
 h.actor.u=shot(12,'guard').units[0];
 director.advance(.016,.016);
 assert.equal(director.acknowledgePresentedFrame(1,.002),0);
 assert.deepEqual(sounds,[]);
 assert.equal(director.stats().recentDeliveryReceipts.at(-1)?.decision,'expired-visual');
 director.dispose();
});
