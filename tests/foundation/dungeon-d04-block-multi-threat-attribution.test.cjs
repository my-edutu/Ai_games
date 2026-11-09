'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const hero=(id,hp=30,extra={})=>({id,kind:id==='vanguard'?'vanguard':'ranger',
 faction:'party',x:2,z:2,hp,maxHp:30,action:'idle',actionTick:10,...extra});
const enemy=(id,extra={})=>({id,kind:'revenant',faction:'enemy',x:3,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10,...extra});
const snap=(tick,units,events=[])=>({run:1,floor:1,tick,units,events});
const blockEvent={kind:'block',tick:11,text:'untrusted combat prose'};
const block=async(before,after)=>{
 const {planPhysicalFeedback}=await load();
 return planPhysicalFeedback(before,after).find(c=>c.kind==='block');
};

test('D04 unique witnessed guard still anchors a lone, non-contested block',async()=>{
 const before=snap(10,[hero('vanguard'),enemy('e1')]);
 const after=snap(11,[hero('vanguard',25,{action:'guard',actionTick:11,guardTick:11}),
  enemy('e1')],[blockEvent]);
 const cue=await block(before,after);
 assert.equal(cue.actorId,'vanguard');
 assert.deepEqual(cue.from,{x:2,z:2});
 assert.equal(cue.proof,'authority-block-unique-guarded-hp');
 assert.equal(cue.audio,'block');
});

test('D04 two same-tick hostile attempts make a guarded HP drop non-attributable',async()=>{
 const before=snap(10,[hero('vanguard'),enemy('e1'),enemy('e2')]);
 const after=snap(11,[
  hero('vanguard',20,{action:'guard',actionTick:11,guardTick:11}),
  enemy('e1',{action:'attack',actionTick:11}),
  enemy('e2',{action:'attack',actionTick:11})
 ],[blockEvent]);
 const cue=await block(before,after);
 assert.ok(cue);
 assert.equal(cue.actorId,null,'no guessed blocked actor when two attacks coincide');
 assert.equal(cue.from,null,'no misleading shield contact at the wounded hero');
 assert.equal(cue.proof,'authority-event');
 assert.equal(cue.audio,'block','real public block sound remains');
 assert.equal(cue.verified,true);
});

test('D04 simultaneous HP loss to a different actor prevents guessed block position',async()=>{
 const before=snap(10,[hero('vanguard'),hero('ranger'),enemy('e1')]);
 const after=snap(11,[
  hero('vanguard',24,{action:'guard',actionTick:11,guardTick:11}),
  hero('ranger',19,{action:'hurt',actionTick:11}),
  enemy('e1')
 ],[blockEvent]);
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(before,after);
 const cue=cues.find(c=>c.kind==='block');
 assert.ok(cue);
 assert.equal(cue.actorId,null);
 assert.equal(cue.from,null);
 assert.equal(cue.proof,'authority-event');
 assert.equal(cue.audio,'block');
 assert.deepEqual(cues.filter(c=>c.kind==='damage').map(c=>c.targetId).sort(),
  ['ranger','vanguard'],'both actual victims keep HP-based injuries');
});
