'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const folder=path.resolve(__dirname,'../../public/ai-dungeon');
const load=async file=>import(pathToFileURL(path.join(folder,file)).href);
const hero=(changes={})=>({id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10,targetId:null,...changes});
const foe=(changes={})=>({id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10,targetId:null,...changes});
const map=()=>Array.from({length:9},()=>'.'.repeat(9));
const snap=(tick,changes={})=>({tick,run:1,floor:1,phase:'exploring',map:map(),
 units:[hero(),foe()],events:[],...changes});
const legal=u=>u.targetId==='revenant'?{targetId:'revenant',distance:1}:null;
const kinds=cues=>cues.map(c=>c.kind);

test('a real missed sword attempt has a whoosh/trail but NEVER an impact, attacker claim or phantom collision',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const before=snap(10),after=snap(11,{units:[hero({action:'attack',actionTick:11}),foe()]});
 const cues=planPhysicalFeedback(before,after,{resolveContact:()=>null});
 assert.deepEqual(kinds(cues),['swing']);
 assert.equal(cues[0].audio,'whoosh');
 assert.equal(cues[0].actorId,'vanguard');
 assert.equal(cues[0].targetId,null);
 assert.equal(cues[0].to,null);
 assert.equal(cues[0].proof,'authority-attempt-not-hit');
 assert.equal(cues[0].delay,.12);
 assert.ok(!kinds(cues).some(k=>k.includes('damage')));
 assert.deepEqual(planPhysicalFeedback(before,after,{reducedMotion:true}).map(x=>x.delay),[0]);
});

test('verified legal sword aiming is NOT proof of the attacker causing a witnessed HP loss',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const old=snap(10),newer=snap(11,{units:[hero({action:'attack',actionTick:11,targetId:'revenant'}),foe({hp:19})]});
 const raw=JSON.stringify(newer);
 const cues=planPhysicalFeedback(old,newer,{resolveContact:legal,
  verifiedMeleeDelay:()=>.215});
 assert.equal(cues.length,2);
 const wound=cues.find(c=>c.kind==='damage'),swing=cues.find(c=>c.kind==='swing');
 assert.ok(wound);assert.ok(swing);
 assert.equal(wound.targetId,'revenant');
 assert.equal(wound.actorId,null,'presentation never invents or asserts a perpetrator');
 assert.equal(wound.proof,'observed-hp-drop');
 assert.equal(wound.delay,0,'fallback HP-only beat cannot earn a skeletal melee delay');
 assert.equal(wound.detail.damage,11);
 assert.equal(swing.targetId,'revenant');
 assert.equal(JSON.stringify(newer),raw,'planner must never modify the public authority snapshot');
 const derivation=()=>[{id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,
  damage:11,maxHp:30,fatal:false,incoming:{sourceId:'vanguard',dx:1,dz:0}}];
 const matched=planPhysicalFeedback(old,newer,{resolveContact:legal,
  deriveDamageBeats:derivation,verifiedMeleeDelay:()=>.215});
 assert.equal(matched.find(c=>c.kind==='damage').delay,.215,
  'only an incoming-lane-validated beat may share the real blade contact clock');
});

test('hazard damage, movement hurt and casualties never borrow a nearby weapon owner',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const old=snap(10),hazard=snap(11,{units:[hero({hp:18,action:'hurt',actionTick:11}),foe()]});
 const events=planPhysicalFeedback(old,hazard);
 assert.deepEqual(kinds(events),['damage']);
 assert.equal(events[0].actorId,null);
 assert.equal(events[0].targetId,'vanguard');
 assert.equal(events[0].delay,0);
 assert.equal(planPhysicalFeedback(old,snap(11,{units:[hero({action:'hurt',actionTick:11}),foe()]})).length,0);
 const fatal=snap(11,{units:[hero({hp:0,action:'hurt',actionTick:11}),foe()]});
 assert.deepEqual(kinds(planPhysicalFeedback(old,fatal)),['damage-fatal']);
});

