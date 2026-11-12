'use strict';
// W221 Phase 1: RED-first source-bound GPU commuter skeleton contract.
// Test the actual game implementation; no simulated economy or invented citizen.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const original=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(match=>match[1].includes('function prepareResidentCommuters('));
assert(original,'playable original game must exist');
new vm.Script(original[1],{filename:'live-tiny-kingdom.js'});
const fragment=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>=0&&b>a,'missing original '+start);
 return html.slice(a,b);
};
const source=fragment('function commuterPoseStale(', 'function prepareResidentCommuters(');
const context=vm.createContext({workingSkinCapable:true,state:{t:20},
 climateAt:()=>({season:1})});
vm.runInContext(source,context,{timeout:2000});
const entry={name:'Bram',job:'farmer',activity:'Traveling to market',phase:0,
 x:0,z:0,angle:0,energy:80,hunger:22,season:1,skinned:true,
 mesh:new Float32Array(3000),joints:new Float32Array(300),
 bindSegments:Array.from({length:13},()=>[[0,0,0],[0,1,0]])};
const person={name:'Bram',job:'farmer',activity:'Traveling to market',phase:3,
 x:2,z:1,energy:80,hunger:22};
assert.equal(vm.runInContext('commuterPoseStale',context)(entry,person,.3),false,
 'true original real-traveler 13-joint palette must retain actor geometry across walking strides');
context.workingSkinCapable=false;
assert.equal(vm.runInContext('commuterPoseStale',context)(entry,person,.3),true,
 'unsupported GPU skin must preserve authentic CPU pose refresh');
context.workingSkinCapable=true;
assert.equal(vm.runInContext('commuterPoseStale',context)(entry,{...person,activity:'Returning home at dusk'},.3),true,
 'real change of occupation must rebuild');
context.state.t=23;context.climateAt=()=>({season:2});
assert.equal(vm.runInContext('commuterPoseStale',context)(entry,person,.3),true,
 'true season change must invalidate visual clothing');
// W222 Phase 1: the same true original GPU skin must not re-sculpt complete
// foreground people every arbitrary in-world 1.5 hours, or animate a
// resting body as if walking. These are actual source-function policies.
const rig=fragment('function citizenRigPose(', 'function citizenEmbodiedPose(');
assert(rig.includes('const intensity=traveling?.72:0;'),
 'real feet stay planted whenever no authoritative route movement exists');
const fgSource=fragment('function realForegroundPoseKey(', 'function realForegroundPoseStale(');
const fgContext=vm.createContext({workingSkinCapable:true,
 isWorkingAtSite:()=>false,carryingCommuterLantern:p=>
  p.activity==='Returning home at dusk'&&fgContext.state.t>=19,
 citizenRigPose:()=>({acting:{action:'idle'}}),
 climateAt:()=>({season:'summer'}),state:{t:15}});
vm.runInContext(fgSource,fgContext,{timeout:2000});
const foregroundKey=vm.runInContext('realForegroundPoseKey',fgContext);
const originalResident={name:'Mira',job:'builder',activity:'Resting at home',
 trait:'careful',friend:'Bram',target:[1,2],phase:.2,
 energy:90,hunger:16,workTimer:0};
const skinned=foregroundKey(originalResident,1,true);
const cpu=foregroundKey(originalResident,1,false);
originalResident.phase+=2.3;fgContext.state.t+=13;
assert.equal(foregroundKey(originalResident,1,true),skinned,
 'authentic unchanged GPU-bound adult retains full mesh across time and breathing');
assert.notEqual(foregroundKey(originalResident,1,false),cpu,
 'non-GPU detailed adult still gets current CPU gait');
assert.notEqual(foregroundKey({...originalResident,job:'farmer'},1,true),skinned,
 'actual changed profession rebuilds its original clothing and tool binding');
assert.notEqual(foregroundKey({...originalResident,activity:'Traveling to market'},1,true),skinned,
 'actual route status must invalidate physical binding');
assert.notEqual(foregroundKey({...originalResident,energy:60},1,true),skinned,
 'changed physiological appearance remains a genuine invalidation');
const returning={...originalResident,activity:'Returning home at dusk'};
fgContext.state.t=17;
const beforeLantern=foregroundKey(returning,1,true);
fgContext.state.t=23;
assert.notEqual(foregroundKey(returning,1,true),beforeLantern,
 'same original commuter changes actual lantern mesh only when dusk arrives');
fgContext.climateAt=()=>({season:'winter'});
assert.notEqual(foregroundKey(originalResident,1,true),skinned,
 'winter materials invalidate the original GPU clothing');
const assembly=fragment('function prepareResidentCommuters(','function drawResidentCommuters(');
const draw=fragment('function drawResidentCommuters(','function getResidentCommuterAudit(');
for(const expression of [
 /workSkinCapture\s*=\s*labels/,/entry\.bindSegments\s*=/,
 /entry\.joints\s*=\s*workSkinTags/,
 /commuterResidentJointBuffer/,
 /commuterResidentJointData/
])assert.match(assembly,expression,'real 13-joint commuter buffer staging');
for(const expression of [/uniforms\.workSkinActive/,/uniforms\.workBone/,
 /workSkinMatrices\(entry,p\)/,/skinJointAttribute/,
 /gl\.disableVertexAttribArray\(skinJointAttribute\)/])
 assert.match(draw,expression,'real articulated GPU commuter drawing');
assert.match(fragment('function getResidentCommuterAudit(', 'function resetResidentCommuters('),
 /jointBytes:/,'bounded joint resource accounting must be exposed');
console.log('W221 source PASS: genuine compact commuters animate via 13-joint GPU pose, no per-tick JS mesh regeneration for gait, source parse and full fallback. Live GPU/visual/FPS remains unproven.');
