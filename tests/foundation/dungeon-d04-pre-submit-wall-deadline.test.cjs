'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const snapshot=(tick,hp)=>({run:1,floor:1,tick,events:[],
 units:[{id:'victim',kind:'vanguard',faction:'party',x:2,z:2,
 hp,maxHp:30,action:hp<30?'hurt':'idle',actionTick:tick}]});

async function run({clock,elapsedBeforeAck=0,renderSeconds=.015,muted=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const played=[],retired=[],created=[];
 const visualAdapter={
  emit(cue){created.push(cue);return true},advance(){},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  retireStaleCue(id,reason){retired.push({id,reason});return true},
  reset(){},dispose(){}
 };
 const audioAdapter={
  enable(){return true},emit(cue){played.push(cue);return true},
  cleanup(){},flush(){},disable(){},dispose(){}
 };
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:clock===undefined?()=>now:clock,
  visualAdapter,audioAdapter
 });
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,30));
  d.acceptSnapshot(snapshot(11,20));
  d.advance(.016,.016);
  assert.equal(created.length,1,'verified HP impact reaches a genuine render opportunity');
  assert.equal(played.length,0,'no original sound before actual submission');
  if(muted)d.muteAudio();
  now+=elapsedBeforeAck;
  const delivered=d.acknowledgePresentedFrame(1,renderSeconds);
  return {delivered,played,retired,created,stats:d.stats()};
 }finally{d.dispose()}
}

test('late main-thread work between D04 advance and WebGL submit cannot authorize stale original impact',async()=>{
 const r=await run({elapsedBeforeAck:.7,renderSeconds:.018});
 assert.equal(r.delivered,0,'a real 700ms observation-to-submit delay exceeds the unchanged 400ms bound');
 assert.equal(r.played.length,0,'submitted WebGL alone cannot justify an old impact');
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'stale-frame');
 assert.deepEqual(r.retired.map(x=>x.reason),['stale-frame'],
  'retire the stale injury fragment so a subsequent rendered frame cannot show ghost impact');
});

test('fresh HP-confirmed impact remains audible at a timely genuine submission',async()=>{
 const r=await run({elapsedBeforeAck:.20,renderSeconds:.025});
 assert.equal(r.delivered,1);
 assert.deepEqual(r.played.map(x=>x.kind),['damage']);
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'delivered');
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).sampleSynchronized,false);
});

test('a real clock below the deadline does not double-charge the same renderer interval',async()=>{
 const r=await run({elapsedBeforeAck:.35,renderSeconds:.18});
 assert.equal(r.delivered,1,'elapsed wall time already includes real WebGL submission; do not sum it twice');
 assert.equal(r.played.length,1);
});

test('missing trusted wall clock keeps the existing raw-frame deadline',async()=>{
 const r=await run({clock:()=>NaN,renderSeconds:.39});
 assert.equal(r.delivered,0,'raw frame interval plus submit still exceeds 400ms');
 assert.equal(r.played.length,0);
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'stale-frame');
});

test('mute still prevents delayed audio independent of genuine HP evidence',async()=>{
 const r=await run({elapsedBeforeAck:.03,muted:true});
 assert.equal(r.delivered,0);
 assert.deepEqual(r.played,[]);
});

