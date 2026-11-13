'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async file=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',file),'utf8')).toString('base64'));
const map=()=>Array.from({length:7},()=>'.'.repeat(7));
const source=(updates={})=>({id:'vanguard',kind:'vanguard',faction:'party',
 hp:30,x:2,z:2,action:'attack',actionTick:12,targetId:'revenant',...updates});
const victim={id:'revenant',kind:'revenant',faction:'enemy',hp:19,maxHp:30,x:3,z:2};
const beat={id:'revenant',kind:'revenant',faction:'enemy',damage:11,maxHp:30,
 fatal:false,x:3,z:2,incoming:{sourceId:'vanguard',dx:1,dz:0}};
const snapshot=(attacker=source())=>({tick:12,map:map(),units:[attacker,victim]});

test('verified skinned melee hit begins at the original audible contact beat without touching public HP',async()=>{
 const {planVerifiedMeleeImpactDelay:plan,VERIFIED_MELEE_CONTACT_DELAY:delay}=await load('impact-choreography-plan.js');
 const s=snapshot(),copy=JSON.stringify(s);
 assert.equal(delay,.215);
 assert.equal(plan(beat,s),delay);
 assert.equal(JSON.stringify(s),copy,'presentation must not alter authoritative snapshot');
 assert.equal(plan(beat,s,{reducedMotion:true}),0,'reduced motion keeps injury immediate');
 assert.equal(plan({...beat,fatal:true},s),0,'a genuine death is never visually delayed');
});

test('ambiguous, blocked, remote, stale, unsupported or unrelated actions cannot earn staged sword contact',async()=>{
 const {planVerifiedMeleeImpactDelay:plan}=await load('impact-choreography-plan.js');
 assert.equal(plan({...beat,incoming:null},snapshot()),0);
 assert.equal(plan({...beat,incoming:{sourceId:'missing',dx:1,dz:0}},snapshot()),0);
 assert.equal(plan({...beat,incoming:{sourceId:'vanguard',dx:0,dz:1}},snapshot()),0);
 assert.equal(plan(beat,snapshot(source({targetId:'another'}))),0);
 assert.equal(plan(beat,snapshot(source({actionTick:11}))),0);
 assert.equal(plan(beat,snapshot(source({action:'guard'}))),0);
 assert.equal(plan(beat,snapshot(source({kind:'ranger'}))),0);
 assert.equal(plan(beat,snapshot(source({hp:0}))),0);
 assert.equal(plan(beat,snapshot(source({faction:'enemy'}))),0);
 assert.equal(plan(beat,snapshot(source({x:1}))),0);
 const blocked=map();blocked[2]='..#....';
 assert.equal(plan(beat,{...snapshot(),map:blocked}),0);
 assert.equal(plan(beat,null),0);
});

test('actual game shares verified onset across body recoil and physical shard/fan, preserving audio clock',()=>{
 const read=name=>fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8');
 const app=read('app.js'),director=read('combat-director.js'),sound=read('soundstage.js');
 assert.match(app,/age:-planVerifiedMeleeImpactDelay\(damage,s,\{reducedMotion:reduced\}\)/);
 assert.match(app,/combatDirector\.recordDamage\(damageBeats,s\)/);
 assert.match(director,/planVerifiedMeleeImpactDelay\(beat,snapshot,\{reducedMotion\}\)/);
 assert.match(director,/impacts\.push\(\{mesh,life:-delay,contactAge:0,duration:hit\.duration,mode:'true-hit'/);
 assert.match(director,/fractureEffect=\{mesh:fracture,life:-delay,contactAge:0/);
 assert.match(director,/if\(effect\.life<0\)continue/);
 assert.match(sound,/planAuthorityDamageBeats\(previous,s\)/);
 assert.match(sound,/planVerifiedMeleeImpactDelay\(beat,s,\{reducedMotion\}\)/);
 assert.match(sound,/cue\.kind==='impact'\?\(contactDelays\.get\(cue\.actorId\)\?\?0\)/);
 assert.match(app,/createDungeonSoundstage\(ambience,\{reducedMotion:reduced\}\)/);
});


test('sparse real RAF delivers one original windup, one blade/HP-audio contact and then recovery',async()=>{
 const {planVisibleMeleeContactStep:step,VERIFIED_MELEE_CONTACT_DELAY:contact}=await load('impact-choreography-plan.js');
 let sourceAge=0,audioRemaining=contact,impactLife=-contact,beatAge=-contact;
 for(const [i,elapsed] of [.433,.433,.433,.433,.433,.433].entries()){
  const visualStep=step(elapsed,sourceAge);
  sourceAge+=visualStep;audioRemaining-=visualStep;impactLife+=visualStep;beatAge+=visualStep;
  if(i===0){assert.equal(sourceAge,.05);assert.ok(audioRemaining>0);assert.ok(beatAge<0)}
  if(i===1){assert.ok(Math.abs(sourceAge-contact)<1e-6);assert.ok(audioRemaining<=1e-8);assert.ok(Math.abs(impactLife)<1e-8);assert.ok(Math.abs(beatAge)<1e-8)}
  if(i===2){assert.ok(sourceAge>=.319&&sourceAge<=.321,'first post-contact frame is real body recovery, not skipped');}
  if(i===3){assert.ok(sourceAge>=.424&&sourceAge<=.426,'original wrist, pelvis and boots keep a second observable recovery frame');}
  if(i===5){assert.ok(sourceAge>=.619&&sourceAge<=.621,'original 620ms envelope completes with audio fired exactly once');}
 }
 let normalAge=0;
 for(let i=0;i<15;i++){const delta=step(.016,normalAge);normalAge+=delta;assert.ok(delta<=.01601)}
 assert.ok(normalAge>=contact&&normalAge<=.25);
 for(const bad of [NaN,Infinity,-.5])assert.equal(step(bad,0),0);
 assert.equal(step(.5,NaN),.05,'bad clock starts from bounded opening pose');
 assert.equal(step(.5,5),.35,'stale action cannot accumulate unbounded catch-up');
});
