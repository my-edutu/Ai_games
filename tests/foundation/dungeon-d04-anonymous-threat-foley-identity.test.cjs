'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const foley=()=>import(pathToFileURL(path.join(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);
const planner=()=>import(pathToFileURL(path.join(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
// Synthetic WebAudio nodes prove admission/cleanup, never decoded speaker PCM.
function audioFixture(){
 const starts=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){starts.push(this)},stop(){}});
 return {starts,ctx:{state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBufferSource:node,createBuffer(_channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)}
  }}};
}
const scene=(tick,changes={})=>({tick,run:1,floor:1,units:[],events:[],...changes});
async function authoredThreat(){
 const {planPhysicalFeedback}=await planner();
 return planPhysicalFeedback(scene(7),scene(8,{
  events:[{tick:8,kind:'telegraph',text:'unattributed warning'}]
 })).find(c=>c.kind==='threat-warning');
}
async function unattributedBossThreat(){
 const {planPhysicalFeedback}=await planner();
 const warden={id:'warden',kind:'warden',faction:'enemy',x:3,z:3,
  hp:80,maxHp:80,action:'idle',actionTick:7};
 return planPhysicalFeedback(scene(7),scene(8,{
  units:[warden],
  bossWarning:{warning:true,shape:'NOVA',turnsUntilImpact:2,attackTick:10,
   cells:[{x:4,z:3}]}
 })).find(c=>c.kind==='threat-warning');
}
test('anonymous public threat events and unowned real Warden warnings remain audible but never gain an actor',async()=>{
 const {createOriginalCombatFoley,isCanonicalVerifiedCombatFoleyCue}=await foley();
 for(const genuine of [await authoredThreat(),await unattributedBossThreat()]){
  assert.ok(genuine,'positive warning must come from the real public planner');
  assert.equal(genuine.actorId,null);
  assert.equal(genuine.targetId,null);
  assert.equal(genuine.visual,'none');
  assert.equal(isCanonicalVerifiedCombatFoleyCue(genuine),true,
   'semantic neutral proof must be a canonical witnessed warning');
  const {ctx,starts}=audioFixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
  try{
   assert.equal(engine.enable(),true);
   assert.equal(engine.emit(genuine),true,'a real neutral warning may be heard');
   assert.equal(engine.emit(genuine),false,'the same authority event may sound only once');
   assert.equal(engine.stats().confirmedCueIds,1);
   assert.equal(engine.stats().activeVoices,1);
   assert.equal(starts.length,2); // seeded noise, inharmonic warning partial
  }finally{engine.dispose()}
 }
});
test('invented Warden warnings, borrowed event identities and fake anonymous sound never schedule WebAudio',async()=>{
 const {createOriginalCombatFoley,isCanonicalVerifiedCombatFoleyCue}=await foley();
 const genuine=await authoredThreat();
 assert.ok(genuine);
 const forged=[
  {...genuine,verified:false},
  {...genuine,actorId:'warden'},
  {...genuine,targetId:'hero'},
  {...genuine,from:{x:3,z:4}},
  {...genuine,to:{x:3,z:4}},
  {...genuine,visual:'warning'},
  {...genuine,proof:'authority-action'},
  {...genuine,id:genuine.id+':spoof'},
  {...genuine,sceneKey:'1:2'},
  {...genuine,tick:9},
  {...genuine,audio:'boss-warning'},
  {audio:'threat-warning',priority:5},
  {audio:'boss-warning',priority:5}
 ];
 const {ctx,starts}=audioFixture(),engine=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 try{
  assert.equal(engine.enable(),true);
  for(const cue of forged){
   assert.equal(isCanonicalVerifiedCombatFoleyCue(cue),false,
    'only planner-shaped anonymous alerts may be canonical');
   assert.equal(engine.emit(cue),false,'invalid warning must not sound');
  }
  assert.equal(starts.length,0);
  assert.equal(engine.stats().activeVoices,0);
  assert.equal(engine.stats().confirmedCueIds,0);
  assert.equal(engine.stats().recentOriginalStarts.length,0);
  assert.equal(engine.emit(genuine),true,'invalid warnings never starve valid one');
 }finally{engine.dispose()}
});
test('original sound audition can still play a neutral warning without pretending it is public gameplay',async()=>{
 const {createOriginalCombatFoley}=await foley();
 const {ctx}=audioFixture(),engine=createOriginalCombatFoley(ctx);
 try{
  assert.equal(engine.enable(),true);
  assert.equal(engine.emit({audio:'threat-warning'}),true);
 }finally{engine.dispose()}
});
