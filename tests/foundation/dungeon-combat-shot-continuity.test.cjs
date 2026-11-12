'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.join(__dirname,'../../public/ai-dungeon/combat-shot-continuity.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const scene=(run=1,floor=1,alive=true)=>({run,floor,units:[
 {id:'vanguard',hp:120,x:2,z:3},{id:'warden',kind:'warden',hp:alive?100:0,x:3,z:3}
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

test('the REAL physical Warden lens, not merely its ignored shot offsets, eases wide warning to source strike and earned exposed counter',async()=>{
 const {createCombatShotContinuity}=await load(),c=createCombatShotContinuity();
 const warning=shot('warden-warning',[9,11,9]);
 const state={...scene(),bossWarning:{attackTick:54,cells:Array.from({length:23},(_,i)=>({x:i%7,z:Math.floor(i/7)}))}};
 const original=JSON.stringify(state);
 const wide=Object.freeze({mode:'warden-warning',offsets:[8,11,9],fov:57,lookY:.35,following:10});
 c.resolve(state,warning,.20);
 assert.equal(c.resolveLens(state,warning,wide,.20),wide,'23 real danger cells demand the complete immediate overview');
 assert.equal(JSON.stringify(state),original);
 const strike=shot('warden-release',[-5,8,4]);
 const medium={mode:'warden-release',offsets:[5,8,5],fov:50,lookY:.71,following:8};
 const prior=c.resolveLens(scene(),strike,medium,.20);
 assert.equal(prior.mode,'warden-release');
 assert.ok(prior.offsets[1]>medium.offsets[1]&&prior.offsets[1]<wide.offsets[1]);
 assert.ok(prior.fov>medium.fov&&prior.fov<wide.fov);
 const counter=shot('warden-exposed',[3,5,4]);
 const close={mode:'warden-exposed',offsets:[3,5.4,3.8],fov:45,lookY:1.1};
 const actual=c.resolveLens({...scene(),bossRecovery:{remaining:1}},counter,close,.20);
 assert.equal(actual.mode,'warden-exposed');
 assert.ok(actual.offsets[1]>close.offsets[1]&&actual.offsets[1]<prior.offsets[1]);
 assert.ok(actual.fov>close.fov&&actual.fov<prior.fov);
 assert.equal(actual.following,undefined,'do not invent a lens field');
 assert.equal(c.metrics().physicalLensBridges,2);
 assert.equal(c.metrics().physicalLensWarnings,1);
 assert.ok(c.metrics().physicalLensMaxStep>0);
});

test('the physical optical bridge never delays a new warning, new run, dead Warden, reduced motion or an unearned exposure',async()=>{
 const {createCombatShotContinuity}=await load();
 const wideShot=shot('warden-warning',[9,11,9]);
 const wide={mode:'warden-warning',offsets:[9,11,9],fov:57,lookY:.3};
 const releasedShot=shot('warden-release',[5,8,5]);
 const released={mode:'warden-release',offsets:[5,8,5],fov:50,lookY:.7};
 const exposedShot=shot('warden-exposed',[3,5,3]);
 const exposed={mode:'warden-exposed',offsets:[3,5,3],fov:45,lookY:1};
 for(const choice of ['new-floor','dead','reduced','unearned','new-warning','new-subject']){
  const c=createCombatShotContinuity();
  c.resolveLens({...scene(),bossWarning:{attackTick:54}},wideShot,wide,.1);
  c.resolveLens(scene(),releasedShot,released,.1);
  let state=scene(),shotNow=exposedShot,lensNow=exposed,opts={};
  if(choice==='new-floor')state=scene(1,2);
  if(choice==='dead')state=scene(1,1,false);
  if(choice==='reduced')opts={reducedMotion:true};
  if(choice==='new-warning'){
   state={...scene(),bossWarning:{attackTick:57}};
   shotNow=wideShot;lensNow=wide;
  }
  if(choice==='new-subject')shotNow=shot('warden-exposed',[3,5,3],['vanguard','another-warden']);
  const actual=c.resolveLens(state,shotNow,lensNow,.1,opts);
  assert.equal(actual,lensNow,choice);
 }
});
