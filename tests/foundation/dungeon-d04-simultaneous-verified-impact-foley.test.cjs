'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-dungeon/original-combat-foley.js')).href);
function fixture(){
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},connect(){},disconnect(){},
  start(){},stop(){}});
 const ctx={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBuffer(channels,length,rate){return {length,sampleRate:rate,duration:length/rate,
   getChannelData:()=>new Float32Array(length)}},
  createBufferSource:node};
 return ctx;
}
const damage=(targetId,audio='impact')=>({
 id:'1:1:12:damage:-:'+targetId,kind:'damage',proof:'observed-hp-drop',
 actorId:null,targetId,audio,priority:5,severity:.45
});
test('two independently HP-confirmed victims retain separate impact sounds in one submitted frame',async()=>{
 const {createOriginalCombatFoley}=await load();
 const ctx=fixture(),engine=createOriginalCombatFoley(ctx);
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit(damage('ranger')),true);
 assert.equal(engine.emit(damage('vanguard')),true,'different actual victims must not share one global impact cooldown');
 assert.equal(engine.stats().activeVoices,2);
 engine.dispose();
});
test('one target cannot multiply its foley; bounded onset density rejects a third simultaneous injury',async()=>{
 const {createOriginalCombatFoley}=await load();
 const ctx=fixture(),engine=createOriginalCombatFoley(ctx);
 engine.enable();
 assert.equal(engine.emit(damage('ranger')),true);
 assert.equal(engine.emit(damage('ranger')),false);
 assert.equal(engine.emit(damage('vanguard')),true);
 assert.equal(engine.emit(damage('mystic')),false,'three simultaneous hits would overwhelm stream mix');
 assert.equal(engine.stats().activeVoices,2);
 ctx.currentTime=.091;
 assert.equal(engine.emit(damage('mystic')),true,'the density window expires');
 engine.dispose();
});
test('fatal and nonfatal confirmed injury share the same limited simultaneous onset budget',async()=>{
 const {createOriginalCombatFoley}=await load();
 const engine=createOriginalCombatFoley(fixture());engine.enable();
 assert.equal(engine.emit(damage('revenant','fatal-impact')),true);
 assert.equal(engine.emit(damage('vanguard')),true);
 assert.equal(engine.emit(damage('mystic','fatal-impact')),false);
 engine.dispose();
});
test('unknown or attributed impact must not bypass original type cooldown',async()=>{
 const {createOriginalCombatFoley}=await load();
 const engine=createOriginalCombatFoley(fixture());engine.enable();
 const ordinary={...damage('ranger'),proof:'authority-event',kind:'block'};
 assert.equal(engine.emit(ordinary),true);
 assert.equal(engine.emit({...ordinary,id:'different',targetId:'vanguard'}),false);
 const invented={...damage('culprit'),actorId:'unverified-attacker',audio:'fatal-impact'};
 assert.equal(engine.emit(invented),true);
 assert.equal(engine.emit({...invented,targetId:'another'}),false);
 engine.dispose();
});
test('mute/re-enable resets distinct-injury cooldowns; all bookkeeping stays bounded',async()=>{
 const {createOriginalCombatFoley}=await load();
 const ctx=fixture(),engine=createOriginalCombatFoley(ctx);engine.enable();
 for(let i=0;i<45;i++){
  ctx.currentTime=i*.10;
  assert.equal(engine.emit(damage('enemy-'+i)),true);
  assert.ok(engine.stats().activeVoices<=8);
  assert.ok(engine.stats().verifiedDamageTargets<=16);
 }
 engine.disable();assert.equal(engine.stats().activeVoices,0);
 assert.equal(engine.emit(damage('enemy-44')),false);
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit(damage('enemy-44')),true);
 engine.dispose();
});
