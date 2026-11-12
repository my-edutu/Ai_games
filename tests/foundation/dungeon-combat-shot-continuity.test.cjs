'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.join(__dirname,'../../public/ai-dungeon/combat-shot-continuity.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const scene=(run=1,floor=1,alive=true)=>({run,floor,units:[
 {id:'vanguard',hp:120,x:2,z:3},{id:'warden',hp:alive?100:0,x:3,z:3}
]});
const shot=(mode='contact',offsets=[6,7,5],subjects=['vanguard','warden'])=>({mode,x:2.5,z:3,offsets,subjects,lookY:.65});
test('physical camera holds the genuine two-body screen side without falsifying current duel mode or position',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 director.resolve(scene(),shot('contact',[7,7,2]),.04);
 const after=director.resolve(scene(),shot('warden-exposed',[-7,7,-2]),.05);
 assert.equal(after.mode,'warden-exposed');assert.equal(after.x,2.5);
 assert.ok(after.offsets[0]>-7&&after.offsets[0]<7);
 assert.ok(director.metrics().holds>0);
});
test('real boss telegraph immediately overrides previous combat camera orbit',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 director.resolve(scene(),shot(),.02);
 const danger=shot('warden-warning',[9,11,9]);
 assert.equal(director.resolve({...scene(),bossWarning:{attackTick:6}},danger,.01),danger);
});
test('new floors, dead opponents and reduced-motion refuse stale camera continuity',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 director.resolve(scene(),shot(),.01);
 const current=shot('warden-exposed',[-5,6,-5]);
 assert.equal(director.resolve(scene(1,2),current,.05),current);
 assert.equal(director.resolve(scene(1,2,false),current,.05),current);
 assert.equal(director.resolve(scene(),current,.05,{reducedMotion:true}),current);
 const stranger=shot('contact',[-4,6,-5],['vanguard','revenant']);
 assert.equal(director.resolve(scene(),stranger,.05),stranger);
});
test('ordinary travel cannot be labelled as an old contact camera',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 director.resolve(scene(),shot(),.01);
 const journey=shot('journey',[3,5,4],['vanguard']);
 assert.equal(director.resolve(scene(),journey,.03),journey);
 assert.equal(director.metrics().mode,'journey');
});
test('camera continuity never modifies any authoritative snapshot or public combat coordinates',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 const s=scene(),frozen=JSON.stringify(s);
 director.resolve(s,shot(),.05);director.resolve(s,shot('warden-approach',[-6,8,-4]),.1);
 assert.equal(JSON.stringify(s),frozen);
});

test('real Warden 23-cell warning cuts immediately; genuine strike and earned counter keep a continuous source-boss camera orbit',async()=>{
 const {createCombatShotContinuity}=await load(),director=createCombatShotContinuity();
 const warning=shot('warden-warning',[7,11.2,8]);
 const danger={...scene(),tick:53,bossWarning:{attackTick:54,cells:Array.from({length:23},(_,i)=>({x:i%7,z:Math.floor(i/7)}))}};
 assert.equal(director.resolve(danger,warning,.016),warning);
 const strike=shot('warden-release',[-6,8.8,6]);
 const release=director.resolve({...scene(),tick:54},strike,.05);
 assert.equal(release.mode,'warden-release');assert.equal(release.x,strike.x);
 assert.notDeepEqual(release.offsets,strike.offsets);
 assert.ok(release.offsets[1]>strike.offsets[1]&&release.offsets[1]<warning.offsets[1]);
 assert.ok(Math.hypot(release.offsets[0],release.offsets[2])>3,'cannot cut through boss');
 const counter=shot('warden-counter',[-3.5,5,4.2]);
 const earned=director.resolve({...scene(),tick:55,bossRecovery:{remaining:1}},counter,.05);
 assert.equal(earned.mode,'warden-counter');
 assert.notDeepEqual(earned.offsets,counter.offsets);
 assert.equal(director.metrics().wardenBeatTransfers,2);
 assert.ok(director.metrics().wardenBeatBlends>=2);
 const settled=director.resolve({...scene(),tick:55,bossRecovery:{remaining:1}},counter,.24);
 assert.ok(settled.offsets[1]<earned.offsets[1]);
});
test('Warden camera does not preserve a stale orbit after death, new floor, new boss, warning or reduced motion',async()=>{
 const {createCombatShotContinuity}=await load();
 const warning=shot('warden-warning',[7,11,8]),release=shot('warden-release',[-5,8,5]);
 for(const changed of [
  {s:scene(1,2),opt:{}},{s:scene(1,1,false),opt:{}},
  {s:scene(),opt:{reducedMotion:true}},
  {s:{...scene(),units:[{id:'vanguard',hp:120,x:2,z:3},{id:'warden-2',kind:'warden',hp:100,x:3,z:3}]},opt:{}}
 ]){
  const director=createCombatShotContinuity();
  director.resolve({...scene(),bossWarning:{attackTick:54}},warning,.03);
  assert.equal(director.resolve(changed.s,release,.04,changed.opt),release);
 }
 const director=createCombatShotContinuity();
 director.resolve({...scene(),bossWarning:{attackTick:54}},warning,.03);
 director.resolve(scene(),release,.04);
 const newDanger=shot('warden-warning',[9,12,9]);
 assert.equal(director.resolve({...scene(),bossWarning:{attackTick:70}},newDanger,.03),newDanger);
});
