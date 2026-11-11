'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const snapshot=(tick,hp,action='hurt',kind='vanguard')=>({
 run:1,floor:1,tick,events:[],
 units:[{id:'hero',kind,faction:'party',x:2,z:2,hp,maxHp:30,
  action,actionTick:tick}]
});
function harness(createPhysicalCombatFeedback,clock,requirePresentedFrame=true){
 const visual=[],audio=[];
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame,clock,
  visualAdapter:{emit(cue){visual.push(cue);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(cue){audio.push(cue);return true},
   flush(){},cleanup(){},disable(){},dispose(){}}
 });
 assert.equal(director.enableAudioFromGesture(),true);
 return {director,visual,audio};
}
test('new damage observed AFTER the previous GPU stall is not pre-aged by its prior frame interval',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const h=harness(createPhysicalCombatFeedback,()=>now);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 // Previous frame was expensive (1.2 seconds), but this HP witness arrived
 // 20ms before this advance. It still needs an actual timely WebGL submit.
 now+=.020;
 h.director.advance(.05,1.2);
 assert.equal(h.visual.length,1,'fresh authenticated injury must reach the first frame');
 assert.equal(h.director.stats().expiredQueuedCues,0);
 assert.equal(h.audio.length,0,'a visual is not an audible frame receipt');
 assert.equal(h.director.acknowledgePresentedFrame(1,.025),1);
 assert.equal(h.audio.length,1);
 assert.equal(h.director.stats().recentDeliveryReceipts.at(-1).decision,'delivered');
 h.director.dispose();
});
test('a truly late authority witness still expires even if first advance occurs after it',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const h=harness(createPhysicalCombatFeedback,()=>now);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 now+=.75;
 h.director.advance(.05,.75);
 assert.equal(h.visual.length,0);
 assert.ok(h.director.stats().expiredQueuedCues>=1);
 assert.equal(h.director.acknowledgePresentedFrame(1,.02),0);
 assert.equal(h.audio.length,0);
 h.director.dispose();
});
test('freshly admitted injury cannot sound if its genuine WebGL submission itself stalls',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const h=harness(createPhysicalCombatFeedback,()=>now);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 now+=.018;
 h.director.advance(.018,.8);
 assert.equal(h.visual.length,1);
 assert.equal(h.director.acknowledgePresentedFrame(1,.65),0);
 assert.equal(h.audio.length,0);
 h.director.dispose();
});
test('invalid/nonmonotonic arrival clocks fail closed under an unverified long frame',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 for(const clock of [()=>NaN,()=>-1,()=>Infinity,(()=>{let n=100;return()=>--n})()]){
  const h=harness(createPhysicalCombatFeedback,clock);
  h.director.acceptSnapshot(snapshot(10,30));
  h.director.acceptSnapshot(snapshot(11,20));
  h.director.advance(.05,.8);
  assert.equal(h.visual.length,0);
  assert.equal(h.audio.length,0);
  assert.ok(h.director.stats().expiredQueuedCues>=1);
  h.director.dispose();
 }
});
test('legacy non-submission mode still admits immediate HP event without requiring a clock',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const h=harness(createPhysicalCombatFeedback,()=>NaN,false);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 assert.equal(h.visual.length,1);
 assert.equal(h.audio.length,1);
 h.director.dispose();
});
