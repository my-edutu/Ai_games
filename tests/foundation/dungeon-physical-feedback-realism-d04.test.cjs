'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const load=name=>import(pathToFileURL(path.join(root,name)).href);
function three(){
 const created={geos:0,mats:0,geoDisposed:0,matDisposed:0,meshes:[]};
 class Vec{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}normalize(){const d=Math.sqrt(this.lengthSq())||1;this.x/=d;this.y/=d;this.z/=d;return this}}
 class Geo{constructor(){created.geos++;this.attributes={}}setAttribute(n,v){this.attributes[n]=v;return this}setIndex(v){this.indices=v;return this}computeVertexNormals(){}dispose(){created.geoDisposed++}}
 class Mat{constructor(o={}){created.mats++;Object.assign(this,o)}dispose(){created.matDisposed++}}
 class Obj{constructor(){this.position=new Vec();this.rotation={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};this.quaternion={identity(){},setFromUnitVectors(){}};this.scale={setScalar(x){this.x=x;this.y=x;this.z=x},set(x,y,z){this.x=x;this.y=y;this.z=z}};this.matrix={};}updateMatrix() {}}
 class Mesh{constructor(geo,mat,cap){created.meshes.push(this);this.geometry=geo;this.material=mat;this.count=cap;this.visible=false;this.matrices=[];this.instanceMatrix={setUsage(){},needsUpdate:false}}
 setMatrixAt(i,m){this.matrices[i]={...m}}}
 const T={Object3D:Obj,Vector3:Vec,BufferGeometry:Geo,
  Float32BufferAttribute:class{constructor(array,size){this.array=array;this.itemSize=size}},
  MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,InstancedMesh:Mesh,
  TorusGeometry:Geo,TetrahedronGeometry:Geo,OctahedronGeometry:Geo,
  IcosahedronGeometry:Geo,RingGeometry:Geo,CylinderGeometry:Geo,
  SphereGeometry:Geo,DoubleSide:2,DynamicDrawUsage:35048};
 const scene={children:new Set(),add(v){this.children.add(v)},remove(v){this.children.delete(v)}};
 return {T,scene,created};
}
const cue=(changes={})=>({id:'1:1:11:damage:-:revenant',sceneKey:'1:1',tick:11,kind:'damage',
  visual:'hit',audio:'impact',proof:'observed-hp-drop',verified:true,
  actorId:null,targetId:'revenant',to:{x:3,z:2},from:null,duration:.32,
  severity:.8,priority:5,delay:0,...changes});
function audio(){
 const record={started:0,stopped:0,osc:[],filters:[],buffers:0,connects:0,compressors:0};
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},playbackRate:{value:1},
  connect(){record.connects++},disconnect(){},start(){record.started++},stop(){record.stopped++}});
 const ctx={state:'running',sampleRate:48000,currentTime:0,destination:{},
  createGain:()=>node(),createBuffer:(ch,size,samplerate)=>{record.buffers++;return{length:size,getChannelData:()=>new Float32Array(size)}} ,
  createOscillator:()=>{const n=node();record.osc.push(n);return n},
  createBufferSource:()=>node(),createBiquadFilter:()=>{const n=node();record.filters.push(n);return n},
  createDynamicsCompressor:()=>{record.compressors++;return{threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){}}}};
 return {ctx,record};
}
test('new physical blade streak geometry is tapered, bounded and shared; actual injury makes several retained micro-fragments only',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const {T,scene,created}=three();
 const stage=createPhysicalFeedbackVisuals(T,scene,{reducedFlash:true});
 const idle=stage.stats();
 assert.ok(PHYSICAL_FEEDBACK_POOL_LIMITS.hit>=32,'multiple independently posed chips must remain within a hard cap');
 assert.ok(idle.reservedInstances<=112);
 assert.equal(idle.activeDrawCalls,0);
 const trail=[...scene.children].find(m=>m.geometry.attributes.position?.array);
 assert.ok(trail,'a generated tapered blade geometry, not a glowing torus');
 const vert=trail.geometry.attributes.position.array;
 assert.ok(vert.length>=90 && vert.length<=360,'bounded ribbon vertices');
 assert.ok(Math.max(...vert)>0 && Math.min(...vert)<0,'thin ribbon should straddle the origin without a synthetic swept crescent');
 assert.equal(stage.emit(cue()),true);
 assert.ok(stage.stats().active>=4,'real injury should produce a small physical chip fan');
 assert.equal(stage.stats().activeDrawCalls,1,'all fracture pieces are one instanced draw call');
 for(let i=0;i<20;i++)stage.advance(.05);
 assert.equal(stage.stats().active,0);
 assert.equal(created.geos,scene.children.size,'geometry is retained, not minted per hit');
 assert.equal(created.mats,scene.children.size,'materials are retained, not minted per hit');
 stage.dispose();assert.equal(created.geoDisposed,created.geos);assert.equal(created.matDisposed,created.mats);
});
test('authentic injured body interpolates within its own current cell without losing HP-only contact art',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const OriginalPose=T.Object3D;
 T.Object3D=class extends OriginalPose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 };
 const unit={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:12};
 let snapshot={run:1,floor:1,tick:11,units:[unit]};
 // The actual character rig has not yet reached its newly observed cell:
 // 0.84m of presentation interpolation should not erase genuine HP loss.
 const actor={u:unit,root:{visible:true,position:{x:-6.84,y:0,z:-7},
  rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='revenant'?actor:null,
  getCurrentSnapshot:()=>snapshot
 });
 try{
  assert.equal(stage.emit(cue()),true,
   'a known injured victim within one legitimate cell-step retains body-local hit art');
  assert.ok(stage.stats().instancesByPool.hit>=4);
  const hitMesh=[...scene.children][1]; // fixed pool order: trail then hit
  assert.equal(hitMesh.matrices[0].x,actor.root.position.x,
   'the first damage fragment starts at the actual drawn body, not at the unoccupied destination cell');
  assert.equal(hitMesh.matrices[0].y,1.12,
   'victim-local chest height is used during interpolation');
  stage.reset();
  actor.root.position.x=-8.02;
  assert.equal(stage.emit(cue()),false,
   'a distant reused root cannot anchor the current victim');
  actor.root.position.x=-6.84;
  actor.u={...unit,id:'unrelated'};
  assert.equal(stage.emit(cue()),false,
   'an actor map collision must not assign the injury to another character');
  actor.u={...unit,x:4};
  assert.equal(stage.emit(cue()),false,
   'a character assigned to a different authoritative cell is not a valid impact witness');
  actor.u=unit;
  snapshot={...snapshot,tick:12};
  assert.equal(stage.emit(cue()),false,
   'an expired observation tick cannot be relocalized onto a later pose');
  snapshot={...snapshot,tick:11,units:[unit,{...unit}]};
  assert.equal(stage.emit(cue()),false,
   'duplicate public victim identities are not a reliable body anchor');
  assert.equal(stage.stats().instancesByPool.hit,0);
 }finally{stage.dispose()}
});
test('verified victim injury starts as a bounded torso-surface chip fan instead of an invisible chest-centre stack',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const OriginalPose=T.Object3D;
 T.Object3D=class extends OriginalPose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 };
 const victim={id:'revenant',kind:'revenant',faction:'enemy',
  x:3,z:2,hp:14,maxHp:20};
 let snapshot={run:1,floor:1,tick:11,units:[victim]};
 const actor={u:victim,root:{visible:true,
  position:{x:-6,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id===victim.id?actor:null,
  getCurrentSnapshot:()=>snapshot,requireVerifiedHpReceipt:true
 });
 const actual=cue({severity:.3,detail:{damage:6,remainingHp:14,maxHp:20}});
 const hit=[...scene.children][1];
 try{
  assert.equal(stage.emit(actual),true,'actual current victim HP loss earns torso-local chips');
  assert.equal(stage.stats().instancesByPool.hit,4,'low severity remains four bounded instances');
  assert.equal(stage.stats().activeDrawCalls,1);
  const positions=hit.matrices.slice(0,4).map(m=>({x:m.x,y:m.y,z:m.z}));
  assert.deepEqual(positions[0],{x:-6,y:1.12,z:-7},
   'central victim anchor remains the actual drawn body, not an inferred attacker');
  const surface=positions.slice(1);
  for(const point of surface){
   const radial=Math.hypot(point.x+6,point.z+7);
   assert.ok(radial>=.26&&radial<=.36,
    'chips must start just outside the torso, not hidden at its centre or across the tile');
   assert.ok(Math.abs(point.y-1.12)<=.17,
    'surface chips remain in a restrained chest-height band');
  }
  assert.ok(surface.some(p=>p.x>-6)&&surface.some(p=>p.x<-6),
   'an unknown attacker must not turn every chip into a fake directional slash');
  const budget=stage.stats();
  assert.equal(budget.reservedInstances,102);
  assert.ok(budget.activeDrawCalls<=7);
  stage.reset();
  assert.equal(stage.emit(actual),true);
  assert.deepEqual(hit.matrices.slice(0,4).map(m=>({x:m.x,y:m.y,z:m.z})),positions,
   'same immutable HP receipt produces deterministic shell positions after reset');
  stage.reset();
  snapshot={...snapshot,tick:12};
  assert.equal(stage.emit(actual),false,'old injury must never migrate onto a newer victim tick');
  assert.equal(stage.stats().instancesByPool.hit,0);
 }finally{stage.dispose()}
});

test('verified HP torso-shell fragments have a restrained but readable first-frame footprint, including reduced flash',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const OriginalPose=T.Object3D;
 T.Object3D=class extends OriginalPose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z,
   scale:this.scale.x}}
 };
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:14,maxHp:20};
 const options={actorById:id=>id===victim.id?{
  u:victim,root:{visible:true,position:{x:-6,y:0,z:-7},rotation:{y:0}}
 }:null,getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]}),
  requireVerifiedHpReceipt:true};
 const accepted=cue({severity:.3,detail:{damage:6,remainingHp:14,maxHp:20}});
 const stage=createPhysicalFeedbackVisuals(T,scene,options);
 try{
  assert.equal(stage.emit(accepted),true);
  const hit=[...scene.children][1];
  assert.ok(hit.material.opacity>=.45&&hit.material.opacity<=.51,
   'ordinary authentic HP chips need restrained but legible opacity; no extra light or flash');
  const core=hit.matrices[0].scale;
  assert.ok(core>=.5&&core<=.85,'the body-centre reference remains a small fragment');
  const shell=hit.matrices.slice(1,4).map(m=>m.scale);
  for(const scale of shell)
   assert.ok(scale>=.95&&scale<=1.2,
    'outer shell fragments must not begin as sub-pixel-scale chips relative to their retained geometry');
  assert.equal(stage.stats().instancesByPool.hit,4);
  assert.equal(stage.stats().activeDrawCalls,1);
  assert.equal(stage.stats().reservedInstances,102);
 }finally{stage.dispose()}
 const reduced=three(),low=createPhysicalFeedbackVisuals(reduced.T,reduced.scene,{
  ...options,reducedFlash:true,reducedMotion:true});
 try{
  assert.equal(low.emit(accepted),true);
  const hit=[...reduced.scene.children][1];
  assert.ok(hit.material.opacity<=.22,
   'reduced-flash mode must never gain ordinary contact contrast');
  assert.ok(low.stats().activeDrawCalls<=7);
  for(let i=0;i<20;i++)low.advance(.05);
  assert.equal(low.stats().active,0,'stronger static readability must not extend effect lifespan');
 }finally{low.dispose()}
});

test('verified HP fragments remain readable at a genuine 336ms frame, not after 400ms expiry',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:14,maxHp:20};
 const live=cue({duration:.23,severity:.3,detail:{damage:6,remainingHp:14,maxHp:20}});
 const fixture=three(),OriginalPose=fixture.T.Object3D;
 fixture.T.Object3D=class extends OriginalPose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z,scale:this.scale.x}}
 };
 const stage=createPhysicalFeedbackVisuals(fixture.T,fixture.scene,{
  requireVerifiedHpReceipt:true,
  getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]}),
  actorById:id=>id===victim.id?{u:victim,root:{visible:true,
   position:{x:-6,y:0,z:-7},rotation:{y:0}}}:null
 });
 try{
  assert.equal(stage.emit(live),true,'only canonical current actual HP loss receives body chips');
  stage.advance(.05,.336);
  assert.equal(stage.hasDrawableCue(live.id),true,
   'a 336ms actual frame cannot silently erase the first visible genuine impact before the existing 400ms sound deadline');
  const chips=[...fixture.scene.children][1].matrices.slice(1,4);
  assert.ok(chips.every(m=>m.scale>=.30),
   'a technically live but sub-pixel-sized fragment is not a readable physical impact');
  assert.equal(stage.stats().activeDrawCalls,1);
  assert.equal(stage.stats().reservedInstances,102);
  stage.advance(.05,.05);
  assert.equal(stage.hasDrawableCue(live.id),true,
   'the verified 386ms impact remains within the strict 400ms frame window');
  stage.advance(.014,.014);
  assert.equal(stage.hasDrawableCue(live.id),false,
   'a 400ms-old impact must retire, not become a permanent ghost');
  assert.equal(stage.stats().active,0);
 }finally{stage.dispose()}
 const short=three();
 const legacy=createPhysicalFeedbackVisuals(short.T,short.scene);
 try{
  assert.equal(legacy.emit(live),true);
  legacy.advance(.05,.336);
  assert.equal(legacy.hasDrawableCue(live.id),false,
   'independent/non-strict visual auditions retain their previous brief lifetime');
 }finally{legacy.dispose()}
 const accessible=three();
 const reduced=createPhysicalFeedbackVisuals(accessible.T,accessible.scene,{
  reducedMotion:true,reducedFlash:true,requireVerifiedHpReceipt:true,
  getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]})
 });
 try{
  assert.equal(reduced.emit(live),true);
  assert.ok([...accessible.scene.children][1].material.opacity<=.22);
  reduced.advance(.05,.336);
  assert.equal(reduced.hasDrawableCue(live.id),true,
   'verified reduced-motion HP loss remains drawable on a timely 336ms first frame');
  reduced.advance(.064,.064);
  assert.equal(reduced.hasDrawableCue(live.id),false,
   'the accessible cue still retires at 400ms, not beyond the sound deadline');
 }finally{reduced.dispose()}
});