test('projectiles require the explicit authoritative target and a legal presentation lane',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const before=snap(10,{units:[hero({kind:'ranger'}),foe()]});
 const aim={...hero({kind:'ranger',action:'attack',actionTick:11,targetId:'revenant'})};
 const after=snap(11,{units:[aim,foe()]});
 assert.deepEqual(kinds(planPhysicalFeedback(before,after,{resolveContact:legal})),['ranged-release']);
 const missed=planPhysicalFeedback(before,after,{resolveContact:()=>null});
 assert.deepEqual(kinds(missed),['ranged-unmatched']);
 assert.equal(missed[0].visual,'none');
 const spoof={...aim,targetId:'missing'};
 assert.equal(planPhysicalFeedback(before,{...after,units:[spoof,foe()]},{resolveContact:legal})[0].visual,'none');
 assert.equal(planPhysicalFeedback(before,after,{resolveContact:()=>({targetId:'vanguard',distance:1})})[0].visual,'none');
});

test('healing and trap-disarm remain utility, not offensive magic or projectiles',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 for(const [kind,event] of [['mystic','healing'],['ranger','disarm']]){
  const old=snap(10,{units:[hero({kind}),foe()]});
  const next=snap(11,{units:[hero({kind,action:'cast',actionTick:11,targetId:'revenant'}),foe()],
   events:[{tick:11,kind:event,text:'untrusted attacker string'}]});
  assert.deepEqual(kinds(planPhysicalFeedback(old,next,{resolveContact:legal})),['cast-utility']);
 }
});

test('anonymous event kinds cannot invent a dodge without actual movement',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const old=snap(10);
 const next=snap(11,{events:[{tick:11,kind:'block',text:'hero dealt 99 damage'},
  {tick:11,kind:'block',text:'second collision'},
  {tick:11,kind:'evade',text:'reused user data'},
  {tick:11,kind:'interrupt',text:'claimed stun'},
  {tick:11,kind:'opening',text:'warden vulnerable'},
  {tick:11,kind:'noise',text:'ignore'}]});
 const cues=planPhysicalFeedback(old,next);
 assert.deepEqual(kinds(cues),['interrupt','block'],
  'an anonymous opening string without a Warden recovery is not physical proof');
 assert.equal(cues.find(c=>c.kind==='block').actorId,null,
  'semantic text alone cannot anchor a block to one combatant');
 const walking=snap(11,{units:[hero({x:2,z:3,action:'move',actionTick:11}),foe()],events:[{tick:11,kind:'evade',text:'whatever'}]});
 assert.equal(planPhysicalFeedback(old,walking).some(c=>c.kind==='evade'),false,
  'an arbitrary evade label cannot certify escape despite a one-cell move');
 const witnessed={...walking,events:[{tick:11,kind:'evade',
  text:'vanguard slipped away from the marked shadow hex'}]};
 assert.equal(planPhysicalFeedback(old,witnessed).find(c=>c.kind==='evade').actorId,'vanguard',
  'matching public semantic event and genuine one-cell movement earn dodge art');
 const withoutEvent={...witnessed,events:[]};
 assert.equal(planPhysicalFeedback(old,withoutEvent).some(c=>c.kind==='evade'),false);
});

test('Warden warning cadence, cast release, earned recovery and actual counter loss stay distinct',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const boss=(hp,action='idle',actionTick=20,recovery=undefined)=>({id:'warden',kind:'warden',faction:'enemy',
  x:3,z:3,hp,maxHp:90,action,actionTick,recoveryUntilTick:recovery});
 const warning=(tick,remaining,changes={})=>snap(tick,{units:[hero(),boss(75)],
  bossWarning:{warning:true,shape:'NOVA',attackTick:23,turnsUntilImpact:remaining,cells:[{x:4,z:3}]},...changes});
 const earlier=warning(20,3),rising=warning(21,2),final=warning(22,1);
 assert.deepEqual(kinds(planPhysicalFeedback(earlier,rising)),['boss-warning-rising']);
 assert.deepEqual(kinds(planPhysicalFeedback(rising,final)),['boss-warning-final']);
 // The real authority issues opening on the SAME tick as the actual
 // Warden cast and records a future recoveryUntilTick. Do not fake a
 // second cast on the next tick just to attach the recovery event.
 const release=snap(23,{units:[hero(),boss(75,'cast',23,24)],
  bossWarning:null,bossRecovery:{remaining:2},guardianWard:false,
  events:[{tick:23,kind:'opening',text:'warden exposed'}]});
 assert.deepEqual(kinds(planPhysicalFeedback(final,release)),['warden-release','opening']);
 const counter=snap(24,{units:[hero(),boss(49,'hurt',24)],
  events:[{tick:24,kind:'counter',text:'hero counters'}]});
 assert.deepEqual(kinds(planPhysicalFeedback(release,counter)),['counter','damage']);
 const fake={...counter,units:[hero(),boss(75,'hurt',24)]};
 assert.equal(planPhysicalFeedback(release,fake).some(c=>c.kind==='counter'),false);
 const staleRecovery={...release,units:[hero(),boss(75,'cast',23,22)]};
 assert.equal(planPhysicalFeedback(staleRecovery,counter).some(c=>c.kind==='counter'),false);
});

