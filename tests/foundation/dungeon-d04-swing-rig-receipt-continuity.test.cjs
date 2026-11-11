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

async function trial({swap=false,refresh=false,drift=0,yaw=0}={}){
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
 // Animate after the VFX advance but before the renderer's submission receipt.
 // A stable joint identity is insufficient if its spatial pose has changed.
 wristX+=drift;
 actor.root.rotation.y=yaw;
 const afterSwap=visuals.hasAuthenticatedSwingPose(cue);
 const staleDrawable=visuals.hasDrawableCue(CUE_ID);
 if(refresh){
  feedback.advance(.016,.016);wristX-=.12;feedback.advance(.016,.016);
 }
 const finalDrawable=visuals.hasDrawableCue(CUE_ID);
 const finalWitness=visuals.hasAuthenticatedSwingPose(cue);
 const sent=feedback.acknowledgePresentedFrame(1,.003);
 const drawableAfterReceipt=visuals.hasDrawableCue(CUE_ID);
 const receipts=feedback.stats().recentDeliveryReceipts;
 const visualStats=visuals.stats();
 feedback.dispose();
 return {sent,heard,beforeSwap,afterSwap,staleDrawable,finalDrawable,
  finalWitness,drawableAfterReceipt,receipts,visualStats};
}

test('a swapped animated wrist cannot certify an old retained ribbon at frame receipt',async()=>{
 const r=await trial({swap:true});
 assert.equal(r.beforeSwap,true);
 assert.equal(r.staleDrawable,true,'the prior frame still contains a visible old ribbon');
 assert.equal(r.afterSwap,false,'new joint identity is not an observed old blade stroke');
 assert.equal(r.sent,0);
 assert.deepEqual(r.heard,[]);
 assert.equal(r.receipts.at(-1).decision,'revoked-drawn-swing-pose');
 assert.equal(r.drawableAfterReceipt,false,
  'real retained sword slot must retire after a pose-revoked frame receipt');
 assert.equal(r.visualStats.reservedInstances,102);
 assert.equal(r.visualStats.drawCalls,7);
});
test('a stable, genuinely measured original wrist still releases exactly one submitted whoosh',async()=>{
 const r=await trial();
 assert.equal(r.afterSwap,true);
 assert.equal(r.sent,1);
 assert.deepEqual(r.heard,['whoosh']);
 assert.equal(r.receipts.at(-1).decision,'delivered');
 assert.equal(r.drawableAfterReceipt,true,
  'a still-authenticated submitted sword segment must not be retired');
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

// RED contract: the previous version only checked sourceBone identity at receipt.
// A delayed same-rig pose change could play a whoosh for an old visible ribbon.
test('same wrist moving materially after VFX update cannot authorize stale drawn sound',async()=>{
 const r=await trial({drift:.28});
 assert.equal(r.beforeSwap,true);
 assert.equal(r.staleDrawable,true,'previous submitted ribbon remains retained');
 assert.equal(r.afterSwap,false,'28cm joint drift invalidates physical frame alignment');
 assert.equal(r.sent,0);
 assert.deepEqual(r.heard,[]);
 assert.equal(r.receipts.at(-1).decision,'revoked-drawn-swing-pose');
});
test('small same-rig sampling jitter does not silence a fresh submitted whoosh',async()=>{
 const r=await trial({drift:.012,yaw:.015});
 assert.equal(r.afterSwap,true);
 assert.equal(r.sent,1);
 assert.deepEqual(r.heard,['whoosh']);
});
test('same wrist changing root heading after VFX update cannot certify its old ribbon',async()=>{
 const r=await trial({yaw:.35});
 assert.equal(r.staleDrawable,true);
 assert.equal(r.afterSwap,false);
 assert.equal(r.sent,0);
 assert.deepEqual(r.heard,[]);
});
test('a moved wrist may authorize sound after the actual next sampled blade passage',async()=>{
 const r=await trial({drift:.28,refresh:true});
 assert.equal(r.afterSwap,false);
 assert.equal(r.finalDrawable,true);
 assert.equal(r.finalWitness,true);
 assert.equal(r.sent,1);
 assert.deepEqual(r.heard,['whoosh']);
 assert.equal(r.visualStats.reservedInstances,102);
});

test('receipt freshness treats yaw wrap, root drift and non-finite samples conservatively',async()=>{
 const {isCurrentMeasuredHandReceipt,
  MEASURED_HAND_RECEIPT_MAX_SPATIAL_DRIFT_METERS:limit}=await load('measured-weapon-trail.js');
 const bone={isBone:true};
 const sample={x:-6.7,y:1.2,z:-6.8,rootX:-7,rootY:0,rootZ:-7,
  yaw:Math.PI-.01,sourceBone:bone};
 assert.equal(isCurrentMeasuredHandReceipt(sample,{
  ...sample,yaw:-Math.PI+.01}),true,'angular wrap is a tiny valid rotation');
 assert.equal(isCurrentMeasuredHandReceipt(sample,{
  ...sample,rootX:sample.rootX+limit+.01}),false,
  'a moving root cannot authorize a ribbon sampled before that movement');
 assert.equal(isCurrentMeasuredHandReceipt(sample,{
  ...sample,x:NaN}),false,'malformed new wrist position fails closed');
 assert.equal(isCurrentMeasuredHandReceipt(sample,{
  ...sample,sourceBone:{isBone:true}}),false,'a replacement wrist is never equivalent');
 assert.equal(isCurrentMeasuredHandReceipt(sample,{
  ...sample,x:sample.x+limit*.5}),true,'small change remains within tolerance');
});
