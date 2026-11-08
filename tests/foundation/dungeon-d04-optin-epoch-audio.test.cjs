'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const state=(tick,hp=30,action='idle')=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp,maxHp:30,action,actionTick:tick
 }]
});
function mockAdapters(){
 const visuals=[],sounds=[];
 return {
  visuals,sounds,
  visualAdapter:{
   emit(cue){visuals.push(cue);return true},
   advance(){},reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},
   emit(cue){sounds.push(cue);return true},
   flush(){},disable(){},cleanup(){},dispose(){}
  }
 };
}
function draw(director,frameId,frames=3){
 for(let i=0;i<frames;i++)director.advance(.05,.05);
 return director.acknowledgePresentedFrame(frameId,0);
}

test('D04 delayed pre-gesture swing remains visible but cannot speak retroactively after opting in',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const f=mockAdapters();
 const d=createPhysicalCombatFeedback({...f,requirePresentedFrame:true});
 d.acceptSnapshot(state(10));
 d.acceptSnapshot(state(11,30,'attack'));
 assert.equal(d.enableAudioFromGesture(),true);
 assert.equal(draw(d,'first-real-submission'),0);
 assert.deepEqual(f.visuals.map(x=>x.kind),['swing']);
 assert.equal(f.sounds.length,0);
 assert.equal(d.stats().retroactiveAudioSuppressed,1);
 assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,
  'audio-opt-in-epoch-mismatch');
 // A fresh HP-confirmed injury accepted during consent is still audible.
 d.acceptSnapshot(state(12,21,'hurt'));
 d.advance(.016,.016);
 assert.equal(d.acknowledgePresentedFrame('second-real-submission',0),1);
 assert.deepEqual(f.sounds.map(x=>x.kind),['damage']);
 assert.equal(f.sounds[0].actorId,null,'HP loss never invents an attacker');
 d.dispose();
});

test('D04 a mute/re-enable gesture cannot play an earlier queued sword attempt',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const f=mockAdapters();
 const d=createPhysicalCombatFeedback({...f,requirePresentedFrame:true});
 d.acceptSnapshot(state(10));
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(state(11,30,'attack'));
 d.muteAudio();
 assert.equal(d.preferredMuted(),true);
 assert.equal(d.enableAudioFromGesture(),true);
 assert.equal(draw(d,'post-mute-frame'),0);
 assert.deepEqual(f.visuals.map(x=>x.kind),['swing']);
 assert.equal(f.sounds.length,0);
 assert.equal(d.stats().retroactiveAudioSuppressed,1);
 // A genuinely new witnessed attempt can still sound after re-enabling.
 d.acceptSnapshot(state(12,30,'attack'));
 assert.equal(draw(d,'fresh-action-frame'),1);
 assert.deepEqual(f.sounds.map(x=>x.kind),['swing']);
 d.dispose();
});

test('D04 newly accepted events still use the original non-gated immediate dispatch contract',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const f=mockAdapters();
 const d=createPhysicalCombatFeedback({...f,requirePresentedFrame:false});
 d.acceptSnapshot(state(10));
 d.enableAudioFromGesture();
 d.acceptSnapshot(state(11,20,'hurt'));
 assert.deepEqual(f.visuals.map(x=>x.kind),['damage']);
 assert.deepEqual(f.sounds.map(x=>x.kind),['damage']);
 assert.equal(d.stats().retroactiveAudioSuppressed,0);
 d.dispose();
});

test('D04 when no new gesture occurs, planned visuals remain silent throughout mute',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const f=mockAdapters();
 const d=createPhysicalCombatFeedback({...f,requirePresentedFrame:true});
 d.acceptSnapshot(state(10));
 d.enableAudioFromGesture();
 d.acceptSnapshot(state(11,30,'attack'));
 d.muteAudio();
 assert.equal(draw(d,'still-muted'),0);
 assert.deepEqual(f.visuals.map(x=>x.kind),['swing']);
 assert.equal(f.sounds.length,0);
 assert.equal(d.stats().audioOptedIn,false);
 d.dispose();
});
