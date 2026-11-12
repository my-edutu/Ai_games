'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const folder=path.resolve(__dirname,'../../public/ai-dungeon');
const load=async file=>import(pathToFileURL(path.join(folder,file)).href);
const hero=(changes={})=>({id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10,targetId:null,...changes});
const foe=(changes={})=>({id:'revenant',kind:'revenant',faction:'enemy',x:3,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10,targetId:null,...changes});
const map=()=>Array.from({length:9},()=>'.'.repeat(9));
const snap=(tick,changes={})=>({tick,run:1,floor:1,phase:'exploring',map:map(),
 units:[hero(),foe()],events:[],...changes});

// Regression for D04's live frame pressure: a queued effect is not a submitted
// visual, nor an audible hit. Capacity losses must have their OWN receipt.
test('D04 records every unsubmitted HP cue rejected by the bounded pending queue',async()=>{
 const {createPhysicalCombatFeedback,MAX_PHYSICAL_PENDING}=await load('physical-combat-feedback.js');
 const units=tick=>Array.from({length:18},(_,i)=>({
  id:'foe-'+i,kind:'revenant',faction:'enemy',x:i%9,z:Math.floor(i/9),
  hp:100-tick,maxHp:100,action:'idle',actionTick:0
 }));
 const snapshot=tick=>snap(tick,{units:units(tick)});
 let rendered=0,sounded=0;
 const c=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>1,
  visualAdapter:{emit(){rendered++;return true},advance(){},reset(){},stats(){return {active:0}}},
  audioAdapter:{enable(){return true},emit(){sounded++;return true},cleanup(){},flush(){},stats(){return {activeVoices:0}}}
 });
 for(let tick=0;tick<=3;tick++)c.acceptSnapshot(snapshot(tick));
 const s=c.stats();
 assert.equal(s.pending,MAX_PHYSICAL_PENDING);
 assert.equal(s.pendingOverflow,22);
 const dropped=s.recentDeliveryReceipts.filter(r=>r.decision==='pending-cap-rejected');
 assert.equal(dropped.length,22,'every rejected authentic HP cue needs a bounded audit receipt');
 assert.ok(dropped.every(r=>r.kind==='damage'&&r.visual===false&&r.audio===false&&
  r.frameId===null&&r.scene==='1:1'&&r.observationToSubmissionMs===null));
 assert.equal(rendered,0);assert.equal(sounded,0);
 c.dispose();
});

test('D04 accounts for weaker queued gestures preempted by real HP-loss pressure',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const snapshot=tick=>snap(tick,{units:Array.from({length:18},(_,i)=>({
  id:'hero-'+i,kind:'vanguard',faction:'party',x:i%9,z:Math.floor(i/9),
  hp:tick===3?89:100,maxHp:100,action:tick===3?'hurt':tick===0?'idle':'guard',
  actionTick:tick
 }))});
 const c=createPhysicalCombatFeedback({requirePresentedFrame:true,clock:()=>1});
 for(let tick=0;tick<=3;tick++)c.acceptSnapshot(snapshot(tick));
 const s=c.stats(),evicted=s.recentDeliveryReceipts.filter(r=>r.decision==='pending-cap-preempted');
 assert.equal(s.pending,32);
 assert.equal(evicted.length,18,'priority eviction cannot erase queued gesture provenance');
 assert.ok(evicted.every(r=>r.kind==='guard'&&r.visual===false&&r.audio===false&&r.frameId===null));
 assert.equal(s.recentDeliveryReceipts.filter(r=>r.decision==='pending-cap-rejected').length,4);
 assert.equal(s.visualAccepted,0);assert.equal(s.audioAccepted,0);
 c.dispose();
});

test('D04 audits actual visual cues displaced before WebGL/audio frame receipt',async()=>{
 const {createPhysicalCombatFeedback,MAX_AUDIO_AWAITING_FRAME}=await load('physical-combat-feedback.js');
 const snapshot=tick=>snap(tick,{units:Array.from({length:18},(_,i)=>({
  id:'foe-'+i,kind:'revenant',faction:'enemy',x:i%9,z:Math.floor(i/9),
  hp:100-tick,maxHp:100,action:'idle',actionTick:0
 }))});
 let sounded=0;
 const c=createPhysicalCombatFeedback({requirePresentedFrame:true,clock:()=>1,
  visualAdapter:{emit:()=>true,advance(){},reset(){},stats(){return {active:0}}},
  audioAdapter:{enable:()=>true,emit(){sounded++;return true},cleanup(){},flush(){},stats(){return {activeVoices:0}}}
 });
 c.acceptSnapshot(snapshot(0));assert.equal(c.enableAudioFromGesture(),true);
 for(let tick=1;tick<=2;tick++){c.acceptSnapshot(snapshot(tick));c.advance(.016,.016)}
 const s=c.stats();
 assert.equal(s.awaitingPresentation,MAX_AUDIO_AWAITING_FRAME);
 assert.equal(s.staleAudioDropped,4);
 const rejected=s.recentDeliveryReceipts.filter(r=>r.decision==='awaiting-frame-cap-rejected');
 assert.equal(rejected.length,4,'visual scheduling is not submitted-frame proof');
 assert.ok(rejected.every(r=>r.kind==='damage'&&r.audio===false&&r.frameId===null));
 assert.equal(sounded,0,'no WebGL acknowledgement means no original audio');
 c.dispose();
});
