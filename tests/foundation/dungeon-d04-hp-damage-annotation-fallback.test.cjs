'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const unit=(id,changes={})=>({
 id,kind:id==='hero'?'vanguard':'revenant',
 faction:id==='hero'?'party':'enemy',
 x:id==='hero'?2:3,z:2,hp:30,maxHp:30,
 action:'idle',actionTick:10,...changes
});
const state=(tick,units)=>({run:1,floor:1,tick,units,events:[]});
const pair=()=>[
 state(10,[unit('hero'),unit('enemy')]),
 state(11,[unit('hero',{hp:22,action:'hurt',actionTick:11}),
           unit('enemy',{hp:17,action:'hurt',actionTick:11})])
];
const wounds=cues=>cues.filter(c=>c.kind==='damage'||c.kind==='damage-fatal');
test('empty optional pose annotator never erases two real adjacent-tick HP losses',async()=>{
 const {planPhysicalFeedback}=await load();
 const [before,after]=pair();
 const raw=JSON.stringify(after);
 const result=wounds(planPhysicalFeedback(before,after,{
  deriveDamageBeats:()=>[],
  verifiedMeleeDelay:()=>.215
 }));
 assert.equal(result.length,2,'HP truth comes from snapshots, not optional art annotations');
 assert.deepEqual(new Set(result.map(c=>c.targetId)),new Set(['hero','enemy']));
 assert.ok(result.every(c=>c.verified===true&&c.proof==='observed-hp-drop'));
 assert.ok(result.every(c=>c.actorId===null&&c.delay===0));
 assert.equal(JSON.stringify(after),raw,'the planner must not mutate authority');
});
test('one trustworthy matched incoming lane cannot suppress another injured victim',async()=>{
 const {planPhysicalFeedback}=await load();
 const [before,after]=pair();
 const result=wounds(planPhysicalFeedback(before,after,{
  deriveDamageBeats:()=>[{id:'hero',kind:'vanguard',faction:'party',
   x:2,z:2,damage:8,maxHp:30,fatal:false,
   incoming:{sourceId:'enemy',dx:1,dz:0}}],
  verifiedMeleeDelay:()=>.215
 }));
 assert.equal(result.length,2);
 assert.equal(result.find(x=>x.targetId==='hero').delay,.215);
 assert.equal(result.find(x=>x.targetId==='enemy').delay,0);
 assert.ok(result.every(x=>x.actorId===null));
});
test('a thrown, inconsistent or fabricated external damage beat grants no false contact delay',async()=>{
 const {planPhysicalFeedback}=await load();
 const [before,after]=pair();
 const cases=[
  ()=>{throw Error('optional choreography unavailable')},
  ()=>[{id:'hero',kind:'vanguard',faction:'party',
   x:2,z:2,damage:999,maxHp:30,fatal:false,
   incoming:{sourceId:'enemy',dx:1,dz:0}}],
  ()=>[{id:'absent',kind:'vanguard',faction:'party',
   x:2,z:2,damage:8,maxHp:30,fatal:false,
   incoming:{sourceId:'enemy',dx:1,dz:0}}]
 ];
 for(const deriveDamageBeats of cases){
  const result=wounds(planPhysicalFeedback(before,after,{
   deriveDamageBeats,verifiedMeleeDelay:()=>.215
  }));
  assert.equal(result.length,2,'a failed/corrupt optional resolver cannot remove real wounds');
  assert.ok(result.every(x=>x.actorId===null&&x.delay===0),
   'invalid annotation cannot fabricate a synchronized melee impact');
 }
});
