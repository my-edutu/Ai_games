'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);

// These are public snapshot contracts, not WebGL recordings or sound auditions.
// Authority's planWardenStrike exposes three movement beats for NOVA and
// ECLIPSE_SWEEP, but only two for RIFT_CROSS. No event prose identifies owner.
const boss=(id='warden')=>({
 id,kind:'warden',faction:'enemy',hp:80,maxHp:100,
 x:7,z:7,action:'idle',actionTick:11
});
const cells=()=>[{x:7,z:5},{x:6,z:7},{x:8,z:7}];
const shot=(tick,shape='NOVA',{units=[boss()],warning=true}={})=>({
 run:1,floor:2,tick,units,events:[],
 bossWarning:warning?{
  warning:true,shape,attackTick:23,turnsUntilImpact:23-tick,cells:cells()
 }:null
});
const warnings=cues=>cues.filter(c=>c.kind.startsWith('boss-warning'));

test('D04 begins a genuine NOVA warning on all three public movement beats',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(shot(19,'NOVA',{warning:false}),shot(20));
 assert.deepEqual(warnings(cues).map(c=>c.kind),['boss-warning-rising']);
 assert.equal(warnings(cues)[0].tick,20);
 assert.equal(warnings(cues)[0].detail.attackTick,23);
 assert.equal(warnings(cues)[0].actorId,'warden');
 assert.deepEqual(warnings(cues)[0].detail.cells,cells());
});
test('D04 preserves the first ECLIPSE_SWEEP warning before the three-step curtain',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(shot(19,'ECLIPSE_SWEEP',{warning:false}),
  shot(20,'ECLIPSE_SWEEP'));
 assert.deepEqual(warnings(cues).map(c=>c.kind),['boss-warning-rising']);
 assert.equal(warnings(cues)[0].proof,'authority-warning-window');
});
test('D04 preserves all three successive verified NOVA warning updates',async()=>{
 const {planPhysicalFeedback}=await load();
 const first=planPhysicalFeedback(shot(19,'NOVA',{warning:false}),shot(20));
 const second=planPhysicalFeedback(shot(20),shot(21));
 const final=planPhysicalFeedback(shot(21),shot(22));
 assert.deepEqual([first,second,final].map(w=>warnings(w)[0]?.kind),[
  'boss-warning-rising','boss-warning-rising','boss-warning-final'
 ]);
 assert.equal(new Set([first,second,final].map(w=>warnings(w)[0].id)).size,3);
});
test('RIFT_CROSS cannot claim a fabricated three-beat warning',async()=>{
 const {planPhysicalFeedback}=await load();
 assert.deepEqual(warnings(planPhysicalFeedback(
  shot(19,'RIFT_CROSS',{warning:false}),shot(20,'RIFT_CROSS'))),[]);
 assert.deepEqual(warnings(planPhysicalFeedback(
  shot(20,'RIFT_CROSS',{warning:false}),shot(21,'RIFT_CROSS')))
  .map(c=>c.kind),['boss-warning-rising']);
});
test('unknown shape cannot extend the public warning horizon to three ticks',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(shot(19,'UNKNOWN',{warning:false}),shot(20,'UNKNOWN'));
 assert.deepEqual(warnings(cues),[]);
});
test('three-beat warning with multiple live Wardens remains attacker-neutral',async()=>{
 const {planPhysicalFeedback}=await load();
 const units=[boss('warden-a'),boss('warden-b')];
 const before=shot(19,'NOVA',{units,warning:false});
 const after=shot(20,'NOVA',{units});
 const cues=planPhysicalFeedback(before,after);
 assert.deepEqual(warnings(cues),[]);
 const neutral=cues.filter(c=>c.kind==='threat-warning');
 assert.equal(neutral.length,1);
 assert.equal(neutral[0].actorId,null);
 assert.equal(neutral[0].visual,'none');
 assert.equal(neutral[0].proof,'authority-warning-unattributed');
});
