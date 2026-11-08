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
test('visual effect groups physically distinguish guided arrow, magic orb, rooted blade, dodge grit and measured impact',async()=>{
 const {createPhysicalFeedbackVisuals}=await load('physical-feedback-visuals.js');
 const {T,scene}=three();
 const actors=new Map();const a=(id,x,z)=>({
  u:{id,action:'attack',actionTick:11},authored:id==='vanguard',
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
 actors.get('vanguard').rigMeleeBones[0].bone.world.x+=.12;
 stage.advance(.016);
 assert.equal(stage.stats().activeDrawCalls,1,'actual animated hand displacement produces a single measured ribbon draw');
 assert.ok(stage.stats().measuredTrailFrames>=1);
 assert.equal(stage.emit(cue({kind:'ranged-release',visual:'launch',actorId:'ranger',targetId:'revenant',from:{x:2,z:2},to:{x:3,z:2}})),true);
 assert.equal(stage.emit(cue({kind:'spell-release',visual:'cast',actorId:'mystic',targetId:'revenant',from:{x:2,z:2},to:{x:3,z:2}})),true);
 assert.equal(stage.emit(cue({kind:'evade',visual:'evade',actorId:'vanguard',targetId:null,from:{x:2,z:2},to:{x:2,z:3}})),true);
 const counts=stage.stats().instancesByPool;
 assert.ok(counts.trail>=1 && counts.projectile>=1 && counts.spell>=1 && counts.dust>=1);
 assert.equal(stage.emit(cue({kind:'damage',visual:'hit',proof:'guessed'})),false);
 stage.reset();assert.equal(stage.stats().activeDrawCalls,0);
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
 director.acceptSnapshot({...game(11),units:[unit(30,'attack',11)]});
 director.advance(.05);director.advance(.05);director.advance(.05);
 assert.equal(v.length,1,'authentic swing staged before render');assert.equal(a.length,0,'no sound preceding render submission');
 assert.equal(director.acknowledgePresentedFrame('frame-22'),1);
 assert.equal(a.length,1);
 assert.equal(director.acknowledgePresentedFrame('frame-22'),0);
 assert.equal(a.length,1);
 director.muteAudio();
 director.acceptSnapshot({...game(12),units:[unit(23,'hurt',12)]});
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
  actors.set(id,{u:{id,hp:30},root:{visible:true,position:{x:x-9,y:0,z:z-9}}});
 const v=createPhysicalFeedbackVisuals(T,scene,{actorById:id=>actors.get(id)});
 const arrow=cue({kind:'ranged-release',visual:'launch',proof:'authority-action-not-hit',
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
 const stage=createPhysicalFeedbackVisuals(T,scene,{getFloorMap:()=>{reads++;return map}});
 const shot=cue({kind:'ranged-release',visual:'launch',audio:'ranged-release',
  proof:'authority-action-not-hit',actorId:'ranger',targetId:'revenant',
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
 const {T,scene}=three();const v=createPhysicalFeedbackVisuals(T,scene);
 const arrow=cue({kind:'ranged-release',visual:'launch',actorId:'ranger',
  targetId:'revenant',from:{x:2,z:2},to:{x:5,z:2},proof:'authority-action-not-hit'});
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
