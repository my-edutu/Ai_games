'use strict';
// W319 Phase 1: run the original production civic VBO writer on authentic
// ten-float vertex streams, not a replacement renderer or a mocked outcome.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual running game is required');
new Function(script);
const begin=script.indexOf('function rememberCivicScenery(');
const end=script.indexOf('// G140: resident original settlement VBOs',begin);
assert.ok(begin>0&&end>begin,'actual road GPU writer required');
const helperStart=script.indexOf('function planResidentVertexUpload(');
const helperEnd=script.indexOf('function getResidentDeltaUploadAudit(',helperStart);
assert.ok(helperStart>0&&helperEnd>helperStart,'actual production sparse upload planner required');
const source=script.slice(helperStart,helperEnd)+'\\n'+script.slice(begin,end);
let created=0,released=0,fullUploads=0,partialUploads=0;
const buffers=[],allocations=new Map();
let activeBuffer=null;
const context={
 data:[],Float32Array,Map,Number,
 civicGpuResidencyEnabled:true,CIVIC_CACHE_FLOAT_BUDGET:10000,
 CIVIC_CACHE_MAX_ENTRIES:5,civicSceneryCache:new Map(),
 civicCacheEvictions:0,civicGpuUploads:0,civicGpuDisposals:0,
 civicGpuResidencyFailures:0,civicRoadBufferRecycles:0,
 civicRoadBufferSubUploads:0,civicRoadBufferReallocations:0,
 civicRoadBytesUploaded:0,swiftGpu:false,
 civicRoadDeltaLastWindow:null,civicRoadDeltaAvoidedBytes:0,
 civicRoadDeltaPartialUploads:0,civicRoadDeltaFullUploads:0,
 civicRoadDeltaUnchangedUploads:0,
 civicBuffer:null,civicChunkRanges:[],
 civicCoreBuffer:{id:'real-farm-market-core'},activeCivicCoreKey:'spring-core',
 copyStaticVertexRange:start=>new Float32Array(context.data.slice(start)),
 packLinearResidentScenery:vertices=>({vertices,ranges:[{
  first:0,count:vertices.length/10,minX:-4,minY:0,minZ:-4,
  maxX:4,maxY:4,maxZ:4
 }]}),
 packSpatialScenery:()=>{throw Error('original linear packing must succeed')},
 gl:{
  ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,STATIC_DRAW:35044,
  createBuffer:()=>{const b={id:++created};buffers.push(b);return b},
  bufferData:(target,bytes,usage)=>{
   assert.equal(target,34962);assert.equal(usage,35048);
   assert.ok(Number.isSafeInteger(bytes)&&bytes>0&&bytes%120===0,
    'actual original road buffer reserves complete triangle capacity');
   assert.ok(activeBuffer&&buffers.includes(activeBuffer));
   allocations.set(activeBuffer,new Float32Array(bytes/4));fullUploads++;
  },
  bufferSubData:(target,offset,vertices)=>{
   assert.equal(target,34962);
   assert.ok(vertices instanceof Float32Array&&vertices.length%30===0);
   assert.ok(Number.isSafeInteger(offset)&&offset>=0&&offset%120===0,
    'actual sparse upload preserves original 30-float triangles');
   const gpu=allocations.get(activeBuffer);
   assert.ok(gpu&&offset/4+vertices.length<=gpu.length,
    'no unallocated or out-of-range GPU transfer');
   gpu.set(vertices,offset/4);partialUploads++;
  }
 },
 bindGeometry:buffer=>{assert.ok(buffers.includes(buffer));activeBuffer=buffer},
 releaseGeometryBuffer:buffer=>{assert.ok(buffers.includes(buffer));released++},
 civicCacheStats:()=>({cachedGpuFloats:[...context.civicSceneryCache.values()]
  .reduce((total,entry)=>total+entry.vertices.length,0)})
};
vm.runInNewContext(source,context,{timeout:2500});
const remember=(key,count)=>{
 context.data=Array.from({length:count},(_,i)=>(i*37%1001)*.001);
 const expected=Array.from(new Float32Array(context.data));
 const ok=vm.runInNewContext(
  'rememberCivicScenery('+JSON.stringify(key)+',0,{finalMaterial:1})',
  context,{timeout:2500});
 assert.equal(ok,true);
 assert.deepEqual(Array.from(context.civicSceneryCache.get(key).vertices),expected,
  'every original freight, household road and material vertex must survive');
 assert.equal(context.civicCoreBuffer.id,'real-farm-market-core',
  'never lose the independently resident farm, granary and market');
 const originalGpu=allocations.get(context.civicBuffer);
 assert.ok(originalGpu&&originalGpu.length>=expected.length,
  'original civic road VBO must be allocated for every drawn float');
 assert.deepEqual(Array.from(originalGpu.subarray(0,expected.length)),expected,
  'actual resident GPU positions, normals, colours and material labels must exactly match source');
 return context.civicBuffer;
};
const springA='spring:shader-light:actual-civic-roads:homes12';
const springB='spring:shader-light:actual-civic-roads:homes13';
const autumnA='autumn:shader-light:actual-civic-roads:homes13';
const autumnB='autumn:shader-light:actual-civic-roads:homes14';
const originalBuffer=remember(springA,300);
assert.equal(created,1);assert.equal(fullUploads,1);
assert.equal(remember(springB,270),originalBuffer,
 'changed authentic nearby streets must reuse the compatible seasonal GPU buffer');
assert.equal(created,1,'no extra GPU allocation for smaller changed streets');
assert.equal(partialUploads,1,'unchanged smaller authentic source reuses its existing GPU prefix without uploading');
assert.equal(context.civicRoadDeltaUnchangedUploads,1,'zero dirty triangles must never be uploaded');
assert.equal(context.civicSceneryCache.has(springA),false,
 'the superseded same-season road cannot keep stale GPU ownership');
assert.equal(context.civicRoadBufferRecycles,1);
const autumnBuffer=remember(autumnA,300);
assert.notEqual(autumnBuffer,originalBuffer,
 'season-specific geometry never shares a live GPU handle');
assert.equal(created,2);
assert.equal(remember(autumnB,600),autumnBuffer);
assert.equal(created,2,'grown real streets reallocate storage, not VBO handles');
assert.equal(fullUploads,3,'a larger authentic street needs its full source upload');
assert.equal(context.civicRoadBufferReallocations,1);
assert.equal(context.civicRoadBufferRecycles,2);
assert.equal(context.civicSceneryCache.has(autumnA),false);
assert.equal(context.civicSceneryCache.size,2,'one active road per distinct retained season');
assert.equal(partialUploads,3,'three actual growing or cold original road versions transfer their exact vertices');
assert.ok(context.civicRoadBytesUploaded>0&&context.civicRoadDeltaAvoidedBytes>=270*4,
 'bounded original-source delta planner must account for bytes genuinely not sent');
assert.equal(released,0,'actively recycled GPU handles must never be deleted');
console.log('W319 original civic road GPU residency contract PASS: bounded same-season VBO recycling, complete actual geometry, real new home roads, separate seasonal cache and farm-market core. Hardware FPS and visual transformation NOT PROVEN.');