test('verified reduced-motion injury retains a stationary victim-local pose through a 336ms first frame',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const fixture=three(),OriginalPose=fixture.T.Object3D;
 fixture.T.Object3D=class extends OriginalPose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z,
   rx:this.rotation.x,ry:this.rotation.y,rz:this.rotation.z,scale:this.scale.x}}
 };
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:14,maxHp:20};
 const actual=cue({severity:.3,duration:.23,
  detail:{damage:6,remainingHp:14,maxHp:20}});
 const stage=createPhysicalFeedbackVisuals(fixture.T,fixture.scene,{
  reducedMotion:true,reducedFlash:true,requireVerifiedHpReceipt:true,
  getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]}),
  actorById:id=>id===victim.id?{u:victim,root:{visible:true,
   position:{x:-6,y:0,z:-7},rotation:{y:0}}}:null
 });
 const hit=[...fixture.scene.children][1];
 const positionAndRotation=()=>hit.matrices.slice(0,4).map(
  m=>({x:m.x,y:m.y,z:m.z,rx:m.rx,ry:m.ry,rz:m.rz}));
 try{
  assert.equal(stage.emit(actual),true,'only witnessed real HP loss may admit a chip');
  const first=positionAndRotation();
  assert.equal(first.length,4);
  assert.ok(hit.material.opacity<=.22,'reduced flash must remain subdued');
  stage.advance(.05,.336);
  assert.equal(stage.hasDrawableCue(actual.id),true,
   'a first frame at 336ms must keep the accessible injury visible');
  assert.deepEqual(positionAndRotation(),first,
   'reduced motion must not translate or spin victim-local injury fragments');
  stage.advance(.05,.05);
  assert.equal(stage.hasDrawableCue(actual.id),true,'386ms remains within the fixed window');
  assert.deepEqual(positionAndRotation(),first,'no last-frame ballistic jump');
  stage.advance(.014,.014);
  assert.equal(stage.hasDrawableCue(actual.id),false,
   'the exact 400ms boundary must clear the accessible HP cue');
  assert.equal(stage.stats().active,0);
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('D04 real 373ms injury receipts keep ordinary and fatal body chips legible until the 400ms bound',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 for(const injury of [
  {kind:'damage',audio:'impact',hp:14,damage:6,severity:.3},
  {kind:'damage-fatal',audio:'fatal-impact',hp:0,damage:20,severity:1}
 ]){
  const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,
   hp:injury.hp,maxHp:20};
  const genuine=cue({
   id:`1:1:11:${injury.kind}:-:revenant`,
   kind:injury.kind,audio:injury.audio,duration:.23,severity:injury.severity,
   detail:{damage:injury.damage,remainingHp:injury.hp,maxHp:20}
  });
  const fixture=three(),OriginalPose=fixture.T.Object3D;
  fixture.T.Object3D=class extends OriginalPose{
   updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,
    z:this.position.z,scale:this.scale.x}}
  };
  const stage=createPhysicalFeedbackVisuals(fixture.T,fixture.scene,{
   requireVerifiedHpReceipt:true,
   getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]}),
   actorById:id=>id===victim.id?{u:victim,root:{visible:true,
    position:{x:-6,y:0,z:-7},rotation:{y:0}}}:null
  });
  try{
   assert.equal(stage.emit(genuine),true,'only current canonical HP loss earns the fragments');
   stage.advance(.05,.373);
   assert.equal(stage.hasDrawableCue(genuine.id),true,
    'a real 373ms submission must retain a drawable verified injury');
   const hitMesh=[...fixture.scene.children][1];
   assert.ok(hitMesh.matrices.slice(1,4).every(m=>m.scale>=.30),
    'outer real-contact chips at 373ms must not be effectively invisible');
   stage.advance(.018,.018);
   assert.equal(stage.hasDrawableCue(genuine.id),true,
    'the 391ms submitted injury remains within the fixed 400ms deadline');
   assert.ok(hitMesh.matrices.slice(1,4).every(m=>m.scale>=.30),
    'late but still eligible impact cannot fade below the readable floor');
   assert.equal(stage.stats().reservedInstances,102);
   assert.ok(stage.stats().activeDrawCalls<=7);
   stage.advance(.009,.009);
   assert.equal(stage.hasDrawableCue(genuine.id),false,
    '400ms is a firm retirement bound, not permission to replay a late hit');
   assert.equal(stage.stats().active,0);
  }finally{stage.dispose()}
 }
});

test('visual effect groups physically distinguish guided arrow, magic orb, rooted blade, dodge grit and measured impact',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actors=new Map();const a=(id,x,z)=>({
  u:{id,kind:id,action:id==='mystic'?'cast':'attack',actionTick:11},authored:id==='vanguard',
  assetRoot:id==='vanguard'?{}:null,
  rigMeleeBones:id==='vanguard'?[{part:'wrist',bone:{isBone:true,
   world:{x:x-9+.15,y:1.1,z:z-9},updateWorldMatrix(){},
   getWorldPosition(out){return out.set(this.world.x,this.world.y,this.world.z)}}}]:[],
  root:{visible:true,position:{x:x-9,y:0,z:z-9},rotation:{y:.4}}
 });
 actors.set('vanguard',a('vanguard',2,2));actors.set('revenant',a('revenant',3,2));
 actors.set('ranger',a('ranger',2,2));actors.set('mystic',a('mystic',2,2));
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>actors.get(id)});
 assert.equal(stage.emit(cue({kind:'swing',visual:'trail',proof:'authority-attempt-not-hit',actorId:'vanguard',targetId:null,from:{x:2,z:2},to:null})),true);
 assert.equal(stage.stats().activeDrawCalls,0,'stationary sword hand cannot draw an invented arc');
 assert.equal(stage.hasLiveCue(cue().id),true,'hidden trail retains a live slot');
 assert.equal(stage.hasDrawableCue(cue().id),false,'hidden blade cannot certify a drawn passage');
 actors.get('vanguard').rigMeleeBones[0].bone.world.x+=.12;
 stage.advance(.016);
 assert.equal(stage.stats().activeDrawCalls,1,'actual animated hand displacement produces a single measured ribbon draw');
 assert.equal(stage.hasDrawableCue(cue().id),true,'observed wrist movement makes this slot drawable');
 assert.ok(stage.stats().measuredTrailFrames>=1);
 assert.equal(stage.emit(cue({kind:'ranged-release',visual:'launch',proof:'authority-action',actorId:'ranger',targetId:'revenant',from:{x:2,z:2},to:{x:3,z:2}})),true);
 assert.equal(stage.emit(cue({kind:'spell-release',visual:'cast',proof:'authority-action',actorId:'mystic',targetId:'revenant',from:{x:2,z:2},to:{x:3,z:2}})),true);
 assert.equal(stage.emit(cue({kind:'evade',visual:'evade',proof:'authority-event-and-observed-step',actorId:'vanguard',targetId:null,from:{x:2,z:2},to:{x:2,z:3}})),true);
 const counts=stage.stats().instancesByPool;
 assert.ok(counts.trail>=1 && counts.projectile>=1 && counts.spell>=1 && counts.dust>=1);
 assert.equal(stage.emit(cue({kind:'damage',visual:'hit',proof:'guessed'})),false);
 stage.reset();assert.equal(stage.stats().activeDrawCalls,0);
 stage.dispose();
});
test('D04 visual admission rejects crossed injury/release cue contracts without creating detached effects',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actors={
  ranger:{u:{id:'ranger',kind:'ranger',action:'attack',actionTick:11,hp:20},
   authored:false,root:{visible:true,position:{x:-7,y:0,z:-7}}},
  mystic:{u:{id:'mystic',kind:'mystic',action:'cast',actionTick:11,hp:20},
   authored:false,root:{visible:true,position:{x:-7,y:0,z:-7}}}
 };
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>actors[id]??null});
 const release=(id,kind,visual)=>cue({
  id:'1:1:11:'+kind+':'+id+':enemy',kind,visual,proof:'authority-action',
  actorId:id,targetId:'enemy',from:{x:2,z:2},to:{x:4,z:2},duration:.26
 });
 const arrow=release('ranger','ranged-release','launch');
 const spell=release('mystic','spell-release','cast');
 try{
  assert.equal(stage.emit({...arrow,proof:'observed-hp-drop'}),false,
   'an observed injury is NOT evidence of a new arrow launch');
  assert.equal(stage.emit({...spell,proof:'observed-hp-drop'}),false,
   'an observed injury is NOT evidence of a spell release');
  assert.equal(stage.emit({...arrow,proof:'guessed'}),false,
   'an unspecified source may not mint a projectile');
  assert.equal(stage.emit(cue({targetId:null})),false,
   'an anonymous HP change cannot be rendered as a localized victim impact');
  assert.equal(stage.emit(cue({kind:'swing'})),false,
   'an attempted swing cannot wear the verified HP-injury visual contract');
  assert.equal(stage.stats().active,0,
   'rejected evidence creates no retained fragments or sound authorization');
  assert.equal(stage.emit(arrow),true,'genuinely witnessed ranger launch remains drawable');
  assert.equal(stage.emit(spell),true,'genuinely witnessed spell remains drawable');
  assert.equal(stage.emit(cue()),true,'genuine victim HP injury remains drawable');
  assert.equal(stage.stats().instancesByPool.projectile,1);
  assert.equal(stage.stats().instancesByPool.spell,1);
  assert.ok(stage.stats().instancesByPool.hit>=4);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});
test('D04 delayed releases require a witnessed firing or casting pose, never a stale hand or empty cell',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actor=(id,kind,action)=>({
  u:{id,kind,action,actionTick:11,hp:20},
  authored:false,root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}
 });
 const units={ranger:actor('ranger','ranger','attack'),
  mystic:actor('mystic','mystic','cast')};
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>units[id]??null});
 const release=(id,kind,visual)=>cue({
  id:'1:1:11:'+kind+':'+id+':enemy',kind,visual,
  proof:'authority-action',actorId:id,targetId:'enemy',
  from:{x:2,z:2},to:{x:4,z:2},tick:11,duration:.26
 });
 const arrow=release('ranger','ranged-release','launch');
 const spell=release('mystic','spell-release','cast');
 assert.equal(stage.emit(arrow),true,'witnessed ranger attack may launch');
 assert.equal(stage.emit(spell),true,'witnessed mystic cast may launch');
 stage.reset();
 units.ranger.u.action='idle';
 assert.equal(stage.emit(arrow),false,'old ranger action must not emit a new arrow');
 units.ranger.u.action='attack';units.ranger.u.actionTick=12;
 assert.equal(stage.emit(arrow),false,'different attack tick cannot authenticate earlier shot');
 units.ranger.u.actionTick=11;units.ranger.u.kind='vanguard';
 assert.equal(stage.emit(arrow),false,'non-ranger cannot supply arrow provenance');
 units.ranger.u.kind='ranger';units.mystic.u.action='idle';
 assert.equal(stage.emit(spell),false,'expired cast must not fire a spell');
 units.mystic.u.action='cast';units.mystic.u.actionTick=12;
 assert.equal(stage.emit(spell),false,'different cast tick cannot authenticate earlier spell');
 units.mystic.u.actionTick=11;units.mystic.u.hp=0;
 assert.equal(stage.emit(spell),false,'dead caster must not emit');
 units.mystic.u.hp=20;delete units.ranger;
 assert.equal(stage.emit(arrow),false,'missing firing actor must not create an empty-cell projectile');
 assert.equal(stage.stats().instancesByPool.projectile,0);
 assert.equal(stage.stats().instancesByPool.spell,0);
 stage.dispose();
});

test('witnessed projectile remains a bounded independent flight after its caster changes action',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const ranger={u:{id:'ranger',kind:'ranger',action:'attack',actionTick:11,hp:20},
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}},authored:false};
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>id==='ranger'?ranger:null});
 const arrow=cue({id:'shot-11',kind:'ranged-release',visual:'launch',
  proof:'authority-action',actorId:'ranger',targetId:'enemy',
  from:{x:2,z:2},to:{x:4,z:2},tick:11,duration:.26});
 assert.equal(stage.emit(arrow),true);
 ranger.u.action='idle';ranger.u.actionTick=12;
 stage.advance(.016,.016);
 assert.equal(stage.hasLiveCue('shot-11'),true,
  'already launched shot is not recalled by later authority actions');
 assert.equal(stage.stats().instancesByPool.projectile,1);
 stage.reset();assert.equal(stage.stats().instancesByPool.projectile,0);
 stage.dispose();
});

test('audio uses noise-dominant air sweep, neutral body thud and separate inharmonic steel partials for confirmed block',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES}=await load('original-combat-foley.js');
 const {ctx,record}=audio(),s=createOriginalCombatFoley(ctx);
 assert.equal(s.enable(),true);
 assert.equal(s.emit(cue({audio:'whoosh'})),true);
 assert.equal(record.osc.length,0,'a realistic swing is wind, not an electronic sine beep');
 ctx.currentTime+=.2;
 assert.equal(s.emit(cue({audio:'impact'})),true);
 assert.ok(record.osc.length>=1 && record.osc.length<=2,'thud has restrained low-frequency weight');
 const before=record.osc.length;
 ctx.currentTime+=.2;
 assert.equal(s.emit(cue({audio:'block'})),true);
 assert.ok(record.osc.length-before>=3,'steel collision needs multiple inharmonic resonant partials');
 assert.equal(record.buffers,1,'all transients use one original retained noise buffer');
 assert.ok(record.filters.length>=3,'material-specific filtered noise, not only oscillators');
 assert.ok(s.stats().activeVoices<=MAX_ORIGINAL_COMBAT_VOICES);
 assert.ok(s.stats().masterGain<=.12);
 s.disable();assert.equal(s.stats().activeVoices,0);
 s.dispose();
});
test('a presentation commit barrier holds contact audio until a render submission acknowledgement; duplicate commits never replay',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const v=[],a=[];const visualAdapter={emit:x=>{v.push(x);return true},advance(){},reset(){},dispose(){}};
 const audioAdapter={enable(){return true},emit:x=>{a.push(x);return true},flush(){},disable(){},cleanup(){},dispose(){}};
 const director=createPhysicalCombatFeedback({visualAdapter,audioAdapter,requirePresentedFrame:true});
 assert.equal(director.enableAudioFromGesture(),true);
 const unit=(hp,action,actionTick)=>({id:'vanguard',kind:'vanguard',faction:'party',hp,maxHp:30,x:2,z:2,action,actionTick});
 const game=tick=>({tick,run:1,floor:1,units:[unit(30,'idle',10)],events:[]});
 director.acceptSnapshot(game(10));
 director.acceptSnapshot({...game(11),units:[unit(23,'hurt',11)]});
 director.advance(.05);director.advance(.05);director.advance(.05);
 assert.equal(v.length,1,'confirmed HP injury staged before render');assert.equal(a.length,0,'no sound preceding render submission');
 assert.equal(director.acknowledgePresentedFrame('frame-22'),1);
 assert.equal(a.length,1);
 assert.equal(director.acknowledgePresentedFrame('frame-22'),0);
 assert.equal(a.length,1);
 director.muteAudio();
 director.acceptSnapshot({...game(12),units:[unit(20,'hurt',12)]});
 director.acknowledgePresentedFrame('frame-23');
 assert.equal(a.length,1,'mute must silence even a pending confirmed injury');
 director.dispose();
});
test('unpresented effects and stale scene revisions never leak queued audio on a later frame',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const a=[],director=createPhysicalCombatFeedback({requirePresentedFrame:true,
  visualAdapter:{emit(){return true},advance(){},reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit:x=>{a.push(x);return true},flush(){},disable(){},cleanup(){},dispose(){}}});
 director.enableAudioFromGesture();
 const u=(hp)=>({id:'ranger',kind:'ranger',faction:'party',x:1,z:1,hp,maxHp:30,action:'hurt',actionTick:11});
 const s=(tick,run=1,hp=30)=>({run,floor:1,tick,units:[u(hp)],events:[]});
 director.acceptSnapshot(s(10));director.acceptSnapshot(s(11,1,20));
 director.advance(.016,.016);
 assert.ok(director.stats().awaitingPresentation>0);
 director.acceptSnapshot(s(0,2,30));
 assert.equal(director.acknowledgePresentedFrame('stale'),0);
 assert.equal(a.length,0,'a new run invalidates any queued earlier-scene audio');
 director.dispose();
});
test('sustained true-hit storms cap geometry, submissions and VRAM independently of the number of attacks',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const {T,scene,created}=three(),v=createPhysicalFeedbackVisuals(T,scene);
 const limit=Object.values(PHYSICAL_FEEDBACK_POOL_LIMITS).reduce((a,b)=>a+b,0);
 for(let i=0;i<800;i++){
  v.emit(cue({id:`1:1:${i}:damage:-:revenant`,tick:i}));
  if(i%7===0)v.advance(.05);
 }
 assert.ok(v.stats().active<=PHYSICAL_FEEDBACK_POOL_LIMITS.hit);
 assert.ok(v.stats().peak<=limit);
 assert.equal(v.stats().geometryCount,7);
 assert.ok(v.stats().activeDrawCalls<=7);
 assert.equal(created.geos,7,'no new geometry through eight hundred real-HP event fixtures');
 assert.equal(created.mats,7);
 v.reset();v.reset();v.dispose();v.dispose();
 assert.equal(scene.children.size,0);
 assert.equal(created.geoDisposed,7);assert.equal(created.matDisposed,7);
});
test('ranged visual arriving at the target does not fabricate impact spalls or actor damage',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actors=new Map();for(const [id,x,z] of [['ranger',2,2],['revenant',3,2]])
  actors.set(id,{u:{id,kind:id,action:id==='ranger'?'attack':'idle',actionTick:11,hp:30},
   root:{visible:true,position:{x:x-9,y:0,z:z-9}}});
 const v=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>actors.get(id)});
 const arrow=cue({kind:'ranged-release',visual:'launch',proof:'authority-action',
  actorId:'ranger',targetId:'revenant',from:{x:2,z:2},to:{x:3,z:2}});
 assert.equal(v.emit(arrow),true);
 for(let i=0;i<20;i++)v.advance(.05);
 assert.equal(v.stats().instancesByPool.hit,0);
 assert.equal(v.stats().confirmedFragments,0,'arrival must never create contact debris');
 assert.equal(actors.get('revenant').u.hp,30,'no authority side effects');
 v.dispose();
});
test('reduced-motion and reduced-flash keep genuine damage readable while suppressing recreational trails',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();const v=createPhysicalFeedbackVisuals(T,scene,{reducedMotion:true,reducedFlash:true});
 assert.ok([...scene.children].every(mesh=>mesh.material.opacity<=.25));
 assert.equal(v.emit(cue({kind:'swing',visual:'trail',actorId:'vanguard',targetId:null,
  to:null,from:{x:2,z:2},proof:'authority-attempt-not-hit'})),false);
 assert.equal(v.emit(cue()),true);
 v.advance(.05);v.advance(.05);v.advance(.05);
 assert.equal(v.stats().active,0,'reduced motion should release confirmed fragments quickly');
 v.dispose();
});
test('a missed render deadline drops stale audio rather than playing a delayed combat storm',async()=>{
 const {createPhysicalCombatFeedback,MAX_AUDIO_VISUAL_STALENESS_SECONDS}=await load('physical-combat-feedback.js');
 const audio=[];const controller=createPhysicalCombatFeedback({requirePresentedFrame:true,
  visualAdapter:{emit(){return true},advance(){},reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(x){audio.push(x);return true},flush(){},disable(){},cleanup(){},dispose(){}}});
 controller.enableAudioFromGesture();
 const u=(tick,hp,action='idle')=>({id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,hp,maxHp:30,action,actionTick:tick});
 const s=(tick,hp,action='idle')=>({tick,run:1,floor:1,units:[u(tick,hp,action)],events:[]});
 controller.acceptSnapshot(s(10,30));controller.acceptSnapshot(s(11,21,'hurt'));
 controller.advance(.016,.016);
 assert.ok(controller.stats().awaitingPresentation>=1);
 const frames=Math.ceil((MAX_AUDIO_VISUAL_STALENESS_SECONDS+.06)/.05);
 for(let i=0;i<frames;i++)controller.advance(.05);
 assert.equal(controller.acknowledgePresentedFrame('late-real-frame'),0);
 assert.equal(audio.length,0);
 assert.ok(controller.stats().staleAudioDropped>=1);
 controller.dispose();
});
test('new effects never inspect untrusted event prose, random games, timers or gameplay damage setters',async()=>{
 const fs=require('node:fs');
 for(const file of ['physical-feedback-plan.js','physical-feedback-visuals.js',
  'physical-combat-feedback.js','original-combat-foley.js']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(/\.hp\s*=(?!=)/.test(source),false,`${file} cannot assign HP`);
  for(const needle of ['Math.random(', 'Date.now(', 'performance.now(',
   'localStorage.clear(', 'fetch('])
    assert.equal(source.includes(needle),false,`${file} references forbidden ${needle}`);
 }
});
test('original noise buffer is deterministic across separate explicitly activated sessions',async()=>{
 const {createOriginalCombatFoley}=await load('original-combat-foley.js');
 const records=[];
 for(let n=0;n<2;n++){
  let samples=null;const {ctx}=audio();ctx.createBuffer=(c,len,rate)=>{
   samples=new Float32Array(len);return{length:len,getChannelData:()=>samples};
  };
  const fx=createOriginalCombatFoley(ctx);assert.equal(fx.enable(),true);
  records.push(samples.slice());fx.dispose();
 }
 assert.deepEqual(records[0],records[1]);
});

