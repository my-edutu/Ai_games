'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

function stage(){
 class Vector3{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){return this}
 }
 class Geometry{
  setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}
 }
 class Material{dispose(){}}
 class Object3D{
  constructor(){
   this.position=new Vector3();this.rotation={y:0,set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};this.matrix={};
  }
  updateMatrix(){}
 }
 class InstancedMesh{
  constructor(){this.visible=false;this.instanceMatrix={setUsage(){},needsUpdate:false}}
  setMatrixAt(){}
 }
 const THREE={Vector3,Object3D,BufferGeometry:Geometry,
  Float32BufferAttribute:class{},MeshBasicMaterial:Material,
  MeshStandardMaterial:Material,InstancedMesh,TorusGeometry:Geometry,
  TetrahedronGeometry:Geometry,RingGeometry:Geometry,
  CylinderGeometry:Geometry,IcosahedronGeometry:Geometry,
  DoubleSide:2,DynamicDrawUsage:35048};
 return {THREE,scene:{add(){},remove(){}}};
}
const injury=(id,targetId='enemy-1-0')=>({
 id,sceneKey:'1:1',tick:11,kind:'damage',visual:'hit',audio:'impact',
 proof:'observed-hp-drop',verified:true,actorId:null,targetId,
 to:{x:2,z:2},from:{x:2,z:2},severity:.2,duration:.28,priority:4
});
test('a >400ms submitted WebGL frame retires ONLY stale transient hit fragments, never another cue',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=stage(),v=createPhysicalFeedbackVisuals(THREE,scene);
 const a=injury('1:1:11:damage:-:enemy-1-0');
 const b=injury('1:1:11:damage:-:enemy-1-1','enemy-1-1');
 try{
  assert.equal(v.emit(a),true);assert.equal(v.emit(b),true);
  const before=v.stats();
  assert.ok(before.instancesByPool.hit>=8);
  assert.equal(v.retireStaleCue(a.id,'stale-frame'),4);
  assert.equal(v.hasLiveCue(a.id),false);
  assert.equal(v.hasLiveCue(b.id),true);
  assert.equal(v.stats().instancesByPool.hit,before.instancesByPool.hit-4);
  assert.equal(v.retireStaleCue(a.id,'stale-frame'),0,'deduplicated retirement');
  assert.equal(v.stats().retiredStaleFrameInstances,4);
  assert.equal(v.stats().drawCalls,7);
  assert.ok(v.stats().reservedInstances<=104);
 }finally{v.dispose()}
});
test('an older warning remains authoritative and cannot be erased by the audio deadline',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,scene}=stage(),v=createPhysicalFeedbackVisuals(THREE,scene);
 const warning={id:'1:1:11:threat-warning:-:-',sceneKey:'1:1',tick:11,
  kind:'threat-warning',visual:'warning',audio:'threat-warning',
  verified:true,proof:'authority-warning-window',detail:{cells:[{x:2,z:2},{x:3,z:2}]},
  severity:.5,duration:.6,priority:5};
 try{
  assert.equal(v.emit(warning),true);
  const prior=v.stats().instancesByPool.signal;
  assert.ok(prior>0);
  assert.equal(v.retireStaleCue(warning.id,'stale-frame'),0);
  assert.equal(v.stats().instancesByPool.signal,prior);
  assert.equal(v.hasLiveCue(warning.id),true,
   'frame/audio deadline is not authority to revoke live danger cells');
  assert.equal(v.retireStaleCue(warning.id,'delivered'),0);
 }finally{v.dispose()}
});
test('authentic HP loss with a stalled submitted frame cannot retain next-frame ghost fragments or emit delayed impact',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=stage(),sounds=[];
 const d=createPhysicalCombatFeedback({THREE,scene,requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(c){sounds.push(c);return true},
   flush(){},disable(){},cleanup(){},reset(){},dispose(){}}});
 const snapshot=(tick,hp)=>({run:1,floor:1,tick,events:[],units:[{
  id:'enemy-1-0',kind:'revenant',faction:'enemy',x:2,z:2,hp,maxHp:30,
  action:hp<30?'hurt':'idle',actionTick:tick
 }]});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,30));d.acceptSnapshot(snapshot(11,20));
  d.advance(.016,.016);
  assert.ok(d.stats().visuals.instancesByPool.hit>0);
  assert.equal(d.acknowledgePresentedFrame(1,.88),0);
  assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,'stale-frame');
  assert.deepEqual(sounds,[]);
  assert.equal(d.stats().visuals.instancesByPool.hit,0,
   'the late rendered impact cannot persist into a later, unrelated frame');
  assert.ok(d.stats().visuals.retiredStaleFrameInstances>0);
  assert.equal(d.stats().visuals.drawCalls,7);
 }finally{d.dispose()}
});