test('stale, repeated, cross-floor, first-load, malformed and storm input remain bounded',async()=>{
 const {planPhysicalFeedback,PHYSICAL_FEEDBACK_MAX_CUES}=await load('physical-feedback-plan.js');
 const old=snap(10);
 assert.deepEqual(planPhysicalFeedback(null,old),[]);
 assert.deepEqual(planPhysicalFeedback(old,old),[]);
 assert.deepEqual(planPhysicalFeedback(old,{...old,tick:9}),[]);
 assert.deepEqual(planPhysicalFeedback(old,{...old,floor:2,tick:11}),[]);
 assert.deepEqual(planPhysicalFeedback(old,{...old,run:2,tick:11}),[]);
 assert.deepEqual(planPhysicalFeedback(old,{...old,units:null,tick:11}),[]);
 const stale=snap(20,{units:[hero({hp:7,action:'attack',actionTick:11,targetId:'revenant'}),foe()]});
 assert.equal(planPhysicalFeedback(old,stale).some(c=>c.kind==='damage'),false);
 assert.equal(planPhysicalFeedback(old,stale).some(c=>c.kind==='swing'),false);
 const heroes=Array.from({length:90},(_,i)=>hero({id:'v'+i,action:'attack',actionTick:11}));
 const many=snap(11,{units:heroes,events:Array.from({length:150},(_,i)=>({kind:i%2?'block':'evade',tick:11,text:'duplicate'}))});
 const prior=snap(10,{units:heroes.map(u=>({...u,action:'idle',actionTick:10}))});
 const cues=planPhysicalFeedback(prior,many);
 assert.equal(cues.length,PHYSICAL_FEEDBACK_MAX_CUES);
 assert.equal(new Set(cues.map(x=>x.id)).size,cues.length);
 assert.ok(cues.every(x=>!('text' in x)));
});

function fakeParam(){return {value:0,records:[],setValueAtTime(...a){this.records.push(a)},
 exponentialRampToValueAtTime(...a){this.records.push(a)}}}
function fakeAudio(){
 const counts={buffers:0,created:0,disconnects:0,stops:0};
 const node=(withGain=false)=>{
  counts.created++;
  return {gain:withGain?fakeParam():undefined,frequency:fakeParam(),Q:{value:0},
   playbackRate:{value:1},connect(){},disconnect(){counts.disconnects++},
   start(){},stop(){counts.stops++}}
 };
 const ctx={state:'suspended',currentTime:1,sampleRate:48000,destination:{},
  createGain:()=>node(true),createOscillator:()=>node(),createBiquadFilter:()=>node(),
  createBufferSource:()=>node(),createBuffer:(ch,count,rate)=>{
   counts.buffers++;return {length:count,rate,getChannelData:()=>new Float32Array(count)};
  }};
 return {ctx,counts};
}
test('original sound opt-in, retained noise, max voices, mute cleanup, malformed device fallback',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES,
 ORIGINAL_COMBAT_MAX_NOISE_SAMPLES,createCombatMutePreference}=await load('original-combat-foley.js');
 const {ctx,counts}=fakeAudio(),stage=createOriginalCombatFoley(ctx);
 const cue=(i,priority=5)=>({audio:i%2?'impact':'whoosh',priority,severity:.2});
 assert.equal(stage.emit(cue(1)),false);
 assert.equal(stage.enable(),false,'suspended AudioContext cannot be started by module');
 assert.equal(counts.buffers,0,'no samples before explicit user consent');
 ctx.state='running';assert.equal(stage.enable(),true);
 assert.equal(counts.buffers,1);
 for(let i=0;i<90;i++){ctx.currentTime+=.08;stage.emit(cue(i,5))}
 assert.ok(stage.stats().activeVoices<=MAX_ORIGINAL_COMBAT_VOICES);
 assert.ok(stage.stats().peakVoices<=MAX_ORIGINAL_COMBAT_VOICES);
 assert.ok(stage.stats().noiseSamples<=ORIGINAL_COMBAT_MAX_NOISE_SAMPLES);
 assert.equal(counts.buffers,1,'no sample allocations per weapon hit');
 stage.disable();assert.equal(stage.stats().activeVoices,0);
 assert.equal(stage.emit(cue(1)),false);
 assert.ok(counts.stops>0);
 stage.enable();stage.dispose();assert.equal(stage.stats().disposed,true);
 assert.ok(counts.disconnects>0);
 const store=new Map();const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const p=createCombatMutePreference(storage);
 assert.equal(p.read(),true,'sound defaults muted');
 p.write(false);assert.equal(p.read(),false);
 p.write(true);assert.equal(p.read(),true);
 assert.equal(createCombatMutePreference({getItem(){throw Error('blocked')}}).read(),true);
});

