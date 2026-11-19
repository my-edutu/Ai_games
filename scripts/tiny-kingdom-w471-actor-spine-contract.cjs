'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function residentActorGpuEnabled(){');
const end=html.indexOf('function setResidentActorGpuForTesting(',start);
assert(start>0&&end>start,'must test original deployed actor residency policy');
const fn=new Function('gpuAvailable','swiftGpu','residentActorGpuOverride',
 html.slice(start,end)+'\nreturn residentActorGpuEnabled();');
test('software WebGL defaults to original complete live citizen bodies',()=>{
 assert.equal(fn(true,true,null),false);
 assert.equal(fn(true,false,null),true);
 assert.equal(fn(false,true,null),false);
 assert.equal(fn(false,false,null),false);
 assert.equal(fn(true,true,true),true); // compare with previous resident path
 assert.equal(fn(true,false,false),false); // compare with old live geometry path
});
test('same policy applies to all four real resident admission tiers',()=>{
 const from=html.indexOf('const residentRows=residentActorGpuEnabled()?');
 const to=html.indexOf('dynamicPhaseTimes.residentActorManagement=',from);
 assert(from>0&&to>from);
 const frame=html.slice(from,to);
 assert.match(frame,/const restingRows=residentRows/);
 assert.match(frame,/const commuterRows=residentRows/);
 assert.match(frame,/const workingRows=residentRows/);
 assert.match(frame,/const foregroundRows=residentRows/);
 assert.match(frame,/const commuterFrame=residentActorGpuEnabled\(\)/);
});
test('software path cannot silently drop a real citizen or replace actual 3D body',()=>{
 const start=html.indexOf('const liveActorGeometryStart=performance.now();');
 const end=html.indexOf('householdCarriedSackStats.carriers=0;',start);
 assert(start>0&&end>start);
 const frame=html.slice(start,end);
 assert.match(frame,/for\(let i=0;i<people.length;i\+\+\)/);
 assert.match(frame,/if\(!foregroundIndices.has\(i\)\)villager\(people\[i\]\)/);
 assert.match(frame,/if\(!restingIndices.has\(i\)&&!commuterIndices.has\(i\)&&!workingIndices.has\(i\)\)compactVillager\(people\[i\]\)/);
 assert.match(html,/setResidentActorGpuForTesting,/);
});
