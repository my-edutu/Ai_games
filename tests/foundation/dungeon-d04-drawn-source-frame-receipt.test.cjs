'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

function shot(tick,kind,action='idle'){
 const unit={id:'source',kind,faction:kind==='warden'?'enemy':'party',
  x:2,z:2,hp:30,maxHp:30,action,actionTick:tick,
  ...(kind==='warden'?{recoveryUntilTick:12}:{}),
  ...(kind==='ranger'?{targetId:'victim'}:{})};
 return {run:1,floor:1,tick,phase:'exploring',guardianWard:false,map:[],
  units:[unit,{id:'victim',kind:'revenant',faction:'enemy',
   x:4,z:2,hp:30,maxHp:30,action:'idle',actionTick:10}],
  events:kind==='warden'&&action==='cast'?
   [{kind:'opening',tick,text:'anonymous'}]:[],
  ...(kind==='warden'&&action==='cast'?{bossRecovery:{remaining:2}}:{})};
}

async function staged(kind,{revoke=false}={}){
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 let poseLive=true;
 const heard=[],probes=[];
 const visual={
  emit(){return true},advance(){},reset(){},dispose(){},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  hasAuthenticatedSwingPose(cue){probes.push('swing:'+cue.kind);return poseLive},
  hasAuthenticatedBodyPose(cue){probes.push('body:'+cue.kind);return poseLive}
 };
 const feedback=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter:visual,
  resolveContact:()=>({targetId:'victim',distance:2}),
  audioAdapter:{enable(){return true},emit(cue){heard.push(cue.kind);return true},
   cleanup(){},disable(){},flush(){},dispose(){}}
 });
 assert.equal(feedback.enableAudioFromGesture(),true);
 feedback.acceptSnapshot(shot(10,kind));
 feedback.acceptSnapshot(shot(11,kind,kind==='warden'?'cast':'attack'));
 // All cues are already drawable and age < 400ms. This isolates the
 // interval between pose/effect staging and actual WebGL frame receipt.
 for(let i=0;i<(kind==='ranger'?6:1);i++)feedback.advance(.05,.05);
 if(revoke)poseLive=false;
 const sent=feedback.acknowledgePresentedFrame(1,.004);
 const result={sent,heard,probes,receipts:feedback.stats().recentDeliveryReceipts};
 feedback.dispose();return result;
}

test('drawn sword cannot whoosh from an actor revoked AFTER visual staging',async()=>{
 const h=await staged('vanguard',{revoke:true});
 assert.equal(h.sent,0);
 assert.deepEqual(h.heard,[]);
 assert.deepEqual(h.probes,['swing:swing']);
 assert.equal(h.receipts.at(-1).decision,'revoked-drawn-swing-pose');
});
test('drawn Warden release and recovery cannot sound from revoked cast',async()=>{
 const h=await staged('warden',{revoke:true});
 assert.equal(h.sent,0);
 assert.deepEqual(h.heard,[]);
 assert.deepEqual(h.probes,['body:warden-release','body:opening']);
 assert.deepEqual(h.receipts.map(x=>x.decision),
  ['revoked-drawn-body-pose','revoked-drawn-body-pose']);
});
test('affirmatively live drawn sword and Warden beats still sound once',async()=>{
 const melee=await staged('vanguard');
 assert.equal(melee.sent,1);
 assert.deepEqual(melee.heard,['swing']);
 const boss=await staged('warden');
 assert.equal(boss.sent,2);
 assert.deepEqual(boss.heard,['warden-release','opening']);
});
test('already-launched drawn projectile is independent of later caster pose',async()=>{
 const arrow=await staged('ranger',{revoke:true});
 assert.equal(arrow.sent,1);
 assert.deepEqual(arrow.heard,['ranged-release']);
 assert.deepEqual(arrow.probes,[]);
});

function fakeStage(){
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}}
 class G{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class M{dispose(){}}
 class Obj{constructor(){this.position=new V();this.rotation={y:0,set(){}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};this.matrix={}}
  updateMatrix(){}}
 class Mesh{constructor(){this.visible=false;this.instanceMatrix={setUsage(){}}}
  setMatrixAt(){}}
 return {THREE:{Vector3:V,Object3D:Obj,BufferGeometry:G,
  Float32BufferAttribute:class{},MeshBasicMaterial:M,MeshStandardMaterial:M,
  InstancedMesh:Mesh,TorusGeometry:G,TetrahedronGeometry:G,
  RingGeometry:G,CylinderGeometry:G,IcosahedronGeometry:G,
  DoubleSide:2,DynamicDrawUsage:35048},
  scene:{add(){},remove(){}}};
}

test('real retained measured trail cannot authorize a whoosh after mid-frame actor cancellation',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=fakeStage();
 let wristX=-6.8;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)}};
 const actor={u:null,authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}}};
 const visual=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>actor});
 const heard=[];
 const feedback=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter:visual,
  audioAdapter:{enable(){return true},emit(c){heard.push(c.audio);return true},
   cleanup(){},disable(){},flush(){},dispose(){}}
 });
 assert.equal(feedback.enableAudioFromGesture(),true);
 const before=shot(10,'vanguard'),attack=shot(11,'vanguard','attack');
 actor.u=before.units[0];feedback.acceptSnapshot(before);
 actor.u=attack.units[0];feedback.acceptSnapshot(attack);
 feedback.advance(.016,.016);
 wristX-=.12;feedback.advance(.016,.016);
 const cueId='1:1:11:swing:source:-';
 assert.equal(visual.hasLiveCue(cueId),true);
 assert.equal(visual.hasDrawableCue(cueId),true);
 // Authority/actor changes after the last visual advancement, before the
 // actual submitted-frame receipt. The stale retained GPU slot alone is not
 // proof of a live attacking body at the sound-scheduling boundary.
 actor.u={...actor.u,action:'guard',actionTick:12};
 assert.equal(visual.hasDrawableCue(cueId),true);
 assert.equal(feedback.acknowledgePresentedFrame(1,.003),0);
 assert.deepEqual(heard,[]);
 assert.equal(feedback.stats().recentDeliveryReceipts.at(-1).decision,
  'revoked-drawn-swing-pose');
 assert.equal(feedback.stats().visuals.reservedInstances,102);
 feedback.dispose();
});

test('production witness requires living matched action and actual wrist, without a new effect',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=fakeStage();
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(-6.8,1.17,-6.8)}};
 const actor={u:{id:'source',kind:'vanguard',faction:'party',
   hp:30,action:'attack',actionTick:11},
  authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}}};
 const visual=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>actor});
 const cue={id:'swing-11',kind:'swing',visual:'trail',
  proof:'authority-attempt-not-hit',actorId:'source',tick:11,
  from:{x:2,z:2}};
 assert.equal(visual.hasAuthenticatedSwingPose(cue),true);
 actor.u.action='guard';
 assert.equal(visual.hasAuthenticatedSwingPose(cue),false);
 actor.u.action='attack';actor.u.hp=0;
 assert.equal(visual.hasAuthenticatedSwingPose(cue),false);
 actor.u.hp=30;actor.rigMeleeBones=[];
 assert.equal(visual.hasAuthenticatedSwingPose(cue),false);
 assert.equal(visual.stats().active,0);
 assert.equal(visual.stats().reservedInstances,102);
 visual.dispose();
});
