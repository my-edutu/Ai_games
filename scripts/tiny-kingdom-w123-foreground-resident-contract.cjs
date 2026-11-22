// W123 Phase 1: RED on old source, GREEN on original detailed actor GPU
// residency. No simulation mutations or staged actors.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const s=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function fn(name){
 const at=s.indexOf('function '+name+'(');
 assert(at>=0,'missing authentic foreground function '+name);
 const begin=s.indexOf('{',at);let depth=0,end=begin;
 do{if(s[end]==='{')depth++;else if(s[end]==='}')depth--;end++}
 while(depth&&end<s.length);
 assert(depth===0,'unbalanced function '+name);
 return s.slice(at,end);
}
for(const n of ['isForegroundResidentCandidate','realForegroundPoseStale',
 'prepareForegroundResidents','drawForegroundResidentMesh','resetForegroundResidents',
 'getForegroundResidentAudit'])assert(fn(n).length>100);
const code=fn('isForegroundResidentCandidate')+';'+fn('realForegroundPoseStale')+
 ';({isForegroundResidentCandidate,realForegroundPoseStale})';
const ctx={gpuAvailable:true,foregroundResidentEnabled:true,
 FOREGROUND_ROOT_METERS:.045,FOREGROUND_ROOT_RADIANS:.035,
 follow:true,liveWorkday:false,selectedCitizen:0,
 isMarketUnloading:p=>p.activity==='unloading',
 isWorkingAtSite:p=>p.activity==='harvesting'};
const {isForegroundResidentCandidate:eligible,realForegroundPoseStale:stale}=
 vm.runInNewContext(code,ctx);
const citizen={name:'Original resident',x:0,z:0,phase:1,
 energy:80,hunger:30,activity:'Resting at home',delivery:null};
assert.equal(eligible(citizen,1,new Set([1])),true);
assert.equal(eligible(citizen,0,new Set([0])),false,'followed citizen stays live');
assert.equal(eligible(citizen,1,new Set()),false,'distant citizen is not misclassified');
assert.equal(eligible({...citizen,activity:'harvesting'},1,new Set([1])),false);
assert.equal(eligible({...citizen,activity:'unloading'},1,new Set([1])),false);
assert.equal(eligible({...citizen,delivery:{id:'true cargo'}},1,new Set([1])),false);
const entry={key:'original',x:0,z:0,angle:0};
assert.equal(stale(entry,{x:.02,z:.01},'original',.01),false);
assert.equal(stale(entry,{x:.09,z:0},'original',0),true);
assert.equal(stale(entry,{x:0,z:0},'original',.08),true);
assert.equal(stale(entry,{x:0,z:0},'changed',0),true);
const begin=s.indexOf('function prepareForegroundResidents(');
const stop=s.indexOf('function drawForegroundResidentMesh(',begin);
const renderer=s.slice(begin,stop);
assert(renderer.includes('villager(p);'),'full original detailed mesh only');
assert(renderer.includes('gl.bufferSubData'),'real GPU buffer updates');
assert(renderer.includes('foregroundResidentFallbacks++'),'real person fallback');
assert(s.includes('if(!foregroundIndices.has(i))villager(people[i]);'),
 'original live fallback required');
assert(s.includes('addSceneGeometryStats(animated,foregroundResidentMesh)'),
 'GPU detailed actors must enter geometry audit');
assert(s.includes('(foregroundResidentVisible.length?foregroundResidentMesh.length:0)'),
 'GPU detailed actors must enter rendered triangle ledger');
assert(s.includes('drawForegroundResidentMesh();'),
 'foreground GPU residents must actually draw');
assert(s.includes('resetWorkingResidents();resetForegroundResidents();'),
 'reset/restore must invalidate original residents');
assert(s.includes('getForegroundResidentAudit,'),
 'frame evidence must expose real resident counters');
// W124 RED-before / GREEN-after: genuine near profession hands must keep
// their real workTimer/phase, exclude followed actors and freight, and
// retain the full authored rig only when physically small on screen.
const workerFn=fn('isForegroundWorksiteCandidate');
assert(workerFn.includes('isWorkingAtSite(p)'));
assert(workerFn.includes('projectRealCitizenDetail(p,frame)'));
assert(workerFn.includes('p.delivery'));
assert(fn('realForegroundPoseKey').includes('p.workTimer'));
assert(fn('realForegroundPoseStale').includes('active?.015'));
assert(s.includes('isForegroundWorksiteCandidate(p,i,nearPeople,commuterFrame)'));
const workCtx={...ctx,projectRealCitizenDetail:(p,f)=>f};
const active=vm.runInNewContext(workerFn+';isForegroundWorksiteCandidate',workCtx);
const farmer={...citizen,job:'farmer',activity:'harvesting',workTimer:2.04};
assert.equal(active(farmer,1,new Set([1]),{visible:true,heightFraction:.09}),true);
assert.equal(active(farmer,1,new Set([1]),{visible:true,heightFraction:.20}),false);
assert.equal(active(farmer,1,new Set(),{visible:false,heightFraction:0}),false);
assert.equal(active({...farmer,delivery:{id:'real cargo'}},1,new Set([1]),{visible:false,heightFraction:0}),false);
assert.equal(active({...farmer,activity:'unloading'},1,new Set([1]),{visible:false,heightFraction:0}),false);
assert.equal(active(farmer,0,new Set([0]),{visible:false,heightFraction:0}),false);
assert(s.includes('realWorksiteNames:foregroundResidentVisible'));
assert(s.includes('followedWorkerHandsFullyLive:true'));
console.log('W124 source-only worksite rig eligibility/real-timer/contact policy PASS; runtime WebGL and FPS unmeasured');

console.log('W123 foreground resident GPU original-pose safety contracts PASS');
