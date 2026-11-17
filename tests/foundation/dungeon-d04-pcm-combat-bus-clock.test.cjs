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
  assert.equal(gains.length,7,'D04 gain count includes buses, two ambient beds and PCM silent sink');
  assert.equal(stage.combatEffectsInput(),gains[3],'D04 original sound uses its isolated output');
  assert.equal(gains[3].gain.value,1,'physical foley loudness unchanged');
  assert.ok(gains[3].links.includes(gains[2]),'D04 foley feeds old FX once');
  assert.ok(gains[2].links.includes(gains[0]),'old FX still feeds master');
  assert.ok(gains[3].links.includes(processors[0]),'tap dedicated D04 output');
  assert.equal(gains[2].links.includes(processors[0]),false,
   'legacy footfalls and rewards must not enter D04 impact PCM');
  assert.equal(gains[0].links.includes(processors[0]),false,'not the ambience/master mix');
  submitPcm(processors[0]);
  const result=await p;
  assert.equal(result.status,'RECORDED');
  assert.equal(result.captureBus,'d04-combat-fx-pre-master');
  assert.equal(result.captureTopology,'d04-original-foley-only-v1');
  assert.equal(result.frames,24000);
  assert.equal(result.pcmClock.status,'CONTIGUOUS_CONTEXT_TIME_ONLY');
  assert.equal(result.pcmClock.firstSampleContextSeconds,1);
  assert.ok(Math.abs(result.pcmClock.lastSampleEndContextSeconds-1.5)<1e-9);
  assert.equal(result.pcmClock.blocks,24);
  assert.equal(result.pcmClock.discontinuities,0);
  assert.equal(result.sampleSynchronized,false,
   'an AudioContext timestamp does not prove decoded contact onset or video sync');
  assert.equal(gains[3].links.includes(processors[0]),false,'tap disconnected after capture');
  assert.ok(gains[3].links.includes(gains[2]),'audio graph still routes after tap release');
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
  assert.equal(result.captureTopology,'legacy-master-mix-v1');
  assert.equal(gains.length,6,'legacy gain count includes three buses, two beds and PCM sink');
 }finally{stage.dispose()}
});

test('D04 real browser requests original FX-only PCM only in the gated spectator',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(app.includes("recordOriginalPcm(seconds,physicalFeedback?{source:'d04-combat-fx'}:undefined)"),
  'legacy default records its original mix; only D04 taps the existing combat FX stem');
});


test('D04 audio-thread PCM stays in the live silent output graph, delivers one bounded stem and retires processor errors',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains}=fakeContext(),nodes=[],requestedModules=[];
 const oldNode=globalThis.AudioWorkletNode;
 ctx.audioWorklet={addModule:async url=>{requestedModules.push(url)}};
 globalThis.AudioWorkletNode=class {
  constructor(context,name,options){
   assert.equal(context,ctx);
   assert.equal(name,'d04-original-foley-pcm');
   assert.equal(options.numberOfInputs,1);
   assert.equal(options.numberOfOutputs,1);
   assert.deepEqual(options.outputChannelCount,[1]);
   assert.equal(options.processorOptions.frames,24000);
   this.links=[];this.onprocessorerror=null;
   this.port={onmessage:null,messages:[],postMessage(message){this.messages.push(message)}};
   nodes.push(this);
  }
  connect(target){this.links.push(target)}
  disconnect(){this.links.length=0}
 };
 let stage=null;
 try{
  stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  assert.equal(stage.enable(),true);
  const promise=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  for(let i=0;i<12&&!nodes.length;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.length,1,'live D04 processor attached after original module load');
  assert.deepEqual(requestedModules,['/dungeon/d04-combat-pcm-worklet.js']);
  const node=nodes[0];
  assert.ok(gains[3].links.includes(node),'worklet still samples the physical foley bus');
  assert.ok(gains[3].links.includes(gains[2]),'ordinary original foley remains audible exactly once');
  assert.ok(node.links.includes(ctx.destination),
   'worklet outputs verified silence directly to destination, not a prunable zero-gain sink');
  assert.equal(gains.length,6,'no additional gain node or audible voice for the PCM diagnostic');
  assert.equal(typeof node.onprocessorerror,'function','processor failures must resolve promptly');
  const samples=new Int16Array(24000).fill(5000);
  node.port.onmessage({data:{type:'complete',buffer:samples.buffer,
   frames:24000,firstFrame:48000,blocks:188,invalidClocks:0,discontinuities:0}});
  const pcm=await promise;
  assert.equal(pcm.status,'RECORDED');
  assert.equal(pcm.captureBus,'d04-combat-fx-pre-master');
  assert.equal(pcm.captureTopology,'d04-original-foley-audio-thread-v1');
  assert.equal(pcm.pcmClock.status,'CONTIGUOUS_CONTEXT_TIME_ONLY');
  assert.equal(pcm.pcmClock.firstSampleContextSeconds,1);
  assert.equal(pcm.sampleSynchronized,false,'original PCM is not decoded A/V contact');
  assert.deepEqual(node.port.messages,[{type:'stop'}]);
  assert.equal(node.links.length,0,'successful stem retires its output connection');
  assert.equal(node.onprocessorerror,null);
  assert.ok(gains[3].links.includes(gains[2]),'ordinary D04 foley remains connected');
  const failedPromise=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  for(let i=0;i<12&&nodes.length<2;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.length,2,'a clean subsequent capture is allowed');
  nodes[1].onprocessorerror();
  const failed=await failedPromise;
  assert.equal(failed.status,'UNAVAILABLE');
  assert.equal(failed.reason,'Audio-thread PCM processor failure');
  assert.equal(nodes[1].links.length,0,'error path releases the recording graph');
  assert.deepEqual(nodes[1].port.messages,[{type:'stop'}]);
 }finally{
  stage?.dispose();
  if(oldNode===undefined)delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode=oldNode;
 }
});


