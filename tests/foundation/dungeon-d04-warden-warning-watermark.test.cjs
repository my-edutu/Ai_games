'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=name=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon',name)).href);
const warning=(id,tick,attackTick,sceneKey='1:1',actorId='warden')=>({
 id,tick,sceneKey,actorId,kind:'boss-warning-final',visual:'warning',
 proof:'authority-warning-window',verified:true,priority:8,duration:.30,
 from:{x:6,z:6},detail:{attackTick,cells:[{x:3,z:3}]}
});
const release=(tick,sceneKey='1:1',actorId='warden')=>({
 id:'release-'+tick,sceneKey,actorId,tick,kind:'warden-release',visual:'warden',
 proof:'authority-action',verified:true,priority:7,duration:.30,from:{x:6,z:6}
});
function fakeThree(){
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const m=Math.hypot(this.x,this.y,this.z)||1;this.x/=m;this.y/=m;this.z/=m;return this}}
 class G{setAttribute(){return this}setIndex(){return this}computeVertexNormals(){}dispose(){}}
 class Mat{constructor(p){Object.assign(this,p)}dispose(){}}
 class Obj{constructor(){this.position=new V();this.rotation={y:0,set(){}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};this.matrix=null}
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}}
 class Mesh{constructor(){this.instanceMatrix={setUsage(){},needsUpdate:false};this.visible=false}
  setMatrixAt(){}}
 return {THREE:{Object3D:Obj,Vector3:V,BufferGeometry:G,Float32BufferAttribute:class{},
  MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,InstancedMesh:Mesh,
  TetrahedronGeometry:G,TorusGeometry:G,RingGeometry:G,CylinderGeometry:G,
  IcosahedronGeometry:G,DoubleSide:2,DynamicDrawUsage:35048},
  scene:{add(){},remove(){}}
 };
}
test('retained observation rejects older warning even when no live visual slot remains',async()=>{
 const {isStaleWardenWarning:stale}=await load('warden-warning-lifecycle.js');
 const recent=warning('recent',45,48),older=warning('older',44,47);
 assert.equal(stale(older,[],{lastWarning:recent}),true);
 assert.equal(stale(recent,[],{lastWarning:older}),false);
 assert.equal(stale(older,[],{lastWarning:warning('other',46,49,'2:1')}),false);
});
test('expired authentic Warden release closes its spent attack, never next attack or actor',async()=>{
 const {isStaleWardenWarning:stale}=await load('warden-warning-lifecycle.js');
 const old=warning('spent',49,50),future=warning('future',51,53);
 assert.equal(stale(old,[],{lastRelease:release(50)}),true);
 assert.equal(stale(future,[],{lastRelease:release(50)}),false);
 assert.equal(stale(old,[],{lastRelease:release(50,'2:1')}),false);
 assert.equal(stale(old,[],{lastRelease:{...release(50),proof:'untrusted-text'}}),false);
});
test('late older danger never reappears after newer marker fades; floor reset clears watermark',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=fakeThree(),v=createPhysicalFeedbackVisuals(THREE,scene,{actorById:()=>null});
 const newer=warning('new',45,48),older=warning('old',44,47);
 assert.equal(v.emit(newer),true);
 v.advance(.5,.5);assert.equal(v.stats().active,0);
 assert.equal(v.emit(older),false);
 assert.equal(v.stats().staleWarningCues,1);
 assert.equal(v.stats().warningHistoryOwners,1);
 v.reset();assert.equal(v.stats().warningHistoryOwners,0);
 assert.equal(v.emit(older),true);
 v.dispose();
});
test('released attack cannot redraw spent tell; future danger survives, including different owners',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=fakeThree(),v=createPhysicalFeedbackVisuals(THREE,scene);
 assert.equal(v.emit(release(50)),false,
  'authority release closes its spent warning without fabricating missing actor art');
 v.advance(.5,.5);
 assert.equal(v.emit(warning('spent',49,50)),false);
 assert.equal(v.emit(warning('future',51,53)),true);
 assert.equal(v.emit(warning('foreign',49,50,'2:1','other')),true);
 assert.equal(v.hasLiveCue('future'),true);
 assert.equal(v.stats().reservedInstances,102);
 v.dispose();
});
test('Warden warning history is bounded to eight owners and cleared on reset/dispose',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=fakeThree(),v=createPhysicalFeedbackVisuals(THREE,scene);
 for(let i=0;i<20;i++){
  assert.equal(v.emit(warning('owner-'+i,41+i,43+i,String(i)+':1','warden-'+i)),true);
  assert.ok(v.stats().warningHistoryOwners<=8);
  v.advance(.5,.5);
 }
 assert.equal(v.stats().warningHistoryOwners,8);
 v.reset();assert.equal(v.stats().warningHistoryOwners,0);
 v.dispose();
 assert.equal(v.stats().warningHistoryOwners,0);
});
