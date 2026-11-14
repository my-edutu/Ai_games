'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);

// Simulated nodes exercise original production admission, not browser PCM.
function fixture(){
 const starts=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){starts.push(this)},stop(){}});
 const ctx={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBufferSource:node,createBuffer(channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)};
  }};
 return {ctx,starts};
}
const swing=(tick=7,actorId='vanguard')=>({
 id:`1:1:${tick}:swing:${actorId}:-`,
 sceneKey:'1:1',tick,kind:'swing',visual:'trail',audio:'whoosh',
 proof:'authority-attempt-not-hit',verified:true,actorId,targetId:null,
 priority:4,severity:.5
});
const injury=(tick=8,targetId='revenant',fatal=false)=>({
 id:`1:1:${tick}:${fatal?'damage-fatal':'damage'}:-:${targetId}`,
 sceneKey:'1:1',tick,kind:fatal?'damage-fatal':'damage',visual:'hit',
 audio:fatal?'fatal-impact':'impact',proof:'observed-hp-drop',
 verified:true,actorId:null,targetId,priority:6,severity:.6
});

test('D04 strict original foley refuses a swing with a borrowed event identity',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx,starts}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit({...swing(),id:injury().id}),false);
 assert.equal(starts.length,0,'invalid cue cannot allocate a sound source');
 assert.equal(engine.emit(swing()),true,'genuine swing remains audible');
 engine.dispose();
});

test('D04 strict original foley ties sword actor, tick and scene to ID',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx,starts}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 engine.enable();
 for(const cue of [
  {...swing(),actorId:'revenant'},
  {...swing(),tick:8},
  {...swing(),sceneKey:'2:1'},
  {...swing(),sceneKey:'1:0'},
  {...swing(),sceneKey:'01:1'},
  {...swing(),sceneKey:'9007199254740992:1'},
  {...swing(),tick:-1}
 ]){
  assert.equal(engine.emit(cue),false,JSON.stringify(cue));
 }
 assert.equal(starts.length,0);
 engine.dispose();
});

test('D04 strict HP impact cannot borrow another victim or scene identity',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx,starts}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 engine.enable();
 for(const cue of [
  {...injury(),targetId:'warden'},
  {...injury(),sceneKey:'1:2'},
  {...injury(),tick:9},
  {...injury(),kind:'damage-fatal',audio:'fatal-impact'},
  {...injury(),id:swing().id}
 ])assert.equal(engine.emit(cue),false);
 assert.equal(starts.length,0);
 assert.equal(engine.emit(injury()),true);
 ctx.currentTime=.12;
 assert.equal(engine.emit(injury(9,'warden',true)),true);
 engine.dispose();
});

test('D04 strict valid same-tick independent identities remain polyphonic',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 engine.enable();
 assert.equal(engine.emit(swing(7,'vanguard')),true);
 assert.equal(engine.emit(swing(7,'revenant')),true);
 assert.equal(engine.emit(swing(7,'vanguard')),false);
 assert.equal(engine.stats().confirmedCueIds,2);
 engine.dispose();
});

test('D04 canonical ID guard is production-only; standalone original foley auditions still work',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx}=fixture(),engine=createOriginalCombatFoley(ctx);
 engine.enable();
 assert.equal(engine.emit({audio:'whoosh',id:'standalone-audition'}),true);
 engine.dispose();
});

