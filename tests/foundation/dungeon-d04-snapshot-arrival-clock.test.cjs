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

test('real D04 HP cue records one bounded observation-to-render timeline, not proof of decoded sound',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const h=harness(createPhysicalCombatFeedback,()=>now);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 now=100.018;
 h.director.advance(.018,.018);
 now=100.025;
 assert.equal(h.director.acknowledgePresentedFrame(1,.005),1);
 const receipt=h.director.stats().recentDeliveryReceipts.at(-1);
 assert.equal(receipt.kind,'damage');
 assert.equal(receipt.audio,true);
 assert.equal(receipt.visual,true);
 assert.equal(receipt.frameId,1);
 assert.equal(receipt.observedClockMs,100000,
  'authentic observation needs its own clock reading, never the preceding frame start');
 assert.equal(receipt.submittedClockMs,100025,
  'submission stamp is taken only after the actual render acknowledgment');
 assert.equal(receipt.observationToSubmissionMs,25);
 assert.equal(receipt.renderSubmissionMs,5);
 assert.equal(receipt.sampleSynchronized,false,
  'a real WebAudio emit cannot certify decoded PCM or perceptual alignment');
 assert.equal(h.director.acknowledgePresentedFrame(1,.005),0);
 assert.equal(h.director.stats().recentDeliveryReceipts.length,1,
  'replayed frame may not fabricate a second audio onset or timestamp');
 h.director.dispose();
});

test('missing or backwards clocks do not fabricate A/V timing while scene and sound safety remain intact',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=50;
 const h=harness(createPhysicalCombatFeedback,()=>now);
 h.director.acceptSnapshot(snapshot(10,30));
 h.director.acceptSnapshot(snapshot(11,20));
 now=49; // Browser clock regression cannot become a negative measured latency.
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame(1,.003),1);
 const r=h.director.stats().recentDeliveryReceipts.at(-1);
 assert.equal(r.audio,true,'the established frame-based safety gate remains independent');
 assert.equal(r.observedClockMs,50000);
 assert.equal(r.submittedClockMs,null,
  'invalid/backwards wall stamps must never imply a synchronous impact');
 assert.equal(r.observationToSubmissionMs,null);
 assert.equal(r.sampleSynchronized,false);
 h.director.muteAudio();
 assert.equal(h.director.acknowledgePresentedFrame(2,.002),0);
 assert.equal(h.director.stats().recentDeliveryReceipts.length,1);
 h.director.dispose();
});
