'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-dungeon/original-combat-foley.js')).href);

// Detached WebAudio fixture: these tests do not certify true loudness,
// browser PCM or the source animation's physical contact with anything.
function fixture(){
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){},stop(){}});
 const context={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,createBufferSource:node,
  createBuffer(channels,length,rate){return {length,sampleRate:rate,duration:length/rate,
   getChannelData:()=>new Float32Array(length)}}};
 return context;
}
const swing=(actorId,tick=3)=>({
 id:'1:1:'+tick+':swing:'+actorId+':-',sceneKey:'1:1',
 tick,kind:'swing',visual:'trail',audio:'whoosh',
 proof:'authority-attempt-not-hit',actorId,targetId:null,priority:3,severity:.3
});
test('two distinct observed swing attempts in one frame each receive original air foley, never impact',async()=>{
 const {createOriginalCombatFoley,verifiedSwingFoleyActor}=await load();
 const engine=createOriginalCombatFoley(fixture());assert.equal(engine.enable(),true);
 assert.equal(verifiedSwingFoleyActor(swing('vanguard')),'vanguard');
 assert.equal(engine.emit(swing('vanguard')),true);
 assert.equal(engine.emit(swing('revenant')),true,'one global whoosh cooldown must not mute an independently witnessed swing');
 assert.equal(engine.stats().activeVoices,2);
 assert.equal(engine.stats().verifiedSwingActors,2);
 engine.dispose();
});
test('same actor cannot duplicate air foley, and a third simultaneous actor cannot overload it',async()=>{
 const {createOriginalCombatFoley}=await load();
 const context=fixture(),engine=createOriginalCombatFoley(context);engine.enable();
 assert.equal(engine.emit(swing('vanguard')),true);
 assert.equal(engine.emit(swing('vanguard',4)),false);
 assert.equal(engine.emit(swing('revenant')),true);
 assert.equal(engine.emit(swing('warden')),false,'max two air onsets in one 75ms window');
 assert.equal(engine.stats().swingOnsets,2);
 context.currentTime=.076;
 assert.equal(engine.emit(swing('warden')),true);
 engine.dispose();
});
test('unverified, anonymous or malformed swing source cannot unlock per-actor polyphony',async()=>{
 const {createOriginalCombatFoley,verifiedSwingFoleyActor}=await load();
 const context=fixture(),engine=createOriginalCombatFoley(context);engine.enable();
 for(const invalid of [
  {...swing('vanguard'),proof:'authority-event'},
  {...swing('vanguard'),actorId:null},
  {...swing('vanguard'),actorId:'x'.repeat(129)},
  {...swing('vanguard'),audio:'impact'},
  {...swing('vanguard'),kind:'damage'}
 ])assert.equal(verifiedSwingFoleyActor(invalid),null);
 const unverified={...swing('vanguard'),proof:'authority-event'};
 assert.equal(engine.emit(unverified),true,'preserve legacy single unverified air sound');
 assert.equal(engine.emit({...unverified,id:'another',actorId:'revenant'}),false,
  'only the planner-witnessed action may bypass the type-wide cooldown');
 engine.dispose();
});
test('unverified whoosh cannot become a third onset after two genuinely verified attempts',async()=>{
 const {createOriginalCombatFoley}=await load();
 const engine=createOriginalCombatFoley(fixture());engine.enable();
 assert.equal(engine.emit(swing('vanguard')),true);
 assert.equal(engine.emit(swing('revenant')),true);
 assert.equal(engine.emit({...swing('warden'),proof:'authority-event'}),false);
 assert.equal(engine.stats().activeVoices,2);
 engine.dispose();
});
test('new actor can sound after the density window but a rapid replay from that same actor is rejected',async()=>{
 const {createOriginalCombatFoley}=await load();
 const context=fixture(),engine=createOriginalCombatFoley(context);engine.enable();
 assert.equal(engine.emit(swing('vanguard')),true);
 context.currentTime=.076;
 assert.equal(engine.emit(swing('revenant')),true);
 assert.equal(engine.emit(swing('revenant',4)),false);
 assert.ok(engine.stats().activeVoices<=8);
 engine.dispose();
});
test('mute and reset remove all swing voices and permission, preserving gesture-only replay',async()=>{
 const {createOriginalCombatFoley}=await load();
 const context=fixture(),engine=createOriginalCombatFoley(context);engine.enable();
 assert.equal(engine.emit(swing('vanguard')),true);
 engine.disable();
 assert.equal(engine.stats().activeVoices,0);
 assert.equal(engine.stats().verifiedSwingActors,0);
 assert.equal(engine.stats().swingOnsets,0);
 assert.equal(engine.emit(swing('revenant')),false,'mute is immediate');
 engine.enable();
 assert.equal(engine.emit(swing('vanguard')),true,'fresh opt-in may sound a newly witnessed attempt');
 engine.reset();
 assert.equal(engine.stats().activeVoices,0);
 assert.equal(engine.stats().verifiedSwingActors,0);
 engine.dispose();
});
test('long session actor churn keeps swing cooldown memory <=16 and live voices <=8',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_SWING_ACTOR_COOLDOWNS}=await load();
 const context=fixture(),engine=createOriginalCombatFoley(context);engine.enable();
 for(let i=0;i<48;i++){
  context.currentTime=i*.080;
  assert.equal(engine.emit(swing('actor-'+i,i+3)),true);
  assert.ok(engine.stats().verifiedSwingActors<=MAX_ORIGINAL_SWING_ACTOR_COOLDOWNS);
  assert.ok(engine.stats().activeVoices<=8);
  assert.ok(engine.stats().swingOnsets<=2);
 }
 engine.dispose();
});
