'use strict';
// W332 test-first original 13-joint non-contact citizen rendering contract.
// Actual human, work, provision, hand and receipt eligibility are authoritative.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual playable world script');
new Function(script);
const from=script.indexOf('const FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT=');
const to=script.indexOf('function realForegroundPoseKey(',from);
assert.ok(from>0&&to>from,'production full-body GPU candidate path');
const actual=script.slice(from,to);
function probe(height,p={},opts={}){
 const person={name:'ActualResident',job:'farmer',activity:'Waiting for a safe route',
  x:3,z:5,phase:1.35,provisions:0,...p};
 const env={workingSkinCapable:true,gpuAvailable:true,follow:false,
  liveWorkday:false,selectedCitizen:0,
  isWorkingAtSite:q=>Boolean(q.working),
  isMarketUnloading:q=>Boolean(q.unloading),
  verifiedHouseholdMealEvidence:q=>q.verifiedMeal?{receiptId:'earned'}:null,
  projectRealCitizenDetail:()=>({visible:true,heightFraction:height}),
  foregroundResidentCache:new Map(),
  ...opts};
 if(opts.held)env.foregroundResidentCache.set(0,{
  key:'0:'+person.name+':'+person.job+':resting',
  skinned:true});
 env.person=person;
 return vm.runInNewContext(actual+
  '\n isForegroundWalkingSkinCandidate(person,0,{trueCamera:true});',env,{timeout:1500});
}
// W331's 27% threshold rejects this genuine 35% readable non-contact figure.
assert.equal(probe(.35),true,'medium shot keeps original full 13-joint citizen');
assert.equal(probe(.43,{}, {held:true}),true,
 'existing citizen rig persists across a natural orbit');
assert.equal(probe(.46,{}, {held:true}),false,'hero-scale person stays live CPU');
assert.equal(probe(.20,{working:true}),false,'true worker contact stays live');
assert.equal(probe(.20,{delivery:{id:'credited-freight'}}),false,'cargo stays live');
assert.equal(probe(.20,{unloading:true}),false,'market handoff stays live');
assert.equal(probe(.20,{activity:'Resting at home',verifiedMeal:true}),false,
 'original credited meal stays hand-aligned');
assert.equal(probe(.20,{activity:'Returning home at dusk',provisions:2}),false,
 'earned provisions remain attached to real wrist');
assert.equal(probe(.20,{}, {follow:true}),false,'followed hero stays live');
assert.match(script,/workSkinDetailedMatrices\(entry,p\)/,
 'actual GPU palette follows real 13-bone citizen');
assert.match(script,/if\(!foregroundIndices\.has\(i\)\)villager\(people\[i\]\)/,
 'every unadmitted citizen remains in original complete 3D renderer');
console.log('W332 PASS: near-medium original GPU citizen rig, physical work/cargo/meal exceptions and original full-actor fallback; real hardware/film NOT PROVEN.');
