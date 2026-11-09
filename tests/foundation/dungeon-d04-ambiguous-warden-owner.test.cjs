'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const warden=(id,tick,overrides={})=>({
 id,kind:'warden',faction:'enemy',hp:75,maxHp:90,x:6,z:6,
 action:'idle',actionTick:tick,...overrides
});
const shot=(tick,units,events=[],extra={})=>({
 tick,run:1,floor:1,units,events,...extra
});
const open=tick=>({tick,kind:'opening',text:'anonymous recovery'});
const counter=tick=>({tick,kind:'counter',text:'anonymous counter'});
test('D04 never attaches an anonymous opening to array-first Warden when two live bosses exist',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(10,[warden('one',10)]);
 const next=shot(11,[
  warden('one',11,{action:'cast',recoveryUntilTick:12}),
  warden('other',11)
 ],[open(11)],{guardianWard:false,bossRecovery:{remaining:2}});
 assert.equal(planPhysicalFeedback(prior,next).some(c=>c.kind==='opening'),false,
  'even a unique cast cannot safely attribute an anonymous event among two live Wardens');
});
test('D04 a dead unrelated Warden does not hide the sole witnessed cast and recovery',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(10,[warden('one',10)]);
 const next=shot(11,[
  warden('one',11,{action:'cast',recoveryUntilTick:12}),
  warden('other',11,{hp:0})
 ],[open(11)],{guardianWard:false,bossRecovery:{remaining:2}});
 const openings=planPhysicalFeedback(prior,next).filter(c=>c.kind==='opening');
 assert.equal(openings.length,1);
 assert.equal(openings[0].actorId,'one');
});
test('D04 anonymous counter cannot attribute to the first of multiple observed Wardens',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(11,[
  warden('one',11,{recoveryUntilTick:12}),
  warden('two',11,{x:8,z:6,recoveryUntilTick:12})
 ]);
 const next=shot(12,[
  warden('one',11,{hp:68,recoveryUntilTick:12}),
  warden('two',11,{x:8,z:6,recoveryUntilTick:12})
 ],[counter(12)]);
 const cues=planPhysicalFeedback(prior,next);
 assert.equal(cues.some(c=>c.kind==='counter'),false);
 assert.ok(cues.some(c=>c.kind==='damage'&&c.targetId==='one'),
  'actual HP loss may still be conveyed without inventing counter attribution');
});
test('D04 a single witnessed Warden with active recovery and actual HP loss still earns counter',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(11,[warden('one',11,{recoveryUntilTick:12})]);
 const next=shot(12,[warden('one',11,{hp:68,recoveryUntilTick:12})],[counter(12)]);
 const cues=planPhysicalFeedback(prior,next);
 assert.equal(cues.filter(c=>c.kind==='counter').length,1);
 assert.equal(cues.find(c=>c.kind==='counter').targetId,'one');
});
