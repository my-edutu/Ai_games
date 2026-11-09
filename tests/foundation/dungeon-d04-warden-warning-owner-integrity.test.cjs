'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const warden=(id,{hp=80,x=6,z=6}={})=>({
 id,kind:'warden',faction:'enemy',hp,maxHp:90,x,z,
 action:'idle',actionTick:19
});
const shot=(tick,units,{warning=true,events=[]}={})=>({
 run:1,floor:2,tick,units,events,
 bossWarning:warning?{
  warning:true,shape:'NOVA',attackTick:23,turnsUntilImpact:23-tick,
  cells:[{x:4,z:5},{x:4,z:6}]
 }:null
});
test('two live Wardens cannot borrow owner from array order for a public global warning',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(20,[warden('warden-A'),warden('warden-B',{x:8})]);
 const next=shot(21,[warden('warden-B',{x:8}),warden('warden-A')]);
 const cues=planPhysicalFeedback(prior,next);
 assert.equal(cues.some(c=>c.kind.startsWith('boss-warning')),false);
 const anonymous=cues.filter(c=>c.kind==='threat-warning');
 assert.equal(anonymous.length,1);
 assert.equal(anonymous[0].actorId,null);
 assert.equal(anonymous[0].visual,'none');
 assert.equal(anonymous[0].proof,'authority-warning-unattributed');
});
test('warning owner must be continuous across both adjacent public snapshots',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(20,[warden('old')]);
 const next=shot(21,[warden('new')]);
 const cues=planPhysicalFeedback(prior,next);
 assert.equal(cues.some(c=>c.kind.startsWith('boss-warning')),false);
 assert.deepEqual(cues.filter(c=>c.kind==='threat-warning').map(c=>c.actorId),[null]);
});
test('missing prior owner cannot establish source of already active anonymous warning',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(shot(20,[]),shot(21,[warden('new')]));
 assert.equal(cues.some(c=>c.kind.startsWith('boss-warning')),false);
 assert.equal(cues.filter(c=>c.kind==='threat-warning').length,1);
});
test('single stable living Warden retains genuine danger-cell cadence without identity guessing',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(20,[warden('boss'),warden('corpse',{hp:0,x:8})]);
 const next=shot(21,[warden('corpse',{hp:0,x:8}),warden('boss')]);
 const cues=planPhysicalFeedback(prior,next);
 const warning=cues.find(c=>c.kind==='boss-warning-rising');
 assert.equal(warning.actorId,'boss');
 assert.equal(warning.proof,'authority-warning-window');
 assert.deepEqual(warning.detail.cells,[{x:4,z:5},{x:4,z:6}]);
 assert.equal(cues.some(c=>c.kind==='threat-warning'),false);
});
test('an existing anonymous telegraph and ambiguous global warning share one neutral alert',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=shot(20,[warden('a'),warden('b',{x:8})]);
 const next=shot(21,[warden('a'),warden('b',{x:8})],{
  events:[{tick:21,kind:'telegraph',text:'unattributed danger'}]
 });
 const cues=planPhysicalFeedback(prior,next);
 assert.equal(cues.filter(c=>c.kind==='threat-warning').length,1);
 assert.equal(cues.some(c=>c.kind.startsWith('boss-warning')),false);
});