test('earned Warden counter receives actual victim-anchored restrained VFX with no inferred attacker',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three(),stage=createPhysicalFeedbackVisuals(T,scene);
 const counter=cue({kind:'counter',visual:'counter',audio:'counter',actorId:null,
  targetId:'warden',from:null,to:{x:4,z:4},proof:'authority-counter-and-HP'});
 assert.equal(stage.emit(counter),true,'known Warden victim must not be lost for missing source actor');
 assert.equal(stage.stats().instancesByPool.signal,1);
 assert.equal(stage.emit({...counter,id:'forgery',proof:'unverified'}),false);
 const block=cue({kind:'block',visual:'block',audio:'block',actorId:'vanguard',
  targetId:null,from:{x:2,z:2},to:null,proof:'authority-block-unique-guarded-hp'});
 assert.equal(stage.emit(block),true);
 assert.equal(stage.emit({...block,id:'guess',proof:'authority-event'}),false,
  'unattributed block events must be sound-only');
 stage.reset();assert.equal(stage.stats().active,0);stage.dispose();
});

test('map-backed D04 preview clips projectiles at true stone and suppresses adjacent-wall bolts without invented hits',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 let map=Array.from({length:19},()=>'.'.repeat(19)),reads=0;
 const block=(x,z)=>{map=map.map((row,i)=>i===z?row.slice(0,x)+'#'+row.slice(x+1):row)};
 block(4,2);
 const ranger={u:{id:'ranger',kind:'ranger',action:'attack',actionTick:11,hp:30},
  authored:false,root:{visible:true,position:{x:-7,y:0,z:-7}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>id==='ranger'?ranger:null,
  getFloorMap:()=>{reads++;return map}});
 const shot=cue({kind:'ranged-release',visual:'launch',audio:'ranged-release',
  proof:'authority-action',actorId:'ranger',targetId:'revenant',
  from:{x:2,z:2},to:{x:7,z:2}});
 assert.equal(stage.emit(shot),true);
 assert.equal(stage.stats().occludedFlights,1);
 assert.equal(stage.stats().instancesByPool.projectile,1);
 for(let i=0;i<8;i++)stage.advance(.016);
 assert.equal(reads,1,'public wall map is read only once per release, never raymarched each frame');
 assert.equal(stage.stats().instancesByPool.hit,0);
 stage.reset();
 map=Array.from({length:19},()=>'.'.repeat(19));block(3,2);
 assert.equal(stage.emit({...shot,id:shot.id+':adjacent'}),false);
 assert.equal(stage.stats().blockedFlights,1);
 assert.equal(stage.stats().instancesByPool.hit,0,'no wall crossing may synthesize an impact');
 stage.dispose();
});

test('D04 actual 720ms browser stall expires injury fragments instead of preserving capped-time ghosts',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();const v=createPhysicalFeedbackVisuals(T,scene);
 assert.equal(v.emit(cue()),true);
 assert.ok(v.stats().instancesByPool.hit>0);
 v.advance(.016,.72);
 assert.equal(v.stats().instancesByPool.hit,0,'stale contact debris cannot outlive real elapsed time');
 assert.equal(v.stats().activeDrawCalls,0);
 v.dispose();
});
test('D04 900ms render stall expires unconfirmed arrow without fabricating arrival damage',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const ranger={u:{id:'ranger',kind:'ranger',action:'attack',actionTick:11,hp:30},
  authored:false,root:{visible:true,position:{x:-7,y:0,z:-7}}};
 const v=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>id==='ranger'?ranger:null});
 const arrow=cue({kind:'ranged-release',visual:'launch',actorId:'ranger',
  targetId:'revenant',from:{x:2,z:2},to:{x:5,z:2},proof:'authority-action'});
 assert.equal(v.emit(arrow),true);
 assert.equal(v.stats().instancesByPool.projectile,1);
 v.advance(.016,.9);
 assert.equal(v.stats().instancesByPool.projectile,0);
 assert.equal(v.stats().confirmedFragments,0,'expiry is not an authoritative projectile hit');
 v.dispose();
});
test('D04 true 16ms frames preserve fresh visual cues; malformed frame intervals fail closed',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();const v=createPhysicalFeedbackVisuals(T,scene);
 assert.equal(v.emit(cue()),true);
 v.advance(.016,.016);
 assert.ok(v.stats().active>0);
 v.advance(.016,NaN);
 assert.equal(v.stats().active,0,'unknown raw-frame duration cannot certify VFX continuity');
 v.dispose();
});

test('new confirmed injury initializes retained GPU instance matrices before first real submission',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene,created}=three();
 const stage=createPhysicalFeedbackVisuals(T,scene);
 const hitPool=created.meshes[1]; // pool creation order: trail, hit, block ...
 let admissionWrites=0;
 const originalSet=hitPool.setMatrixAt.bind(hitPool);
 hitPool.setMatrixAt=(i,m)=>{admissionWrites++;originalSet(i,m)};
 hitPool.instanceMatrix.needsUpdate=false;
 const damage=cue({id:'1:1:12:damage:-:revenant'});
 assert.equal(stage.emit(damage),true);
 assert.equal(admissionWrites,5,'every first-frame chip receives a world transform');
 assert.equal(hitPool.instanceMatrix.needsUpdate,true,'initial instance matrices must upload');
 assert.equal(stage.hasLiveCue(damage.id),true);
 assert.equal(stage.stats().activeDrawCalls,1);
 stage.reset();stage.dispose();
});

test('D04 discards the old blade ribbon immediately when a replacement authored wrist appears',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three(),cueId='1:1:11:swing:vanguard:-';
 const bone=x=>({isBone:true,world:{x,y:1.2,z:-7},
  updateWorldMatrix(){},getWorldPosition(out){return out.set(this.world.x,this.world.y,this.world.z)}});
 const first=bone(-6.85),replacement=bone(-6.60);
 const actor={u:{id:'vanguard',kind:'vanguard',action:'attack',actionTick:11},
  authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone:first}],
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:()=>actor});
 assert.equal(stage.emit(cue({id:cueId,kind:'swing',visual:'trail',actorId:'vanguard',
  targetId:null,from:{x:2,z:2},to:null,proof:'authority-attempt-not-hit'})),true);
 first.world.x+=.10;stage.advance(.016,.016);
 assert.equal(stage.hasDrawableCue(cueId),true,'real same-bone motion draws');
 actor.rigMeleeBones=[{part:'wrist',bone:replacement}];stage.advance(.016,.016);
 assert.equal(stage.hasDrawableCue(cueId),false,
  'a new source rig cannot inherit an earlier drawn ribbon');
 assert.equal(stage.stats().activeDrawCalls,0);
 replacement.world.x+=.09;stage.advance(.016,.016);
 assert.equal(stage.hasDrawableCue(cueId),true,
  'new stable wrist can earn a fresh genuine movement segment');
 assert.equal(stage.stats().reservedInstances,102);
 assert.equal(stage.stats().drawCalls,7);
 stage.reset();assert.equal(stage.stats().active,0);
 stage.dispose();
});


test('D04 authored ranger and cultist releases use measured rig hands; invalid hand never falls back to a fictitious muzzle',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {selectObservedWeaponHandBone}=await load('measured-weapon-trail.js');
 const {T,scene}=three();
 T.Object3D.prototype.updateMatrix=function(){
  this.matrix={x:this.position.x,y:this.position.y,z:this.position.z};
 };
 const bone=(x,y,z)=>({isBone:true,updateWorldMatrix(){},
  getWorldPosition(out){return out.set(x,y,z)}});
 const actor=(id,kind,action,hand,authored=true)=>({
  u:{id,kind,action,actionTick:11,hp:20},
  authored,assetRoot:authored?{}:null,rigHandBone:hand,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}
 });
 const units={
  cultist:actor('cultist','cultist','cast',bone(-6.72,1.46,-7)),
  ranger:actor('ranger','ranger','attack',bone(-6.77,1.38,-7))
 };
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>units[id]??null});
 const release=(id,kind,visual)=>cue({id:'rig-'+id+'-'+kind,
  kind,visual,proof:'authority-action',actorId:id,targetId:'enemy',
  from:{x:2,z:2},to:{x:4,z:2},tick:11,duration:.26});
 const spell=release('cultist','spell-release','cast');
 const arrow=release('ranger','ranged-release','launch');
 assert.equal(selectObservedWeaponHandBone(units.cultist),units.cultist.rigHandBone,
  'authored cultist has an actual right-hand joint, not a guessed staff tip');
 assert.equal(stage.emit(spell),true);
 assert.equal(stage.emit(arrow),true);
 const meshes=[...scene.children];
 assert.ok(Math.abs(meshes[6].matrices[0].x-(-6.72))<1e-6,
  'first spell frame must start at measured cultist hand, not static torso/root');
 assert.ok(Math.abs(meshes[6].matrices[0].y-1.46)<1e-6);
 assert.ok(Math.abs(meshes[5].matrices[0].x-(-6.77))<1e-6,
  'first arrow frame must start at measured ranger hand');
 stage.reset();
 units.ranger.rigHandBone=bone(-3.6,1.4,-7);
 assert.equal(stage.emit(arrow),false,
  'implausibly distant imported hand must never silently become a root muzzle');
 units.ranger.rigHandBone=bone(NaN,1.4,-7);
 assert.equal(stage.emit(arrow),false,
  'invalid joint coordinates must fail closed for authored rig');
 units.ranger.rigHandBone=null;
 assert.equal(stage.emit(arrow),false,
  'authored body without rigged hand cannot certify a projectile origin');
 units.cultist.authored=false;units.cultist.assetRoot=null;units.cultist.rigHandBone=null;
 assert.equal(stage.emit(spell),true,
  'existing explicitly procedural non-GLB spectator fallback remains usable');
 assert.equal(stage.stats().instancesByPool.projectile,0);
 assert.ok(stage.stats().reservedInstances<=104);
 stage.reset();stage.dispose();assert.equal(scene.children.size,0);
});

test('D04 guard and utility glyphs require a live, matching actor action at the original tick',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actor=(id,kind,action)=>({
  u:{id,kind,action,actionTick:11,hp:18},
  authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}
 });
 const units={vanguard:actor('vanguard','vanguard','guard'),
  mystic:actor('mystic','mystic','cast')};
 const visuals=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>units[id]??null});
 const guard=cue({id:'guard-11',kind:'guard',visual:'utility',
  audio:'guard',proof:'authority-action',verified:true,actorId:'vanguard',
  targetId:null,from:{x:2,z:2},to:null,tick:11,duration:.17});
 const utility=cue({id:'heal-11',kind:'cast-utility',visual:'utility',
  audio:'utility',proof:'authority-action',verified:true,actorId:'mystic',
  targetId:null,from:{x:2,z:2},to:null,tick:11,duration:.22});
 assert.equal(visuals.emit(guard),true,'observed guard creates one body-local cue');
 assert.equal(visuals.emit(utility),true,'observed healing cast creates one body-local cue');
 units.vanguard.u.action='idle';
 visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(guard.id),false,
  'the old guarding ring retires when the character leaves guard action');
 assert.equal(visuals.hasLiveCue(utility.id),true,
  'unrelated authentic utility ring is not collateral cleanup');
 units.mystic.u.action='idle';
 visuals.advance(.016,.016);
 assert.equal(visuals.hasLiveCue(utility.id),false,
  'the casting ring retires on changed action rather than hovering in empty air');
 visuals.reset();
 units.vanguard.u.action='idle';
 assert.equal(visuals.emit(guard),false,'stale idle actor cannot show a guard glyph');
 units.vanguard.u.action='guard';units.vanguard.u.actionTick=12;
 assert.equal(visuals.emit(guard),false,'different tick cannot grant old guard art');
 units.vanguard.u.actionTick=11;units.vanguard.u.hp=0;
 assert.equal(visuals.emit(guard),false,'dead actor cannot show a guard');
 units.vanguard.u.hp=18;delete units.vanguard;
 assert.equal(visuals.emit(guard),false,'missing actor cannot emit an empty-cell guard ring');
 units.mystic.u.action='idle';
 assert.equal(visuals.emit(utility),false,'a completed cast cannot keep releasing utility glyphs');
 units.mystic.u.action='cast';units.mystic.u.actionTick=12;
 assert.equal(visuals.emit(utility),false,'different cast tick cannot grant old utility art');
 units.mystic.u.actionTick=11;units.mystic.u.hp=0;
 assert.equal(visuals.emit(utility),false,'dead caster cannot release utility art');
 units.mystic.u.hp=18;delete units.mystic;
 assert.equal(visuals.emit(utility),false,'missing caster cannot create empty-cell magic ring');
 assert.equal(visuals.stats().instancesByPool.signal,0);
 visuals.dispose();
});

