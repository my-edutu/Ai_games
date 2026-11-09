'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const hero=(hp=30,x=2,extra={})=>({id:'vanguard',kind:'vanguard',
 faction:'party',x,z:2,hp,maxHp:30,action:'idle',actionTick:10,...extra});
const foe=(hp=20,extra={})=>({id:'revenant',kind:'revenant',
 faction:'enemy',x:3,z:2,hp,maxHp:20,action:'idle',actionTick:10,...extra});
const snap=(tick,units,events=[])=>({run:1,floor:1,tick,units,events});
const injuries=cues=>cues.filter(c=>c.kind==='damage'||c.kind==='damage-fatal');

test('a two-tick gap cannot turn a real HP delta into an impact at a relocated final cell',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(10,[hero(),foe()]),snap(12,[hero(19,5),foe()]));
 assert.equal(injuries(cues).length,0);
 assert.equal(cues.some(c=>c.audio==='impact'||c.audio==='fatal-impact'),false);
});

test('a five-tick fatal health loss does not become a fabricated fatal contact burst',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(10,[hero(),foe()]),snap(15,[hero(0,5),foe()]));
 assert.equal(injuries(cues).length,0);
});

test('simultaneously wounded actors do not get guessed contact frames after missed ticks',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(10,[hero(),foe()]),snap(14,[hero(18),foe(7)]));
 assert.equal(injuries(cues).length,0);
});

test('a missed snapshot can retain a truthful anonymous block sound without injury sound or body contact',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(10,[hero(),foe()]),
  snap(12,[hero(20,2,{action:'guard',actionTick:12,guardTick:12}),foe()],
   [{tick:12,kind:'block',text:'untrusted defender name'}]));
 const block=cues.find(c=>c.kind==='block');
 assert.ok(block);
 assert.equal(block.audio,'block');
 assert.equal(block.actorId,null);
 assert.equal(block.from,null);
 assert.equal(injuries(cues).length,0);
});

test('a genuinely adjacent HP loss keeps target-only injury, exact position and impact audio',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(10,[hero(),foe()]),snap(11,[hero(22,2),foe()]));
 const hit=injuries(cues);
 assert.equal(hit.length,1);
 assert.equal(hit[0].tick,11);
 assert.equal(hit[0].targetId,'vanguard');
 assert.equal(hit[0].actorId,null);
 assert.deepEqual(hit[0].to,{x:2,z:2});
 assert.equal(hit[0].audio,'impact');
 assert.equal(hit[0].proof,'observed-hp-drop');
});

test('an adjacent genuine fatal loss preserves the fatal effect',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const hit=injuries(plan(snap(10,[hero(),foe()]),
  snap(11,[hero(0),foe()])));
 assert.equal(hit.length,1);
 assert.equal(hit[0].kind,'damage-fatal');
 assert.equal(hit[0].audio,'fatal-impact');
});

test('fresh adjacent HP loss after a stalled observation becomes eligible again',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 const cues=plan(snap(12,[hero(20),foe()]),snap(13,[hero(17),foe()]));
 assert.equal(injuries(cues).length,1);
 assert.equal(injuries(cues)[0].detail.damage,3);
});

test('a custom damage-beat resolver cannot bypass the skipped-frame integrity gate',async()=>{
 const {planPhysicalFeedback:plan}=await load();
 let derivations=0;
 const cues=plan(snap(10,[hero(),foe()]),snap(12,[hero(19),foe()]),{
  deriveDamageBeats:()=>{derivations++;return [{id:'vanguard',x:2,z:2,damage:11,
   maxHp:30,incoming:{sourceId:'revenant',dx:1,dz:0}}]},
  verifiedMeleeDelay:()=>.215
 });
 assert.equal(derivations,0,'do not derive a physical beat at an unseen contact tick');
 assert.equal(injuries(cues).length,0);
});
