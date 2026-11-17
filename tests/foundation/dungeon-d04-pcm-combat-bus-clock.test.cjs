'use strict';
// D04-only authentic original WebAudio recording contract. ScriptProcessor
// is a legacy existing soundstage tap; no synthetic cue or device playback
// qualifies a real-game sample onset or A/V synchronization.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const url=f=>'data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,f),'utf8')).toString('base64');
async function load(){
 const source=fs.readFileSync(path.join(root,'soundstage.js'),'utf8')
  .replace("'/dungeon/soundstage-plan.js'","'"+url('soundstage-plan.js')+"'")
  .replace("'/dungeon/impact-choreography-plan.js'","'"+url('impact-choreography-plan.js')+"'")
  .replace("'/dungeon/facing-plan.js'","'"+url('facing-plan.js')+"'")
  .replace("'/dungeon/material-foley.js'","'"+url('material-foley.js')+"'");
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
function fakeContext(){
 const gains=[],processors=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},
  setTargetAtTime(){},cancelScheduledValues(){}});
 const node=()=>({links:[],connect(other){this.links.push(other)},
  disconnect(other){if(other)this.links=this.links.filter(n=>n!==other);else this.links=[]}});
 const ctx={
  currentTime:0,state:'running',sampleRate:48000,destination:node(),
  createGain(){const gain={...node(),gain:param()};gains.push(gain);return gain},
  createOscillator(){return {...node(),frequency:param(),start(){},stop(){}}},
  createScriptProcessor(size,ins,outs){
   assert.equal(size,1024);assert.equal(ins,1);assert.equal(outs,1);
   const p=node();processors.push(p);return p;
  }
 };
 return {ctx,gains,processors};
}
function submitPcm(processor,{first=1,invalid=false,gapAt=-1}={}){
 const sampleRate=48000,block=1024;
 for(let i=0;i<24;i++){
  const playbackTime=invalid?undefined:first+i*block/sampleRate+
   (i>=gapAt&&gapAt>=0?.2:0);
  processor.onaudioprocess({playbackTime,
   inputBuffer:{getChannelData(){return new Float32Array(block).fill(.2)}}});
 }
}
test('D04 FX-only PCM uses real consented FX bus, not ambient master; records contiguous AudioContext sample window',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains,processors}=fakeContext();
 const stage=createDungeonSoundstage(ctx,{suppressCombat:true});
 try{
  assert.equal(stage.enable(),true);
  const p=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  assert.equal(processors.length,1);
  assert.ok(gains[2].links.includes(processors[0]),'tap the original combat FX bus');
  assert.equal(gains[0].links.includes(processors[0]),false,'not the ambience/master mix');
  submitPcm(processors[0]);
  const result=await p;
  assert.equal(result.status,'RECORDED');
  assert.equal(result.captureBus,'d04-combat-fx-pre-master');
  assert.equal(result.frames,24000);
  assert.equal(result.pcmClock.status,'CONTIGUOUS_CONTEXT_TIME_ONLY');
  assert.equal(result.pcmClock.firstSampleContextSeconds,1);
  assert.ok(Math.abs(result.pcmClock.lastSampleEndContextSeconds-1.5)<1e-9);
  assert.equal(result.pcmClock.blocks,24);
  assert.equal(result.pcmClock.discontinuities,0);
  assert.equal(result.sampleSynchronized,false,
   'an AudioContext timestamp does not prove decoded contact onset or video sync');
  assert.equal(gains[2].links.includes(processors[0]),false,'tap disconnected after capture');
 }finally{stage.dispose()}
});
test('D04 never fabricates a sample timeline from missing or noncontiguous processor playback times',async()=>{
 const {createDungeonSoundstage}=await load();
 for(const scenario of [{invalid:true,status:'UNVERIFIED_MISSING_OR_INVALID_CLOCK'},
  {gapAt:9,status:'UNVERIFIED_NONCONTIGUOUS_CONTEXT_TIME'}]){
  const {ctx,processors}=fakeContext(),stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  try{
   assert.equal(stage.enable(),true);
   const p=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
   submitPcm(processors[0],scenario);
   const result=await p;
   assert.equal(result.status,'RECORDED','PCM can exist without a trustworthy time axis');
   assert.equal(result.pcmClock.status,scenario.status);
   assert.equal(result.pcmClock.firstSampleContextSeconds,null);
   assert.equal(result.pcmClock.lastSampleEndContextSeconds,null);
   assert.equal(result.sampleSynchronized,false);
  }finally{stage.dispose()}
 }
});
test('legacy soundstage cannot opt into D04-only combat PCM and stays on original mix',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains,processors}=fakeContext(),stage=createDungeonSoundstage(ctx);
 try{
  assert.equal(stage.enable(),true);
  const refused=await stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  assert.equal(refused.status,'UNAVAILABLE');
  assert.equal(processors.length,0);
  const p=stage.recordOriginalPcm(.5);
  assert.ok(gains[0].links.includes(processors[0]),'legacy default continues recording master');
  submitPcm(processors[0]);
  const result=await p;
  assert.equal(result.captureBus,'original-master-mix');
 }finally{stage.dispose()}
});

test('D04 real browser requests original FX-only PCM only in the gated spectator',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(app.includes("recordOriginalPcm(seconds,physicalFeedback?{source:'d04-combat-fx'}:undefined)"),
  'legacy default records its original mix; only D04 taps the existing combat FX stem');
});