test('D04 stopped guard gesture cannot authorize frame-gated foley after its glyph retires',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const {T,scene}=three();
 const before={id:'vanguard',kind:'vanguard',faction:'party',hp:30,maxHp:30,
  x:2,z:2,action:'idle',actionTick:10};
 const guarding={...before,action:'guard',actionTick:11};
 const body={u:guarding,authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const visuals=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='vanguard'?body:null});
 const sounds=[],controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(x){sounds.push(x);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}});
 const snap=(tick,unit)=>({tick,run:1,floor:1,units:[unit],events:[]});
 assert.equal(controller.enableAudioFromGesture(),true);
 controller.acceptSnapshot(snap(10,before));
 controller.acceptSnapshot(snap(11,guarding));
 controller.advance(.016,.016);
 assert.equal(visuals.hasLiveCue('1:1:11:guard:vanguard:-'),true);
 assert.equal(sounds.length,0,'no sound before a genuine submitted frame');
 body.u={...guarding,action:'idle',actionTick:12};
 controller.advance(.016,.016);
 assert.equal(visuals.hasLiveCue('1:1:11:guard:vanguard:-'),false);
 assert.equal(controller.acknowledgePresentedFrame(1),0);
 assert.equal(sounds.length,0,'stale guard art cannot release delayed guarded-sound foley');
 assert.ok(controller.stats().recentDeliveryReceipts.some(x=>
  x.kind==='guard'&&x.decision==='expired-visual'));
 controller.dispose();
});

test('undrawn release audio witness reuses live authored hand and action proof without allocating effects',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const hand={isBone:true,updateWorldMatrix(){},getWorldPosition(out){
  return out.set(-6.75,1.35,-7);
 }};
 const ranger={u:{id:'ranger',kind:'ranger',action:'attack',actionTick:11,hp:30},
  authored:true,assetRoot:{},rigHandBone:hand,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 let present=true;
 const renderer=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='ranger'&&present?ranger:null});
 const shot=cue({id:'ranger:11',kind:'ranged-release',visual:'launch',
  proof:'authority-action',actorId:'ranger',targetId:'victim',
  from:{x:2,z:2},to:{x:4,z:2},tick:11});
 const witness=x=>renderer.hasAuthenticatedReleasePose(x);
 assert.equal(witness(shot),true,'existing imported hand and firing pose authenticate release');
 ranger.u.action='idle';
 assert.equal(witness(shot),false,'a finished shot cannot make a late sound');
 ranger.u.action='attack';ranger.u.actionTick=12;
 assert.equal(witness(shot),false,'a new attack cannot witness an older release');
 ranger.u.actionTick=11;ranger.rigHandBone=null;
 assert.equal(witness(shot),false,'authored model never substitutes a synthetic root muzzle');
 ranger.rigHandBone=hand;ranger.root.visible=false;
 assert.equal(witness(shot),false,'invisible source is not an emitter');
 ranger.root.visible=true;present=false;
 assert.equal(witness(shot),false,'unloaded source is not an emitter');
 present=true;ranger.authored=false;
 assert.equal(witness(shot),true,'explicit procedural fallback retains its observed root proxy');
 assert.equal(witness({...shot,proof:'guessed'}),false);
 assert.equal(witness({...shot,kind:'damage'}),false);
 assert.equal(renderer.stats().active,0,'witness check cannot create pooled visual effects');
 assert.equal(renderer.stats().reservedInstances,102);
 renderer.dispose();
});

test('body-local foley witness reads live guard, utility and Warden recovery without spawning art',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const body=(id,kind,action)=>({u:{id,kind,action,actionTick:11,hp:20,
   recoveryUntilTick:12},authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}});
 const units=new Map([
  ['vanguard',body('vanguard','vanguard','guard')],
  ['mystic',body('mystic','mystic','cast')],
  ['warden',body('warden','warden','cast')]
 ]);
 let current={run:1,floor:1,tick:11,guardianWard:false,
  bossRecovery:{remaining:2}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>units.get(id),getCurrentSnapshot:()=>current});
 const make=(kind,id,visual,proof)=>cue({id:id+':'+kind,sceneKey:'1:1',
  tick:11,kind,actorId:id,visual,proof,from:{x:2,z:2}});
 const guard=make('guard','vanguard','utility','authority-action');
 const utility=make('cast-utility','mystic','utility','authority-action');
 const release=make('warden-release','warden','warden','authority-action');
 const recovery=make('opening','warden','opening','authority-opening-recovery-window');
 const witnessed=c=>stage.hasAuthenticatedBodyPose(c);
 for(const c of [guard,utility,release,recovery])
  assert.equal(witnessed(c),true,c.kind+' remains witnessed');
 units.get('vanguard').u.action='idle';
 assert.equal(witnessed(guard),false,'obsolete guarding pose cannot authorize sound');
 units.get('mystic').u.actionTick=12;
 assert.equal(witnessed(utility),false,'later cast does not authorize older utility foley');
 units.get('warden').root.visible=false;
 assert.equal(witnessed(release),false,'unloaded Warden is not a release source');
 assert.equal(witnessed(recovery),false,'unloaded Warden is not a recovery source');
 units.get('warden').root.visible=true;
 current={...current,guardianWard:true};
 assert.equal(witnessed(recovery),false,'resealed vulnerability cannot sound');
 current={...current,guardianWard:false,tick:13,
  bossRecovery:{remaining:0}};
 assert.equal(witnessed(recovery),false,'expired recovery cannot sound');
 assert.equal(witnessed({...release,proof:'guessed'}),false);
 assert.equal(witnessed({...guard,kind:'damage',visual:'hit'}),false);
 assert.equal(stage.stats().active,0,'probe cannot create effects');
 assert.equal(stage.stats().reservedInstances,102);
 stage.dispose();
});

test('D04 witnessed dodge and guarded HP block cannot be minted from unrelated public evidence',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const stage=createPhysicalFeedbackVisuals(T,scene);
 const dodge=cue({id:'1:1:11:evade:vanguard:-',kind:'evade',visual:'evade',
  audio:'evade',proof:'authority-event-and-observed-step',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:{x:3,z:2}});
 const block=cue({id:'1:1:11:block:vanguard:-',kind:'block',visual:'block',
  audio:'block',proof:'authority-block-unique-guarded-hp',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:null});
 try{
  for(const [name,bad] of [
   ['HP injury is not a dodge',{...dodge,proof:'observed-hp-drop'}],
   ['unattributed miss is not an observed dodger',{...dodge,proof:'authority-event'}],
   ['wrong action cannot masquerade as dodge',{...dodge,kind:'damage'}],
   ['unnamed dodger cannot receive localized grit',{...dodge,actorId:null}],
   ['missing authoritative verification cannot make dodge',{...dodge,verified:undefined}],
   ['unattributed block event has no localized contact',{...block,proof:'authority-event'}],
   ['HP injury alone cannot prove a guarded block',{...block,proof:'observed-hp-drop'}],
   ['wrong action cannot become a shield spark',{...block,kind:'swing'}],
   ['anonymous defender cannot receive shield art',{...block,actorId:null}],
   ['nonlocal defender cannot receive shield art',{...block,from:null}],
   ['missing verified block cannot receive shield art',{...block,verified:undefined}]
  ]){
   assert.equal(stage.emit(bad),false,name);
  }
  assert.equal(stage.stats().active,0,'all rejected evidence must leave retained pools empty');
  assert.equal(stage.emit(dodge),true,'unique witnessed legal step still shows two grit chips');
  assert.equal(stage.emit(block),true,'unique guarded HP loss still shows restrained shield contact');
  assert.equal(stage.stats().instancesByPool.dust,2);
  assert.equal(stage.stats().instancesByPool.block,1);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});


test('D04 delayed evasion and shield contact cannot resurrect after the witnessed public pose has ended',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const unit=(action,actionTick,x,z,guardTick=null)=>({
  id:'vanguard',kind:'vanguard',faction:'party',hp:25,maxHp:30,
  x,z,action,actionTick,guardTick
 });
 let current={run:1,floor:1,tick:12,units:[unit('move',11,3,2)]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  getCurrentSnapshot:()=>current
 });
 const dodge=cue({id:'1:1:11:evade:vanguard:-',kind:'evade',visual:'evade',
  audio:'evade',proof:'authority-event-and-observed-step',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:{x:3,z:2}});
 const block=cue({id:'1:1:11:block:vanguard:-',kind:'block',visual:'block',
  audio:'block',proof:'authority-block-unique-guarded-hp',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:null});
 try{
  assert.equal(stage.emit(dodge),false,'an old move cannot emit delayed dodge grit');
  current={...current,tick:11,units:[unit('move',11,4,2)]};
  assert.equal(stage.emit(dodge),false,'different destination cannot become the witnessed dodge');
  current={...current,units:[unit('idle',11,3,2)]};
  assert.equal(stage.emit(dodge),false,'the evasion action must still be observed');
  current={...current,units:[unit('move',11,3,2)]};
  assert.equal(stage.emit(dodge),true,'same-tick observed legal step can emit grit');
  current={...current,tick:12,units:[unit('guard',11,2,2,11)]};
  assert.equal(stage.emit(block),false,'expired guarded HP contact cannot float on a later frame');
  current={...current,tick:11,units:[unit('guard',11,2,2,10)]};
  assert.equal(stage.emit(block),false,'guardTick cannot differ from its block witness');
  current={...current,units:[unit('guard',11,2,2,11)]};
  assert.equal(stage.emit(block),true,'the live guarding defender retains its shield cue');
  assert.equal(stage.stats().instancesByPool.dust,2);
  assert.equal(stage.stats().instancesByPool.block,1);
  assert.equal(stage.stats().reservedInstances,102);
 }finally{stage.dispose()}
});


test('D04 unloaded victim can receive HP chips only from its unique current public injury cell',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const injured={id:'revenant',kind:'revenant',faction:'enemy',hp:12,
  x:3,z:2};
 let latest={run:1,floor:1,tick:11,units:[injured]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:()=>null,getCurrentSnapshot:()=>latest
 });
 const proof=cue();
 const check=(next,allowed,why)=>{
  stage.reset();latest=next;
  assert.equal(stage.emit(proof),allowed,why);
 };
 try{
  check(latest,true,'unloaded mesh may use a unique same-tick wounded public cell');
  assert.ok(stage.stats().instancesByPool.hit>=4);
  check({...latest,tick:12},false,'previous tick cannot cause a fresh ground-centre injury');
  check({...latest,run:2},false,'old-run cue cannot attach to the new run');
  check({...latest,floor:2},false,'old-floor cue cannot attach to the new floor');
  check({...latest,units:[]},false,'missing public victim cannot anchor injury art');
  check({...latest,units:[{...injured,x:4}]},false,'moved victim cannot leave chips on its old tile');
  check({...latest,units:[injured,{...injured}]},false,'duplicate victim IDs are ambiguous');
  check({...latest,units:[{...injured,hp:NaN}]},false,'non-finite HP is not a public witness');
  check({...latest,units:new Array(256).fill(null).concat(injured)},false,
   'units beyond the bounded 256-unit public HP observation window are not witnessed');
  assert.equal(stage.stats().active,0);
  check({run:1,floor:1,tick:11},false,'missing unit array fails closed');
 }finally{stage.dispose()}
});

test('D04 visible HP body must match the unique current public injury witness before drawing fragments',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:12};
 const actor={u:{...victim},root:{visible:true,position:{x:-6,y:0,z:-7},rotation:{y:0}}};
 let current={run:1,floor:1,tick:11,units:[victim]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='revenant'?actor:null,
  getCurrentSnapshot:()=>current
 });
 const original=cue();
 const check=(snapshot,body,expected,message)=>{
  stage.reset();current=snapshot;actor.u=body;
  assert.equal(stage.emit(original),expected,message);
  assert.equal(stage.stats().instancesByPool.hit,expected?5:0,
   'no unverified injury fragments may remain in retained GPU pools');
 };
 try{
  check(current,{...victim},true,'same-tick public HP injury is anchored to the visible injured body');
  check({...current,tick:12},{...victim},false,
   'a once-witnessed injury cannot be painted on a later drawable body');
  check({...current,run:2},{...victim},false,
   'a recycled body on another run does not authorize old HP chips');
  check({...current,floor:2},{...victim},false,
   'a recycled body on another floor does not authorize old HP chips');
  check({...current,units:[]},{...victim},false,
   'an old model left at the right coordinates is not a live victim');
  check({...current,units:[victim,{...victim}]},{...victim},false,
   'duplicate current public IDs never choose an arbitrary rendered body');
  check({...current,units:[{...victim,hp:10}]},{...victim},false,
   'body HP must not contradict the public victim injury state');
  check(current,{...victim,hp:10},false,
   'a stale drawn model HP must not masquerade as the injured public unit');
  check(current,{...victim,x:4},false,
   'a drawable root positioned correctly cannot override wrong actor authority coordinates');
  check({...current,units:[{...victim,hp:NaN}]},{...victim},false,
   'non-finite public HP cannot authenticate a body-local contact');
  check({run:1,floor:1,tick:11,units:[victim]},{...victim},true,
   'valid current body remains drawable after invalid snapshots');
 }finally{stage.dispose()}
});


test('D04 removes an orphaned trail draw call immediately when pool priority preempts its only measured blade',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actors=new Map();
 const makeActor=id=>{
  const hand={isBone:true,world:{x:-6.8,y:1.2,z:-7},
   updateWorldMatrix(){},getWorldPosition(out){return out.set(this.world.x,this.world.y,this.world.z)}};
  const actor={u:{id,kind:'vanguard',faction:'party',x:2,z:2,
   hp:30,action:'attack',actionTick:11},
   authored:true,assetRoot:{},rigMeleeBones:[{part:'wrist',bone:hand}],
   root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
  actors.set(id,actor);return actor;
 };
 const stage=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>actors.get(id)});
 const swing=(id,priority)=>cue({id:'1:1:11:swing:'+id+':-',
  kind:'swing',visual:'trail',audio:'whoosh',
  proof:'authority-attempt-not-hit',actorId:id,targetId:null,
  from:{x:2,z:2},to:null,priority,duration:.35});
 try{
  const first=makeActor('blade-0');
  assert.equal(stage.emit(swing('blade-0',1)),true);
  for(let i=1;i<PHYSICAL_FEEDBACK_POOL_LIMITS.trail;i++){
   const id='blade-'+i;makeActor(id);
   assert.equal(stage.emit(swing(id,2)),true);
  }
  assert.equal(stage.stats().activeDrawCalls,0,'no animated wrist means no visible sword trail');
  first.rigMeleeBones[0].bone.world.x+=.15;
  stage.advance(.016,.016);
  assert.equal(stage.hasDrawableCue(swing('blade-0',1).id),true);
  assert.equal(stage.stats().activeDrawCalls,1,'one witnessed sword passage is drawable');
  makeActor('replacement');
  assert.equal(stage.emit(swing('replacement',3)),true,
   'a higher-priority attempted swing replaces the weakest live trail slot');
  assert.equal(stage.hasDrawableCue(swing('blade-0',1).id),false,
   'preempted blade cannot certify an old whoosh');
  assert.equal(stage.hasDrawableCue(swing('replacement',3).id),false,
   'replacement starts hidden until its own observed wrist movement');
  assert.equal(stage.stats().activeDrawCalls,0,
   'a mesh with only hidden replacement trails must not remain a live WebGL draw call');
  stage.advance(.016,.016);
  assert.equal(stage.stats().activeDrawCalls,0,'idle hidden trails stay free of draw submissions');
  const replacement=actors.get('replacement');
  replacement.rigMeleeBones[0].bone.world.x+=.15;
  stage.advance(.016,.016);
  assert.equal(stage.hasDrawableCue(swing('replacement',3).id),true);
  assert.equal(stage.stats().activeDrawCalls,1,'a later independent wrist passage restores drawing');
 }finally{stage.dispose()}
});