function fakeThree(){
 const tracked={geometries:0,materials:0,disposedGeo:0,disposedMat:0};
 class Vec{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}
  normalize(){return this}
 }
 class Geometry{constructor(){tracked.geometries++}setAttribute(){return this}setIndex(){return this}computeVertexNormals(){}dispose(){tracked.disposedGeo++}}
 class Material{constructor(options={}){tracked.materials++;this.opacity=options.opacity}dispose(){tracked.disposedMat++}}
 class Object3D{
  constructor(){this.position=new Vec();this.rotation={set(){},x:0,y:0,z:0};
   this.quaternion={identity(){},setFromUnitVectors(){}};this.scale={setScalar(){}};
   this.matrix={};}
  updateMatrix(){}
 }
 class InstancedMesh{constructor(geo,mat,count){this.geometry=geo;this.material=mat;this.count=count;
  this.instanceMatrix={setUsage(){},needsUpdate:false};this.matrices=[];}
  setMatrixAt(i,m){this.matrices[i]=m}
 }
 const THREE={Object3D,Vector3:Vec,BufferGeometry:Geometry,Float32BufferAttribute:class {constructor(array,itemSize){this.array=array;this.itemSize=itemSize}},MeshStandardMaterial:Material,MeshBasicMaterial:Material,InstancedMesh,
  TorusGeometry:Geometry,OctahedronGeometry:Geometry,TetrahedronGeometry:Geometry,IcosahedronGeometry:Geometry,SphereGeometry:Geometry,RingGeometry:Geometry,CylinderGeometry:Geometry,
  DoubleSide:2,DynamicDrawUsage:35048};
 const children=new Set(),scene={add:o=>children.add(o),remove:o=>children.delete(o)};
 return {THREE,scene,tracked,children};
}
test('retained VFX pool never allocates an effect mesh per hit; reduced flash and disposal stay bounded',async()=>{
 const {createPhysicalFeedbackVisuals,PHYSICAL_FEEDBACK_POOL_LIMITS}=await load('physical-feedback-visuals.js');
 const {THREE,scene,tracked,children}=fakeThree();
 const visuals=createPhysicalFeedbackVisuals(THREE,scene,{reducedFlash:true});
 const e={id:'1:1:11:damage:-:v',sceneKey:'1:1',kind:'damage',tick:11,
  visual:'hit',proof:'observed-hp-drop',verified:true,to:{x:3,z:2},targetId:'revenant',
  priority:5,duration:.23,severity:.9};
 const count=Object.values(PHYSICAL_FEEDBACK_POOL_LIMITS).reduce((a,b)=>a+b,0);
 assert.equal(visuals.stats().reservedInstances,count);
 assert.equal([...children].filter(x=>x.visible).length,0,
  'zero idle draw calls from retained pools before a real combat event');
 assert.ok([...children].every(x=>x.material.opacity<=.25),
  'reduced flash must cap every pooled material opacity');
 for(let i=0;i<400;i++){visuals.emit(e);visuals.advance(.05)}
 assert.ok([...children].filter(x=>x.visible).length<=1,
  'an actual damage chip should never wake idle effect groups');
 assert.equal(tracked.geometries,7,'seven immutable geometric role pools, not per-effect geometry');
 assert.equal(tracked.materials,7,'seven retained material roles');
 assert.ok(visuals.stats().active<=count);
 assert.ok(visuals.stats().peak<=count);
 assert.equal(children.size,7);
 assert.equal(visuals.emit({...e,proof:'guessed'}),false,'no injury fragment without observed HP loss');
 visuals.reset();assert.equal(visuals.stats().active,0);
 assert.equal([...children].filter(x=>x.visible).length,0,
  'reset returns every retained pool to zero draw calls');
 visuals.dispose();assert.equal(children.size,0);
 assert.equal(tracked.disposedGeo,7);
 assert.equal(tracked.disposedMat,7);
});

