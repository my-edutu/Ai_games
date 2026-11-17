'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
 if(script[1].trim())new vm.Script(script[1]);
const excerpt=(begin,end)=>{
 const a=html.indexOf(begin),b=html.indexOf(end,a);
 assert(a>=0&&b>a,'missing real game code '+begin);
 return html.slice(a,b);
};
assert(html.includes("const grainWorkday=grainJourney?.villageLife===true"));
assert(html.includes("if(grainJourney.villageLife)attachVillageDocumentaryToGrainJourney()"));
assert(html.includes("if(originalGrain){\n  const chain=watchRealGrainJourney();\n  if(chain){\n   attachVillageDocumentaryToGrainJourney();"));
const context={Float32Array};
vm.runInNewContext('const DYNAMIC_WORLD_DELTA_MAX_FLOATS=320000;let dynamicWorldSnapshotAllocations=0,dynamicWorldSnapshotReuses=0,dynamicWorldSnapshotPatchedFloats=0;'+
 excerpt('function retainDynamicWorldGpuSnapshot(','function getDynamicWorldDeltaAudit(')+
 ';globalThis.retain=retainDynamicWorldGpuSnapshot;globalThis.counts=()=>[dynamicWorldSnapshotAllocations,dynamicWorldSnapshotReuses,dynamicWorldSnapshotPatchedFloats];',context);
const initial=new Float32Array(240000);
const reference=initial.slice(),next=initial.slice();
next[60]=2;next[180000]=7;
const delta={ranges:[{firstFloat:60,lastFloat:90},{firstFloat:180000,lastFloat:180030}]};
let resident=context.retain(null,initial,null);
assert.equal(resident.length,240000);const first=resident;
resident=context.retain(resident,next,delta);reference.set(next);
assert.strictEqual(resident,first,'must retain actual prior GPU slot');
assert.deepEqual(Array.from(resident),Array.from(reference),'exact full scene bytes');
resident=context.retain(resident,next,{ranges:[]});
assert.strictEqual(resident,first,'unchanged view must keep original slot');
const changedTopology=context.retain(resident,new Float32Array(30),null);
assert.notStrictEqual(changedTopology,first,'different topology allocates bounded copy');
assert.equal(context.retain(resident,new Float32Array(320001),null),null,'oversize rejects');
assert.equal(context.counts()[0],2);
assert.equal(context.counts()[1],2);
assert.equal(context.counts()[2],60);
console.log('W399 exact-triangle retained GPU snapshot contract PASS; linked documentary running CI still required');
