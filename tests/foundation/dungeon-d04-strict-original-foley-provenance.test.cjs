'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);
// Synthetic audio nodes test semantic authorization only. NOT browser PCM.
function fixture(){
 const sources=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){sources.push(this)},stop(){}});
 const ctx={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBufferSource:node,createBuffer(channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)}
  }};
 return {ctx,sources};
}
const sword=(id='vanguard',overrides={})=>({
 id:'1:1:7:swing:'+id+':-',sceneKey:'1:1',tick:7,
 kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
 verified:true,actorId:id,targetId:null,priority:4,severity:.5,...overrides
});
const injury=(id='revenant',fatal=false,overrides={})=>({
 id:'1:1:7:damage:-:'+id,sceneKey:'1:1',tick:7,
 kind:fatal?'damage-fatal':'damage',
 visual:'hit',audio:fatal?'fatal-impact':'impact',
 proof:'observed-hp-drop',verified:true,actorId:null,targetId:id,
 priority:7,severity:.6,...overrides
});
test('strict production foley cannot play a whoosh from an unverified action or invented source',async()=>{
 const {createOriginalCombatFoley}=await load(),{ctx,sources}=fixture();
 const f=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 assert.equal(f.enable(),true);
 for(const invalid of [
  sword('vanguard',{proof:'authority-event'}),
  sword('vanguard',{verified:false}),
  sword('vanguard',{actorId:null}),
  sword('vanguard',{actorId:'x'.repeat(129)}),
  sword('vanguard',{kind:'damage'}),
  sword('vanguard',{visual:'none'}),
  sword('vanguard',{tick:-1})
 ])assert.equal(f.emit(invalid),false,'unproven swing must be silent');
 assert.equal(f.stats().activeVoices,0);
 assert.equal(sources.length,0,'no source should start for rejected cue');
 assert.equal(f.emit(sword('vanguard')),true,'genuine action must remain audible');
 assert.equal(f.emit(sword('revenant')),true,'independent witnessed swords remain polyphonic');
 assert.equal(f.stats().activeVoices,2);
 f.dispose();
});
test('strict production foley never turns an invented attacker into real HP impact sound',async()=>{
 const {createOriginalCombatFoley}=await load(),{ctx,sources}=fixture();
 const f=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 f.enable();
 for(const invalid of [
  injury('revenant',false,{actorId:'guessed-attacker'}),
  injury('revenant',false,{proof:'authority-event'}),
  injury('revenant',false,{verified:false}),
  injury('revenant',false,{targetId:null}),
  injury('revenant',false,{kind:'block'}),
  injury('revenant',true,{kind:'damage'}),
  injury('revenant',true,{audio:'impact'})
 ])assert.equal(f.emit(invalid),false,'unverified injury must be silent');
 assert.equal(sources.length,0);
 assert.equal(f.stats().verifiedDamageTargets,0);
 assert.equal(f.emit(injury('revenant')),true);
 assert.equal(f.emit(injury('warden',true)),true);
 assert.equal(f.stats().activeVoices,2);
 f.dispose();
});
test('strictly rejected transients do not consume onset budgets, and mute clears admitted voices',async()=>{
 const {createOriginalCombatFoley}=await load(),{ctx}=fixture();
 const f=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});f.enable();
 for(let i=0;i<15;i++)assert.equal(f.emit(sword('vanguard',{verified:false})),false);
 assert.equal(f.stats().swingOnsets,0);
 assert.equal(f.emit(sword('vanguard')),true);
 f.disable();
 assert.equal(f.stats().activeVoices,0);
 assert.equal(f.emit(sword('revenant')),false);
 assert.equal(f.enable(),true);
 assert.equal(f.emit(injury('revenant')),true);
 assert.equal(f.emit({kind:'warden-release',audio:'warden-release',
  proof:'authority-action',verified:true,priority:8,severity:1}),true,
  'Warden release is distinct from damage and swing proof');
 f.dispose();
 assert.equal(f.stats().disposed,true);
});
test('older standalone audition adapters keep their existing permissive surface',async()=>{
 const {createOriginalCombatFoley}=await load(),{ctx}=fixture();
 const f=createOriginalCombatFoley(ctx);f.enable();
 assert.equal(f.emit(sword('vanguard',{proof:'authority-event'})),true);
 assert.equal(f.emit(injury('revenant',false,{actorId:'legacy-injected'})),true);
 f.dispose();
});
