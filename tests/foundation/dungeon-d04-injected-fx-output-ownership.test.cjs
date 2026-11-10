'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
function fixture(){
 const seen=[],heard=[],disabled=[];
 const ctx={state:'running'};
 const audio={
  enable(){return true},
  emit(cue){heard.push(cue);return true},
  disable(){disabled.push('disabled')},
  flush(){},cleanup(){},dispose(){}
 };
 const visuals={
  emit(cue){seen.push(cue);return true},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  advance(){},reset(){},dispose(){}
 };
 return {ctx,audio,visuals,seen,heard,disabled};
}
const state=(tick)=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',
  x:2,z:2,hp:30,maxHp:30,action:tick===10?'idle':'attack',actionTick:tick
 }]
});
function stage(d,tick){
 d.acceptSnapshot(state(tick));d.advance(.016,.016);
}
test('injected adapter rejects same-context FX bus replacement and retires staged sound',async()=>{
 const {createPhysicalCombatFeedback}=await load(),f=fixture();
 const a={name:'old-combat-fx'},b={name:'replacement-combat-fx'};
 const d=createPhysicalCombatFeedback({
  ctx:f.ctx,requirePresentedFrame:true,audioAdapter:f.audio,
  visualAdapter:f.visuals
 });
 assert.equal(d.attachAudioContext(f.ctx,{output:a}),true);
 assert.equal(d.enableAudioFromGesture(),true);
 stage(d,10);stage(d,11);
 assert.equal(d.stats().awaitingPresentation,1);
 assert.equal(d.attachAudioContext(f.ctx,{output:b}),false,
  'external adapter has no verified output rebinding capability');
 assert.equal(d.stats().injectedOutputMismatch,true);
 assert.equal(d.stats().audioOptedIn,false);
 assert.equal(d.stats().awaitingPresentation,0);
 assert.equal(d.enableAudioFromGesture(),false);
 assert.deepEqual(f.disabled,['disabled']);
 assert.equal(d.acknowledgePresentedFrame('old-output-frame',0),0);
 assert.equal(f.heard.length,0,'revoked output cannot deliver old staged sound');
 assert.equal(d.preferredMuted(),false,
  'automatic safety revocation is not a manual mute');
 assert.equal(d.attachAudioContext(f.ctx,{output:a}),true);
 assert.equal(d.stats().injectedOutputMismatch,false);
 assert.equal(d.enableAudioFromGesture(),true);
 stage(d,12);
 assert.equal(d.acknowledgePresentedFrame('fresh-output-frame',0),1);
 assert.deepEqual(f.heard.map(x=>x.tick),[12]);
 d.dispose();
});
test('same injected context and same FX bus identity is idempotent',async()=>{
 const {createPhysicalCombatFeedback}=await load(),f=fixture(),bus={name:'stable-fx'};
 const d=createPhysicalCombatFeedback({
  ctx:f.ctx,requirePresentedFrame:true,audioAdapter:f.audio,
  visualAdapter:f.visuals
 });
 assert.equal(d.attachAudioContext(f.ctx,{output:bus}),true);
 assert.equal(d.enableAudioFromGesture(),true);
 assert.equal(d.attachAudioContext(f.ctx,{output:bus}),true);
 assert.equal(d.stats().audioOptedIn,true);
 stage(d,10);stage(d,11);
 assert.equal(d.acknowledgePresentedFrame(1,0),1);
 assert.equal(f.heard.length,1);
 assert.equal(f.disabled.length,0);
 d.dispose();
});
test('explicit null FX bus after known injected output is a new unsupported route',async()=>{
 const {createPhysicalCombatFeedback}=await load(),f=fixture(),bus={name:'fx'};
 const d=createPhysicalCombatFeedback({
  ctx:f.ctx,requirePresentedFrame:true,audioAdapter:f.audio,
  visualAdapter:f.visuals
 });
 d.attachAudioContext(f.ctx,{output:bus});d.enableAudioFromGesture();
 assert.equal(d.attachAudioContext(f.ctx,{output:null}),false);
 assert.equal(d.stats().injectedOutputMismatch,true);
 assert.equal(d.enableAudioFromGesture(),false);
 assert.equal(d.attachAudioContext(f.ctx,{output:bus}),true);
 assert.equal(d.enableAudioFromGesture(),true);
 d.muteAudio();
 assert.equal(d.preferredMuted(),true);
 assert.equal(d.stats().audioOptedIn,false);
 d.dispose();
});