test('D04 revoking an interrupted Warden release hides its GPU signal draw and uploads the retirement matrix before the next real frame',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actor={u:{id:'warden',kind:'warden',faction:'enemy',x:2,z:2,
  hp:60,action:'cast',actionTick:11},
  authored:false,root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='warden'?actor:null
 });
 const release=cue({id:'1:1:11:warden-release:warden:-',
  kind:'warden-release',visual:'warden',audio:'warden-release',
  proof:'authority-action',actorId:'warden',targetId:null,
  from:{x:2,z:2},to:null,duration:.3,priority:8});
 const signalMesh=[...scene.children][4]; // fixed retained-pool order: trail, hit, block, dust, signal
 try{
  assert.equal(stage.emit(release),true,'real live cast authorizes one body-local release glyph');
  assert.equal(stage.stats().instancesByPool.signal,1);
  assert.equal(stage.stats().activeDrawCalls,1);
  // A real renderer clears needsUpdate after uploading the visible signal.
  // Subsequent authority interruption must upload the HIDDEN matrix too.
  signalMesh.instanceMatrix.needsUpdate=false;
  actor.u.action='idle';
  stage.advance(.016,.016);
  assert.equal(stage.stats().instancesByPool.signal,0,
   'interrupted authoritative pose retires the old glyph');
  assert.equal(stage.stats().activeDrawCalls,0,
   'no orphaned Warden release draw may remain after interruption');
  assert.equal(signalMesh.visible,false);
  assert.equal(signalMesh.instanceMatrix.needsUpdate,true,
   'GPU must receive the cleared instance matrix before the next submission');
  assert.equal(stage.stats().lastAdvanceDirtyPools,1,
   'retirement is an actual dirty retained-pool update, not just a JS slot removal');
  assert.equal(stage.stats().retiredUnanchoredBodySignals,1);
  assert.equal(stage.hasDrawableCue(release.id),false);
 }finally{stage.dispose()}
});


test('D04 ranger and cultist releases require current unique public action witnesses, not stale drawn actors',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const make=(id,kind,action)=>({id,kind,faction:kind==='ranger'?'party':'enemy',
  x:2,z:2,hp:24,action,actionTick:11});
 const ranger=make('ranger','ranger','attack');
 const cultist=make('cultist','cultist','cast');
 const bodies=new Map([ranger,cultist].map(u=>[u.id,{u:{...u},authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}}]));
 let current={run:1,floor:1,tick:11,units:[{...ranger},{...cultist}]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>bodies.get(id),getCurrentSnapshot:()=>current});
 const release=(id,kind)=>cue({id:'1:1:11:release:'+id+':victim',
  sceneKey:'1:1',tick:11,kind:kind==='ranger'?'ranged-release':'spell-release',
  visual:kind==='ranger'?'launch':'cast',audio:kind==='ranger'?'ranged-release':'spell-release',
  proof:'authority-action',verified:true,actorId:id,targetId:'victim',
  from:{x:2,z:2},to:{x:4,z:2},duration:.28});
 const shot=release('ranger','ranger'),spell=release('cultist','cultist');
 const check=(snapshot,c,isValid,why)=>{
  stage.reset();current=snapshot;
  assert.equal(stage.hasAuthenticatedReleasePose(c),isValid,why+' (audio)');
  assert.equal(stage.emit(c),isValid,why+' (visual)');
  if(!isValid)assert.equal(stage.stats().active,0,'rejected release leaves no flight');
 };
 try{
  check(current,shot,true,'same-tick ranger action and visible performer may launch');
  check(current,spell,true,'same-tick cultist cast and visible performer may launch');
  check({...current,tick:12},shot,false,'a new public tick revokes yesterday\'s cached shooter');
  check({...current,tick:12},spell,false,'a new public tick revokes yesterday\'s cached caster');
  check({...current,units:[{...ranger,action:'idle',actionTick:12},cultist]},
   shot,false,'publicly ended attack revokes cached attack pose');
  check({...current,units:[ranger,{...ranger},cultist]},shot,false,
   'duplicate public source identity must not choose an arbitrary shooter');
  check({...current,units:[{...ranger,x:3},cultist]},shot,false,
   'public moved source cannot use old muzzle position');
  check({...current,units:[{...ranger,hp:0},cultist]},shot,false,
   'dead public shooter cannot launch from a cached living rig');
  check({...current,run:2},spell,false,'old-floor cast cannot borrow a new run');
  check({...current,units:[ranger,{...cultist,actionTick:12}]},
   spell,false,'newer public cast tick revokes old spell');
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});

test('a live authoritative Warden warning keeps all eight threatened-cell glyphs under unrelated signal-pool pressure',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {canonicalPhysicalWarningFootprint}=await load('physical-feedback-plan.js');
 const {T,scene}=three();
 const cells=Array.from({length:8},(_,i)=>({x:2+i,z:3}));
 const warden={id:'warden',kind:'warden',faction:'enemy',x:2,z:2,
  hp:45,action:'cast',actionTick:12};
 let latest={run:1,floor:1,tick:11,units:[warden],
  bossWarning:{warning:true,attackTick:12,turnsUntilImpact:1,
   shape:'RIFT_CROSS',cells}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  getCurrentSnapshot:()=>latest,
  actorById:id=>id==='warden'?{
   u:warden,authored:false,
   root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}
  }:null
 });
 const warning=cue({id:'1:1:11:boss-warning:warden:-',
  kind:'boss-warning',visual:'warning',audio:'boss-warning',
  actorId:'warden',targetId:null,proof:'authority-warning-window',
  priority:5,from:{x:2,z:2},to:null,
  detail:{cells,attackTick:12,shape:'RIFT_CROSS',
   footprintKey:canonicalPhysicalWarningFootprint(cells)}});
 const unrelatedCounter=cue({id:'1:1:11:counter:-:warden',
  kind:'counter',visual:'counter',audio:'counter',
  proof:'authority-counter-and-HP',actorId:null,targetId:'warden',
  priority:7,from:null,to:{x:2,z:2}});
 try{
  assert.equal(stage.emit(warning),true);
  assert.equal(stage.stats().instancesByPool.signal,8);
  assert.equal(stage.stats().activeDrawCalls,1);
  assert.equal(stage.emit(unrelatedCounter),false,
   'unrelated higher-priority body glyph cannot steal a confirmed live hazard cell');
  assert.equal(stage.stats().instancesByPool.signal,8,
   'all eight current public danger-cell markers remain drawable');
  assert.equal(stage.stats().preempted,0,
   'a valid hazard must not be counted as displaced cosmetic art');
  // Actual release closes only the matching spent hazard; it may then
  // consume the reclaimed slot. No reserved instances or new draw calls.
  latest={...latest,tick:12,bossWarning:null};
  const release=cue({id:'1:1:12:warden-release:warden:-',
   tick:12,kind:'warden-release',visual:'warden',audio:'warden-release',
   proof:'authority-action',actorId:'warden',targetId:null,
   priority:7,from:{x:2,z:2},to:null});
  assert.equal(stage.emit(release),true,
   'genuine release still retires its spent warning and gets a body glyph');
  assert.equal(stage.stats().instancesByPool.signal,1);
  assert.ok(stage.stats().retiredWarningMarkers>=8);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});


test('an authority-revoked Warden warning retires its retained GPU glyphs at frame acknowledgement, never a still-live hazard',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {canonicalPhysicalWarningFootprint}=await load('physical-feedback-plan.js');
 const {T,scene}=three();
 const cells=Array.from({length:8},(_,i)=>({x:2+i,z:3}));
 const warden={id:'warden',kind:'warden',faction:'enemy',x:2,z:2,
  hp:45,action:'cast',actionTick:12};
 let current={run:1,floor:1,tick:11,units:[warden],
  bossWarning:{warning:true,attackTick:12,turnsUntilImpact:1,
   shape:'RIFT_CROSS',cells}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  getCurrentSnapshot:()=>current,
  actorById:id=>id==='warden'?{u:warden,authored:false,
   root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}}:null
 });
 const warning=cue({id:'1:1:11:boss-warning:warden:-',
  kind:'boss-warning',visual:'warning',audio:'boss-warning',
  actorId:'warden',targetId:null,proof:'authority-warning-window',
  priority:5,from:{x:2,z:2},to:null,
  detail:{cells,attackTick:12,shape:'RIFT_CROSS',
   footprintKey:canonicalPhysicalWarningFootprint(cells)}});
 const signalMesh=[...scene.children][4];
 try{
  assert.equal(stage.emit(warning),true);
  assert.equal(stage.stats().instancesByPool.signal,8);
  assert.equal(stage.retireStaleCue(warning.id,'authority-revoked-warning'),0,
   'an old audio deadline must not erase eight currently authoritative threat cells');
  assert.equal(stage.stats().instancesByPool.signal,8);
  assert.equal(stage.stats().activeDrawCalls,1);
  // The public hazard was cancelled while the renderer submitted the prior frame.
  // Its already-uploaded glyphs must be cleared immediately at the receipt
  // boundary, rather than waiting for another animation advance.
  signalMesh.instanceMatrix.needsUpdate=false;
  current={...current,tick:12,bossWarning:null};
  assert.equal(stage.retireStaleCue(warning.id,'authority-revoked-warning'),8,
   'all eight now-revoked cells must retire before another WebGL submission');
  assert.equal(stage.hasDrawableCue(warning.id),false);
  assert.equal(stage.stats().instancesByPool.signal,0);
  assert.equal(stage.stats().activeDrawCalls,0);
  assert.equal(signalMesh.visible,false);
  assert.equal(signalMesh.instanceMatrix.needsUpdate,true,
   'retirement must dirty the actual retained GPU instance matrices');
  assert.equal(stage.retireStaleCue(warning.id,'authority-revoked-warning'),0,
   'receipt replay must not retire twice');
  assert.equal(stage.stats().reservedInstances,102);
 }finally{stage.dispose()}
});

test('an authority-revoked Warden warning frame receipt cancels its pending audio and requests immediate GPU cleanup',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const retired=[],sounds=[];
 const visualAdapter={emit(){return true},advance(){},
  retireStaleCue(id,reason){retired.push({id,reason});return 8},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  reset(){},dispose(){}};
 const audioAdapter={enable(){return true},emit(cue){sounds.push(cue);return true},
  flush(){},disable(){},cleanup(){},dispose(){}};
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,visualAdapter,audioAdapter});
 const warden={id:'warden',kind:'warden',faction:'enemy',
  x:2,z:2,hp:45,maxHp:45,action:'cast',actionTick:12};
 const cells=Array.from({length:8},(_,i)=>({x:2+i,z:3}));
 const snapshot=(tick,bossWarning)=>({run:1,floor:1,tick,
  units:[warden],events:[],bossWarning});
 try{
  controller.enableAudioFromGesture();
  controller.acceptSnapshot(snapshot(10,null));
  controller.acceptSnapshot(snapshot(11,{warning:true,attackTick:12,
   turnsUntilImpact:1,shape:'RIFT_CROSS',cells}));
  controller.advance(.016,.016);
  assert.ok(controller.stats().awaitingPresentation>0,
   'a real authority warning must be staged before testing cancellation');
  controller.acceptSnapshot(snapshot(12,null));
  controller.acknowledgePresentedFrame(1,0);
  assert.ok(retired.some(x=>x.id==='1:1:11:boss-warning-final:warden:-'&&
   x.reason==='authority-revoked-warning'),
   'the real post-WebGL receipt must revoke prior warning glyphs without waiting for advance');
  assert.equal(sounds.some(x=>x.visual==='warning'),false,
   'a cancelled threat never earns late warning foley');
 }finally{controller.dispose()}
});

test('D04 unmatched dry releases demand the same unique current actor and live physical source',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const ranger={id:'ranger',kind:'ranger',faction:'party',hp:24,
  x:2,z:2,action:'attack',actionTick:11};
 const cultist={id:'cultist',kind:'cultist',faction:'enemy',hp:20,
  x:3,z:2,action:'cast',actionTick:11};
 const bodies=new Map([ranger,cultist].map(u=>[u.id,{
  u:{...u},authored:false,
  root:{visible:true,position:{x:u.x-9,y:0,z:u.z-9},rotation:{y:0}}
 }]));
 let current={run:1,floor:1,tick:11,units:[{...ranger},{...cultist}]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>bodies.get(id)??null,getCurrentSnapshot:()=>current});
 const dry=(u)=>({
  id:'1:1:11:'+(u.kind==='ranger'?'ranged-unmatched':'cast-unmatched')+':'+u.id+':-',
  sceneKey:'1:1',tick:11,kind:u.kind==='ranger'?'ranged-unmatched':'cast-unmatched',
  visual:'none',audio:u.kind==='ranger'?'draw':'cast-dry',
  verified:false,proof:'authority-action',actorId:u.id,targetId:null,
  from:{x:u.x,z:u.z},to:null
 });
 try{
  for(const u of [ranger,cultist]){
   const action=dry(u);
   assert.equal(stage.hasAuthenticatedSourceOnlyAction(action),true,
    'the visible living actor and exact public action permit an attempt-only dry cue');
   const check=(snapshot,expected,why)=>{
    current=snapshot;
    assert.equal(stage.hasAuthenticatedSourceOnlyAction(action),expected,why);
   };
   const canonical=current;
   check({...canonical,units:[...Array(95).fill(null),{...u}]},true,
    'the planner can observe a sole eligible source at action-window index 95');
   check({...canonical,units:[...Array(96).fill(null),{...u}]},false,
    'a source first found at index 96 cannot mint a dry cast/draw outside the planner action window');
   check({...canonical,units:[...Array(100).fill(null),{...u}]},false,
    'a later-only source inside the 256-unit identity window cannot become an action performer');
   check({...canonical,units:[{...u},...Array(99).fill(null),{...u}]},false,
    'a duplicate ID beyond the action window still disqualifies the earlier source');
   current=canonical;
   check({...current,tick:12},false,'later public tick cannot resurrect old action');
   check({...current,run:2},false,'a new scene cannot authorize the old foley');
   check({...current,units:[...current.units,{...u}]},false,
    'duplicate source ID does not choose an arbitrary performer');
   check({...current,units:current.units.map(x=>x.id===u.id?{...x,x:x.x+1}:x)},
    false,'a moved source cannot sound from the old cell');
   check({...current,units:current.units.map(x=>x.id===u.id?{...x,hp:0}:x)},
    false,'a defeated actor cannot still launch a dry release');
   check({...current,units:current.units.map(x=>x.id===u.id?{...x,action:'idle'}:x)},
    false,'cancelled action may not sound at submission');
   current={run:1,floor:1,tick:11,units:[{...ranger},{...cultist}]};
   const rendered=bodies.get(u.id);
   rendered.u.action='idle';
   assert.equal(stage.hasAuthenticatedSourceOnlyAction(action),false,
    'stale rendered pose cannot borrow the correct public snapshot');
   rendered.u.action=u.action;
   rendered.root.visible=false;
   assert.equal(stage.hasAuthenticatedSourceOnlyAction(action),false,
    'an unloaded body cannot produce source-local sound');
   rendered.root.visible=true;
   assert.equal(stage.hasAuthenticatedSourceOnlyAction({...action,targetId:'revenant'}),false,
    'unconfirmed attempts cannot be laundered into a targeted release');
   assert.equal(stage.hasAuthenticatedSourceOnlyAction({...action,from:{x:7,z:7}}),false,
    'the dry source cannot sound from another tile');
   assert.equal(stage.hasAuthenticatedSourceOnlyAction(action),true);
  }
  assert.equal(stage.stats().active,0,'witnesses must not spawn physical FX');
  assert.equal(stage.stats().activeDrawCalls,0,'a pure audio witness allocates no draw');
 }finally{stage.dispose()}
});

