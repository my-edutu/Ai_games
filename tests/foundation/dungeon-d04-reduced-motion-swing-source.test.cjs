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
  DoubleSide:2,DynamicDrawUsage:35048},
  scene:{add(){},remove(){}}};
}
const unit=(tick,action='idle')=>({
 id:'v',kind:'vanguard',faction:'party',x:2,z:2,hp:30,maxHp:30,
 action,actionTick:tick
});
const shot=(tick,action='idle')=>({run:1,floor:1,tick,phase:'exploring',map:[],
 units:[unit(tick,action)],events:[]});
function actor(THREE){
 return {u:unit(10),authored:false,root:{
  visible:true,position:new THREE.Vector3(-7,0,-7),rotation:{y:0}
 }};
}
async function trial({cancel='none',reducedMotion=true,muted=false}={}){
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=stage(),a=actor(THREE),heard=[];
 const visuals=createPhysicalFeedbackVisuals(THREE,scene,{
  reducedMotion,actorById:()=>a});
 const fb=createPhysicalCombatFeedback({
  requirePresentedFrame:true,reducedMotion,visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(c){heard.push(c);return true},
   cleanup(){},flush(){},disable(){},dispose(){}}
 });
 if(!muted)assert.equal(fb.enableAudioFromGesture(),true);
 fb.acceptSnapshot(shot(10));a.u=unit(11,'attack');
 fb.acceptSnapshot(shot(11,'attack'));
 if(cancel==='before-admission')a.u={...a.u,action:'guard',actionTick:12};
 if(cancel==='dead-before-admission')a.u={...a.u,hp:0};
 fb.advance(.016,.016);
 if(cancel==='before-receipt')a.u={...a.u,action:'guard',actionTick:12};
 if(cancel==='dead-before-receipt')a.u={...a.u,hp:0};
 const delivered=fb.acknowledgePresentedFrame(1,.002);
 const result={delivered,heard,receipts:fb.stats().recentDeliveryReceipts,
  visuals:visuals.stats()};
 fb.dispose();return result;
}

test('valid reduced-motion procedural Vanguard keeps one truthful audible attempt without trail or injury',async()=>{
 const r=await trial();
 assert.equal(r.delivered,1);
 assert.deepEqual(r.heard.map(c=>c.audio),['whoosh']);
 assert.equal(r.heard[0].proof,'authority-attempt-not-hit');
 assert.equal(r.visuals.active,0);
 assert.equal(r.visuals.reservedInstances,102);
 assert.equal(r.receipts.at(-1).decision,'delivered');
});
test('cancelled/dead reduced-motion swing cannot make a late whoosh after visual staging',async()=>{
 for(const cancel of ['before-receipt','dead-before-receipt']){
  const r=await trial({cancel});
  assert.equal(r.delivered,0,cancel);
  assert.deepEqual(r.heard,[],cancel);
  assert.equal(r.receipts.at(-1).decision,'revoked-reduced-swing-action',cancel);
 }
});
test('cancelled/dead source before reduced-motion admission is never queued as foley',async()=>{
 for(const cancel of ['before-admission','dead-before-admission']){
  const r=await trial({cancel});
  assert.equal(r.delivered,0,cancel);
  assert.deepEqual(r.heard,[],cancel);
  assert.equal(r.receipts.at(-1).decision,'unverified-reduced-swing-action',cancel);
 }
});
test('actor-local action witness accepts procedural reduced-motion fallback but rejects absent/stale sources',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=stage(),a=actor(THREE);
 const v=createPhysicalFeedbackVisuals(THREE,scene,{
  reducedMotion:true,actorById:()=>a});
 const cue={kind:'swing',visual:'trail',proof:'authority-attempt-not-hit',
  tick:11,actorId:'v',from:{x:2,z:2}};
 a.u=unit(11,'attack');
 assert.equal(v.hasAuthenticatedSwingAction(cue),true);
 a.root.position.x=-5;
 assert.equal(v.hasAuthenticatedSwingAction(cue),false);
 a.root.position.x=-7;a.root.visible=false;
 assert.equal(v.hasAuthenticatedSwingAction(cue),false);
 a.root.visible=true;a.u={...a.u,kind:'cultist'};
 assert.equal(v.hasAuthenticatedSwingAction(cue),false);
 a.u=unit(11,'attack');a.u.hp=0;
 assert.equal(v.hasAuthenticatedSwingAction(cue),false);
 assert.equal(v.stats().active,0);
 v.dispose();
});
test('normal-motion sword without an authenticated authored blade remains silent',async()=>{
 const r=await trial({reducedMotion:false});
 assert.equal(r.delivered,0);
 assert.deepEqual(r.heard,[]);
 assert.equal(r.receipts.at(-1).decision,'missing-measured-blade');
});
test('mute does not backfill a pre-consent reduced-motion sound',async()=>{
 const r=await trial({muted:true});
 assert.equal(r.delivered,0);
 assert.deepEqual(r.heard,[]);
 assert.equal(r.visuals.active,0);
});
