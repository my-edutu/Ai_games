'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon',name)).href);
const boss=()=>({id:'warden',kind:'warden',faction:'enemy',x:6,z:6,hp:80,maxHp:90,action:'idle',actionTick:20});
const danger=()=>[
 {x:3,z:2},{x:4,z:2},{x:5,z:2},{x:3,z:3},{x:4,z:3},
 {x:5,z:3},{x:3,z:4},{x:4,z:4},{x:5,z:4},{x:3,z:5},
 {x:4,z:5},{x:5,z:5},{x:3,z:2},{x:-1,z:3},{x:7.5,z:5},{x:'6',z:4}
];
function warningPair(){
 const before={run:1,floor:1,tick:20,units:[boss()],events:[],
  bossWarning:{warning:true,shape:'NOVA',attackTick:23,turnsUntilImpact:3,cells:danger()}};
 const after={...before,tick:21,bossWarning:{
  ...before.bossWarning,turnsUntilImpact:2,cells:danger()}};
 return {before,after};
}
function fakeThree(){
 const meshes=[];
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const m=Math.hypot(this.x,this.y,this.z)||1;this.x/=m;this.y/=m;this.z/=m;return this}}
 class G{setAttribute(){return this}setIndex(){return this}computeVertexNormals(){}dispose(){}}
 class Mat{constructor(props){Object.assign(this,props)}dispose(){}}
 class Obj{constructor(){this.position=new V();this.rotation={y:0,set(){}};this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};this.matrix=null}
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}}
 class Mesh{constructor(geometry,material,max){this.geometry=geometry;this.material=material;this.max=max;
  this.matrices=[];this.instanceMatrix={setUsage(){},needsUpdate:false};this.visible=false;meshes.push(this)}
  setMatrixAt(i,matrix){this.matrices[i]={...matrix}}}
 const scene={add(){},remove(){}};
 const T={Object3D:Obj,Vector3:V,BufferGeometry:G,
  Float32BufferAttribute:class{constructor(array,size){this.array=array;this.itemSize=size}},
  MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,InstancedMesh:Mesh,
  TetrahedronGeometry:G,TorusGeometry:G,RingGeometry:G,CylinderGeometry:G,IcosahedronGeometry:G,
  DoubleSide:2,DynamicDrawUsage:35048};
 return {T,scene,meshes};
}

test('D04 Warden warning carries only genuine unique threatened cells into a bounded immutable cue',async()=>{
 const {planPhysicalFeedback,PHYSICAL_FEEDBACK_MAX_WARNING_MARKERS}=await load('physical-feedback-plan.js');
 const {before,after}=warningPair(),raw=JSON.stringify(after),cues=planPhysicalFeedback(before,after);
 assert.equal(cues.length,1);
 const cue=cues[0];
 assert.equal(cue.kind,'boss-warning-rising');
 assert.equal(cue.proof,'authority-warning-window');
 assert.ok(Array.isArray(cue.detail.cells));
 assert.ok(cue.detail.cells.length>1&&cue.detail.cells.length<=PHYSICAL_FEEDBACK_MAX_WARNING_MARKERS);
 assert.equal(PHYSICAL_FEEDBACK_MAX_WARNING_MARKERS,8,'same eight retained signal instances');
 const actual=new Set(danger().filter(p=>Number.isInteger(p.x)&&Number.isInteger(p.z)&&p.x>=0&&p.z>=0).map(p=>p.x+':'+p.z));
 assert.ok(cue.detail.cells.every(p=>actual.has(p.x+':'+p.z)));
 assert.equal(new Set(cue.detail.cells.map(p=>p.x+':'+p.z)).size,cue.detail.cells.length);
 assert.ok(Object.isFrozen(cue.detail.cells)&&cue.detail.cells.every(Object.isFrozen));
 assert.equal(JSON.stringify(after),raw,'no mutation of authoritative warning');
});

test('D04 warning rings occupy witnessed danger cells instead of inventing a false boss-centre hazard',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene,meshes}=fakeThree();
 const v=createPhysicalFeedbackVisuals(T,scene,{actorById:()=>null,reducedFlash:true});
 const {before,after}=warningPair(),cue=planPhysicalFeedback(before,after)[0];
 assert.ok(cue);
 assert.equal(v.emit(cue),true,'live warning cells do not require a loaded GLB');
 const signal=meshes[4],count=v.stats().instancesByPool.signal;
 assert.equal(count,cue.detail.cells.length);
 assert.ok(count<=8&&v.stats().reservedInstances===102);
 assert.equal(v.stats().activeDrawCalls,1);
 const visible=signal.matrices.filter(m=>m.y>-.1);
 assert.equal(visible.length,count);
 const actual=new Set(danger().filter(p=>Number.isInteger(p.x)&&Number.isInteger(p.z)&&p.x>=0&&p.z>=0).map(p=>(p.x-9)+':'+(p.z-9)));
 assert.ok(visible.every(p=>actual.has(p.x+':'+p.z)));
 assert.ok(visible.every(p=>p.x!==-3||p.z!==-3),'no false marker under boss at cell 6:6');
 v.advance(.5,.5);
 assert.equal(v.stats().active,0);
 v.reset();assert.equal(v.stats().activeDrawCalls,0);v.dispose();
});

test('D04 warning rejects forged / invalid footprints without drawing a fictitious cell',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=fakeThree(),v=createPhysicalFeedbackVisuals(T,scene);
 const cue={id:'fake',tick:21,kind:'boss-warning-rising',visual:'warning',verified:true,
  priority:7,duration:.3,from:{x:6,z:6},actorId:'warden',proof:'authority-warning-window',
  detail:{cells:[{x:999,z:3},{x:-1,z:2},{x:'5',z:4}]}};
 assert.equal(v.emit(cue),false);
 assert.equal(v.stats().active,0);
 assert.equal(v.emit({...cue,detail:null}),false);
 assert.equal(v.emit({...cue,proof:'untrusted-text',detail:{cells:[{x:3,z:2}]}}),false);
 v.dispose();
});
