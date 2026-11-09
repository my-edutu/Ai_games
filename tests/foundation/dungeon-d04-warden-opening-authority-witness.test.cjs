'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon/physical-feedback-plan.js')).href);
const boss=(tick,changes={})=>({
 id:'warden',kind:'warden',faction:'enemy',hp:75,maxHp:90,
 x:6,z:6,action:'idle',actionTick:tick,...changes
});
const hero=()=>({id:'vanguard',kind:'vanguard',faction:'party',hp:30,maxHp:30,
 x:5,z:6,action:'idle',actionTick:10});
const snapshot=(tick,options={})=>({
 run:1,floor:1,tick,map:Array(19).fill('.'.repeat(19)),
 units:[hero(),boss(tick-1)],events:[],...options
});
const event=tick=>({tick,kind:'opening',text:'WARDEN EXPOSED — text is not physical proof'});
const opened=(tick=11)=>snapshot(tick,{
 units:[hero(),boss(tick,{action:'cast',recoveryUntilTick:tick+1})],
 events:[event(tick)],guardianWard:false,bossRecovery:{remaining:2,damageMultiplier:1.5}
});
const openings=(previous,next,plan)=>plan(previous,next).filter(c=>c.kind==='opening');

test('D04: observed Warden cast and active public recovery window earn one actor-local opening',async()=>{
 const {planPhysicalFeedback}=await load();
 const cues=openings(snapshot(10),opened(),planPhysicalFeedback);
 assert.equal(cues.length,1);
 assert.equal(cues[0].actorId,'warden');
 assert.deepEqual(cues[0].from,{x:6,z:6});
 assert.equal(cues[0].proof,'authority-opening-recovery-window');
 assert.equal(cues[0].audio,'recovery');
 assert.equal(cues[0].targetId,null,'an opening never invents an attacking hero');
});

test('D04: anonymous opening text without a real Warden cannot create recovery audio',async()=>{
 const {planPhysicalFeedback}=await load();
 const before=snapshot(10,{units:[hero()]});
 const after=snapshot(11,{units:[hero()],events:[event(11)]});
 assert.equal(openings(before,after,planPhysicalFeedback).length,0);
});

test('D04: stale opening event after skipped simulation ticks cannot impersonate current recovery',async()=>{
 const {planPhysicalFeedback}=await load();
 const late=snapshot(13,{units:[hero(),boss(13,{action:'cast',recoveryUntilTick:14})],
  events:[event(11)],guardianWard:false,bossRecovery:{remaining:2}});
 assert.equal(openings(snapshot(10),late,planPhysicalFeedback).length,0);
});

test('D04: no valid active recovery, a sealed Warden, or contradictory public recovery suppresses the beat',async()=>{
 const {planPhysicalFeedback}=await load();
 const before=snapshot(10);
 const base=opened();
 for(const changed of [
  {units:[hero(),boss(11,{action:'cast'})]},
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:10})]},
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:17})]},
  {guardianWard:true},
  {bossRecovery:null},
  {bossRecovery:{remaining:1}},
  {units:[hero(),boss(11,{action:'guard',recoveryUntilTick:12})]},
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:12,actionTick:10})]}
 ]){
  assert.equal(openings(before,{...base,...changed},planPhysicalFeedback).length,0,
   'unproven Warden recovery is not an actor-local physical opening');
 }
});

test('D04: ambiguous owner, dead Warden and missing prior identity never claim an opening',async()=>{
 const {planPhysicalFeedback}=await load();
 const prior=snapshot(10);
 const base=opened();
 for(const changed of [
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:12}),
    {...boss(11,{action:'cast',recoveryUntilTick:12}),id:'other-warden'}]},
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:12,hp:0})]},
  {units:[hero(),boss(11,{action:'cast',recoveryUntilTick:12,id:'new-warden'})]}
 ])assert.equal(openings(prior,{...base,...changed},planPhysicalFeedback).length,0);
});
