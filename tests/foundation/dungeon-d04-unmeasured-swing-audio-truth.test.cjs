'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);
const observation=(changes={})=>({
 sceneMatches:true,observedFrameVerified:true,elapsedSeconds:.02,
 submissionSeconds:.006,maxStalenessSeconds:.4,visualAccepted:false,
 visualAlive:false,visualDrawable:false,requiresMeasuredBlade:true,...changes
});
const snapshot=(tick,{action='idle',hp=30}={})=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,hp,maxHp:30,
  action,actionTick:tick
 }]
});
async function stage({art=false,reducedMotion=false}={}){
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 let drawable=false;const played=[];
 const director=createPhysicalCombatFeedback({
  reducedMotion,requirePresentedFrame:true,
  visualAdapter:{
   emit(){return art},advance(){},hasLiveCue(){return art},
   hasDrawableCue(){return drawable},reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(c){played.push(c);return true},
   disable(){},flush(){},cleanup(){},dispose(){}
  }
 });
 assert.equal(director.enableAudioFromGesture(),true);
 return {director,played,setDrawable(v){drawable=v}};
}
test('pure frame gate distinguishes absent measured sword from sound-only event',async()=>{
 const {classifySubmittedCombatAudio:gate}=await load('physical-feedback-frame-gate.js');
 assert.equal(gate(observation()),'missing-measured-blade');
 assert.equal(gate(observation({requiresMeasuredBlade:false})),'deliver',
  'genuine HP loss or neutral anonymous block must remain sound-capable');
 assert.equal(gate(observation({visualAccepted:true,visualAlive:true})),
  'await-drawable-visual','hidden rig wrist is not measured passage');
 assert.equal(gate(observation({visualAccepted:true,visualAlive:true,visualDrawable:true})),
  'deliver');
 assert.equal(gate(observation({elapsedSeconds:.51})),'stale-frame');
 assert.equal(gate(observation({observedFrameVerified:false})),'unverified-frame');
});
test('unmounted sword emits no fictional whoosh despite a genuine adjacent action tick',async()=>{
 const h=await stage();
 h.director.acceptSnapshot(snapshot(10));
 h.director.acceptSnapshot(snapshot(11,{action:'attack'}));
 h.director.advance(.016,.016);
 assert.equal(h.director.stats().awaitingPresentation,1);
 assert.equal(h.director.acknowledgePresentedFrame('missing-rig',.006),0);
 assert.equal(h.played.length,0);
 assert.equal(h.director.stats().awaitingPresentation,0);
 const receipt=h.director.stats().recentDeliveryReceipts.at(-1);
 assert.equal(receipt?.decision,'missing-measured-blade');
 assert.equal(receipt?.audio,false);
 assert.equal(h.director.acknowledgePresentedFrame('missing-rig',.006),0);
 h.director.dispose();
});
test('measured but hidden trail remains silent until drawable frame submission',async()=>{
 const h=await stage({art:true});
 h.director.acceptSnapshot(snapshot(10));
 h.director.acceptSnapshot(snapshot(11,{action:'attack'}));
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame('hidden',.003),0);
 assert.equal(h.director.stats().awaitingPresentation,1);
 h.setDrawable(true);
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame('observed-motion',.003),1);
 assert.equal(h.played.length,1);
 assert.equal(h.played[0].audio,'whoosh');
 assert.equal(h.director.acknowledgePresentedFrame('observed-motion',.003),0);
 h.director.dispose();
});
test('intentional reduced-motion suppression retains legitimate audio alternative',async()=>{
 const h=await stage({reducedMotion:true});
 h.director.acceptSnapshot(snapshot(10));
 h.director.acceptSnapshot(snapshot(11,{action:'attack'}));
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame('reduced',.003),1);
 assert.equal(h.played.length,1);
 h.director.muteAudio();
 assert.equal(h.director.stats().awaitingPresentation,0);
 assert.equal(h.director.acknowledgePresentedFrame('muted',.003),0);
 h.director.dispose();
});
test('real victim-only HP damage remains audible without optional VFX',async()=>{
 const h=await stage();
 h.director.acceptSnapshot(snapshot(10));
 h.director.acceptSnapshot(snapshot(11,{hp:21,action:'hurt'}));
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame('injury',.003),1);
 assert.deepEqual(h.played.map(x=>x.kind),['damage']);
 assert.equal(h.played[0].actorId,null);
 assert.equal(h.played[0].targetId,'vanguard');
 h.director.dispose();
});
test('a queued blade cue is cancelled on scene reset without a ghost sound',async()=>{
 const h=await stage();
 h.director.acceptSnapshot(snapshot(10));
 h.director.acceptSnapshot(snapshot(11,{action:'attack'}));
 h.director.advance(.016,.016);
 h.director.acceptSnapshot({...snapshot(1),run:2});
 assert.equal(h.director.acknowledgePresentedFrame('new-run',.003),0);
 assert.equal(h.played.length,0);
 assert.equal(h.director.stats().awaitingPresentation,0);
 h.director.dispose();
});
