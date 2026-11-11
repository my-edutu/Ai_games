'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);

// Simulated WebAudio nodes check cue admission and resource counts, not
// actual browser PCM, audible alignment or genuine Dungeon moving footage.
function fixture(){
 const started=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){started.push(this)},stop(){}});
 const ctx={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBufferSource:node,createBuffer(channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)}
  }};
 return {ctx,started};
}
const swing=(tick=7,actorId='vanguard')=>({
 id:'1:1:'+tick+':swing:'+actorId+':-',sceneKey:'1:1',tick,
 kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
 verified:true,actorId,targetId:null,priority:4,severity:.5
});
const injury=(tick=8,targetId='revenant')=>({
 id:'1:1:'+tick+':damage:-:'+targetId,sceneKey:'1:1',tick,
 kind:'damage',visual:'hit',audio:'impact',proof:'observed-hp-drop',
 verified:true,actorId:null,targetId,priority:6,severity:.6
});

test('D04 strict foley cannot play one witnessed attack twice after its cooldown',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit(swing()),true);
 const started=f.started.length;
 f.ctx.currentTime=.14; // well beyond the per-actor 75ms cooldown
 assert.equal(engine.emit(swing()),false,'same authoritative event is one sound');
 assert.equal(f.started.length,started,'duplicate cannot allocate any nodes');
 assert.equal(engine.stats().confirmedCueIds,1);
 assert.equal(engine.emit(swing(9)),true,'new witnessed attack remains audible');
 engine.dispose();
});

test('D04 strict foley cannot re-injure a victim acoustically from the same HP delta',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit(injury()),true);
 const started=f.started.length;
 f.ctx.currentTime=.16;
 assert.equal(engine.emit(injury()),false);
 assert.equal(f.started.length,started,'one HP loss cannot mint a second impact');
 assert.equal(engine.emit(injury(9)),true,'new independent HP drop remains audible');
 engine.dispose();
});

test('D04 strict foley still admits two independently witnessed simultaneous bodies',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit(swing(7,'vanguard')),true);
 assert.equal(engine.emit(swing(7,'revenant')),true);
 assert.equal(engine.emit(swing(7,'vanguard')),false);
 assert.equal(engine.stats().activeVoices,2);
 assert.equal(engine.stats().confirmedCueIds,2);
 engine.dispose();
});

test('D04 accepted sound-event memory remains bounded during actor/tick churn',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_CONFIRMED_CUE_IDS}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 for(let i=0;i<MAX_ORIGINAL_CONFIRMED_CUE_IDS+50;i++){
  f.ctx.currentTime=i*.10;
  assert.equal(engine.emit(swing(i+7,'actor-'+i)),true);
  assert.ok(engine.stats().confirmedCueIds<=MAX_ORIGINAL_CONFIRMED_CUE_IDS);
  assert.ok(engine.stats().activeVoices<=8);
 }
 assert.equal(engine.stats().confirmedCueIds,MAX_ORIGINAL_CONFIRMED_CUE_IDS);
 engine.dispose();
 assert.equal(engine.stats().confirmedCueIds,0);
});

test('D04 explicit mute, reset and fresh opt-in retire old cue-event memory',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit(swing()),true);
 engine.disable();
 assert.equal(engine.stats().confirmedCueIds,0);
 assert.equal(engine.emit(swing()),false,'no replay while muted');
 assert.equal(engine.enable(),true,'fresh explicit gesture may permit a new scene session');
 assert.equal(engine.emit(swing()),true);
 engine.reset();
 assert.equal(engine.stats().confirmedCueIds,0);
 engine.dispose();
});