test('D04 strict production HP art refuses a forged sound-only or non-damage injury receipt',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const stage=createPhysicalFeedbackVisuals(T,scene,{requireVerifiedHpReceipt:true});
 const real=cue({detail:{damage:16,maxHp:20,remainingHp:4}});
 try{
  // The public planner is the only authority for injury. An adapter's
  // verified flag, impact recipe or copied cue ID cannot mint visible damage.
  for(const invalid of [
   {...real,detail:null},
   {...real,detail:{...real.detail,damage:0}},
   {...real,detail:{...real.detail,remainingHp:0}},
   {...real,severity:.3},
   {...real,actorId:'vanguard'},
   {...real,from:{x:2,z:2}},
   {...real,id:'1:1:11:swing:vanguard:-'},
   {...real,kind:'swing',audio:'whoosh',visual:'trail',proof:'authority-attempt-not-hit'}
  ]){
   assert.equal(stage.emit(invalid),false,JSON.stringify(invalid));
   assert.equal(stage.stats().instancesByPool.hit,0,
    'invalid evidence must never allocate retained injury fragments');
  }
  assert.equal(stage.emit(real),true,'coherent observed HP loss remains visible');
  assert.ok(stage.stats().instancesByPool.hit>=4);
  stage.reset();
  const fatal=cue({id:'1:1:12:damage-fatal:-:revenant',tick:12,
   kind:'damage-fatal',audio:'fatal-impact',severity:1,
   detail:{damage:20,maxHp:20,remainingHp:0}});
  assert.equal(stage.emit(fatal),true,'genuine death also has injury art');
 }finally{stage.dispose()}
});

test('strict D04 HP fragments require the real same-tick public victim health, not merely a coherent forged delta',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const proof=cue({detail:{damage:16,maxHp:20,remainingHp:4}});
 let current=null,rendered=null;
 const actor={u:null,root:{visible:true,position:{x:-6,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='revenant'?rendered:null,
  getCurrentSnapshot:()=>current,
  requireVerifiedHpReceipt:true
 });
 function check(mode,hp,maxHp,expected,why){
  stage.reset();
  const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp,maxHp};
  current={run:1,floor:1,tick:11,units:[victim]};
  actor.u=victim;
  actor.root.position.x=mode==='interpolated'?-6.84:-6;
  rendered=mode==='unloaded'?null:actor;
  assert.equal(stage.emit(proof),expected,why);
  assert.equal(stage.stats().instancesByPool.hit,expected?5:0,
   'an unproven injury must never allocate a retained fragment');
 }
 try{
  for(const mode of ['drawn','interpolated','unloaded']){
   check(mode,20,20,false,mode+' uninjured public body cannot receive forged HP fragments');
   check(mode,11,20,false,mode+' wrong post-hit HP must fail closed');
   check(mode,4,40,false,mode+' different real max HP cannot borrow the cue severity');
   check(mode,4,20,true,mode+' genuine same-tick HP victim remains drawable');
  }
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('D04 prior-HP actor cache may lag one confirmed public injury without losing body-local shards',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const proof=cue({detail:{damage:16,maxHp:20,remainingHp:4}});
 const victim={id:'revenant',kind:'revenant',faction:'enemy',
  x:3,z:2,hp:4,maxHp:20};
 let current={run:1,floor:1,tick:11,units:[victim]};
 const actor={u:{...victim,hp:20},root:{
  visible:true,position:{x:-6,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='revenant'?actor:null,
  getCurrentSnapshot:()=>current,requireVerifiedHpReceipt:true
 });
 const check=(expected,why)=>{
  stage.reset();
  assert.equal(stage.emit(proof),expected,why);
  assert.equal(stage.stats().instancesByPool.hit,expected?5:0,why);
 };
 try{
  for(const [mode,rootX] of [['drawn',-6],['interpolated',-6.84]]){
   actor.root.position.x=rootX;
   actor.u={...victim,hp:20};
   check(true,mode+' pre-hit body cache is the same current public victim');
   actor.u={...victim,hp:19};
   check(false,mode+' arbitrary contradictory cached HP must not earn injury');
   actor.u={...victim,hp:20,maxHp:21};
   check(false,mode+' cached body with a different health capacity is not the victim');
   // A drawable rig may already report the CURRENT remaining HP but still
   // belong to an obsolete/recycled health model. Matching HP alone cannot
   // make a different-capacity presentation body the proven injury victim.
   for(const wrongMaxHp of [21,0,undefined]){
    actor.u={...victim,maxHp:wrongMaxHp};
    check(false,mode+' current HP with stale/invalid maxHp '+wrongMaxHp+
     ' cannot receive real impact fragments');
   }
   actor.u={...victim};
   check(true,mode+' full current HP and health capacity still permit impact');
   actor.u={...victim,hp:20};
   current={...current,tick:12};
   check(false,mode+' later public tick must not revive stale injury');
   current={...current,tick:11,units:[victim,{...victim}]};
   check(false,mode+' duplicate current public victim IDs cannot choose a body');
   current={...current,units:[victim]};
  }
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('strict D04 injury follows a current public victim when only its rendered cell cache is one step behind',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 // D04 does not infer an attacker or reconstruct a hit from old coordinates:
 // the public victim is unique at its CURRENT tile and its exact HP transition
 // is canonical. A still-visible body root must be physically at that tile.
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:4,maxHp:20};
 let current={run:1,floor:1,tick:11,units:[victim]};
 const actor={u:{...victim,x:2,hp:20},
  root:{visible:true,position:{x:-6.1,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  actorById:id=>id==='revenant'?actor:null,
  getCurrentSnapshot:()=>current,requireVerifiedHpReceipt:true
 });
 const proof=cue({detail:{damage:16,maxHp:20,remainingHp:4}});
 const check=(ok,why)=>{
  stage.reset();
  assert.equal(stage.emit(proof),ok,why);
  assert.equal(stage.stats().instancesByPool.hit,ok?5:0,why);
 };
 try{
  check(true,'one-step cached tile and exact prior HP can follow the already visible current public victim');
  assert.equal(stage.stats().activeDrawCalls,1);
  actor.u={...victim,x:2};
  check(true,'current HP in the same stale one-cell coordinate also has a unique public witness');
  actor.u={...victim,x:1,hp:20};
  check(false,'two stale tiles must not be treated as presentation interpolation');
  actor.u={...victim,x:2,hp:19};
  check(false,'a contradictory historical HP cannot attach fragments');
  actor.u={...victim,x:2,hp:20,maxHp:21};
  check(false,'different health capacity cannot borrow the injury');
  actor.u={...victim,x:2,hp:20};
  actor.root.position.x=-6.99;
  check(false,'a root outside the bounded current-tile neighborhood cannot attach art');
  actor.root.position.x=-6.1;
  current={...current,tick:12};
  check(false,'the same body on a later public tick cannot resurrect old contact');
  current={...current,tick:11,units:[victim,{...victim}]};
  check(false,'duplicate public IDs cannot authorize an ambiguous model');
  current={...current,units:[victim]};
  actor.u={...victim,x:2,hp:20};
  check(true,'a legitimate root may still be admitted after invalid witnesses');
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('D04 real controller enables strict HP VFX admission while isolated visual auditions stay compatible',()=>{
 const fs=require('node:fs');
 const controller=fs.readFileSync(path.join(root,'physical-combat-feedback.js'),'utf8');
 assert.match(controller,/requireVerifiedHpReceipt:true/,
  'the real preview cannot use the permissive isolated VFX test adapter');
});


test('D04 only marks occupied GPU instance matrix rows for upload, not the whole reserved hit pool',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const {T,scene,created}=three();
 const Base=T.InstancedMesh;
 T.InstancedMesh=class extends Base{
  constructor(...args){
   super(...args);
   const ranges=[];
   this.instanceMatrix.addUpdateRange=(start,count)=>ranges.push({start,count});
   this.instanceMatrix.clearUpdateRanges=()=>{ranges.length=0};
   this.instanceMatrix.updateRanges=ranges;
  }
 };
 const stage=createPhysicalFeedbackVisuals(T,scene);
 const hit=created.meshes[1];
 try{
  assert.equal(hit.count,0,'all effect pools start without GPU draw submissions');
  assert.deepEqual(hit.instanceMatrix.updateRanges,[],
   'one-time buffer initialization remains a normal full upload');
  assert.equal(stage.emit(cue()),true);
  const allocated=stage.stats().instancesByPool.hit;
  assert.ok(allocated>=4&&allocated<=6);
  assert.equal(hit.count,allocated);
  assert.deepEqual(hit.instanceMatrix.updateRanges,
   [{start:0,count:allocated*16}],
   'contiguous changed rows must coalesce to ONE bounded pending GPU upload');
  assert.ok(allocated*16*4<PHYSICAL_FEEDBACK_POOL_LIMITS.hit*16*4,
   'five visible fragments must not invalidate all 48 reserved hit matrices');
  // Simulate Three's completed WebGL upload, which clears attribute ranges.
  hit.instanceMatrix.clearUpdateRanges();
  stage.advance(.016,.72);
  assert.equal(hit.count,0,'a real stalled frame must still retire expired injury art');
  assert.deepEqual(hit.instanceMatrix.updateRanges,
   [{start:0,count:allocated*16}],
   'retirement also coalesces the hidden matrix rows into one GPU upload');
  assert.equal(stage.stats().activeDrawCalls,0);
  // When a pool stays invisible, Three's renderer has NO occasion to clear
  // its pending update ranges. Hundreds of scene resets must not accumulate
  // unbounded per-row range objects before the next visible frame.
  for(let i=0;i<160;i++){
   assert.equal(stage.emit(cue({id:'1:1:'+i+':damage:-:revenant',tick:i})),true);
   stage.reset();
  }
  assert.ok(hit.instanceMatrix.updateRanges.length<=1,
   'a dormant pooled mesh must retain at most one pending upload range');
  assert.ok(hit.instanceMatrix.updateRanges[0].count<=
   PHYSICAL_FEEDBACK_POOL_LIMITS.hit*16,
   'its pending upload must never exceed reserved instance capacity');
  hit.instanceMatrix.clearUpdateRanges();
  assert.equal(stage.emit(cue({id:'1:1:900:damage:-:revenant',tick:900})),true);
  assert.deepEqual(hit.instanceMatrix.updateRanges,
   [{start:0,count:allocated*16}],
   'the next genuinely new renderer batch begins with a fresh narrow range');
  stage.reset();
  assert.equal(hit.count,0);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});


test('D04 nonadjacent retained GPU matrix dirt is kept sparse and strictly bounded under hidden-pool churn',async()=>{
 const {planD04MatrixUploadRanges,MAX_D04_PENDING_MATRIX_UPLOAD_RANGES,
  PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const cap=PHYSICAL_FEEDBACK_POOL_LIMITS.hit;
 assert.equal(cap,48,'the known hit pool reserves 48 instances');
 let pending=planD04MatrixUploadRanges([],0,cap);
 pending=planD04MatrixUploadRanges(pending,cap-1,cap);
 assert.deepEqual(pending,[{start:0,count:16},{start:(cap-1)*16,count:16}],
  'two distant changed matrices must not force uploading all reserved hit slots');
 pending=planD04MatrixUploadRanges(pending,1,cap);
 assert.deepEqual(pending,[{start:0,count:32},{start:(cap-1)*16,count:16}],
  'adjacent dirty matrices coalesce without bridging distant untouched rows');
 for(const index of [12,24,36,6,18,30,42]){
  pending=planD04MatrixUploadRanges(pending,index,cap);
  assert.ok(pending.length<=MAX_D04_PENDING_MATRIX_UPLOAD_RANGES,
   'even a hidden mesh with scattered effects cannot grow update-record memory without bound');
  assert.ok(pending.every(r=>Number.isSafeInteger(r.start)&&r.start%16===0&&
   Number.isSafeInteger(r.count)&&r.count>0&&r.count%16===0&&r.start+r.count<=cap*16),
   'every WebGL float update must cover full, in-bounds matrix rows');
  assert.ok(pending.every((r,i)=>i===0||pending[i-1].start+pending[i-1].count<r.start),
   'pending WebGL update ranges must be sorted, nonoverlapping and nonadjacent');
 }
 assert.ok(pending.reduce((n,r)=>n+r.count,0)<cap*16,
  'scattered edits must still save a meaningful part of the 48-instance buffer');
 let dormant=[];
 for(let i=0;i<500;i++)dormant=planD04MatrixUploadRanges(dormant,i%2?cap-1:0,cap);
 assert.deepEqual(dormant,[{start:0,count:16},{start:(cap-1)*16,count:16}],
  'five hundred invisible-pool rewrites must neither accumulate ranges nor widen to full storage');
 assert.deepEqual(planD04MatrixUploadRanges([{start:-1,count:16}],2,cap),
  [{start:0,count:cap*16}],
  'corrupt/unaligned pending renderer ranges must use the existing conservative full-buffer fallback');
 assert.deepEqual(planD04MatrixUploadRanges([],cap,cap),
  [{start:0,count:cap*16}],
  'an out-of-range matrix index must not produce an out-of-bounds GPU upload');
});


test('D04 actual retained hit-mesh retirement preserves separated GPU upload rows after busy combat',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene,created}=three();
 const Original=T.InstancedMesh;
 T.InstancedMesh=class extends Original{
  constructor(...args){
   super(...args);
   const ranges=[];
   this.instanceMatrix.updateRanges=ranges;
   this.instanceMatrix.addUpdateRange=(start,count)=>ranges.push({start,count});
   this.instanceMatrix.clearUpdateRanges=()=>{ranges.length=0};
  }
 };
 const stage=createPhysicalFeedbackVisuals(T,scene);
 const hit=created.meshes[1],ids=[];
 try{
  for(let i=0;i<9;i++){
   const id='1:1:'+(11+i)+':damage:-:revenant';
   ids.push(id);
   assert.equal(stage.emit(cue({id,tick:11+i})),true);
  }
  assert.equal(stage.stats().instancesByPool.hit,45,
   'nine five-fragment genuine-cue-shaped batches occupy distinct retained hit rows');
  hit.instanceMatrix.clearUpdateRanges(); // Actual Three.js completes one upload.
  assert.equal(stage.retireStaleCue(ids[0],'stale-frame'),5);
  assert.equal(stage.retireStaleCue(ids[8],'stale-frame'),5);
  assert.deepEqual(hit.instanceMatrix.updateRanges,
   [{start:0,count:80},{start:640,count:80}],
   'retiring distant occupied fragments must NOT dirty the 35 untouched middle matrix rows');
  assert.equal(hit.count,40,'retirement must still suppress unused GPU instance submissions');
  assert.equal(hit.instanceMatrix.needsUpdate,true);
  stage.reset();
  assert.equal(hit.count,0);
  assert.equal(stage.stats().activeDrawCalls,0);
 }finally{stage.dispose()}
});

test('strict D04 earned Warden counter glyph requires current public HP and authentic recovery receipt',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const damage=28,maxHp=90,remainingHp=42;
 const victim={id:'warden',kind:'warden',faction:'enemy',x:4,z:4,
  hp:remainingHp,maxHp,action:'hurt',actionTick:11};
 let current={run:1,floor:1,tick:11,units:[victim]};
 let rendered=null;
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>current,
  actorById:id=>id==='warden'?rendered:null
 });
 const proven=cue({id:'1:1:11:counter:-:warden',kind:'counter',
  visual:'counter',audio:'counter',proof:'authority-counter-and-HP',
  verified:true,actorId:null,targetId:'warden',from:null,to:{x:4,z:4},
  severity:damage/maxHp,priority:7,
  detail:{damage,maxHp,remainingHp,recoveryUntilTick:11}});
 function check(candidate,expected,message){
  stage.reset();
  assert.equal(stage.emit(candidate),expected,message);
  assert.equal(stage.stats().instancesByPool.signal,expected?1:0,
   'unverified recovery must not reserve a Warden body glyph');
 }
 try{
  check(proven,true,'genuine unique same-frame Warden HP loss remains a visual counter');
  for(const changed of [
   {...proven,detail:null},
   {...proven,detail:{...proven.detail,damage:0}},
   {...proven,detail:{...proven.detail,recoveryUntilTick:10}},
   {...proven,detail:{...proven.detail,remainingHp:41}},
   {...proven,actorId:'vanguard'},
   {...proven,from:{x:3,z:4}},
   {...proven,severity:.8},
   {...proven,id:'1:1:11:counter:vanguard:warden'}
  ])check(changed,false,'a copied success ID cannot mint a forged counter glyph');
  for(const altered of [
   {...victim,hp:70},
   {...victim,maxHp:100},
   {...victim,x:5},
   {...victim,kind:'revenant'},
   {...victim,faction:'party'}
  ]){
   current={...current,units:[altered]};
   check(proven,false,'counter art must attach only to the actual public Warden casualty');
  }
  current={...current,units:[victim,{...victim}]};
  check(proven,false,'duplicate Warden identity cannot choose an arbitrary casualty');
  current={...current,units:[victim],tick:12};
  check(proven,false,'one-tick-old counter cannot be replayed on a later body');
  current={...current,tick:11,run:2};
  check(proven,false,'another run must not inherit physical recovery art');
  current={...current,run:1};
  check(proven,true,'the current authoritative Warden still earns counter emphasis');
  rendered={u:{...victim,hp:41},root:{
   visible:true,position:{x:-5,y:0,z:-5},rotation:{y:0}}};
  check(proven,false,'a contradictory drawn-body cache cannot receive verified counter art');
  rendered.u={...victim,hp:70};
  check(proven,true,'the exact pre-injury HP cache may lag one canonical 28-HP loss');
  assert.ok(stage.stats().activeDrawCalls<=7);
  assert.equal(stage.stats().reservedInstances,102);
 }finally{stage.dispose()}
});


test('D04 full 256-unit integrity window rejects off-screen duplicate Warden, release and defensive owners',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const at={x:2,z:2},destination={x:4,z:2};
 const warden={id:'warden',kind:'warden',faction:'enemy',x:4,z:4,
  hp:42,maxHp:90,action:'hurt',actionTick:11};
 const ranger={id:'ranger',kind:'ranger',faction:'party',x:2,z:2,
  hp:20,maxHp:20,action:'attack',actionTick:11};
 const guard={id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp:20,maxHp:20,action:'guard',actionTick:11,guardTick:11};
 const evader={...guard,x:3,z:2,action:'move'};
 const candidates=[
  {label:'earned Warden HP counter',unit:warden,requested:cue({
   id:'1:1:11:counter:-:warden',kind:'counter',visual:'counter',audio:'counter',
   proof:'authority-counter-and-HP',verified:true,actorId:null,targetId:'warden',
   from:null,to:{x:4,z:4},severity:28/90,priority:7,
   detail:{damage:28,maxHp:90,remainingHp:42,recoveryUntilTick:11}})},
  {label:'ranger arrow muzzle',unit:ranger,requested:cue({
   id:'1:1:11:ranged-release:ranger:enemy',kind:'ranged-release',
   visual:'launch',audio:'ranged-release',proof:'authority-action',
   actorId:'ranger',targetId:'enemy',from:at,to:destination})},
  {label:'body-local shield block',unit:guard,requested:cue({
   id:'1:1:11:block:vanguard:-',kind:'block',visual:'block',audio:'block',
   proof:'authority-block-unique-guarded-hp',actorId:'vanguard',
   targetId:null,from:at,to:null})},
  {label:'actual one-cell sidestep',unit:evader,requested:cue({
   id:'1:1:11:evade:vanguard:-',kind:'evade',visual:'evade',audio:'evade',
   proof:'authority-event-and-observed-step',actorId:'vanguard',
   targetId:null,from:at,to:{x:3,z:2}})}
 ];
 let snapshot={run:1,floor:1,tick:11,units:[warden]};
 const drawnRanger={u:ranger,authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>snapshot,
  actorById:id=>id==='ranger'?drawnRanger:null
 });
 try{
  for(const {label,unit,requested} of candidates){
   stage.reset();snapshot={run:1,floor:1,tick:11,units:[unit]};
   assert.equal(stage.emit(requested),true,label+' remains drawable with a unique real source');
   stage.reset();
   // Planner source-action scanning stops at 96, but planner's duplicate-ID
   // integrity scan covers 256. A repeated ID at index 100 must NOT become
   // an invisible second owner for the preview's retained GPU art.
   snapshot={...snapshot,units:[unit,...Array(99).fill(null),{...unit}]};
   assert.equal(stage.emit(requested),false,
    label+' must reject a duplicate at index 100 before any retained VFX allocation');
   assert.equal(stage.stats().active,0,label+' has no stranded pooled effect');
   stage.reset();
   snapshot={...snapshot,units:[...Array(100).fill(null),unit]};
   assert.equal(stage.emit(requested),false,
    label+' cannot be discovered exclusively beyond the first 96 action units');
   assert.equal(stage.stats().active,0,
    label+' must not widen the planner action-discovery boundary');
   assert.ok(stage.stats().activeDrawCalls<=7);
  }
  assert.equal(stage.stats().reservedInstances,102);
 }finally{stage.dispose()}
});

test('D04 visual receipts render each HP-loss event once across expiry but reset cleanly',async()=>{
 const {createPhysicalFeedbackVisuals,MAX_D04_VISUAL_CUE_HISTORY}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const stage=createPhysicalFeedbackVisuals(T,scene);
 const wound=cue();
 try{
  assert.equal(stage.emit(wound),true,'first real HP-loss cue draws bounded injury fragments');
  const initial=stage.stats();
  assert.ok(initial.instancesByPool.hit>=4);
  assert.equal(stage.emit({...wound}),false,
   'redelivering the same receipt must not double fracture shards on the same frame');
  assert.equal(stage.stats().spawned,initial.spawned,
   'duplicate delivery must not allocate or preempt additional GPU instances');
  for(let i=0;i<20;i++)stage.advance(.05);
  assert.equal(stage.stats().active,0,'physical fragments expire normally');
  assert.equal(stage.emit({...wound}),false,
   'expiry is not permission to replay an old impact from the same run');
  assert.equal(stage.stats().active,0,'expired duplicate must not resurrect injury');
  assert.equal(stage.stats().suppressedDuplicateCues,2);
  assert.ok(stage.stats().rememberedVisualCueIds<=MAX_D04_VISUAL_CUE_HISTORY,
   'independent visual dedup history must remain strictly bounded');
  stage.reset();
  assert.equal(stage.stats().rememberedVisualCueIds,0,
   'a new scene/run cannot retain the old admission registry');
  assert.equal(stage.emit(wound),true,
   'a clean scene reset permits a fresh independent replay fixture');
 }finally{stage.dispose()}
});


test('D04 strict visual and original sound reject noncanonical projectile identities before GPU allocation',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {isCanonicalVerifiedCombatFoleyCue}=await load('original-combat-foley.js');
 const {T,scene}=three();
 const ranger={id:'ranger',kind:'ranger',faction:'party',x:2,z:2,
  hp:20,maxHp:20,action:'attack',actionTick:11};
 const drawn={u:ranger,authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const current={run:1,floor:1,tick:11,units:[ranger]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>current,
  actorById:id=>id==='ranger'?drawn:null
 });
 const release=cue({id:'1:1:11:ranged-release:ranger:revenant',
  kind:'ranged-release',visual:'launch',audio:'ranged-release',
  proof:'authority-action',verified:true,
  actorId:'ranger',targetId:'revenant',
  from:{x:2,z:2},to:{x:4,z:2}});
 try{
  assert.equal(isCanonicalVerifiedCombatFoleyCue(release),true,
   'genuine public action should satisfy the original foley identity contract');
  for(const forged of [
   {...release,id:'unbound-release-event'},
   {...release,id:'1:1:11:ranged-release:ranger:another-target'},
   {...release,id:'1:1:11:ranged-release:-:revenant'},
   {...release,id:'1:1:11:spell-release:ranger:revenant'},
   {...release,targetId:'other-target'}
  ]){
   assert.equal(isCanonicalVerifiedCombatFoleyCue(forged),false,
    'original sound already rejects a claimed action whose ID disagrees with its witness');
   assert.equal(stage.emit(forged),false,
    'strict physical VFX must not draw an arrow that original sound would reject');
   assert.equal(stage.stats().active,0,'forged release never reserves retained GPU art');
  }
  assert.equal(stage.emit(release),true,'authentic arrow launch remains visible');
  const initial=stage.stats().spawned;
  assert.equal(stage.emit({...release}),false,'one real release remains one-shot');
  assert.equal(stage.stats().spawned,initial,'duplicate does not allocate again');
  assert.ok(stage.stats().reservedInstances<=104);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});


test('D04 strict spell caster identity rejects silent false orb launches while auditions remain flexible',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {isCanonicalVerifiedCombatFoleyCue}=await load('original-combat-foley.js');
 const {T,scene}=three();
 const mystic={id:'mystic',kind:'mystic',faction:'party',x:2,z:2,
  hp:20,maxHp:20,action:'cast',actionTick:11};
 const drawn={u:mystic,authored:false,
  root:{visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const current={run:1,floor:1,tick:11,units:[mystic]};
 const options={actorById:id=>id==='mystic'?drawn:null,
  getCurrentSnapshot:()=>current,requireVerifiedHpReceipt:true};
 const spell=cue({id:'1:1:11:spell-release:mystic:revenant',
  kind:'spell-release',visual:'cast',audio:'spell-release',
  proof:'authority-action',verified:true,actorId:'mystic',
  targetId:'revenant',from:{x:2,z:2},to:{x:4,z:2}});
 const strict=createPhysicalFeedbackVisuals(T,scene,options);
 try{
  assert.equal(isCanonicalVerifiedCombatFoleyCue(spell),true);
  assert.equal(strict.emit({...spell,id:'audition-spell-11'}),false,
   'a physically plausible cast with a noncanonical sound ID must not draw');
  assert.equal(strict.emit({...spell,targetId:'different-target'}),false,
   'altered aim cannot inherit a genuine sound-verified event identity');
  assert.equal(strict.stats().active,0);
  assert.equal(strict.emit(spell),true,'genuine cast remains a bounded spell release');
  assert.equal(strict.stats().instancesByPool.spell,1);
 }finally{strict.dispose()}
 const audition=createPhysicalFeedbackVisuals(T,scene,{
  actorById:options.actorById
 });
 try{
  assert.equal(audition.emit({...spell,id:'audition-spell-11'}),true,
   'standalone visual mesh auditions do not require a production canonical event ID');
  assert.equal(audition.stats().instancesByPool.spell,1);
 }finally{audition.dispose()}
});


test('strict D04 earned counter follows a uniquely proved Warden victim across a one-cell rendered cache lag',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const Pose=T.Object3D;
 T.Object3D=class extends Pose{
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 };
 const victim={id:'warden',kind:'warden',faction:'enemy',x:4,z:4,
  hp:42,maxHp:90,action:'hurt',actionTick:11};
 let snapshot={run:1,floor:1,tick:11,units:[victim]};
 // Live body/root has already interpolated to the actual casualty tile, while
 // actor.u still stores the previous one-cell coordinate and pre-injury HP.
 const drawn={u:{...victim,x:3,z:4,hp:70},
  root:{visible:true,position:{x:-4.82,y:0,z:-5.12},rotation:{y:0}}};
 const counter=cue({id:'1:1:11:counter:-:warden',kind:'counter',
  visual:'counter',audio:'counter',proof:'authority-counter-and-HP',
  verified:true,actorId:null,targetId:'warden',from:null,to:{x:4,z:4},
  severity:28/90,priority:7,
  detail:{damage:28,maxHp:90,remainingHp:42,recoveryUntilTick:11}});
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>snapshot,
  actorById:id=>id==='warden'?drawn:null
 });
 function check(expected,message){
  stage.reset();
  assert.equal(stage.emit(counter),expected,message);
  assert.equal(stage.stats().instancesByPool.signal,expected?1:0);
  if(expected){
   const ring=[...scene.children][4]; // retained trail/hit/block/dust/signal order
   assert.equal(ring.matrices[0].x,drawn.root.position.x,
    'counter reaction must originate on the actual drawn Warden, not grid centre');
   assert.equal(ring.matrices[0].z,drawn.root.position.z);
  }
 }
 try{
  check(true,'earned Warden counter follows the current rendered root despite one-cell cache lag');
  drawn.u={...drawn.u,hp:42};
  check(true,'an exact current HP cache with one-step position lag remains the same victim');
  drawn.u={...drawn.u,maxHp:91};
  check(false,'different health capacity must never acquire counter success glyph');
  drawn.u={...victim,x:2,z:4};
  check(false,'two-cell cached coordinates cannot impersonate the current victim');
  drawn.u={...victim,x:3,z:4,hp:70};
  drawn.root.position.x=-5.8;
  check(false,'distant drawn root cannot borrow the public Warden tile');
  drawn.root.position.x=-4.82;
  snapshot={...snapshot,units:[victim,{...victim}]};
  check(false,'duplicate public victims invalidate claimed counter ownership');
  snapshot={...snapshot,units:[victim],tick:12};
  check(false,'stale authority ticks never replay a confirmed counter');
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});


