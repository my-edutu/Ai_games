'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);

const actor=(kind,change={})=>({
 id:'actor',kind,faction:['warden','revenant'].includes(kind)?'enemy':'party',
 x:2,z:2,hp:30,maxHp:30,action:'idle',actionTick:10,targetId:null,...change
});
const target=kind=>({
 id:'target',kind:'revenant',faction:['warden','revenant'].includes(kind)?'party':'enemy',
 x:3,z:2,hp:30,maxHp:30,action:'idle',actionTick:10
});
const snap=(tick,units,events=[])=>({tick,run:1,floor:1,units,events});
const fixture=({kind,action,nextTick,actionTick,unmatched=false})=>{
 const prior=snap(10,[actor(kind),target(kind)]);
 const next=snap(nextTick,[actor(kind,{action,actionTick,targetId:'target'}),target(kind)]);
 const options={resolveContact:()=>unmatched?null:{targetId:'target',distance:1}};
 return {prior,next,options};
};

test('skipped authoritative ticks never stage belated weapon, spell, Warden, or guard physicality',async()=>{
 const {planPhysicalFeedback}=await load();
 const cases=[
  ['two-tick missed sword', 'vanguard','attack',12,11],
  ['latest-tick sword with missing prior pose','vanguard','attack',12,12],
  ['five-tick Revenant sword','revenant','attack',15,11],
  ['historical ranger arrow','ranger','attack',12,11],
  ['latest-tick ranger arrow with gap','ranger','attack',12,12],
  ['historical mystic spell','mystic','cast',13,12],
  ['latest-tick Warden release with gap','warden','cast',12,12],
  ['historical guard stance','vanguard','guard',12,11],
  ['unmatched ranger draw after gap','ranger','attack',12,12,true]
 ];
 for(const [label,kind,action,nextTick,actionTick,unmatched=false] of cases){
  const f=fixture({kind,action,nextTick,actionTick,unmatched});
  const serialized=JSON.stringify(f.next);
  const cues=planPhysicalFeedback(f.prior,f.next,f.options);
  assert.deepEqual(cues.map(c=>c.kind),[],label);
  assert.equal(JSON.stringify(f.next),serialized,label+' is read-only');
 }
});

test('genuinely consecutive observed action releases are still staged',async()=>{
 const {planPhysicalFeedback}=await load();
 const cases=[
  ['vanguard','attack','swing'],
  ['ranger','attack','ranged-release'],
  ['mystic','cast','spell-release'],
  ['warden','cast','warden-release'],
  ['vanguard','guard','guard']
 ];
 for(const [kind,action,expected] of cases){
  const f=fixture({kind,action,nextTick:11,actionTick:11});
  const cues=planPhysicalFeedback(f.prior,f.next,f.options);
  assert.deepEqual(cues.map(c=>c.kind),[expected],kind+' fresh action');
  assert.equal(cues[0].tick,11);
  assert.equal(cues[0].actorId,'actor');
  assert.equal(cues[0].verified,true);
 }
});

test('a skipped release cannot replay when adjacent snapshots resume, but a genuinely new action can',async()=>{
 const {planPhysicalFeedback}=await load();
 const f=fixture({kind:'vanguard',action:'attack',nextTick:12,actionTick:12});
 assert.deepEqual(planPhysicalFeedback(f.prior,f.next).map(c=>c.kind),[]);
 const held=snap(13,[actor('vanguard',{action:'attack',actionTick:12}),target('vanguard')]);
 assert.deepEqual(planPhysicalFeedback(f.next,held).map(c=>c.kind),[],
  'do not replay a last observed attempt when polling resumes');
 const fresh=snap(13,[actor('vanguard',{action:'attack',actionTick:13}),target('vanguard')]);
 assert.deepEqual(planPhysicalFeedback(f.next,fresh).map(c=>c.kind),['swing'],
  'a new witnessed adjacent action still gets a timely whoosh');
});

test('skipped contacts are silent, while a subsequent adjacent true HP loss remains victim-only',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=snap(10,[actor('vanguard'),target('vanguard')]);
 const skipped=snap(12,[actor('vanguard',{action:'attack',actionTick:12}),{
  ...target('vanguard'),hp:25
 }]);
 const late=planPhysicalFeedback(prior,skipped);
 assert.deepEqual(late.map(c=>c.kind),[]);
 const next=snap(13,[actor('vanguard',{action:'idle',actionTick:12}),{
  ...target('vanguard'),hp:22
 }]);
 const confirmed=planPhysicalFeedback(skipped,next);
 assert.deepEqual(confirmed.map(c=>c.kind),['damage']);
 assert.equal(confirmed[0].targetId,'target');
 assert.equal(confirmed[0].actorId,null);
 assert.equal(confirmed[0].detail.damage,3);
});

test('anonymous block remains neutral on a skipped poll, and reduced-motion adjacent sword remains available',async()=>{
 const {planPhysicalFeedback}=await load();
 const f=fixture({kind:'vanguard',action:'attack',nextTick:12,actionTick:12});
 const after={...f.next,events:[{kind:'block',tick:11,text:'untrusted defender'}]};
 const cues=planPhysicalFeedback(f.prior,after,f.options);
 assert.deepEqual(cues.map(c=>c.kind),['block']);
 assert.equal(cues[0].actorId,null);
 assert.equal(cues[0].from,null);
 const fresh=fixture({kind:'vanguard',action:'attack',nextTick:11,actionTick:11});
 const reduced=planPhysicalFeedback(fresh.prior,fresh.next,{reducedMotion:true});
 assert.deepEqual(reduced.map(c=>c.kind),['swing']);
 assert.equal(reduced[0].delay,0);
});
