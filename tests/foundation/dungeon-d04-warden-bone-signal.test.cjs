'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const load=name=>import(pathToFileURL(path.join(root,name)).href);

function riggedThree(){
 class Vec{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=l;this.y/=l;this.z/=l;return this}
 }
 class Geometry{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Material{constructor(o){Object.assign(this,o)}dispose(){}}
 class Object3D{
  constructor(){
   this.position=new Vec();
   this.rotation={y:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};
   this.matrix={};
  }
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 }
 class Mesh{
  constructor(){this.visible=false;this.matrices=[];this.instanceMatrix={setUsage(){},needsUpdate:false}}
  setMatrixAt(i,m){this.matrices[i]={...m}}
 }
 const T={Object3D,Vector3:Vec,BufferGeometry:Geometry,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh:Mesh,DynamicDrawUsage:1,
  TorusGeometry:Geometry,TetrahedronGeometry:Geometry,
  RingGeometry:Geometry,IcosahedronGeometry:Geometry,
  CylinderGeometry:Geometry,DoubleSide:2};
 const scene={children:new Set(),add(m){this.children.add(m)},remove(m){this.children.delete(m)}};
 return {T,scene};
}
const bone=(x,y,z)=>({isBone:true,world:{x,y,z},
 updateWorldMatrix(){},getWorldPosition(out){
  return out.set(this.world.x,this.world.y,this.world.z)}});
const cue=(kind,visual)=>({
 id:'1:1:11:'+kind+':warden:-',sceneKey:'1:1',tick:11,kind,visual,
 actorId:'warden',targetId:null,from:{x:2,z:2},to:null,
 proof:kind==='opening'?'authority-opening-recovery-window':'authority-action',
 verified:true,priority:7,delay:0,duration:.34,severity:0
});
const boss=(wrist,spine)=>({
 authored:true,assetRoot:{},
 u:{id:'warden',kind:'warden',faction:'enemy',hp:50,maxHp:50,
  action:'cast',actionTick:11,recoveryUntilTick:13,x:2,z:2},
 root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}},
 rigMeleeBones:[{part:'wrist',bone:wrist},{part:'spine',bone:spine}]
});
const snapshot=()=>({run:1,floor:1,tick:11,guardianWard:false,
 bossRecovery:{remaining:3}});

test('D04 authored Warden release follows the real animated wrist, recovery follows its spine',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=riggedThree(),wrist=bone(-6.69,1.55,-7.03),
  spine=bone(-6.96,1.14,-7.01);
 const actor=boss(wrist,spine);
 const visuals=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='warden'?actor:null,getCurrentSnapshot:snapshot});
 const ring=[...scene.children][4];
 assert.equal(visuals.emit(cue('warden-release','warden')),true);
 assert.equal(ring.matrices[0].x,wrist.world.x,'release cannot borrow static root centre');
 assert.equal(ring.matrices[0].y,wrist.world.y,'release must localize to observed wrist height');
 assert.equal(visuals.emit(cue('opening','opening')),true);
 assert.equal(ring.matrices[1].x,spine.world.x,'recovery is a measured body beat');
 assert.equal(ring.matrices[1].y,spine.world.y);
 wrist.world.x+=.10;spine.world.y+=.10;
 visuals.advance(.016,.016);
 assert.equal(ring.matrices[0].x,wrist.world.x,'release follows the moving hand');
 assert.equal(ring.matrices[1].y,spine.world.y,'opening follows animated torso');
 assert.ok(visuals.stats().reservedInstances<=104);
 visuals.dispose();assert.equal(scene.children.size,0);
});

test('D04 authored Warden cannot emit detached body glyphs without valid bones; procedural fallback is explicit',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=riggedThree();
 const actor=boss(null,null);
 const visuals=createPhysicalFeedbackVisuals(T,scene,{
  actorById:()=>actor,getCurrentSnapshot:snapshot});
 const release=cue('warden-release','warden'),opening=cue('opening','opening');
 assert.equal(visuals.emit(release),false,'no imported wrist is not evidence of a weapon position');
 assert.equal(visuals.emit(opening),false,'no imported spine is not evidence of a recovery body position');
 actor.rigMeleeBones[0].bone=bone(3,1.5,3);
 actor.rigMeleeBones[1].bone=bone(NaN,1.3,-7);
 assert.equal(visuals.emit(release),false,'detached wrist must not turn into a root ring');
 assert.equal(visuals.emit(opening),false,'non-finite spine must not turn into a root ring');
 actor.authored=false;actor.assetRoot=null;
 assert.equal(visuals.emit(release),true,'explicit procedural character retains the bounded fallback');
 assert.equal(visuals.emit(opening),true);
 visuals.dispose();assert.equal(scene.children.size,0);
});
