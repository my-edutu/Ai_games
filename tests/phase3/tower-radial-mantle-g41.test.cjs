'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const scene=fs.readFileSync(path.join(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const {createSession,advance}=require('../../scripts/serve-tower-stream.cjs');
function shipped(name,args) {
 const match=scene.match(new RegExp('^function '+name+'\\('+args+'\\) \\{[\\s\\S]*?^\\}','m'));
 assert.ok(match,'actual '+name+' must exist');
 return vm.runInNewContext(match[0]+'\n'+name);
}
const landing=shipped('intendedLanding','snapshot');
const approach=shipped('climbApproachRadius','snapshot, platform');
const director=shipped('createTowerRadialTransition','');
test('real seeded ascent never jumps inward after genuine hand contact',()=>{
 const run=createSession(),state=director(),seen=[];
 const unmodified=[];
 for(let i=0;i<=320;i++){
  const frame=run.controller.frame(960,600,{reducedMotion:true,muted:true}).snapshot;
  if(frame.tick>=285&&frame.tick<=320){
   const checksum=frame.publicChecksum;
   const r=state.sample(frame,approach(frame,landing(frame)));
   seen.push({tick:frame.tick,r});
   assert.equal(frame.publicChecksum,checksum,'renderer cannot mutate authoritative snapshot');
  }
  advance(run);
 }
 const at=t=>seen.find(x=>x.tick===t).r;
 assert.ok(at(298)>=27.95,'helmet exterior to actual deck at hand contact');
 assert.ok(at(300)>=27.95,'continue outside until foot clears ledge');
 assert.ok(at(304)>26.2,'no instant interior snap at recorded failing tick');
 for(let i=1;i<seen.length;i++){
  const delta=seen[i-1].r-seen[i].r;
  assert.ok(delta<=.55*(seen[i].tick-seen[i-1].tick)+1e-6,
    'inward travel limited by authoritative simulation time');
 }
 assert.ok(Math.abs(at(316)-25)<1e-5,'return to walking band at actual landing');
});
test('same-tick polls do not double step; restore, floor and run changes reset',()=>{
 const d=director(),f=(tick,runToken='a',floor=1)=>({
  tick,runToken,floor,publicChecksum:runToken+tick,player:{state:'airborne',vy:3200,health:5}});
 assert.equal(d.sample(f(8),28.05),28.05);
 assert.equal(d.sample(f(9),25),27.5);
 assert.equal(d.sample(f(9),25),27.5);
 assert.equal(d.sample(f(10),25),26.95);
 assert.equal(d.sample(f(3),25),25);
 assert.equal(d.sample(f(4,'b'),25),25);
 assert.equal(d.sample(f(5,'b',2),25),25);
 assert.equal(d.sample({...f(6,'b',2),tick:NaN},27),25);
});
test('the renderer maps the bounded value instead of the discontinuous requested radius',()=>{
 assert.match(scene,/const approachRadius = climbApproachRadius\(snapshot, targetPlatform\)/);
 assert.match(scene,/const presentedRadius = radialTransition\.sample\(snapshot, approachRadius\)/);
 assert.match(scene,/pointFor\(p\.x, p\.y - p\.halfHeight, snapshot\.chunkBaseY, snapshot\.worldWidth, presentedRadius\)/);
 assert.match(scene,/radialTransition: radialTransition\.diagnostics\(\)/);
});