test('one controller clock handles deduped contact, restart, opt-in and mute without replaying old sounds',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const actions=[],audio=[];
 const visualAdapter={emit:c=>actions.push(c),advance(){},reset(){},stats(){return {active:0}},dispose(){}};
 const audioAdapter={enable(){return true},emit:c=>audio.push(c),flush(){},disable(){},cleanup(){},stats(){return {played:audio.length}},dispose(){}};
 const storage=new Map(),store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const c=createPhysicalCombatFeedback({visualAdapter,audioAdapter,storage:store});
 assert.equal(c.preferredMuted(),true);
 assert.equal(c.acceptSnapshot(snap(10)),0);
 const next=snap(11,{units:[hero({action:'attack',actionTick:11}),foe({hp:15})]});
 assert.equal(c.acceptSnapshot(next),2);
 assert.equal(actions.length,1,'true HP damage acts immediately');
 assert.equal(audio.length,0,'must not autoplay');
 c.advance(.05);c.advance(.05);c.advance(.05);
 assert.equal(actions.length,2,'missed swing arrives after original authored anticipation');
 assert.equal(c.acceptSnapshot(next),0);
 assert.equal(actions.length,2);
 assert.equal(c.enableAudioFromGesture(),true);
 assert.equal(c.preferredMuted(),false);
 const third=snap(12,{units:[hero({action:'attack',actionTick:12}),foe({hp:7})]});
 c.acceptSnapshot(third);assert.ok(audio.length>=1);
 c.muteAudio();assert.equal(c.preferredMuted(),true);
 const restart={...snap(0),run:2};
 c.acceptSnapshot(restart);assert.equal(c.stats().pending,0);
 assert.equal(c.stats().sceneResets,1);
 c.dispose();assert.equal(c.stats().disposed,true);
 assert.equal(c.acceptSnapshot(third),0);
});


test('generic threat text is never misrepresented as an authored Warden warning',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const next=snap(11,{events:[{tick:11,kind:'telegraph',text:'WARDEN NOVA STRIKE'}]});
 const cues=planPhysicalFeedback(snap(10),next);
 assert.equal(cues.length,1);
 assert.equal(cues[0].kind,'threat-warning');
 assert.equal(cues[0].audio,'threat-warning');
 assert.equal(cues[0].actorId,null);
 assert.equal(cues[0].visual,'none');
 assert.equal(cues[0].verified,true,'only the existence of a warning is verified');
});

test('receipts are bounded and include separate attempted VFX and audio delivery acknowledgments',async()=>{
 const {createPhysicalCombatFeedback,MAX_PHYSICAL_RECEIPTS}=await load('physical-combat-feedback.js');
 const visuals={emit:()=>true,advance(){},reset(){},dispose(){},stats(){return {active:0}}};
 const audio={enable:()=>true,emit:()=>true,disable(){},flush(){},cleanup(){},dispose(){},stats(){return {activeVoices:0}}};
 const c=createPhysicalCombatFeedback({visualAdapter:visuals,audioAdapter:audio});
 assert.equal(c.acceptSnapshot(snap(1)),0);
 assert.equal(c.enableAudioFromGesture(),true);
 for(let tick=2;tick<=130;tick++){
  const next=snap(tick,{events:[{tick,kind:'block',text:'no invented owner'}]});
  c.acceptSnapshot(next);c.advance(.05);
 }
 const stats=c.stats();
 assert.equal(stats.limits.maxReceipts,MAX_PHYSICAL_RECEIPTS);
 assert.equal(stats.recentDeliveryReceipts.length,MAX_PHYSICAL_RECEIPTS);
 assert.ok(stats.recentDeliveryReceipts.every(r=>r.visual&&r.audio&&
  r.kind==='block'&&r.scene==='1:1'&&Number.isSafeInteger(r.tick)&&
  Number.isSafeInteger(r.renderedMs)&&r.renderedMs>=0));
 assert.equal(stats.audioAccepted,stats.visualAccepted);
 assert.equal(stats.pending,0);
 c.dispose();
});

