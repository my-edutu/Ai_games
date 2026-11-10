'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon',name)).href);
const cell={x:3,z:3};
const warning=(overrides={})=>({
 id:'1:1:11:boss-warning-rising:warden:-',
 sceneKey:'1:1',actorId:'warden',tick:11,
 kind:'boss-warning-rising',visual:'warning',audio:'boss-warning-rising',
 proof:'authority-warning-window',verified:true,priority:7,duration:.30,
 from:{x:6,z:6},detail:{attackTick:14,shape:'NOVA',cells:[cell]},
 ...overrides
});
const boss={id:'warden',kind:'warden',faction:'enemy',hp:50,maxHp:50,
 x:6,z:6,action:'idle',actionTick:9};
const scene=(tick=11,overrides={})=>({
 run:1,floor:1,tick,events:[],units:[{...boss}],
 bossWarning:{warning:true,shape:'NOVA',attackTick:14,
  turnsUntilImpact:14-tick,cells:[cell]},
 ...overrides
});
function fakeThree(){
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const m=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=m;this.y/=m;this.z/=m;return this}}
 class G{setAttribute(){return this}setIndex(){return this}
  computeVertexNormals(){}dispose(){}}
 class Mat{constructor(p){Object.assign(this,p)}dispose(){}}
 class Obj{constructor(){this.position=new V();this.rotation={y:0,set(){}};
  this.quaternion={identity(){},setFromUnitVectors(){}};
  this.scale={setScalar(){},set(){}};this.matrix=null}
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}}
 class Mesh{constructor(){
  this.instanceMatrix={setUsage(){},needsUpdate:false};this.visible=false}
  setMatrixAt(){}}
 return {THREE:{Object3D:Obj,Vector3:V,BufferGeometry:G,Float32BufferAttribute:class{},
  MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,InstancedMesh:Mesh,
  TetrahedronGeometry:G,TorusGeometry:G,RingGeometry:G,CylinderGeometry:G,
  IcosahedronGeometry:G,DoubleSide:2,DynamicDrawUsage:35048},
  stage:{add(){},remove(){}}
 };
}

test('D04 retains the true three-beat Warden threat, retires it at impact',async()=>{
 const {isLiveWardenWarning}=await load('warden-warning-lifecycle.js');
 for(const tick of [11,12,13])
  assert.equal(isLiveWardenWarning(warning(),scene(tick)),true);
 assert.equal(isLiveWardenWarning(warning(),scene(14)),false);
});

test('D04 revoked, changed, moved and ownerless warnings cannot remain physical danger',async()=>{
 const {isLiveWardenWarning}=await load('warden-warning-lifecycle.js');
 assert.equal(isLiveWardenWarning(warning(),scene(12,{bossWarning:null})),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{
  bossWarning:{...scene(12).bossWarning,attackTick:15}
 })),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{
  bossWarning:{...scene(12).bossWarning,shape:'RIFT_CROSS'}
 })),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{
  bossWarning:{...scene(12).bossWarning,cells:[{x:5,z:5}]}
 })),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{
  bossWarning:{...scene(12).bossWarning,turnsUntilImpact:1}
 })),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{units:[{...boss,hp:0}]})),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{units:[{...boss,id:'other'}]})),false);
 assert.equal(isLiveWardenWarning(warning(),scene(12,{run:2})),false);
});

test('retained warning floor glyph retires on snapshot cancellation, not just elapsed VFX timeout',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {THREE,stage}=fakeThree();let current=scene(11);
 const visuals=createPhysicalFeedbackVisuals(THREE,stage,{
  actorById:()=>null,getCurrentSnapshot:()=>current});
 const cue=warning();
 assert.equal(visuals.emit(cue),true);
 assert.equal(visuals.hasLiveCue(cue.id),true);
 current=scene(12);visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(cue.id),true,'still-authoritative warning stays visible');
 current=scene(12,{bossWarning:null});
 visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(cue.id),false,'cancelled threat is not still dangerous');
 assert.equal(visuals.stats().retiredInvalidWarnings,1);
 assert.equal(visuals.emit(cue),false,'a delayed, cancelled warning cannot be readmitted');
 assert.ok(visuals.stats().reservedInstances<=104);
 visuals.dispose();
});

test('unsubmitted revoked Warden warning cannot release ghost audio on frame receipt',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const sounds=[],visuals={
  emit:()=>true,advance(){},hasLiveCue:()=>true,hasDrawableCue:()=>true,
  reset(){},dispose(){}
 };
 const audio={enable:()=>true,emit:c=>{sounds.push(c);return true},
  disable(){},flush(){},cleanup(){},dispose(){}};
 const d=createPhysicalCombatFeedback({
  visualAdapter:visuals,audioAdapter:audio,requirePresentedFrame:true});
 d.enableAudioFromGesture();
 d.acceptSnapshot(scene(10,{bossWarning:null}));
 d.acceptSnapshot(scene(11));
 d.advance(.016,.016);
 assert.equal(d.stats().awaitingPresentation,1);
 d.acceptSnapshot(scene(12,{bossWarning:null}));
 assert.equal(d.acknowledgePresentedFrame(1,.005),0);
 assert.equal(sounds.length,0);
 assert.equal(d.stats().recentDeliveryReceipts.at(-1)?.decision,'retired-warning');
 assert.equal(d.stats().awaitingPresentation,0);
 d.dispose();
});

test('still-authoritative Warden warning sound may follow verified frame submission once',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const sounds=[],visuals={
  emit:()=>true,advance(){},hasLiveCue:()=>true,hasDrawableCue:()=>true,
  reset(){},dispose(){}
 };
 const audio={enable:()=>true,emit:c=>{sounds.push(c);return true},
  disable(){},flush(){},cleanup(){},dispose(){}};
 const d=createPhysicalCombatFeedback({
  visualAdapter:visuals,audioAdapter:audio,requirePresentedFrame:true});
 d.enableAudioFromGesture();
 d.acceptSnapshot(scene(10,{bossWarning:null}));
 d.acceptSnapshot(scene(11));
 d.advance(.016,.016);
 assert.equal(d.acknowledgePresentedFrame(1,.005),1);
 assert.equal(d.acknowledgePresentedFrame(1,.005),0);
 assert.equal(sounds.length,1);
 d.dispose();
});
