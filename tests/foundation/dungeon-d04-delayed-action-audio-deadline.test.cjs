'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

// Test public-action snapshots, not an invented attacker/contact. The explicit
// target only authorizes an aimed launch; it never asserts a landed hit.
const snapshot=(tick,kind,action)=>({
 run:1,floor:1,tick,events:[],units:[
  {id:'hero',kind,faction:'party',x:2,z:2,hp:30,maxHp:30,
   action,actionTick:tick,targetId:'enemy'},
  {id:'enemy',kind:'revenant',faction:'enemy',x:4,z:2,hp:30,maxHp:30,
   action:'idle',actionTick:10}
 ]
});
async function delayedAction(kind,action,frames,submissionSeconds){
 const {createPhysicalCombatFeedback}=await load();
 const visuals=[],sounds=[];
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:true,resolveContact:()=>({targetId:'enemy',distance:2}),
  visualAdapter:{
   emit(cue){visuals.push(cue);return true},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   advance(){},reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){sounds.push(cue);return true},
   flush(){},cleanup(){},disable(){},dispose(){}
  }
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10,kind,'idle'));
 director.acceptSnapshot(snapshot(11,kind,action));
 for(let i=0;i<frames;i++)director.advance(.05,.05);
 const released=director.acknowledgePresentedFrame('submitted-webgl-frame',submissionSeconds);
 const receipt=director.stats().recentDeliveryReceipts.at(-1);
 director.dispose();
 return {released,visuals,sounds,receipt};
}
test('D04 spell audio deadline includes its 290ms staging, never restarts at visual emission',async()=>{
 const result=await delayedAction('mystic','cast',6,.12);
 assert.equal(result.visuals.length,1,'the aimed spell may still draw');
 assert.equal(result.visuals[0].kind,'spell-release');
 assert.equal(result.released,0,'300ms staging plus 120ms submission exceeds 400ms');
 assert.equal(result.sounds.length,0,'late spell must not sound after its original action');
 assert.equal(result.receipt.decision,'stale-frame');
 assert.equal(result.receipt.intendedDelayMs,290);
});
test('D04 ranger release cannot exploit a new 400ms deadline after staging',async()=>{
 const result=await delayedAction('ranger','attack',5,.18);
 assert.equal(result.visuals[0].kind,'ranged-release');
 assert.equal(result.released,0,'250ms elapsed plus 180ms submission exceeds 400ms');
 assert.deepEqual(result.sounds,[]);
 assert.equal(result.receipt.decision,'stale-frame');
});
test('D04 genuinely timely staged spell can still sound after a submitted frame',async()=>{
 const result=await delayedAction('mystic','cast',6,.06);
 assert.equal(result.released,1,'300ms plus 60ms is within the original deadline');
 assert.deepEqual(result.sounds.map(c=>c.kind),['spell-release']);
 assert.equal(result.receipt.decision,'delivered');
 assert.equal(result.receipt.scheduledDelayMs,290);
});
test('D04 timely staged ranger release retains its original audio and aim-only meaning',async()=>{
 const result=await delayedAction('ranger','attack',5,.02);
 assert.equal(result.released,1);
 assert.equal(result.sounds.length,1);
 assert.equal(result.sounds[0].proof,'authority-action');
 assert.equal(result.sounds[0].targetId,'enemy');
 assert.equal(result.sounds[0].kind,'ranged-release');
 assert.equal(result.sounds[0].visual,'launch');
 assert.equal(result.receipt.decision,'delivered');
});