test('persisted unmute never re-enables audio automatically on reload; broken optional adapters degrade safely',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const audio={enable:()=>true,emit(){throw Error('output device lost')},
  disable(){throw Error('mute device lost')},flush(){throw Error('audio flush error')},
  cleanup(){},dispose(){},stats(){return {activeVoices:0}}};
 const visuals={emit(){throw Error('WebGL reset')},advance(){throw Error('renderer lost')},
  reset(){},dispose(){},stats(){return {active:0}}};
 const first=createPhysicalCombatFeedback({storage,audioAdapter:audio,visualAdapter:visuals});
 assert.equal(first.enableAudioFromGesture(),true);
 first.acceptSnapshot(snap(10));
 first.acceptSnapshot(snap(11,{events:[{tick:11,kind:'block'}]}));
 assert.ok(first.stats().adapterFailures>=2);
 assert.equal(first.stats().recentDeliveryReceipts[0].audio,false,
  'device errors cannot be counted as audible feedback');
 assert.equal(first.stats().recentDeliveryReceipts[0].visual,false,
  'renderer errors cannot be counted as a visible effect');
 first.muteAudio();first.dispose();
 // Another page, same persisted storage, no gesture: no oscillators are created.
 const second=createPhysicalCombatFeedback({storage,audioAdapter:audio,visualAdapter:visuals});
 assert.equal(second.preferredMuted(),true);
 assert.equal(second.stats().audioOptedIn,false);
 second.dispose();
 const third=createPhysicalCombatFeedback({storage,
  audioAdapter:{...audio,disable(){},flush(){},emit(){return true}},visualAdapter:visuals});
 assert.equal(third.enableAudioFromGesture(),true);
 assert.equal(third.preferredMuted(),false);
 third.dispose();
 const reloaded=createPhysicalCombatFeedback({storage,audioAdapter:audio,visualAdapter:visuals});
 assert.equal(reloaded.preferredMuted(),false,'unmute preference persists');
 assert.equal(reloaded.stats().audioOptedIn,false,'persistent preference is NEVER autoplay consent');
 reloaded.dispose();
});

test('D04 block VFX requires one corroborated guarded HP loss, no invented blocker from prose or ambiguous simultaneous blocks',async()=>{
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const old=snap(10);
 const event={tick:11,kind:'block',text:'the enemy says vanguard is attacking'};
 const valid=snap(11,{units:[hero({hp:21,action:'guard',actionTick:11,guardTick:11}),foe()],events:[event]});
 const anchor=planPhysicalFeedback(old,valid).find(c=>c.kind==='block');
 assert.equal(anchor.actorId,'vanguard');assert.equal(anchor.targetId,null);
 assert.deepEqual(anchor.from,{x:2,z:2});
 assert.equal(anchor.proof,'authority-block-unique-guarded-hp');
 const priorAmbiguous=snap(10,{units:[hero(),foe({id:'ally',kind:'ranger',faction:'party'})]});
 const ambiguous=snap(11,{units:[hero({hp:21,action:'guard',guardTick:11}),foe({id:'ally',kind:'ranger',faction:'party',hp:23,action:'guard',guardTick:11})],events:[event]});
 assert.equal(planPhysicalFeedback(priorAmbiguous,ambiguous).find(c=>c.kind==='block').actorId,null);
 const duplicate={...valid,events:[event,{...event,text:'different alleged actor'}]};
 assert.equal(planPhysicalFeedback(old,duplicate).find(c=>c.kind==='block').actorId,null);
 const absorbed={...valid,units:[hero({hp:30,action:'guard',guardTick:11}),foe()]};
 assert.equal(planPhysicalFeedback(old,absorbed).find(c=>c.kind==='block').actorId,null);
});

