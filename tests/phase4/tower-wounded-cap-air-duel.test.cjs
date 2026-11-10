'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const policy = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/wounded-cap-duel.mjs')).href);
const make = () => {
  const cap = {id:'f8:cap', x:115200, y:3212000, width:249600, height:12000};
  const guardian = {id:'f8:guardian',kind:'guardian',active:true,
    x:240000,y:3238000,health:1,maxHealth:8};
  const frame = {lifecycle:'running',tick:401,floor:8,runToken:'real-run',
    player:{state:'airborne',health:25,x:265000,y:3286000},
    intent:{mode:'air-control',targetPlatformId:cap.id}};
  const locked={cap,guardian,runToken:frame.runToken,floor:frame.floor,tick:frame.tick};
  return {cap,guardian,frame,locked};
};
test('wounded live cap guardian remains a source-bound camera subject during selected cap landing',async()=>{
 const {observedWoundedCapAirDuel:claim}=await policy;
 const {frame,guardian,locked}=make();
 assert.equal(claim(frame,guardian,locked),true);
 assert.equal(claim({...frame,intent:{...frame.intent,mode:'settling-landing'}},guardian,locked),true);
 assert.equal(claim({...frame,intent:{...frame.intent,mode:'oracle-air-control'}},guardian,locked),true);
});
test('no dead, undamaged, absent or unrelated guardian can stage a cap duel',async()=>{
 const {observedWoundedCapAirDuel:claim}=await policy;
 const {frame,guardian,locked}=make();
 for(const enemy of [null,{...guardian,health:8},{...guardian,health:0,active:false},
   {...guardian,active:false},{...guardian,id:'f7:guardian'}, {...guardian,kind:'revenant'}])
   assert.equal(claim(frame,enemy,locked),false);
 assert.equal(claim(frame,guardian,{...locked,guardian:{...guardian,id:'other'}}),false);
 assert.equal(claim(frame,guardian,null),false);
});
test('never steal ordinary jumps, another route or stale episode',async()=>{
 const {observedWoundedCapAirDuel:claim}=await policy;
 const {frame,guardian,locked}=make();
 for(const altered of [
  {...frame,stale:true}, {...frame,lifecycle:'result'},
  {...frame,player:{...frame.player,state:'standing'}},
  {...frame,player:{...frame.player,health:0}},
  {...frame,intent:{...frame.intent,mode:'exploring'}},
  {...frame,intent:{...frame.intent,targetPlatformId:'f8:p6'}},
  {...frame,runToken:'next-episode'}, {...frame,tick:402}, {...frame,floor:9}])
   assert.equal(claim(altered,guardian,locked),false);
});
test('only a physically nearby cap combat and actual vertical corridor qualify',async()=>{
 const {observedWoundedCapAirDuel:claim}=await policy;
 const {frame,guardian,locked}=make();
 assert.equal(claim({...frame,player:{...frame.player,x:400000}},guardian,locked),false);
 assert.equal(claim({...frame,player:{...frame.player,y:3440000}},guardian,locked),false);
 assert.equal(claim(frame,{...guardian,x:1},locked),false);
 assert.equal(claim(frame,{...guardian,y:3010000},locked),false);
 assert.equal(claim(frame,guardian,{...locked,cap:{...locked.cap,id:'f8:p5'}}),false);
});
test('scene retains true source cap/guardian, real landing and source authority',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(scene,/import \{ observedWoundedCapAirDuel \}/);
 assert.match(scene,/const lockedCap = observedLockedGuardianCap\(snapshot\)/);
 assert.match(scene,/const witnessedCapAirDuel = observedWoundedCapAirDuel\(snapshot, enemy, lockedCap\)/);
 assert.match(scene,/const routeLanding = encounter && player.state !== 'airborne' \? null : landing/);
 assert.match(scene,/witnessedCapAirDuel \|\| player\.attacking/);
});