test('strict original WebAudio start receipts preserve verified event identity without claiming decoded Opus',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_RECORDED_STARTS}=await load();
 const {ctx,starts}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 assert.equal(MAX_ORIGINAL_RECORDED_STARTS,32);
 assert.equal(engine.enable(),true);
 assert.deepEqual(engine.stats().recentOriginalStarts,[]);
 assert.equal(engine.emit(injury(8,'revenant')),true);
 assert.ok(starts.length>=1,'actual mocked WebAudio source.start() must occur');
 const [first]=engine.stats().recentOriginalStarts;
 assert.equal(first.cueId,'1:1:8:damage:-:revenant');
 assert.equal(first.kind,'damage');
 assert.equal(first.audio,'impact');
 assert.equal(first.sceneKey,'1:1');
 assert.equal(first.tick,8);
 assert.equal(first.scheduledContextMs,0);
 assert.ok(first.startedSources>=1);
 assert.equal(first.sampleSynchronized,false);
 assert.equal(engine.emit(injury(8,'revenant')),false,'duplicate has no second source start');
 assert.equal(engine.stats().recentOriginalStarts.length,1);
 ctx.currentTime=.15;
 assert.equal(engine.emit(swing(9,'vanguard')),true);
 const latest=engine.stats().recentOriginalStarts.at(-1);
 assert.equal(latest.cueId,'1:1:9:swing:vanguard:-');
 assert.equal(latest.audio,'whoosh');
 assert.equal(latest.scheduledContextMs,150);
 assert.equal(latest.sampleSynchronized,false);
 engine.disable();
 assert.deepEqual(engine.stats().recentOriginalStarts,[],
  'mute and same-scene cleanup must not retain stale source receipts');
 engine.dispose();
});

test('original source start telemetry is capped and rejected actions never become sound evidence',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_RECORDED_STARTS}=await load();
 const {ctx}=fixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit({...swing(1),verified:false}),false);
 assert.equal(engine.stats().recentOriginalStarts.length,0);
 for(let i=0;i<MAX_ORIGINAL_RECORDED_STARTS+5;i++){
  ctx.currentTime=i*.4;
  assert.equal(engine.emit(injury(i+10,'victim'+i)),true);
 }
 const receipts=engine.stats().recentOriginalStarts;
 assert.equal(receipts.length,MAX_ORIGINAL_RECORDED_STARTS);
 assert.equal(receipts[0].cueId,'1:1:15:damage:-:victim5');
 assert.equal(receipts.at(-1).cueId,'1:1:46:damage:-:victim36');
 assert.equal(receipts.some(x=>x.sampleSynchronized!==false),false);
 assert.equal(engine.stats().activeVoices<=8,true);
 engine.flush();
 assert.equal(engine.stats().recentOriginalStarts.length,0);
 engine.dispose();
});

test('strict D04 original source-start receipt bridges a real AudioContext output timestamp only as an estimate',async()=>{
 const {createOriginalCombatFoley}=await load();
 const {ctx}=fixture();
 ctx.currentTime=7;
 // Both output fields use the Web Audio getOutputTimestamp clock domains.
 // This is a host-clock estimate, NOT decoded PCM onset or A/V sync proof.
 ctx.getOutputTimestamp=()=>({contextTime:6.98,performanceTime:1000});
 const engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 try{
  assert.equal(engine.enable(),true);
  assert.equal(engine.emit(swing(30)),true);
  const [receipt]=engine.stats().recentOriginalStarts;
  assert.equal(receipt.cueId,swing(30).id);
  assert.equal(receipt.scheduledContextMs,7000);
  assert.equal(receipt.estimatedOutputPerformanceMs,1020);
  assert.equal(receipt.sampleSynchronized,false);
  assert.ok(engine.stats().activeVoices<=8);
 }finally{engine.dispose()}
});

test('invalid, stale, unsupported and throwing output timestamp probes never counterfeit a source-start clock',async()=>{
 const {createOriginalCombatFoley}=await load();
 for(const getTimestamp of [
  undefined,
  ()=>({contextTime:7000,performanceTime:1000}),
  ()=>({contextTime:6.98,performanceTime:Infinity}),
  ()=>({contextTime:-1,performanceTime:1000}),
  ()=>{throw Error('output device timestamp not available')}
 ]){
  const {ctx}=fixture();
  ctx.currentTime=7;
  if(getTimestamp)ctx.getOutputTimestamp=getTimestamp;
  const engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
  try{
   assert.equal(engine.enable(),true);
   assert.equal(engine.emit(swing(30)),true);
   const [receipt]=engine.stats().recentOriginalStarts;
   assert.equal(receipt.estimatedOutputPerformanceMs,null);
   assert.equal(receipt.sampleSynchronized,false);
   assert.equal(receipt.startedSources,1);
   assert.ok(engine.stats().activeVoices<=8);
  }finally{engine.dispose()}
 }
});
