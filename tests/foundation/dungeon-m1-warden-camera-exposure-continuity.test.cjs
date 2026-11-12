'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=()=>fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/combat-shot-continuity.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(read()).toString('base64'));
const state=(tick,{warning=false,recovery=0,run=1,floor=1,dead=false}={})=>({
 run,floor,tick,
 bossWarning:warning?{shape:'NOVA',attackTick:54,cells:Array.from({length:23},(_,i)=>({x:8+i%5,z:6+Math.floor(i/5)}))}:null,
 bossRecovery:recovery?{remaining:recovery}:null,
 units:[{id:'warden-1',kind:'warden',faction:'enemy',x:10,z:9,hp:dead?0:125},
  {id:'ranger',kind:'ranger',faction:'party',x:9,z:9,hp:42},
  {id:'vanguard',kind:'vanguard',faction:'party',x:8,z:9,hp:77}]
});
const shot=(mode,offsets,subjects,x=9,z=9)=>({mode,offsets,subjects,x,z});
const wide=shot('warden-warning',[8,12,9],['warden-1','ranger']);
const release=shot('warden-release',[5,7,5],['warden-1','ranger'],10,9.6);
const counter=shot('warden-exposed',[3,4,4],['warden-1','vanguard'],8.7,8.9);
test('real 23-tile warning retains the complete authentic immediate wide shot',async()=>{
 const {createCombatShotContinuity}=await load();const c=createCombatShotContinuity();
 const s=state(53,{warning:true}),before=JSON.stringify(s);
 assert.deepEqual(c.resolve(s,wide,.22),wide);
 assert.equal(c.metrics().wardenBeatBlends,0);
 assert.equal(JSON.stringify(s),before);
});
test('true Warden release into earned exposed counter preserves both live 3D orbit and bounded current-scene aim',async()=>{
 const {createCombatShotContinuity}=await load();const c=createCombatShotContinuity();
 c.resolve(state(53,{warning:true}),wide,.20);
 const a=c.resolve(state(54,{recovery:2}),release,.20);
 assert.ok(a.offsets.some((v,i)=>Math.abs(v-release.offsets[i])>.01));
 assert.ok(Math.hypot(a.x-release.x,a.z-release.z)>.01);
 const current=state(55,{recovery:1}),copy=JSON.stringify(current);
 const b=c.resolve(current,counter,.20);
 assert.equal(b.mode,'warden-exposed');
 assert.deepEqual(b.subjects,counter.subjects,'the current true hero target still owns the shot');
 assert.ok(b.offsets.some((v,i)=>Math.abs(v-counter.offsets[i])>.01),'actual exposed beat does not abruptly reset orbit');
 assert.ok(Math.hypot(b.x-counter.x,b.z-counter.z)>.01,'actual current aim blends');
 assert.ok(Math.hypot(b.x-counter.x,b.z-counter.z)<=.91,'camera aim never drifts farther than one live cell');
 assert.ok(c.metrics().earnedExposureBridges>0);
 assert.ok(c.metrics().wardenAimBridges>0);
 assert.equal(JSON.stringify(current),copy,'no gameplay mutation');
});
test('stale exposure, killed or replaced Warden, emergency warning, reduced motion and new floor never inherit cinematic beat',async()=>{
 const {createCombatShotContinuity}=await load();
 for(const choice of ['stale','dead','new-floor','reduced','emergency','replacement']){
  const c=createCombatShotContinuity();
  c.resolve(state(53,{warning:true}),wide,.20);
  c.resolve(state(54,{recovery:2}),release,.20);
  let current=state(55,{recovery:1}),target=counter,opts={};
  if(choice==='stale')current=state(55);
  if(choice==='dead')current=state(55,{recovery:1,dead:true});
  if(choice==='new-floor')current=state(55,{recovery:1,floor:2});
  if(choice==='reduced')opts={reducedMotion:true};
  if(choice==='emergency'){current=state(55,{recovery:1,warning:true});target=wide;}
  if(choice==='replacement')target=shot('warden-exposed',[3,4,4],['new-warden','vanguard']);
  const actual=c.resolve(current,target,.20,opts);
  assert.deepEqual(actual,target,choice);
 }
});
test('ordinary bounded one-cell duels retain existing look and orbit semantics',async()=>{
 const {createCombatShotContinuity}=await load();const c=createCombatShotContinuity();
 const first=shot('contact',[5,6,5],['ranger','warden-1']),second=shot('warden-contact',[3,5,3],['ranger','warden-1']);
 c.resolve(state(20),first,.20);const actual=c.resolve(state(21),second,.20);
 assert.equal(actual.x,second.x);assert.equal(actual.z,second.z);
 assert.ok(actual.offsets[1]>second.offsets[1]);
 assert.equal(c.metrics().earnedExposureBridges,0);
});
