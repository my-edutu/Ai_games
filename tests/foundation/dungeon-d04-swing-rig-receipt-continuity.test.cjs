'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

function stage(){
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
  DoubleSide:2,DynamicDrawUsage:35048},scene:{add(){},remove(){}}};
}
const unit=(tick,action='idle')=>({
 id:'source',kind:'vanguard',faction:'party',x:2,z:2,hp:30,maxHp:30,
 action,actionTick:tick
});
const shot=(tick,action='idle')=>({
 run:1,floor:1,tick,phase:'exploring',map:[],units:[unit(tick,action)],events:[]
});
const CUE_ID='1:1:11:swing:source:-';
const cue=Object.freeze({
 id:CUE_ID,kind:'swing',visual:'trail',proof:'authority-attempt-not-hit',
 actorId:'source',tick:11,from:{x:2,z:2}
});

async function trial({swap=false,refresh=false}={}){
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=stage();
 let wristX=-6.8;
 const bone=()=>({isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)}});
 const originalBone=bone(),replacementBone=bone();
 const actor={u:unit(10),authored:true,assetRoot:{},
  rigMeleeBones:[{part:'wrist',bone:originalBone}],
  root:{visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}}};
 const visuals=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>actor});
 const heard=[];
 const feedback=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(c){heard.push(c.audio);return true},
   cleanup(){},disable(){},flush(){},dispose(){}}
 });
 assert.equal(feedback.enableAudioFromGesture(),true);
 feedback.acceptSnapshot(shot(10));
 actor.u=unit(11,'attack');
 feedback.acceptSnapshot(shot(11,'attack'));
 feedback.advance(.016,.016);
 wristX-=.12;feedback.advance(.016,.016);
 assert.equal(visuals.hasDrawableCue(CUE_ID),true,
  'a genuinely measured original wrist must be drawn before the rig swap');
 const beforeSwap=visuals.hasAuthenticatedSwingPose(cue);
 if(swap)actor.rigMeleeBones=[{part:'wrist',bone:replacementBone}];
 const afterSwap=visuals.hasAuthenticatedSwingPose(cue);
 const staleDrawable=visuals.hasDrawableCue(CUE_ID);
 if(refresh){
  feedback.advance(.016,.016);wristX-=.12;feedback.advance(.016,.016);
 }
 const finalDrawable=visuals.hasDrawableCue(CUE_ID);
 const finalWitness=visuals.hasAuthenticatedSwingPose(cue);
 const sent=feedback.acknowledgePresentedFrame(1,.003);
 const receipts=feedback.stats().recentDeliveryReceipts;
 const visualStats=visuals.stats();
 feedback.dispose();
 return {sent,heard,beforeSwap,afterSwap,staleDrawable,finalDrawable,
  finalWitness,receipts,visualStats};
}

test('a swapped animated wrist cannot certify an old retained ribbon at frame receipt',async()=>{
 const r=await trial({swap:true});
 assert.equal(r.beforeSwap,true);
 assert.equal(r.staleDrawable,true,'the prior frame still contains a visible old ribbon');
 assert.equal(r.afterSwap,false,'new joint identity is not an observed old blade stroke');
 assert.equal(r.sent,0);
 assert.deepEqual(r.heard,[]);
 assert.equal(r.receipts.at(-1).decision,'revoked-drawn-swing-pose');
 assert.equal(r.visualStats.reservedInstances,102);
 assert.equal(r.visualStats.drawCalls,7);
});
test('a stable, genuinely measured original wrist still releases exactly one submitted whoosh',async()=>{
 const r=await trial();
 assert.equal(r.afterSwap,true);
 assert.equal(r.sent,1);
 assert.deepEqual(r.heard,['whoosh']);
 assert.equal(r.receipts.at(-1).decision,'delivered');
});
test('new wrist can earn a fresh physical motion after two authentic samples',async()=>{
 const r=await trial({swap:true,refresh:true});
 assert.equal(r.afterSwap,false);
 assert.equal(r.finalDrawable,true);
 assert.equal(r.finalWitness,true);
 assert.equal(r.sent,1);
 assert.deepEqual(r.heard,['whoosh']);
 assert.equal(r.visualStats.reservedInstances,102);
});
