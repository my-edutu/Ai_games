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