test('one public snapshot and one submitted frame use one clock sample per boundary for simultaneous injuries',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const before=()=>({run:1,floor:1,tick:10,events:[],units:[
  {id:'hero',kind:'vanguard',faction:'party',x:2,z:2,hp:30,maxHp:30,action:'idle',actionTick:10},
  {id:'ally',kind:'mystic',faction:'party',x:3,z:2,hp:30,maxHp:30,action:'idle',actionTick:10}
 ]});
 const after=()=>({...before(),tick:11,units:before().units.map(u=>({
  ...u,hp:20,action:'hurt',actionTick:11
 }))});
 let calls=0;
 const audio=[],visual=[];
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>100+(++calls)*.01,
  visualAdapter:{emit(cue){visual.push(cue);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(cue){audio.push(cue);return true},
   flush(){},cleanup(){},disable(){},dispose(){}}
 });
 try{
  assert.equal(director.enableAudioFromGesture(),true);
  director.acceptSnapshot(before());
  const beforeSnapshotCalls=calls;
  director.acceptSnapshot(after());
  assert.equal(visual.length,0,'no effects before a real render opportunity');
  assert.equal(calls-beforeSnapshotCalls,1,
   'all HP losses in one immutable public snapshot share their observation boundary');
  director.advance(.016,.016);
  assert.equal(visual.filter(c=>c.proof==='observed-hp-drop').length,2);
  const beforeReceiptCalls=calls;
  assert.equal(director.acknowledgePresentedFrame(1,.012),2);
  assert.equal(calls-beforeReceiptCalls,1,
   'one real renderer acknowledgement supplies exactly one trusted timestamp');
  const receipts=director.stats().recentDeliveryReceipts.filter(r=>r.audio);
  assert.equal(receipts.length,2);
  assert.equal(new Set(receipts.map(r=>r.observedClockMs)).size,1);
  assert.equal(new Set(receipts.map(r=>r.submittedClockMs)).size,1);
  // One extra post-visual-work clock read now separates real-frame phases.
  assert.ok(receipts.every(r=>r.observationToSubmissionMs===30));
  assert.ok(receipts.every(r=>r.beforeVisualAdvanceMs===10&&
   r.visualAdvanceMs===10&&r.afterVisualAdvanceToSubmissionMs===10));
  assert.ok(receipts.every(r=>r.sampleSynchronized===false));
  assert.deepEqual(new Set(audio.map(c=>c.targetId)),new Set(['hero','ally']));
  assert.equal(director.acknowledgePresentedFrame(1,.012),0,'replay must not create a second receipt');
 }finally{director.dispose()}
});


test('D04 receipt separates pre-advance, visual-work and post-visual frame stall without relaxing stale audio',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const original=[],retired=[];
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>now,
  visualAdapter:{
   emit(){return true},
   advance(){now+=.011}, // Measured, controlled retained-visual work.
   hasLiveCue(){return true},hasDrawableCue(){return true},
   retireStaleCue(id,reason){retired.push(reason);return true},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){original.push(cue);return true},
   flush(){},cleanup(){},disable(){},dispose(){}
  }
 });
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,30));
  d.acceptSnapshot(snapshot(11,20)); // Real HP loss observed at t=100.
  now+=.032; // Legitimate waiting before the D04 advance begins.
  d.advance(.016,.016); // D04 visual work advances injected clock by 11ms.
  now+=2.740; // Heavy non-visual wait and WebGL work before submission.
  assert.equal(d.acknowledgePresentedFrame(1,.013),0);
  const receipt=d.stats().recentDeliveryReceipts.at(-1);
  assert.equal(receipt.decision,'stale-frame');
  assert.equal(receipt.observationToSubmissionMs,2783);
  assert.equal(receipt.beforeVisualAdvanceMs,32);
  assert.equal(receipt.visualAdvanceMs,11);
  assert.equal(receipt.afterVisualAdvanceToSubmissionMs,2740);
  assert.equal(receipt.renderSubmissionMs,13);
  assert.equal(original.length,0,'late authoritative HP loss must not trigger old impact foley');
  assert.deepEqual(retired,['stale-frame']);
  assert.equal(receipt.sampleSynchronized,false);
 }finally{d.dispose()}
});

test('a missing or nonmonotonic D04 visual-work sample cannot fabricate phase attribution',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const values=[100,100.05,99.9,100.2];
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>values.shift()??100.2,
  visualAdapter:{emit(){return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(){return true},
   flush(){},cleanup(){},disable(){},dispose(){}}
 });
 try{
  d.enableAudioFromGesture();
  d.acceptSnapshot(snapshot(10,30));
  d.acceptSnapshot(snapshot(11,20));
  d.advance(.016,.016);
  d.acknowledgePresentedFrame(1,.015);
  const receipt=d.stats().recentDeliveryReceipts.at(-1);
  assert.equal(receipt.observationToSubmissionMs,200);
  assert.equal(receipt.beforeVisualAdvanceMs,50);
  assert.equal(receipt.visualAdvanceMs,null);
  assert.equal(receipt.afterVisualAdvanceToSubmissionMs,null);
  assert.equal(receipt.sampleSynchronized,false);
 }finally{d.dispose()}
});
