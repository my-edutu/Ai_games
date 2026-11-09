'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=n=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+n)).href);
const observation=(changes={})=>({
 sceneMatches:true,observedFrameVerified:true,elapsedSeconds:.02,
 submissionSeconds:.004,maxStalenessSeconds:.4,
 visualAccepted:true,visualAlive:true,visualDrawable:true,
 requiresMeasuredBlade:true,...changes
});
const snapshot=(tick,{action='idle',hp=30}={})=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,hp,maxHp:30,
  action,actionTick:tick
 }]
});
async function run({withLive=true,withDrawable=true,live=true,drawable=true,
 reducedMotion=false,art=true,damage=false}={}){
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const sounds=[];
 const visuals={emit(){return art},advance(){},reset(){},dispose(){}};
 if(withLive)visuals.hasLiveCue=()=>live;
 if(withDrawable)visuals.hasDrawableCue=()=>drawable;
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:true,reducedMotion,visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(cue){sounds.push(cue);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10));
 director.acceptSnapshot(snapshot(11,damage?{hp:22,action:'hurt'}:{action:'attack'}));
 director.advance(.016,.016);
 return {director,sounds};
}
test('sword sound requires confirmed liveness and drawable evidence, not merely accepted art',async()=>{
 const {classifySubmittedCombatAudio:gate}=await load('physical-feedback-frame-gate.js');
 assert.equal(gate(observation({visualDrawable:null})),'unverified-blade-visual');
 assert.equal(gate(observation({visualAlive:null})),'unverified-blade-visual');
 assert.equal(gate(observation({visualAlive:true,visualDrawable:false})),'await-drawable-visual');
 assert.equal(gate(observation({visualAlive:false})),'expired-visual');
 assert.equal(gate(observation({visualAccepted:false})),'missing-measured-blade');
 assert.equal(gate(observation()),'deliver');
});
test('injected adapter with no per-cue drawable query cannot authorize sword sound',async()=>{
 const h=await run({withDrawable:false});
 assert.equal(h.director.stats().awaitingPresentation,1);
 assert.equal(h.director.acknowledgePresentedFrame('no-drawable-query',.002),0);
 assert.equal(h.sounds.length,0);
 assert.equal(h.director.stats().recentDeliveryReceipts.at(-1).decision,'unverified-blade-visual');
 h.director.dispose();
});
test('injected adapter with no per-cue liveness query cannot authorize sword sound',async()=>{
 const h=await run({withLive:false});
 assert.equal(h.director.acknowledgePresentedFrame('no-live-query',.002),0);
 assert.equal(h.sounds.length,0);
 assert.equal(h.director.stats().recentDeliveryReceipts.at(-1).decision,'unverified-blade-visual');
 h.director.dispose();
});
test('genuine retained drawable trail still releases one whoosh after a submitted frame',async()=>{
 const h=await run();
 assert.equal(h.director.acknowledgePresentedFrame('measured',.003),1);
 assert.deepEqual(h.sounds.map(c=>c.audio),['whoosh']);
 assert.equal(h.director.acknowledgePresentedFrame('measured',.003),0);
 h.director.dispose();
});
test('deliberately reduced-motion swing retains accessible opt-in sound-only path',async()=>{
 const h=await run({art:false,reducedMotion:true,withLive:false,withDrawable:false});
 assert.equal(h.director.acknowledgePresentedFrame('reduced',.003),1);
 assert.deepEqual(h.sounds.map(c=>c.audio),['whoosh']);
 h.director.muteAudio();
 assert.equal(h.director.acknowledgePresentedFrame('muted',.003),0);
 h.director.dispose();
});
test('independently observed HP injury stays sound-capable without visual adapter queries',async()=>{
 const h=await run({art:false,withLive:false,withDrawable:false,damage:true});
 assert.equal(h.director.acknowledgePresentedFrame('real-injury',.003),1);
 assert.deepEqual(h.sounds.map(c=>c.kind),['damage']);
 assert.equal(h.sounds[0].actorId,null);
 assert.equal(h.sounds[0].targetId,'vanguard');
 h.director.dispose();
});
test('missing measured blade proof cannot persist across reset or mute',async()=>{
 const h=await run({withDrawable:false});
 h.director.muteAudio();
 assert.equal(h.director.stats().awaitingPresentation,0);
 assert.equal(h.director.acknowledgePresentedFrame('after-mute',.003),0);
 h.director.acceptSnapshot({...snapshot(1),run:2});
 assert.equal(h.director.acknowledgePresentedFrame('after-reset',.003),0);
 assert.equal(h.sounds.length,0);
 h.director.dispose();
});