test('D04 diagnoses actual slow post-visual WebGL submissions without mistaking raw rAF interval for render cost',async()=>{
 const {createPhysicalCombatFeedback,MAX_RECENT_SLOW_SUBMISSION_PHASES}=await load('physical-combat-feedback.js');
 let now=0;
 const visuals={emit:()=>false,advance(){now+=.020},reset(){},dispose(){},stats(){return {active:0}}};
 const audio={enable:()=>true,emit:()=>true,disable(){},flush(){},cleanup(){},dispose(){},stats(){return {activeVoices:0}}};
 const c=createPhysicalCombatFeedback({visualAdapter:visuals,audioAdapter:audio,
  requirePresentedFrame:true,clock:()=>now});
 try{
  assert.equal(c.enableAudioFromGesture(),true);
  now=.010;c.advance(.016,.016); // end at .030 (20ms in visual advance)
  now=.160;c.acknowledgePresentedFrame(1,.025); // 130ms after visual, of which 25ms is renderer
  let s=c.stats();
  assert.equal(s.verifiedSubmissionPhaseFrames,1);
  assert.equal(s.unverifiedSubmissionPhaseFrames,0);
  assert.equal(s.slowSubmissionFrames,1);
  assert.equal(s.limits.maxSlowSubmissionPhases,MAX_RECENT_SLOW_SUBMISSION_PHASES);
  assert.deepEqual(s.recentSlowSubmissionPhases[0],{
   frameId:1,observedRafMs:16,advanceToSubmissionMs:150,
   d04VisualAdvanceMs:20,afterVisualToSubmissionMs:130,
   beforeRendererMs:105,rendererMs:25
  });
  c.acknowledgePresentedFrame(1,.025);
  assert.equal(c.stats().slowSubmissionFrames,1,'replayed submissions cannot inflate phase metrics');
  now=.200;c.advance(.016,.016);now=.240;c.acknowledgePresentedFrame(2,.010);
  s=c.stats();
  assert.equal(s.verifiedSubmissionPhaseFrames,2);
  assert.equal(s.slowSubmissionFrames,1,'ordinary frames do not enter the forensic slow-frame ring');
  assert.equal(s.recentSlowSubmissionPhases.length,1);
 }finally{c.dispose()}
});
test('D04 slow-frame attribution fails closed for clock regressions and is bounded under repeated stalls',async()=>{
 const {createPhysicalCombatFeedback,MAX_RECENT_SLOW_SUBMISSION_PHASES}=await load('physical-combat-feedback.js');
 let now=0,invalid=false;
 const c=createPhysicalCombatFeedback({
  visualAdapter:{advance(){now+=.01},emit(){return false},reset(){},dispose(){},stats(){return {active:0}}},
  audioAdapter:{enable(){return true},emit(){return true},disable(){},flush(){},cleanup(){},dispose(){},stats(){return {activeVoices:0}}},
  requirePresentedFrame:true,clock:()=>invalid?NaN:now
 });
 try{
  c.enableAudioFromGesture();
  now=.01;c.advance(.016,.016);invalid=true;now=.25;c.acknowledgePresentedFrame(1,.02);
  let s=c.stats();
  assert.equal(s.unverifiedSubmissionPhaseFrames,1);
  assert.equal(s.verifiedSubmissionPhaseFrames,0);
  assert.equal(s.recentSlowSubmissionPhases.length,0,'unverified clocks cannot fabricate a renderer phase');
  invalid=false;
  for(let i=2;i<MAX_RECENT_SLOW_SUBMISSION_PHASES+9;i++){
   now+=.001;c.advance(.016,.016);
   now+=.2;c.acknowledgePresentedFrame(i,.02);
  }
  s=c.stats();
  assert.equal(s.recentSlowSubmissionPhases.length,MAX_RECENT_SLOW_SUBMISSION_PHASES);
  assert.ok(s.recentSlowSubmissionPhases.every(x=>x.advanceToSubmissionMs>=200&&x.beforeRendererMs>=0));
  assert.equal(s.slowSubmissionFrames,MAX_RECENT_SLOW_SUBMISSION_PHASES+7);
  assert.equal(s.verifiedSubmissionPhaseFrames,MAX_RECENT_SLOW_SUBMISSION_PHASES+7);
 }finally{c.dispose()}
});