test('D04 original PCM recording budget starts after module load and node connection, not before',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx}=fakeContext(),nodes=[],timers=[];
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
 const oldNode=globalThis.AudioWorkletNode;
 let completeModule;
 ctx.audioWorklet={addModule:()=>new Promise(resolve=>{completeModule=resolve})};
 globalThis.setTimeout=(callback,ms)=>{
  const timer={callback,ms,cleared:false};timers.push(timer);return timer;
 };
 globalThis.clearTimeout=timer=>{if(timer)timer.cleared=true};
 globalThis.AudioWorkletNode=class {
  constructor(){this.links=[];this.port={onmessage:null,messages:[],
   postMessage(value){this.messages.push(value)}};nodes.push(this)}
  connect(target){this.links.push(target)}
  disconnect(){this.links.length=0}
 };
 let stage=null;
 try{
  stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  assert.equal(stage.enable(),true);
  const pending=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  await Promise.resolve();await Promise.resolve();
  assert.equal(timers.length,1,'only the loading-phase watchdog exists before module resolves');
  assert.equal(timers[0].ms,12000);
  assert.equal(nodes.length,0,'no node or PCM samples before browser module completes');
  completeModule();
  for(let i=0;i<12&&!nodes.length;i++)await Promise.resolve();
  assert.equal(nodes.length,1);
  assert.equal(timers.length,2,'the separate bounded recording watchdog starts after connection');
  assert.equal(timers[0].cleared,true,'loading timer cannot kill a live recording');
  assert.ok(timers[1].ms>=20000,'heavy original WebGL stalls allow delayed PCM message delivery');
  assert.equal(timers[1].cleared,false);
  const buffer=new Int16Array(24000).fill(2000).buffer;
  nodes[0].port.onmessage({data:{type:'complete',buffer,frames:24000,
   firstFrame:48000,blocks:188,invalidClocks:0,discontinuities:0}});
  const result=await pending;
  assert.equal(result.status,'RECORDED');
  assert.equal(result.pcmClock.status,'CONTIGUOUS_CONTEXT_TIME_ONLY');
  assert.equal(result.sampleSynchronized,false);
  assert.equal(timers[1].cleared,true,'no orphan PCM timeout after success');
  assert.deepEqual(nodes[0].port.messages,[{type:'stop'}]);
 }finally{
  stage?.dispose();
  globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;
  if(oldNode===undefined)delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode=oldNode;
 }
});

