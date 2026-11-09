'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const hero=(id='vanguard',x=2,z=2,extra={})=>({id,kind:'vanguard',faction:'party',
 x,z,hp:30,maxHp:30,action:'idle',actionTick:10,...extra});
const cultist=(extra={})=>({id:'cultist',kind:'cultist',faction:'enemy',
 x:5,z:5,hp:20,maxHp:20,action:'idle',actionTick:10,...extra});
const snap=(tick,units,events=[])=>({tick,run:1,floor:1,units,events});
const evade=tick=>({tick,kind:'evade',text:'untrusted: hero dodged the bolt'});
const own=cues=>cues.filter(c=>c.kind==='evade');
test('a Cultist missed hex is not a hero footstep or dodge dust',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const result=plan(snap(10,[hero(),cultist()]),
  snap(11,[hero(),cultist({action:'cast',actionTick:11})],[evade(11)]));
 assert.equal(own(result).length,0);
});
test('one witnessed one-cell sidestep earns the actual dodge sound and position',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const result=own(plan(snap(10,[hero(),cultist()]),
  snap(11,[hero('vanguard',3,2,{action:'move',actionTick:11}),cultist()],[evade(11)])));
 assert.equal(result.length,1);
 assert.equal(result[0].actorId,'vanguard');
 assert.equal(result[0].audio,'evade');
 assert.equal(result[0].proof,'authority-event-and-observed-step');
 assert.deepEqual(result[0].from,{x:2,z:2});
 assert.deepEqual(result[0].to,{x:3,z:2});
});
test('missed observations never retroactively authenticate generic dodge events',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const before=snap(10,[hero(),cultist()]);
 for(const tick of [11,13]){
  const after=snap(13,[hero('vanguard',3,2,{action:'move',actionTick:tick}),cultist()],[evade(tick)]);
  assert.equal(own(plan(before,after)).length,0);
 }
});
test('duplicate same-tick evade events fail closed instead of guessing ownership',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const result=plan(snap(10,[hero(),cultist()]),
  snap(11,[hero('vanguard',3,2,{action:'move',actionTick:11}),cultist()],
   [evade(11),evade(11)]));
 assert.equal(own(result).length,0);
});
test('multiple moving party bodies and invalid/dead movers cannot create faux dodges',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const before=snap(10,[hero(),hero('ally',4,4),cultist()]);
 const both=snap(11,[hero('vanguard',3,2,{action:'move',actionTick:11}),
  hero('ally',4,5,{action:'move',actionTick:11}),cultist()],[evade(11)]);
 assert.equal(own(plan(before,both)).length,0);
 const dead=snap(11,[hero('vanguard',3,2,{hp:0,action:'move',actionTick:11}),
  hero('ally',4,4),cultist()],[evade(11)]);
 assert.equal(own(plan(before,dead)).length,0);
 const absent={...both,units:[both.units[0],hero('ally',4,4),cultist()],events:[]};
 assert.equal(own(plan(before,absent)).length,0);
});
test('unrelated authentic HP loss still produces victim-only impact, never dodge or attacker',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const result=plan(snap(10,[hero(),cultist()]),
  snap(11,[hero('vanguard',2,2,{hp:22,action:'hurt',actionTick:11}),
   cultist({action:'cast',actionTick:11})],[evade(11)]));
 assert.equal(own(result).length,0);
 const wound=result.find(c=>c.kind==='damage');
 assert.equal(wound?.targetId,'vanguard');
 assert.equal(wound?.actorId,null);
 assert.equal(wound?.proof,'observed-hp-drop');
});