test('strict D04 visual cue history cannot resurrect a stale real HP wound after its bounded cache rotates',async()=>{
 const {createPhysicalFeedbackVisuals,MAX_D04_VISUAL_CUE_HISTORY}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,
  hp:19,maxHp:20,action:'hurt',actionTick:11};
 let snapshot={run:1,floor:1,tick:11,units:[victim]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  getCurrentSnapshot:()=>snapshot,requireVerifiedHpReceipt:true
 });
 const wound=tick=>cue({id:`1:1:${tick}:damage:-:revenant`,tick,
  severity:1/20,detail:{damage:1,maxHp:20,remainingHp:19}});
 try{
  // Force FIFO one-shot identity rotation without exceeding retained GPU
  // instances. These are individual canonical victim-only receipts; no
  // attacker, simulated contact, or fabricated AudioContext is involved.
  for(let tick=11;tick<11+MAX_D04_VISUAL_CUE_HISTORY+2;tick++){
   snapshot={...snapshot,tick};
   assert.equal(stage.emit(wound(tick)),true,
    'a new unique current public HP-loss receipt remains eligible');
   stage.advance(.7,.7);
  }
  assert.equal(stage.stats().active,0);
  assert.ok(stage.stats().rememberedVisualCueIds<=MAX_D04_VISUAL_CUE_HISTORY);
  const newest=11+MAX_D04_VISUAL_CUE_HISTORY+1;
  // A duplicate too old for the public five-tick planner must not be
  // re-admitted simply because its bounded receipt key was FIFO-evicted.
  snapshot={...snapshot,tick:11};
  assert.equal(stage.emit(wound(11)),false,
   'expired, evicted injury cannot create a second physical hit');
  assert.equal(stage.stats().active,0);
  // Out-of-order but NEW events inside the five-tick admission horizon
  // remain eligible; only ancient events are refused.
  snapshot={...snapshot,tick:newest-3};
  assert.equal(stage.emit(wound(newest-3)),false,
   'a previously admitted recent wound is still one-shot');
  stage.reset();
  snapshot={...snapshot,tick:11};
  assert.equal(stage.emit(wound(11)),true,
   'explicit scene reset clears the timeline epoch and admitted IDs');
  assert.ok(stage.stats().reservedInstances<=104);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('strict D04 guarded block and observed dodge use canonical original-foley identity before retained GPU art',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {isCanonicalVerifiedCombatFoleyCue}=await load('original-combat-foley.js');
 const {T,scene}=three();
 const guard={id:'vanguard',kind:'vanguard',faction:'party',
  x:2,z:2,hp:20,maxHp:30,action:'guard',actionTick:11,guardTick:11};
 const evader={...guard,x:3,z:2,action:'move',guardTick:null};
 let snapshot={run:1,floor:1,tick:11,units:[guard]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>snapshot
 });
 const block=cue({id:'1:1:11:block:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'block',visual:'block',audio:'block',
  proof:'authority-block-unique-guarded-hp',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:null});
 const dodge=cue({id:'1:1:11:evade:vanguard:-',sceneKey:'1:1',tick:11,
  kind:'evade',visual:'evade',audio:'evade',
  proof:'authority-event-and-observed-step',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:{x:3,z:2}});
 const reject=(effect,message)=>{
  assert.equal(isCanonicalVerifiedCombatFoleyCue(effect),false,
   message+' must be rejected by original sound');
  assert.equal(stage.emit(effect),false,
   message+' must not create a silent fake visual');
  assert.equal(stage.stats().active,0,
   message+' must not allocate a GPU slot');
 };
 try{
  assert.equal(isCanonicalVerifiedCombatFoleyCue(block),true);
  reject({...block,id:'1:1:11:block:impostor:-'},
   'renamed defender in guarded-block receipt');
  reject({...block,targetId:'enemy'},
   'block incorrectly claims an enemy target');
  reject({...block,audio:'impact'},
   'block visual wearing a confirmed-impact sound label');
  assert.equal(stage.emit(block),true,
   'canonical and currently witnessed defender may display guarded contact');
  assert.equal(stage.stats().instancesByPool.block,1);
  stage.reset();
  snapshot={...snapshot,units:[evader]};
  assert.equal(isCanonicalVerifiedCombatFoleyCue(dodge),true);
  reject({...dodge,id:'1:1:11:evade:impostor:-'},
   'renamed evader in one-cell-step receipt');
  reject({...dodge,targetId:'enemy'},
   'dodge incorrectly attributes a pursuer');
  reject({...dodge,audio:'impact'},
   'dodge visual wearing a successful-hit sound label');
  assert.equal(stage.emit(dodge),true,
   'canonical and currently witnessed one-cell evader may display grit');
  assert.equal(stage.stats().instancesByPool.dust,2);
  assert.ok(stage.stats().reservedInstances<=104);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('strict D04 Warden release requires a unique live public caster and canonical foley identity',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {isCanonicalVerifiedCombatFoleyCue}=await load('original-combat-foley.js');
 const {T,scene}=three();
 const warden={id:'warden',kind:'warden',faction:'enemy',
  x:2,z:2,hp:60,maxHp:100,action:'cast',actionTick:11};
 let current={run:1,floor:1,tick:11,units:[warden]};
 const actor={u:{...warden},authored:false,root:{
  visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>current,
  actorById:id=>id==='warden'?actor:null
 });
 const release=cue({id:'1:1:11:warden-release:warden:-',
  kind:'warden-release',visual:'warden',audio:'warden-release',
  proof:'authority-action',actorId:'warden',targetId:null,
  from:{x:2,z:2},to:null,duration:.38,priority:7});
 const check=(candidate,expected,message)=>{
  stage.reset();
  assert.equal(stage.emit(candidate),expected,message);
  assert.equal(stage.hasAuthenticatedBodyPose(candidate),expected,
   message+' must agree with the original sound source witness');
  assert.equal(stage.stats().instancesByPool.signal,expected?1:0,
   message+' must never allocate disconnected boss art');
 };
 try{
  assert.equal(isCanonicalVerifiedCombatFoleyCue(release),true);
  check(release,true,'one genuine current public cast owns its own release');
  for(const candidate of [
   {...release,id:'1:1:11:warden-release:impostor:-'},
   {...release,targetId:'vanguard'},
   {...release,audio:'impact'}
  ]){
   assert.equal(isCanonicalVerifiedCombatFoleyCue(candidate),false);
   check(candidate,false,'noncanonical release cannot draw while original foley rejects it');
  }
  current={...current,units:[{...warden,action:'idle'}]};
  check(release,false,'stale rendered cast cannot override an idle current public Warden');
  current={...current,units:[{...warden,hp:0}]};
  check(release,false,'a dead authoritative Warden cannot release despite live-looking rig');
  current={...current,units:[{...warden,x:3}]};
  check(release,false,'a different current public cell cannot emit from yesterday hand');
  current={...current,tick:12,units:[warden]};
  check(release,false,'an earlier tick cannot authorize a later frame release');
  current={...current,tick:11,run:2};
  check(release,false,'another run must not inherit a stale release');
  current={...current,run:1,units:[warden,{...warden}]};
  check(release,false,'duplicate identity cannot choose a boss source');
  current={...current,units:[...Array.from({length:96},(_,i)=>
   ({id:'decoy-'+i,kind:'revenant'})),warden]};
  check(release,false,'a late-only boss outside 96 action owners cannot mint release');
  current={run:1,floor:1,tick:11,units:[warden]};
  check(release,true,'legitimate release still renders after invalid witnesses');
  // Interrupt in authority without mutating the still-casting presentation rig:
  // the existing ring must retire before the next WebGL submission.
  current={...current,units:[{...warden,action:'idle'}]};
  stage.advance(.016,.016);
  assert.equal(stage.stats().instancesByPool.signal,0,
   'obsolete Warden glyph retires when authority ends its cast');
  assert.equal(stage.stats().activeDrawCalls,0,
   'no stale boss release draw call survives the next real frame');
  assert.equal(stage.hasDrawableCue(release.id),false);
  assert.ok(stage.stats().reservedInstances<=104);
  assert.ok(stage.stats().activeDrawCalls<=7);
 }finally{stage.dispose()}
});

test('strict D04 refuses a premature Warden release without erasing eight live threat cells',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {canonicalPhysicalWarningFootprint}=await load('physical-feedback-plan.js');
 const {isCanonicalVerifiedCombatFoleyCue}=await load('original-combat-foley.js');
 const {T,scene}=three();
 const cells=Array.from({length:8},(_,i)=>({x:2+i,z:3}));
 const warden={id:'warden',kind:'warden',faction:'enemy',
  x:2,z:2,hp:60,maxHp:100,action:'cast',actionTick:12};
 const current={run:1,floor:1,tick:11,units:[warden],
  bossWarning:{warning:true,attackTick:12,turnsUntilImpact:1,shape:'RIFT_CROSS',cells}};
 // The drawn actor is already at next tick's cast while PUBLIC authority
 // still proves danger at tick 11. Presentation must never retire it early.
 const actor={u:{...warden},authored:false,root:{
  visible:true,position:{x:-7,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>current,
  actorById:id=>id==='warden'?actor:null
 });
 const warning=cue({id:'1:1:11:boss-warning:warden:-',
  kind:'boss-warning',visual:'warning',audio:'boss-warning',
  actorId:'warden',targetId:null,proof:'authority-warning-window',
  priority:5,from:{x:2,z:2},to:null,
  detail:{cells,attackTick:12,shape:'RIFT_CROSS',
   footprintKey:canonicalPhysicalWarningFootprint(cells)}});
 const premature=cue({id:'1:1:12:warden-release:warden:-',tick:12,
  kind:'warden-release',visual:'warden',audio:'warden-release',
  actorId:'warden',targetId:null,proof:'authority-action',
  from:{x:2,z:2},to:null,priority:7});
 try{
  assert.equal(stage.emit(warning),true,'public current threat proves eight cells');
  assert.equal(stage.stats().instancesByPool.signal,8);
  assert.equal(isCanonicalVerifiedCombatFoleyCue(premature),true,
   'a canonical event string alone must not prove a later public action');
  assert.equal(stage.emit(premature),false,
   'future rendered cast cannot launch before authority reaches that tick');
  assert.equal(stage.stats().retiredWarningMarkers,0,
   'rejected release cannot erase the still-authoritative warning');
  assert.equal(stage.stats().instancesByPool.signal,8,
   'all eight live danger markers remain visible');
  assert.equal(stage.hasAuthenticatedBodyPose(premature),false,
   'uncorroborated release cannot qualify for sound-only original foley');
  assert.equal(stage.stats().activeDrawCalls,1);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});


test('strict D04 guard and healing rings require the current unique public action, not yesterday rendered body',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const guardUnit={id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp:20,maxHp:20,action:'guard',actionTick:11};
 const healer={id:'mystic',kind:'mystic',faction:'party',x:3,z:2,
  hp:18,maxHp:18,action:'cast',actionTick:11};
 const rendered={
  vanguard:{u:guardUnit,authored:false,root:{visible:true,
   position:{x:-7,y:0,z:-7},rotation:{y:0}}},
  mystic:{u:healer,authored:false,root:{visible:true,
   position:{x:-6,y:0,z:-7},rotation:{y:0}}}
 };
 let current={run:1,floor:1,tick:11,units:[guardUnit,healer]};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,getCurrentSnapshot:()=>current,
  actorById:id=>rendered[id]??null
 });
 const guard=cue({id:'1:1:11:guard:vanguard:-',kind:'guard',
  visual:'utility',audio:'guard',proof:'authority-action',verified:true,
  actorId:'vanguard',targetId:null,from:{x:2,z:2},to:null});
 const healing=cue({id:'1:1:11:cast-utility:mystic:-',kind:'cast-utility',
  visual:'utility',audio:'utility',proof:'authority-action',verified:true,
  actorId:'mystic',targetId:null,from:{x:3,z:2},to:null});
 try{
  current={...current,units:[{...guardUnit,action:'idle'},healer]};
  assert.equal(stage.emit(guard),false,
   'stale visible guard pose must not create an authority-revoked ring');
  assert.equal(stage.hasAuthenticatedBodyPose(guard),false,
   'sound-only guard must not use a stale visual body as public action proof');
  current={...current,units:[guardUnit,{...healer,action:'idle'}]};
  assert.equal(stage.emit(healing),false,
   'old skinned healing cast cannot release a glyph after authority cancels it');
  assert.equal(stage.hasAuthenticatedBodyPose(healing),false);
  current={...current,tick:12,units:[guardUnit,healer]};
  assert.equal(stage.emit(healing),false,
   'a later public tick cannot certify the original cast action');
  current={...current,tick:11,units:[guardUnit,healer,{...healer}]};
  assert.equal(stage.emit(healing),false,
   'a duplicated public caster must not choose an arbitrary source body');
  current={...current,units:[
   ...Array.from({length:96},(_,i)=>({id:'decoy-'+i,kind:'revenant'})),
   healer]};
  assert.equal(stage.emit(healing),false,
   'late-only performer after 96 action candidates cannot create a utility ring');
  assert.equal(stage.stats().instancesByPool.signal,0);
  current={run:1,floor:1,tick:11,units:[guardUnit,healer]};
  assert.equal(stage.emit(guard),true,'unique current guard remains drawable');
  assert.equal(stage.emit(healing),true,'unique current utility cast remains drawable');
  assert.equal(stage.stats().instancesByPool.signal,2);
  current={...current,units:[guardUnit,{...healer,action:'idle'}]};
  stage.advance(.016,.016);
  assert.equal(stage.stats().instancesByPool.signal,1,
   'cancelled healing ring must retire before the next WebGL submission');
  assert.equal(stage.hasAuthenticatedBodyPose(healing),false);
  current={...current,tick:12};
  stage.advance(.016,.016);
  assert.equal(stage.stats().instancesByPool.signal,0,
   'stale guard ring also retires after authority advances');
  assert.equal(stage.stats().activeDrawCalls,0);
  assert.ok(stage.stats().reservedInstances<=104);
 }finally{stage.dispose()}
});