test('D04 unresponsive audio-worklet module cannot connect late or leak a recording session',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx}=fakeContext(),timers=[],nodes=[];
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
 const oldNode=globalThis.AudioWorkletNode;
 let finishModule;
 ctx.audioWorklet={addModule:()=>new Promise(resolve=>{finishModule=resolve})};
 globalThis.setTimeout=(callback,ms)=>{
  const timer={callback,ms,cleared:false};timers.push(timer);return timer;
 };
 globalThis.clearTimeout=timer=>{if(timer)timer.cleared=true};
 globalThis.AudioWorkletNode=class {constructor(){nodes.push(this)}};
 let stage=null;
 try{
  stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  assert.equal(stage.enable(),true);
  const pending=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  await Promise.resolve();await Promise.resolve();
  assert.equal(timers.length,1);
  timers[0].callback();
  const result=await pending;
  assert.equal(result.status,'UNAVAILABLE');
  assert.equal(result.reason,'Audio-thread PCM module load timed out');
  finishModule();
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(nodes.length,0,'a late-loaded module must not resurrect capture after expiry');
  assert.equal(timers[0].cleared,true);
 }finally{
  stage?.dispose();
  globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;
  if(oldNode===undefined)delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode=oldNode;
 }
});


test('D04 primes the original PCM worklet on consent before capture, without an extra voice or module fetch',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains}=fakeContext(),nodes=[];
 const oldNode=globalThis.AudioWorkletNode;
 let finishLoad,calls=0;
 ctx.audioWorklet={addModule:url=>{
  calls++;
  assert.equal(url,'/dungeon/d04-combat-pcm-worklet.js');
  return new Promise(resolve=>{finishLoad=resolve});
 }};
 globalThis.AudioWorkletNode=class {
  constructor(){this.links=[];this.port={onmessage:null,messages:[],
   postMessage(message){this.messages.push(message)}};nodes.push(this)}
  connect(target){this.links.push(target)}
  disconnect(){this.links.length=0}
 };
 let stage;
 try{
  stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  assert.equal(calls,0,'no module loading or sound creation before user consent');
  assert.equal(stage.enable(),true);
  assert.equal(calls,1,'preload begins immediately after real user audio opt-in');
  assert.equal(nodes.length,0,'preloading never instantiates or voices a diagnostic processor');
  assert.equal(stage.stats().voices,0);
  assert.ok(gains[3].links.includes(gains[2]),'original combat foley still goes to the normal FX mix once');
  finishLoad();
  for(let i=0;i<12;i++)await Promise.resolve();
  const pending=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  for(let i=0;i<12&&!nodes.length;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,1,'capture reuses the consent-time module rather than reloading mid-combat');
  assert.equal(nodes.length,1);
  const pcm=new Int16Array(24000).fill(2048).buffer;
  nodes[0].port.onmessage({data:{type:'complete',buffer:pcm,frames:24000,
   firstFrame:48000,blocks:188,invalidClocks:0,discontinuities:0}});
  const recorded=await pending;
  assert.equal(recorded.status,'RECORDED');
  assert.equal(recorded.captureBus,'d04-combat-fx-pre-master');
  assert.equal(recorded.sampleSynchronized,false,'preloading is not audible impact/video contact proof');
  assert.equal(nodes[0].links.length,0,'completed recorder retires its silent output');
  assert.equal(stage.stats().voices,0,'no audio voice was introduced by diagnostic preload');
 }finally{
  stage?.dispose();
  if(oldNode===undefined)delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode=oldNode;
 }
});

test('D04 consent-time module failure does not mute foley or permanently poison later PCM recording',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx}=fakeContext(),nodes=[];
 const oldNode=globalThis.AudioWorkletNode;
 let calls=0;
 ctx.audioWorklet={addModule:()=>{
  calls++;
  return calls===1?Promise.reject(Error('temporary module load failure')):Promise.resolve();
 }};
 globalThis.AudioWorkletNode=class {
  constructor(){this.links=[];this.port={onmessage:null,postMessage(){}};nodes.push(this)}
  connect(target){this.links.push(target)}
  disconnect(){this.links.length=0}
 };
 let stage;
 try{
  stage=createDungeonSoundstage(ctx,{suppressCombat:true});
  assert.equal(stage.enable(),true,'module load is diagnostic-only and cannot block audible opt-in');
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(stage.stats().enabled,true);
  const pending=stage.recordOriginalPcm(.5,{source:'d04-combat-fx'});
  for(let i=0;i<12&&!nodes.length;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,2,'failed preloading may be retried only on a requested capture');
  assert.equal(nodes.length,1);
  nodes[0].port.onmessage({data:{type:'complete',buffer:new Int16Array(24000).fill(256).buffer,
   frames:24000,firstFrame:48000,blocks:188,invalidClocks:0,discontinuities:0}});
  assert.equal((await pending).status,'RECORDED');
 }finally{
  stage?.dispose();
  if(oldNode===undefined)delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode=oldNode;
 }
});
