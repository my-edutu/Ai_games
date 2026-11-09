'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-plan.js')).href);
const map=['....','....','....','....'];
const hero=(id,kind,x,z,action,tick)=>({
 id,kind,faction:'party',x,z,hp:30,maxHp:30,action,actionTick:tick
});
const snap=(tick,units,events=[],extra={})=>({
 run:1,floor:1,phase:'exploring',tick,map,units,events,...extra
});
const evade=(text,tick=11)=>({kind:'evade',tick,text});
const footsteps=planned=>planned.filter(c=>c.kind==='evade');
const before=()=>snap(10,[hero('v','vanguard',1,1,'idle',10)]);
const after=(text,extra={})=>snap(11,[hero('v','vanguard',2,1,'move',11)],
 [evade(text)],extra);

test('an anonymous empty-stone miss plus coincidental party step is NOT a dodge',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(before(),after('Cultist blast missed empty stone'));
 assert.equal(footsteps(cues).length,0,
  'public evade alone does not identify an actor, dodge or audible footstep');
});
test('a witnessed shadow-hex escape retains exactly one sound and grounded dust',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=footsteps(planPhysicalFeedback(before(),
  after('vanguard slipped away from the marked shadow hex')));
 assert.equal(cues.length,1);
 assert.equal(cues[0].actorId,'v');
 assert.equal(cues[0].targetId,null,'a dodge must not invent a strike target');
 assert.deepEqual(cues[0].from,{x:1,z:1});
 assert.deepEqual(cues[0].to,{x:2,z:1});
 assert.equal(cues[0].audio,'evade');
 assert.equal(cues[0].visual,'evade');
 assert.equal(cues[0].proof,'authority-event-and-observed-step');
});
test('revenant breach and Warden warning escapes are independently recognized',async()=>{
 const {planPhysicalFeedback}=await load();
 for(const text of ['vanguard slipped away from the marked revenant breach',
  'vanguard moved toward clear stone before the Warden strike']){
  assert.equal(footsteps(planPhysicalFeedback(before(),after(text))).length,1,text);
 }
});
test('two same-kind movers sharing one anonymous escape do not select a fictional dodger',async()=>{
 const {planPhysicalFeedback}=await load();
 const prev=snap(10,[hero('v','vanguard',1,1,'idle',10),
  hero('v2','vanguard',1,2,'idle',10)]);
 const next=snap(11,[hero('v','vanguard',2,1,'move',11),
  hero('v2','vanguard',2,2,'move',11)],
  [evade('vanguard slipped away from the marked shadow hex')]);
 assert.equal(footsteps(planPhysicalFeedback(prev,next)).length,0);
});
test('missing authoritative terrain/phase denies body-anchored dodge instead of guessing',async()=>{
 const {planPhysicalFeedback}=await load();
 const text='vanguard slipped away from the marked shadow hex';
 assert.equal(footsteps(planPhysicalFeedback(before(),after(text,{map:null}))).length,0);
 assert.equal(footsteps(planPhysicalFeedback(before(),after(text,{phase:'intermission'}))).length,0);
});
test('stale and doubled anonymous evade evidence cannot produce a fresh dodge',async()=>{
 const {planPhysicalFeedback}=await load();
 const text='vanguard slipped away from the marked shadow hex';
 const delayed=snap(12,[hero('v','vanguard',2,1,'move',11)],[evade(text)]);
 assert.equal(footsteps(planPhysicalFeedback(before(),delayed)).length,0);
 const doubled=after(text);
 doubled.events.push(evade(text));
 assert.equal(footsteps(planPhysicalFeedback(before(),doubled)).length,0);
});
test('same witnessed dodge does not invent a hit, source attacker or HP loss',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=planPhysicalFeedback(before(),
  after('vanguard slipped away from the marked shadow hex'));
 assert.equal(cues.filter(c=>c.kind==='damage'||c.kind==='damage-fatal').length,0);
 assert.equal(footsteps(cues).length,1);
 assert.ok(cues.every(c=>c.kind!=='swing'));
});
