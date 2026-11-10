'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);
const rotation=angle=>({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});

test('same live wrist position but 0.48-radian skinned rotation cannot certify an older ribbon',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const bone={isBone:true};
 const previous={x:-6.8,y:1.2,z:-6.8,rootX:-7,rootY:0,rootZ:-7,yaw:0,
  sourceBone:bone,wristQuaternion:rotation(0)};
 assert.equal(isCurrentMeasuredHandReceipt(previous,{
  ...previous,wristQuaternion:rotation(.48)}),false,
  'unchanged world wrist point does not prove that the blade orientation is unchanged');
 assert.equal(isCurrentMeasuredHandReceipt(previous,{
  ...previous,wristQuaternion:rotation(.018)}),true,
  'small wrist angular sampling jitter must not silence an authentic passage');
});

test('world quaternion sign ambiguity and malformed replacement pose are handled conservatively',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const q=rotation(.15),bone={isBone:true};
 const p={x:-6.8,y:1.2,z:-6.8,rootX:-7,rootY:0,rootZ:-7,yaw:0,
  sourceBone:bone,wristQuaternion:q};
 assert.equal(isCurrentMeasuredHandReceipt(p,{
  ...p,wristQuaternion:{x:-q.x,y:-q.y,z:-q.z,w:-q.w}}),true,
  'q and -q represent the same physical orientation');
 assert.equal(isCurrentMeasuredHandReceipt(p,{...p,wristQuaternion:null}),false,
  'a disappeared pose measurement cannot retroactively approve an old skinned frame');
 assert.equal(isCurrentMeasuredHandReceipt(p,{...p,
  wristQuaternion:{x:NaN,y:0,z:0,w:1}}),false);
 assert.equal(isCurrentMeasuredHandReceipt(p,{...p,
  wristQuaternion:{x:0,y:0,z:0,w:0}}),false,
  'zero-norm quaternions do not prove orientation');
});

function stage(){
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}normalize(){return this}}
 class G{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class M{dispose(){}}
 class Obj{constructor(){this.position=new V();this.rotation={y:0,set(){}};
  this.quaternion={identity(){},setFromUnitVectors(){}};this.scale={setScalar(){},set(){}};this.matrix={}}
  updateMatrix(){}}
 class Mesh{constructor(){this.visible=false;this.instanceMatrix={setUsage(){}}}setMatrixAt(){}}
 class Q{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}}
 const THREE={Vector3:V,Quaternion:Q,Object3D:Obj,BufferGeometry:G,
  Float32BufferAttribute:class{},MeshBasicMaterial:M,MeshStandardMaterial:M,
  InstancedMesh:Mesh,TorusGeometry:G,TetrahedronGeometry:G,RingGeometry:G,
  CylinderGeometry:G,IcosahedronGeometry:G,DoubleSide:2,DynamicDrawUsage:35048};
 let wristX=-6.8,wristAngle=0;
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){v.set(wristX,1.17,-6.8)},
  getWorldQuaternion(q){Object.assign(q,rotation(wristAngle));return q}};
 const u=(tick,action)=>({id:'vanguard',kind:'vanguard',faction:'party',
  x:2,z:2,hp:30,maxHp:30,action,actionTick:tick});
 const actor={authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new V(-7,0,-7),rotation:{y:0}},u:u(11,'attack')};
 const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
  actorId:'vanguard',targetId:null,from:{x:2,z:2},verified:true,
  duration:.22,priority:2,severity:.2};
 return {THREE,scene:{add(){},remove(){}},actor,cue,u,
  move(x){wristX=x},turn(a){wristAngle=a}};
}

test('real D04 visual and frame gate refuse a whoosh after wrist rotates between VFX and submit',async()=>{
 const {createPhysicalCombatFeedback}=await source('physical-combat-feedback.js');
 const f=stage(),heard=[];
 const d=createPhysicalCombatFeedback({THREE:f.THREE,scene:f.scene,
  actorById:()=>f.actor,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){heard.push(c.audio);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  const snapshot=(tick,action)=>({run:1,floor:1,tick,units:[f.u(tick,action)],events:[]});
  d.acceptSnapshot(snapshot(10,'idle'));
  d.acceptSnapshot(snapshot(11,'attack'));
  d.advance(.016,.016);
  f.move(-6.92);d.advance(.016,.016);
  f.turn(.48); // Animation changed AFTER the old trail matrix was staged.
  assert.equal(d.acknowledgePresentedFrame(1,.001),0);
  assert.deepEqual(heard,[],'no late sound from the outdated blade orientation');
  assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,'revoked-drawn-swing-pose');
  assert.equal(d.stats().visuals.reservedInstances,102);
  assert.equal(d.stats().visuals.drawCalls,7);
 }finally{d.dispose()}
});
