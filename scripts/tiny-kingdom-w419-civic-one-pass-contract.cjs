'use strict';
// W419 Phase-1 RED/GREEN: the REAL civic road VBO must stage exact float32
// vertices AND conservative bounds in one pass from its original frame offset.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const original=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(m=>m[1].includes('function rememberCivicScenery('))?.[1];
assert(original,'playable original world is required');
new vm.Script(original);
const start=original.indexOf('function rememberCivicScenery(');
const end=original.indexOf('// G140: resident original settlement VBOs',start);
assert(start>0&&end>start,'original resident civic road renderer required');
const source=original.slice(start,end);
const stream=Array.from({length:390},(_,i)=>i<90?999:(i%30===9?4:(i*17%131)*.007));
const expected=Array.from(new Float32Array(stream.slice(90)));
function exercise(gpu=true,allocation=true){
 const calls={copies:0,packs:[],uploads:0},ctx={
  data:stream.slice(),Float32Array,Map,Number,
  civicGpuResidencyEnabled:gpu,swiftGpu:false,
  CIVIC_CACHE_FLOAT_BUDGET:12000,CIVIC_CACHE_MAX_ENTRIES:5,
  civicSceneryCache:new Map(),civicBuffer:null,civicChunkRanges:[],
  civicGpuUploads:0,civicGpuDisposals:0,civicGpuResidencyFailures:0,
  civicRoadBufferRecycles:0,civicRoadBufferSubUploads:0,
  civicRoadBufferReallocations:0,civicRoadBytesUploaded:0,
  civicRoadDeltaPartialUploads:0,civicRoadDeltaUnchangedUploads:0,
  civicRoadDeltaFullUploads:0,civicRoadDeltaAvoidedBytes:0,
  civicRoadDeltaLastWindow:null,civicCacheEvictions:0,
  civicCoreBuffer:{id:'authentic-farm-market-core'},
  activeCivicCoreKey:'genuine-core',
  copyStaticVertexRange:(offset)=>{calls.copies++;
   return new Float32Array(ctx.data.slice(offset));},
  packLinearResidentScenery:(mesh,sceneClass,offset=0)=>{
   calls.packs.push({sceneClass,offset,originalSource:Array.isArray(mesh)});
   const vertices=Array.isArray(mesh)?
    new Float32Array(mesh.slice(offset)):mesh;
   return {vertices,ranges:[{first:0,count:vertices.length/10,
    minX:-10,minY:0,minZ:-10,maxX:10,maxY:10,maxZ:10}]};
  },
  packSpatialScenery:()=>{throw Error('real unchanged order must be packed linearly')},
  planResidentVertexUpload:()=>null,
  civicCacheStats:()=>({cachedGpuFloats:300}),
  releaseGeometryBuffer:()=>{throw Error('no original core or new road may be discarded')},
  bindGeometry:()=>{},
  gl:{ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,
   createBuffer:()=>allocation?{id:'real-civic-vbo'}:null,
   bufferData:(_target,size)=>{assert.equal(size%4,0);
    calls.gpu=new Float32Array(size/4);},
   bufferSubData:(_target,byteOffset,values)=>{
    assert(values instanceof Float32Array,'GPU upload must contain Float32Array');
    calls.gpu.set(values,byteOffset/4);calls.uploads++;}}
 };
 vm.runInNewContext(source,ctx,{timeout:2000});
 const ok=vm.runInNewContext('rememberCivicScenery("spring:shader-light:actual-civic-roads:12",90,{finalMaterial:1})',ctx,{timeout:2000});
 assert.equal(ok,gpu&&allocation);
 assert.deepEqual(ctx.data,stream,'source stays intact for original fallback and authority');
 if(gpu){
  assert.equal(calls.copies,0,'source offset must NOT make one full typed copy then pack again');
  assert.equal(calls.packs.length,1,'original civic road geometry packed exactly once');
  assert.equal(calls.packs[0].originalSource,true,'packer must consume original frame directly');
  assert.equal(calls.packs[0].offset,90,'sentinel prefix must never enter civic culling bounds');
  assert.equal(calls.packs[0].sceneClass,'civic-road','original road has distinct residency evidence');
 }else{
  assert.equal(calls.packs.length,0,'software fallback keeps complete original JS source');
 }
 if(gpu&&allocation){
  assert.deepEqual(Array.from(ctx.civicSceneryCache.values().next().value.vertices),expected);
  assert.deepEqual(Array.from(calls.gpu.subarray(0,300)),expected,
   'original 10-float vertex ordering, normals and material unchanged on GPU');
  assert.equal(calls.uploads,1,'one bounded complete original civic upload');
  assert.equal(ctx.civicCoreBuffer.id,'authentic-farm-market-core');
 }else{
  assert.equal(calls.uploads,0);
  if(!gpu)assert.deepEqual(ctx.civicSceneryCache.values().next().value.vertices,stream.slice(90));
  if(gpu)assert.equal(ctx.civicBuffer,null,'failed GPU allocation does not draw stale road');
 }
}
exercise(true,true);exercise(true,false);exercise(false,true);
console.log('W419 PASS: original civic road source offset uses one Float32 packing+bounds traversal; exact GPU vertices, allocation failure and software full geometry preserved. FPS and experience NOT PROVEN.');