test('D04 actual HP chips have a legible but bounded physical footprint without enlarging dust or allocating pools',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const BaseTetra=T.TetrahedronGeometry;
 // Record constructor geometry dimensions; ordinary node mocks intentionally
 // do not implement triangle rasterization or claim actual mobile pixels.
 T.TetrahedronGeometry=class extends BaseTetra{
  constructor(radius,detail){super(radius,detail);this.physicalRadius=radius}
 };
 const victim={id:'revenant',kind:'revenant',faction:'enemy',
  x:3,z:2,hp:14,maxHp:20};
 const visual=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,
  actorById:id=>id===victim.id?{u:victim,root:{visible:true,
   position:{x:-6,y:0,z:-7},rotation:{y:0}}}:null,
  getCurrentSnapshot:()=>({run:1,floor:1,tick:11,units:[victim]})
 });
 try{
  const injury=cue({severity:.3,detail:{damage:6,remainingHp:14,maxHp:20}});
  assert.equal(visual.emit(injury),true,'only a genuine current HP witness earns the physical effect');
  const meshes=[...scene.children],hit=meshes[1],dust=meshes[3];
  assert.ok(hit.geometry.physicalRadius>=.10&&hit.geometry.physicalRadius<=.11,
   'the original tiny 73mm facet is undersized for restrained torso contact; this is a scene-space contract, not a mobile pixel pass');
  assert.equal(dust.geometry.physicalRadius,.072,
   'non-injury dodge dust must not inherit the stronger contact footprint');
  assert.equal(visual.stats().instancesByPool.hit,4);
  assert.equal(visual.stats().reservedInstances,102);
  assert.equal(visual.stats().activeDrawCalls,1);
  assert.ok(hit.material.opacity<=.51,'avoid a neon flare or enlarged material flash');
 }finally{visual.dispose()}
});

test('strict D04 fatal HP evidence remains visible at the unique public cell when the dying rig is hidden',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const victim={id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,hp:0,maxHp:20};
 let current={run:1,floor:1,tick:11,units:[victim]};
 const actor={u:{...victim},root:{visible:false,
  position:{x:-6,y:0,z:-7},rotation:{y:0}}};
 const stage=createPhysicalFeedbackVisuals(T,scene,{
  requireVerifiedHpReceipt:true,
  actorById:id=>id==='revenant'?actor:null,
  getCurrentSnapshot:()=>current
 });
 const fatal=cue({id:'1:1:11:damage-fatal:-:revenant',
  kind:'damage-fatal',audio:'fatal-impact',severity:1,
  detail:{damage:20,maxHp:20,remainingHp:0}});
 const check=(snapshot,drawn,visible,expected,reason)=>{
  stage.reset();current=snapshot;actor.u=drawn;actor.root.visible=visible;
  assert.equal(stage.emit(fatal),expected,reason);
  assert.equal(stage.stats().instancesByPool.hit,expected?6:0,
   'only authenticated death may allocate retained injury fragments');
 };
 try{
  check(current,{...victim},false,true,
   'the independently witnessed fatal HP loss stays drawable after the dying rig is hidden');
  assert.equal(stage.stats().reservedInstances,102);
  assert.ok(stage.stats().activeDrawCalls<=7);
  check(current,{...victim,hp:20},false,true,
   'exact cached pre-death HP is independently reconciled to the observed terminal delta');
  check(current,{...victim,hp:19},false,false,
   'unrelated cached HP cannot borrow the fatal event');
  check(current,{...victim,maxHp:30},false,false,
   'different-capacity hidden models cannot borrow a death');
  check(current,{...victim,x:4},false,false,
   'an old hidden model at another public cell cannot borrow the injury');
  check(current,{...victim,id:'unrelated'},false,false,
   'recycled actor identity must not project fragments');
  check({...current,tick:12},{...victim},false,false,
   'an old fatal event cannot repaint a subsequent tick');
  check({...current,units:[victim,{...victim}]},{...victim},false,false,
   'duplicate current victim IDs are never an unambiguous anchor');
  check({...current,units:[{...victim,hp:1}]},{...victim},false,false,
   'an alive public victim cannot receive a fatal impact');
  check({run:1,floor:1,tick:11,units:[victim]},{...victim},true,true,
   'existing live visible-body HP anchoring remains unchanged');
 }finally{stage.dispose()}
});