test('silent D04 preview retains verified WebGL phase receipts without granting combat audio',async()=>{
  const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
  let now=0,soundEmits=0;
  const c=createPhysicalCombatFeedback({
   visualAdapter:{emit(){return true},advance(){now+=.005},reset(){},dispose(){},stats(){return {active:0}}},
   audioAdapter:{enable(){return true},emit(){soundEmits++;return true},
    disable(){},flush(){},cleanup(){},dispose(){},stats(){return {activeVoices:0}}},
   requirePresentedFrame:true,clock:()=>now
  });
  try{
   c.acceptSnapshot(snap(10));
   now=.005;
   c.acceptSnapshot(snap(11,{units:[hero(),foe({hp:23})]}));
   now=.010;c.advance(.016,.016);
   now=.160;
   assert.equal(c.acknowledgePresentedFrame(1,.025),0,'a silent receipt never delivers audio');
   let s=c.stats();
   assert.equal(s.framesAcknowledged,1,'a real visual submission must be measurable before audio consent');
   assert.equal(s.verifiedSubmissionPhaseFrames,1);
   assert.equal(s.slowSubmissionFrames,1);
   assert.equal(s.recentSlowSubmissionPhases[0].rendererMs,25);
   assert.equal(s.audioOptedIn,false);
   assert.equal(s.audioAccepted,0);
   assert.equal(s.awaitingPresentation,0);
   assert.equal(soundEmits,0,'old injury cannot acquire audio after a later gesture');
   c.acknowledgePresentedFrame(1,.025);
   assert.equal(c.stats().framesAcknowledged,1,'silent replay is not a second real frame');
   assert.equal(c.enableAudioFromGesture(),true);
   now=.180;c.advance(.016,.016);
   now=.320;c.acknowledgePresentedFrame(2,.025);
   c.muteAudio();
   now=.330;c.advance(.016,.016);
   now=.490;
   assert.equal(c.acknowledgePresentedFrame(3,.025),0);
   s=c.stats();
   assert.equal(s.framesAcknowledged,3,'muted D04 still measures real submitted visuals');
   assert.equal(s.verifiedSubmissionPhaseFrames,3);
   assert.equal(s.audioOptedIn,false);
   assert.equal(s.audioAccepted,0);
   assert.equal(soundEmits,0);
   assert.equal(s.awaitingPresentation,0);
  }finally{c.dispose()}
 });

test('D04 slow-phase evidence includes real cue admission after the retained visual advance',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 let now=0;
 const emitted=[];
 const visuals={
  advance(){now+=.020},
  emit(cue){emitted.push(cue);now+=.060;return true},
  reset(){},dispose(){},stats(){return {active:0}},
  hasLiveCue(){return true},hasDrawableCue(){return true}
 };
 const audio={enable(){return true},emit(){return false},disable(){},
  flush(){},cleanup(){},dispose(){},stats(){return {activeVoices:0}}};
 const c=createPhysicalCombatFeedback({visualAdapter:visuals,audioAdapter:audio,
  requirePresentedFrame:true,clock:()=>now});
 try{
  assert.equal(c.enableAudioFromGesture(),true);
  c.acceptSnapshot(snap(10));
  now=.010;
  c.acceptSnapshot(snap(11,{units:[hero({action:'attack',actionTick:11}),foe()]}));
  now=.020;c.advance(.016,.016);
  assert.deepEqual(emitted.map(x=>x.kind),['swing'],
   'only an actual public attempted action stages the emitted cue');
  assert.equal(emitted[0].proof,'authority-attempt-not-hit');
  assert.equal(emitted[0].targetId,null,
   'a swing admission must not invent a damaged victim');
  now=.160;c.acknowledgePresentedFrame(1,.020);
  const phase=c.stats().recentSlowSubmissionPhases[0];
  assert.ok(phase,'genuine slow submission should be retained');
  assert.equal(phase.advanceToSubmissionMs,140);
  assert.equal(phase.d04VisualAdvanceMs,80,
   '20ms pooled aging AND 60ms actual effect emission belong to D04');
  assert.equal(phase.afterVisualToSubmissionMs,60,
   'already-charged D04 emission must not be blamed on non-D04 work');
  assert.equal(phase.beforeRendererMs,40);
  assert.equal(phase.rendererMs,20);
  assert.equal(c.stats().audioAccepted,0,
   'a staged sword attempt alone does not authorize an audible impact');
 }finally{c.dispose()}
});
