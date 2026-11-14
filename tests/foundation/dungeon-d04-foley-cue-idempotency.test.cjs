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

test('strict sword and injury foley reject sound without a stable event ID',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit({...swing(),id:null}),false);
 assert.equal(engine.emit({...injury(),id:undefined}),false);
 assert.equal(f.started.length,0,'no ambiguous event creates source nodes');
 assert.equal(engine.stats().confirmedCueIds,0);
 engine.dispose();
});


// A failed high-priority sound may not sacrifice an already audible, lower
// priority voice. These are WebAudio scheduling contracts, not recorded PCM.
function failingPreemptionFixture(){
 let failPhase=null,sourceStarts=0;
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=kind=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){
   if(kind==='source'&&failPhase==='start'){
    failPhase=null;throw Error('simulated output start failure');
   }
   if(kind==='source')sourceStarts++;
  },stop(){}});
 const ctx={state:'running',currentTime:0,destination:node('destination'),
  createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),
  createOscillator:()=>node('oscillator'),
  createBufferSource(){
   if(failPhase==='allocate'){
    failPhase=null;throw Error('simulated output allocation failure');
   }
   return node('source');
  },
  createBuffer(_channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)};
  }};
 return {ctx,failNext:phase=>{failPhase=phase},getSourceStarts:()=>sourceStarts};
}

for(const phase of ['allocate','start']){
 test('D04 high-priority '+phase+' failure cannot silence an existing eight-voice mix',async()=>{
  const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES}=await load();
  const fixture=failingPreemptionFixture();
  const engine=createOriginalCombatFoley(fixture.ctx,{requireVerifiedContact:true});
  assert.equal(engine.enable(),true);
  const low=['draw','ranged-release','spell-release','cast-dry',
   'utility','guard','evade','recovery'];
  for(const [i,audio] of low.entries())
   assert.equal(engine.emit({audio,id:'low-'+i,priority:1}),true,audio);
  const before=engine.stats();
  assert.equal(before.activeVoices,MAX_ORIGINAL_COMBAT_VOICES);
  const starts=fixture.getSourceStarts();
  fixture.failNext(phase);
  const high={audio:'warden-release',id:'high-priority',priority:9};
  assert.equal(engine.emit(high),false,'failed WebAudio cannot report delivery');
  assert.equal(engine.stats().activeVoices,MAX_ORIGINAL_COMBAT_VOICES,
   'failed candidate must preserve all eight legitimate ongoing voices');
  assert.equal(engine.stats().stopped,before.stopped,
   'failed candidate must not preempt an existing sound');
  assert.equal(fixture.getSourceStarts(),starts,
   'failed candidate must not start a new noise voice');
  assert.equal(engine.emit(high),true,'same high-priority cue remains retryable');
  assert.equal(engine.stats().activeVoices,MAX_ORIGINAL_COMBAT_VOICES,
   'successful replacement must still meet the eight-voice cap');
  assert.equal(engine.stats().stopped,before.stopped+1,
   'only successful scheduling may retire a lower-priority voice');
  assert.ok(engine.stats().peakVoices<=MAX_ORIGINAL_COMBAT_VOICES);
  engine.dispose();
 });
}


// An old witnessed swing must not be reconstructed as fresh sound when the
// bounded event-ID cache rotates during a long real session. Public D04
// snapshots accept at most a five-tick authority gap, not arbitrary replay
// from much older ticks. These fake WebAudio checks do NOT prove PCM timing.
test('D04 evicted one-shot swing ID cannot replay after later verified ticks',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_CONFIRMED_CUE_IDS}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit(swing(7,'original')),true);
 for(let i=0;i<MAX_ORIGINAL_CONFIRMED_CUE_IDS+12;i++){
  f.ctx.currentTime=(i+1)*.1;
  assert.equal(engine.emit(swing(30+i,'new-'+i)),true,
   'new genuine public attempts remain independently audible');
 }
 const priorStarts=f.started.length;
 f.ctx.currentTime+=.1;
 assert.equal(engine.emit(swing(7,'original')),false,
  'evicted ID must not become a newly authorized historical attack');
 assert.equal(f.started.length,priorStarts,
  'rejected replay must allocate no audio source');
 assert.ok(engine.stats().confirmedCueIds<=MAX_ORIGINAL_CONFIRMED_CUE_IDS);
 assert.equal(engine.emit(swing(30+MAX_ORIGINAL_CONFIRMED_CUE_IDS+12,'fresh')),true);
 engine.dispose();
});

test('D04 strict foley permits five-tick delayed witnesses but rejects older injury replay',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit(swing(200,'first')),true);
 f.ctx.currentTime=.10;
 assert.equal(engine.emit(injury(195,'in-window')),true,
  'five-tick public backlog remains eligible on a timely submitted frame');
 f.ctx.currentTime=.20;
 const before=f.started.length;
 assert.equal(engine.emit(injury(194,'stale')),false,
  'six-tick-old public injury cannot manufacture new impact foley');
 assert.equal(f.started.length,before);
 engine.reset();
 f.ctx.currentTime=.30;
 assert.equal(engine.emit(injury(194,'new-session')),true,
  'explicit scene reset discards the old tick watermark');
 engine.dispose();
});

test('D04 failed WebAudio allocation does not advance historical tick rejection',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=failingPreemptionFixture();
 const engine=createOriginalCombatFoley(f.ctx,{requireVerifiedContact:true});
 engine.enable();
 f.failNext('allocate');
 assert.equal(engine.emit(swing(900,'failed')),false);
 assert.equal(engine.emit(swing(5,'legitimate')),true,
  'a never-delivered future cue cannot poison later source admission');
 engine.dispose();
});
