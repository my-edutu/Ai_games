'use strict';
// D04-owned GPU update contract. This exercises the actual retained VFX module,
// not a mock visual implementation, while never changing game authority.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

function fakeThree(){
 const meshes=[];
 class V{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const d=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=d;this.y/=d;this.z/=d;return this}
 }
 class G{
  setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}
 }
 class Obj{
  constructor(){
   this.position=new V();
   this.rotation={set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};
   this.matrix={};
  }
  updateMatrix(){}
 }
 class Material{constructor(props){Object.assign(this,props)}dispose(){}}
 class Mesh{
  constructor(){
   this.instanceMatrix={needsUpdate:false,setUsage(){}};
   this.visible=false;this.matrixWrites=0;meshes.push(this);
  }
  setMatrixAt(){this.matrixWrites++}
 }
 const THREE={
  Object3D:Obj,Vector3:V,BufferGeometry:G,
  Float32BufferAttribute:class{},
  MeshBasicMaterial:Material,MeshStandardMaterial:Material,
  InstancedMesh:Mesh,TetrahedronGeometry:G,TorusGeometry:G,
  RingGeometry:G,CylinderGeometry:G,IcosahedronGeometry:G,
  DoubleSide:2,DynamicDrawUsage:35048
 };
 return {THREE,meshes,scene:{add(){},remove(){}}};
}
const cells=[{x:3,z:3}];
const boss={id:'warden',kind:'warden',faction:'enemy',hp:50,maxHp:50,
 x:6,z:6,action:'idle',actionTick:10};
const snapshot=(tick,warning=true)=>({
 run:1,floor:1,tick,events:[],units:[{...boss}],
 bossWarning:warning?{warning:true,shape:'NOVA',attackTick:14,
  turnsUntilImpact:14-tick,cells}:null
});
const cue={
 id:'1:1:11:boss-warning-rising:warden:-',sceneKey:'1:1',
 actorId:'warden',tick:11,kind:'boss-warning-rising',visual:'warning',
 audio:'boss-warning-rising',proof:'authority-warning-window',
 verified:true,priority:7,duration:.30,from:{x:6,z:6},
 detail:{attackTick:14,shape:'NOVA',cells,footprintKey:'771'}
};

test('a frozen still-authoritative Warden warning keeps its GPU matrix until authority changes',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load();
 const {THREE,meshes,scene}=fakeThree();
 let latest=snapshot(11);
 const visual=createPhysicalFeedbackVisuals(THREE,scene,{
  getCurrentSnapshot:()=>latest,reducedFlash:true
 });
 assert.equal(meshes.length,7,'exact seven retained pools');
 const signal=meshes[4];
 assert.equal(visual.emit(cue),true);
 for(let i=0;i<3;i++)visual.advance(.05,.05);
 assert.equal(visual.stats().instancesByPool.signal,1);
 assert.equal(signal.visible,true);
 // Simulate Three.js clearing update flag after the last actual renderer upload.
 signal.instanceMatrix.needsUpdate=false;
 const frozenWrites=signal.matrixWrites;
 latest=snapshot(12);
 for(let i=0;i<16;i++)visual.advance(.016,.016);
 latest=snapshot(13);
 for(let i=0;i<16;i++)visual.advance(.016,.016);
 assert.equal(signal.matrixWrites,frozenWrites,
  'static validated danger-cell ring must not upload the same instance matrix each frame');
 assert.equal(signal.instanceMatrix.needsUpdate,false);
 assert.equal(visual.hasLiveCue(cue.id),true);
 assert.equal(visual.stats().activeDrawCalls,1,
  'optimization must never hide a still-authoritative warning');
 assert.ok(visual.stats().reservedInstances<=104);
 assert.equal(PHYSICAL_FEEDBACK_POOL_LIMITS.signal,8);
 latest=snapshot(13,false);
 visual.advance(.016,.016);
 assert.ok(signal.matrixWrites>frozenWrites,
  'revoked warning still clears its retained matrix before the next frame');
 assert.equal(signal.visible,false);
 assert.equal(visual.stats().activeDrawCalls,0);
 assert.equal(visual.hasLiveCue(cue.id),false);
 visual.dispose();
});