test('active Warden footprint survives slow WebGL, but a released or changed public warning disappears',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {canonicalPhysicalWarningFootprint}=await load('physical-feedback-plan.js');
 const {THREE,scene}=stage();
 const cells=[{x:2,z:2},{x:3,z:2}];
 const warning={id:'1:1:11:boss-warning-rising:warden-1:-',
  sceneKey:'1:1',tick:11,kind:'boss-warning-rising',visual:'warning',
  audio:'boss-warning-rising',proof:'authority-warning-window',verified:true,
  actorId:'warden-1',targetId:null,from:{x:2,z:2},to:null,
  duration:.30,priority:8,severity:.7,
  detail:{cells,shape:'NOVA',attackTick:14,
   footprintKey:canonicalPhysicalWarningFootprint(cells)}
 };
 let snapshot={run:1,floor:1,tick:11,
  bossWarning:{warning:true,shape:'NOVA',attackTick:14,
   turnsUntilImpact:3,cells},
  units:[{id:'warden-1',kind:'warden',faction:'enemy',hp:90}]};
 const v=createPhysicalFeedbackVisuals(THREE,scene,{getCurrentSnapshot:()=>snapshot});
 try{
  assert.equal(v.emit(warning),true);
  assert.equal(v.stats().instancesByPool.signal,2);
  for(let i=0;i<12;i++){
   // Actual Chrome stalls are much longer than the 300ms visual recipe.
   // The public threat remains live, so its current floor cells must remain.
   v.advance(.016,.70);
   assert.equal(v.stats().instancesByPool.signal,2,
    'genuinely live danger does not vanish simply because WebGL stalled');
   assert.equal(v.hasDrawableCue(warning.id),true);
  }
  assert.equal(v.retireStaleCue(warning.id,'stale-frame'),0,
   'audio expiry must not revoke live Warden hazard markers');
  snapshot={...snapshot,tick:12,bossWarning:{...snapshot.bossWarning,
   turnsUntilImpact:2}};
  v.advance(.016,.70);
  assert.equal(v.stats().instancesByPool.signal,2);
  snapshot={...snapshot,tick:14,
   bossWarning:{warning:false,shape:'NOVA',attackTick:14,
    turnsUntilImpact:0,cells}};
  v.advance(.016,.016);
  assert.equal(v.hasLiveCue(warning.id),false,
   'spent danger markers must disappear on the next real presentation update');
  assert.equal(v.stats().instancesByPool.signal,0);
  assert.ok(v.stats().retiredInvalidWarnings>=2);
  assert.ok(v.stats().reservedInstances<=104);
  assert.equal(v.stats().drawCalls,7);
 }finally{v.dispose()}
});

test('missing or untrusted Warden snapshot cannot extend an expired visual cue',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {canonicalPhysicalWarningFootprint}=await load('physical-feedback-plan.js');
 const {THREE,scene}=stage();
 const cells=[{x:2,z:2}];
 const warning={id:'1:1:11:boss-warning-rising:warden-1:-',
  sceneKey:'1:1',tick:11,kind:'boss-warning-rising',visual:'warning',
  audio:'boss-warning-rising',proof:'authority-warning-window',verified:true,
  actorId:'warden-1',duration:.30,priority:8,severity:.7,
  detail:{cells,shape:'NOVA',attackTick:14,
   footprintKey:canonicalPhysicalWarningFootprint(cells)}};
 let latest={run:1,floor:1,tick:11,
  bossWarning:{warning:true,shape:'NOVA',attackTick:14,
   turnsUntilImpact:3,cells},
  units:[{id:'warden-1',kind:'warden',faction:'enemy',hp:90}]};
 const v=createPhysicalFeedbackVisuals(THREE,scene,{getCurrentSnapshot:()=>latest});
 try{
  assert.equal(v.emit(warning),true);
  latest=null;v.advance(.016,.70);
  assert.equal(v.hasLiveCue(warning.id),false,
   'missing authority must fail closed rather than make immortal warning art');
  assert.equal(v.stats().instancesByPool.signal,0);
 }finally{v.dispose()}
 const legacy=createPhysicalFeedbackVisuals(THREE,scene);
 try{
  assert.equal(legacy.emit(warning),true);
  legacy.advance(.016,.70);
  assert.equal(legacy.hasLiveCue(warning.id),false,
   'standalone adapters without live authority keep their finite old lifetime');
 }finally{legacy.dispose()}
});

test('silent HP shards retire on an unverified real frame instead of ghosting into later WebGL draws',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {THREE,scene}=stage();let now=100;
 const sounds=[];
 const director=createPhysicalCombatFeedback({THREE,scene,clock:()=>now,
  requirePresentedFrame:true,
  audioAdapter:{enable(){return true},emit(cue){sounds.push(cue);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}});
 const snapshot=(tick,hp)=>({run:1,floor:1,tick,events:[],units:[{
  id:'enemy-1-0',kind:'revenant',faction:'enemy',x:2,z:2,hp,maxHp:30,
  action:hp<30?'hurt':'idle',actionTick:tick
 }]});
 try{
  director.acceptSnapshot(snapshot(10,30));
  director.acceptSnapshot(snapshot(11,20));
  now=100.016;director.advance(.016,.016);
  assert.ok(director.stats().visuals.instancesByPool.hit>=4,
   'actual observed HP loss creates bounded silent retained shards');
  assert.equal(director.stats().awaitingVisualReceipt,1);
  now=NaN; // WebGL submitted; browser clock cannot verify the cue's age.
  assert.equal(director.acknowledgePresentedFrame(1,.005),0);
  const receipt=director.stats().recentDeliveryReceipts.at(-1);
  assert.equal(receipt.kind,'damage');
  assert.equal(receipt.decision,'visual-submission-unverified');
  assert.equal(receipt.frameId,1);
  assert.equal(receipt.audio,false);
  assert.equal(receipt.submittedClockMs,null);
  assert.equal(director.stats().awaitingVisualReceipt,0);
  assert.equal(director.stats().visuals.instancesByPool.hit,0,
   'invalid CPU submission timing must retire its untrusted VFX before another draw');
  assert.equal(director.stats().visuals.activeDrawCalls,0,
   'expired shard geometry must not stay visible on a later unrelated frame');
  assert.ok(director.stats().visuals.retiredStaleFrameInstances>=4);
  now=100.04;
  assert.equal(director.enableAudioFromGesture(),true);
  assert.equal(director.acknowledgePresentedFrame(2,.005),0);
  assert.deepEqual(sounds,[],'late audio opt-in must not replay an unverified injury');
  assert.ok(director.stats().visuals.reservedInstances<=104);
  assert.equal(director.stats().visuals.drawCalls,7);
 }finally{director.dispose()}
});
