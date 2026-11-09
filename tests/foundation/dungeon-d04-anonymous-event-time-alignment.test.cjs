'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const hero=(hp=30,extra={})=>({id:'vanguard',kind:'vanguard',faction:'party',
 x:2,z:2,hp,maxHp:30,action:'idle',actionTick:10,...extra});
const enemy=(extra={})=>({id:'revenant',kind:'revenant',faction:'enemy',
 x:3,z:2,hp:30,maxHp:30,action:'idle',actionTick:10,...extra});
const warden=(hp,extra={})=>({id:'warden',kind:'warden',faction:'enemy',
 x:4,z:4,hp,maxHp:75,action:'idle',actionTick:10,...extra});
const snap=(tick,units,events=[])=>({run:1,floor:1,tick,units,events});

test('block event from skipped ticks retains neutral sound without an invented late injury or shield contact',async()=>{
 const {planPhysicalFeedback}=await load();
 const before=snap(10,[hero(),enemy()]);
 const after=snap(13,[hero(24,{action:'guard',guardTick:11,actionTick:11}),enemy()],
  [{tick:11,kind:'block',text:'untrusted actor description'}]);
 const cues=planPhysicalFeedback(before,after),block=cues.find(c=>c.kind==='block');
 assert.ok(block);
 assert.equal(block.audio,'block');
 assert.equal(block.actorId,null);
 assert.equal(block.from,null);
 assert.equal(block.proof,'authority-event');
 assert.equal(cues.some(c=>c.kind==='damage'||c.kind==='damage-fatal'),false,
  'a multi-tick HP delta cannot establish a frame-accurate contact');
});

test('even a block event on the latest tick cannot time-stamp an HP loss across an unseen intermediate tick',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(snap(10,[hero(),enemy()]),
  snap(12,[hero(22,{action:'guard',guardTick:12,actionTick:12}),enemy()],
   [{tick:12,kind:'block'}]));
 const block=cues.find(c=>c.kind==='block');
 assert.ok(block);
 assert.equal(block.actorId,null);
 assert.equal(block.audio,'block');
 assert.equal(cues.some(c=>c.kind==='damage'&&c.targetId==='vanguard'),false,
  'latest-tick block does not time-stamp an older, unobserved HP drop');
});

test('a delayed evade event cannot claim final-position footfall as an exact dodge cell',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(snap(10,[hero(),enemy()]),
  snap(13,[hero(30,{x:3,action:'move',actionTick:11}),enemy()],
   [{tick:11,kind:'evade'}]));
 assert.equal(cues.some(c=>c.kind==='evade'),false,
  'stale generic evade may denote a missed attack, never a verified bootstep');
});

test('a delayed counter event plus multi-tick Warden HP loss cannot claim an earned melee contact',async()=>{
 const {planPhysicalFeedback}=await load();
 const before=snap(24,[hero(),warden(75,{recoveryUntilTick:25})]);
 const after=snap(27,[hero(),warden(48,{action:'hurt',actionTick:27,recoveryUntilTick:25})],
  [{tick:25,kind:'counter'}]);
 const cues=planPhysicalFeedback(before,after);
 assert.equal(cues.some(c=>c.kind==='counter'),false);
 assert.equal(cues.some(c=>c.kind==='damage'&&c.targetId==='warden'),false,
  'multi-tick real HP loss updates state but cannot fake a timed Warden impact');
});

test('adjacent-tick evidence preserves grounded guarded contact, dodge dust, and earned Warden counter',async()=>{
 const {planPhysicalFeedback}=await load();
 const block=planPhysicalFeedback(snap(10,[hero(),enemy()]),
  snap(11,[hero(22,{action:'guard',guardTick:11,actionTick:11}),enemy()],
   [{tick:11,kind:'block'}])).find(c=>c.kind==='block');
 assert.equal(block.actorId,'vanguard');
 assert.deepEqual(block.from,{x:2,z:2});
 const evade=planPhysicalFeedback(snap(10,[hero(),enemy()]),
  snap(11,[hero(30,{x:3,action:'move',actionTick:11}),enemy()],
   [{tick:11,kind:'evade'}])).find(c=>c.kind==='evade');
 assert.equal(evade.actorId,'vanguard');
 assert.deepEqual(evade.from,{x:2,z:2});
 assert.deepEqual(evade.to,{x:3,z:2});
 const counter=planPhysicalFeedback(
  snap(24,[hero(),warden(75,{recoveryUntilTick:25})]),
  snap(25,[hero(),warden(48,{action:'hurt',actionTick:25})],
   [{tick:25,kind:'counter'}])).find(c=>c.kind==='counter');
 assert.ok(counter);
 assert.equal(counter.targetId,'warden');
 assert.equal(counter.actorId,null);
 assert.equal(counter.proof,'authority-counter-and-HP');
});
