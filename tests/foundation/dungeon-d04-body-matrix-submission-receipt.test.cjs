'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);
const basis=(xx=1,yy=1,zz=1)=>({
 bodyM0:xx,bodyM1:0,bodyM2:0,
 bodyM4:0,bodyM5:yy,bodyM6:0,
 bodyM8:0,bodyM9:0,bodyM10:zz,
 bodyM12:0,bodyM13:0,bodyM14:0
});
const point=(bone={},body={})=>({
 x:-6.8,y:1.17,z:-6.8,rootX:-7,rootY:0,rootZ:-7,yaw:0,
 sourceBone:bone,sourceBodyRoot:body,localX:.2,localY:1.17,localZ:.2,
 wristQx:0,wristQy:0,wristQz:0,wristQw:1,...basis()
});

test('D04 receipt revokes an old swing when the authored body is rescaled after VFX',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const before=point(),after={...before,...basis(1.65,1,1)};
 assert.equal(isCurrentMeasuredHandReceipt(before,after),false,
  'unchanged wrist world point/quaternion cannot certify an outdated body-space VFX matrix');
});

test('D04 receipt catches authored parent roll and shear without false wrist movement',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const before=point();
 assert.equal(isCurrentMeasuredHandReceipt(before,{...before,bodyM1:.45}),false);
 assert.equal(isCurrentMeasuredHandReceipt(before,{...before,bodyM8:-.27}),false);
 assert.equal(isCurrentMeasuredHandReceipt(before,{...before,bodyM12:.16}),false,
  'a shifted asset pivot may be hidden by a compensating local wrist movement');
});

test('D04 body matrix receipt allows bounded jitter and unchanged authored geometry',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const before=point();
 assert.equal(isCurrentMeasuredHandReceipt(before,{...before}),true);
 assert.equal(isCurrentMeasuredHandReceipt(before,{...before,bodyM0:1.002,bodyM5:.999}),true,
  'subpixel world-matrix drift should not cancel a genuinely matched frame');
});

test('D04 body matrix receipt fails closed for broken, missing or replaced witnesses',async()=>{
 const {isCurrentMeasuredHandReceipt}=await source('measured-weapon-trail.js');
 const before=point();
 for(const after of [
  {...before,sourceBodyRoot:{}},
  {...before,bodyM0:NaN},
  {...before,bodyM5:Infinity},
  {...before,bodyM10:undefined},
  {...before,bodyM14:NaN}
 ])assert.equal(isCurrentMeasuredHandReceipt(before,after),false);
 const minimal={x:-6.8,y:1.17,z:-6.8,rootX:-7,rootY:0,rootZ:-7,
  yaw:0,sourceBone:{}};
 assert.equal(isCurrentMeasuredHandReceipt(minimal,{...minimal}),true,
  'older numeric rig adapters without body matrices retain their own receipt path');
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
 let wristShift=0;
 const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 const bone={isBone:true,updateWorldMatrix(){},
  getWorldPosition(v){return v.set(-6.8+wristShift,1.17,-6.8)},
  getWorldQuaternion(q){q.x=0;q.y=0;q.z=0;q.w=1;return q}};
 const assetRoot={matrixWorld:{elements:matrix},updateWorldMatrix(){},
  worldToLocal(v){return v}};
 const unit=(tick,action)=>({id:'vanguard',kind:'vanguard',faction:'party',
  x:2,z:2,hp:30,maxHp:30,action,actionTick:tick});
 const actor={authored:true,assetRoot,rigMeleeBones:[{part:'wrist',bone}],
  root:{visible:true,position:new V(-7,0,-7),rotation:{y:0}},u:unit(11,'attack')};
 return {THREE,scene:{add(){},remove(){}},actor,unit,matrix,
  moveWrist(m){wristShift=m}};
}

test('D04 real retained VFX and frame gate reject a sound after parent matrix changes before submit',async()=>{
 const {createPhysicalCombatFeedback}=await source('physical-combat-feedback.js');
 const f=stage(),heard=[],d=createPhysicalCombatFeedback({
  THREE:f.THREE,scene:f.scene,actorById:()=>f.actor,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){heard.push(c);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}
 });
 const snapshot=(tick,action)=>({run:1,floor:1,tick,units:[f.unit(tick,action)],events:[]});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,'idle'));
  d.acceptSnapshot(snapshot(11,'attack'));
  d.advance(.016,.016);
  f.moveWrist(.12);d.advance(.016,.016); // Actually authored moving wrist.
  assert.equal(d.stats().visuals.bodyLocalTrailFrames,1);
  f.matrix[0]=1.65; // Existing asset transformed after the last VFX draw.
  assert.equal(d.acknowledgePresentedFrame(1,.001),0);
  assert.deepEqual(heard,[],'stale matrix must not emit a sword whoosh');
  assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,
   'revoked-drawn-swing-pose');
  assert.equal(d.stats().visuals.drawCalls,7);
  assert.equal(d.stats().visuals.reservedInstances,102);
 }finally{d.dispose()}
});
