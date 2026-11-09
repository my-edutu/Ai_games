'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

// Retained matrix harness only: no claim of GLB, GPU submission or real sound.
function stage(){
 class Vec{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const n=Math.hypot(this.x,this.y,this.z)||1;this.x/=n;this.y/=n;this.z/=n;return this}}
 class Geo{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Mat{constructor(p){Object.assign(this,p)}dispose(){}}
 class Obj{constructor(){
  this.position=new Vec();
  this.rotation={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};
  this.matrix={x:0,y:0,z:0};
 }updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}}
 class Mesh{constructor(geo,mat,count){this.geometry=geo;this.material=mat;this.count=count;
  this.visible=false;this.matrices=[];this.instanceMatrix={setUsage(){},needsUpdate:false}}
  setMatrixAt(i,m){this.matrices[i]={...m}}}
 const THREE={Object3D:Obj,Vector3:Vec,BufferGeometry:Geo,
  Float32BufferAttribute:class{constructor(v,n){this.array=v;this.itemSize=n}},
  MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,InstancedMesh:Mesh,
  TorusGeometry:Geo,TetrahedronGeometry:Geo,IcosahedronGeometry:Geo,
  RingGeometry:Geo,CylinderGeometry:Geo,DoubleSide:2,DynamicDrawUsage:35048};
 const scene={meshes:[],add(m){this.meshes.push(m)},remove(m){
  this.meshes.splice(this.meshes.indexOf(m),1)}};
 return {THREE,scene};
}
const boss=()=>({
 u:{id:'warden',kind:'warden',action:'cast',actionTick:11,
  recoveryUntilTick:12,hp:70},
 root:{visible:true,position:{x:-3,y:0,z:-3},rotation:{y:0}}
});
const signal=(kind)=>({
 id:'1:1:11:'+kind+':warden:-',sceneKey:'1:1',tick:11,
 kind,visual:kind==='opening'?'opening':'warden',
 audio:kind==='opening'?'recovery':'warden-release',
 actorId:'warden',targetId:null,from:{x:6,z:6},to:null,
 verified:true,proof:kind==='opening'?'authority-opening-recovery-window':'authority-action',
 duration:.38,severity:0,priority:7
});
const shot=(tick,guardianWard=false)=>({
 run:1,floor:1,tick,guardianWard,bossRecovery:{remaining:Math.max(0,13-tick)}
});
test('D04 opening ring retires when its real recovery window has ended, even if cast pose persists',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage(),body=boss();let current=shot(11);
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{
  actorById:()=>body,getCurrentSnapshot:()=>current});
 const cue=signal('opening');
 assert.equal(fx.emit(cue),true);
 current=shot(13);
 fx.advance(.016,.016);
 assert.equal(fx.hasLiveCue(cue.id),false,'finished vulnerability cannot retain a recovery ring');
 assert.equal(fx.stats().retiredUnanchoredBodySignals,1);
 fx.dispose();
});
test('D04 re-sealed guardian cancels an opening ring before its normal visual lifetime',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage(),body=boss();let current=shot(11);
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{
  actorById:()=>body,getCurrentSnapshot:()=>current});
 const cue=signal('opening');
 assert.equal(fx.emit(cue),true);
 current=shot(11,true);
 fx.advance(.016,.016);
 assert.equal(fx.hasDrawableCue(cue.id),false,'sealed boss must not advertise vulnerability');
 assert.equal(fx.stats().instancesByPool.signal,0);
 fx.dispose();
});
test('D04 deceased Warden cannot keep an actor-local release or opening glyph',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 for(const kind of ['warden-release','opening']){
  const {THREE,scene}=stage(),body=boss();let current=shot(11);
  const fx=createPhysicalFeedbackVisuals(THREE,scene,{
   actorById:()=>body,getCurrentSnapshot:()=>current});
  const cue=signal(kind);
  assert.equal(fx.emit(cue),true);
  body.u.hp=0;
  fx.advance(.016,.016);
  assert.equal(fx.hasLiveCue(cue.id),false,kind+' ring must retire on defeat');
  assert.equal(fx.stats().activeDrawCalls,0);
  fx.dispose();
 }
});
test('D04 genuine unsealed recovery continues to track body within its authority window',async()=>{
 const {createPhysicalFeedbackVisuals}=await load();
 const {THREE,scene}=stage(),body=boss();let current=shot(11);
 const fx=createPhysicalFeedbackVisuals(THREE,scene,{
  actorById:()=>body,getCurrentSnapshot:()=>current});
 const cue=signal('opening');
 assert.equal(fx.emit(cue),true);
 body.root.position.x+=.2;
 current=shot(12);
 fx.advance(.016,.016);
 assert.equal(fx.hasDrawableCue(cue.id),true);
 assert.ok(scene.meshes[4].matrices[0].x>-3,'live glyph still follows the cast body');
 assert.equal(fx.stats().reservedInstances,102);
 fx.dispose();
});

test('D04 controller gates late recovery audio on the latest public state before the first WebGL submission',async()=>{
 const {createPhysicalCombatFeedback}=await import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-dungeon/physical-combat-feedback.js')).href);
 const {THREE,scene}=stage(),body=boss(),sounds=[];
 const director=createPhysicalCombatFeedback({THREE,scene,
  actorById:()=>body,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){sounds.push(c.audio);return true},
   flush(){},cleanup(){},disable(){},dispose(){}}});
 const unit=(tick,action='idle',actionTick=tick)=>({
  id:'warden',kind:'warden',faction:'enemy',x:6,z:6,
  hp:70,maxHp:90,action,actionTick,recoveryUntilTick:12
 });
 const snapshot=(tick,u,events=[],remaining=0)=>({
  run:1,floor:1,tick,units:[u],events,guardianWard:false,
  bossRecovery:{remaining}
 });
 const early=unit(10);
 const casting=unit(11,'cast',11);
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10,early));
 body.u={...casting};
 director.acceptSnapshot(snapshot(11,casting,[{tick:11,kind:'opening',text:'recovery'}],2));
 director.advance(.016,.016);
 assert.equal(director.stats().visuals.instancesByPool.signal,2);
 // The actual authority has moved past the recovery window, but the same
 // animated cast pose remains. No previous WebGL submission was acknowledged.
 const later=unit(13,'cast',11);body.u={...later};
 director.acceptSnapshot(snapshot(13,later,[],0));
 director.advance(.016,.016);
 assert.equal(director.stats().visuals.instancesByPool.signal,1,
  'expired recovery must retire; genuine cast release glyph may continue');
 assert.equal(director.acknowledgePresentedFrame('first-rendered-frame',.004),1);
 assert.deepEqual(sounds,['warden-release'],
  'the stale recovery is not eligible for a falsely synchronized sound');
 assert.deepEqual(director.stats().recentDeliveryReceipts.map(r=>r.decision),
  ['delivered','expired-visual']);
 director.dispose();
});