test('D04 reports actual JS instance writes separately from estimated buffer upload pressure',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load();
 const {THREE,meshes,scene}=fakeThree();
 let latest=snapshot(11);
 const visual=createPhysicalFeedbackVisuals(THREE,scene,{
  getCurrentSnapshot:()=>latest
 });
 const signal=meshes[4];
 assert.equal(visual.stats().lastAdvanceMatrixWrites,0);
 assert.equal(visual.stats().lastAdvanceDirtyPools,0);
 assert.equal(visual.emit(cue),true);
 const before=signal.matrixWrites;
 visual.advance(.05,.05);
 const moving=visual.stats();
 assert.equal(moving.lastAdvanceMatrixWrites,signal.matrixWrites-before,
  'count only matrices actually written during advance, not emitter admission');
 assert.equal(moving.lastAdvanceMatrixWrites,1);
 assert.equal(moving.lastAdvanceDirtyPools,1);
 assert.equal(moving.lastAdvancePotentialBufferBytes,
  PHYSICAL_FEEDBACK_POOL_LIMITS.signal*64,
  'upper bound is the reserved signal instance buffer, NOT measured GPU bytes');
 assert.equal(moving.lastAdvanceWritesByPool.signal,1);
 assert.equal(Object.keys(moving.lastAdvanceWritesByPool).length,7);
 assert.ok(moving.lastAdvanceMatrixWrites<=moving.reservedInstances);
 assert.ok(moving.lastAdvanceDirtyPools<=moving.drawCalls);
 for(let i=0;i<3;i++)visual.advance(.05,.05);
 latest=snapshot(12);
 visual.advance(.016,.016);
 const held=visual.stats();
 assert.equal(held.lastAdvanceMatrixWrites,0);
 assert.equal(held.lastAdvanceDirtyPools,0);
 assert.equal(held.lastAdvancePotentialBufferBytes,0);
 assert.ok(held.advanceFrames>=5);
 assert.equal(held.lastAdvanceWritesByPool.signal,0);
 latest=snapshot(12,false);
 const retiredBefore=signal.matrixWrites;
 visual.advance(.016,.016);
 const retired=visual.stats();
 assert.equal(retired.lastAdvanceMatrixWrites,signal.matrixWrites-retiredBefore);
 assert.equal(retired.lastAdvanceMatrixWrites,1);
 assert.equal(retired.lastAdvanceDirtyPools,1);
 assert.equal(retired.lastAdvancePotentialBufferBytes,
  PHYSICAL_FEEDBACK_POOL_LIMITS.signal*64);
 assert.equal(retired.active,0);
 visual.reset();
 visual.advance(.016,.016);
 const cleared=visual.stats();
 assert.equal(cleared.lastAdvanceMatrixWrites,0);
 assert.equal(cleared.lastAdvanceDirtyPools,0);
 assert.equal(cleared.lastAdvancePotentialBufferBytes,0);
 visual.dispose();
});

test('a never-measured melee ribbon does not rewrite an invisible GPU slot every frame',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,meshes,scene}=fakeThree();
 let wristX=0;
 const wrist={isBone:true,getWorldPosition(v){return v.set(wristX,1.2,0)}};
 const actor={
  u:{id:'vanguard-1',kind:'vanguard',action:'attack',actionTick:9,hp:30},
  root:{visible:true,position:{x:0,y:0,z:0},rotation:{y:0}},
  authored:true,assetRoot:{},
  rigMeleeBones:[{part:'wrist',bone:wrist}]
 };
 const visual=createPhysicalFeedbackVisuals(THREE,scene,{
  actorById:id=>id===actor.u.id?actor:null
 });
 const trail=meshes[0];
 const swing={
  id:'1:1:9:swing:vanguard-1:-',sceneKey:'1:1',
  actorId:'vanguard-1',tick:9,kind:'swing',visual:'trail',
  proof:'authority-attempt-not-hit',verified:true,priority:4,
  duration:.35,from:{x:9,z:9}
 };
 assert.equal(visual.emit(swing),true);
 const initialWrites=trail.matrixWrites;
 trail.instanceMatrix.needsUpdate=false;
 for(let i=0;i<4;i++)visual.advance(.016,.016);
 assert.equal(trail.matrixWrites,initialWrites,
  'a still wrist is NOT a measured blade and requires zero redundant hidden-matrix writes');
 assert.equal(trail.instanceMatrix.needsUpdate,false,
  'no GPU instance-buffer upload from an invisible unmeasured ribbon');
 assert.equal(visual.stats().lastAdvanceWritesByPool.trail,0);
 assert.equal(trail.visible,false);
 assert.equal(visual.hasDrawableCue(swing.id),false);
 // A real newly observed wrist displacement must immediately restore the
 // existing ribbon on the next genuine draw opportunity, without a fake hit.
 wristX=.12;
 visual.advance(.016,.016);
 assert.ok(trail.matrixWrites>initialWrites);
 assert.equal(trail.visible,true);
 assert.equal(visual.hasDrawableCue(swing.id),true);
 // Once the measured sample ages out, clear its LAST visible matrix once.
 wristX=.12;
 for(let i=0;i<5;i++)visual.advance(.016,.016);
 assert.equal(trail.visible,false);
 assert.equal(visual.hasDrawableCue(swing.id),false);
 const hiddenWrites=trail.matrixWrites;
 trail.instanceMatrix.needsUpdate=false;
 for(let i=0;i<3;i++)visual.advance(.016,.016);
 assert.equal(trail.matrixWrites,hiddenWrites,
  'a previously visible trail is hidden once, not re-uploaded every stalled frame');
 assert.equal(trail.instanceMatrix.needsUpdate,false);
 assert.equal(visual.stats().lastAdvancePotentialBufferBytes,0);
 visual.dispose();
});
