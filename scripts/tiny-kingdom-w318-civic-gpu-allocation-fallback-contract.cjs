'use strict';
// W318 regression-first: live original civic source cannot disappear when
// WebGL refuses a dependent road VBO. Exercise PRODUCTION functions directly.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'real playable renderer required');new Function(script);
const start=script.indexOf('function rememberCivicScenery(');
const end=script.indexOf('// G140: resident original settlement VBOs',start);
assert.ok(start>0&&end>start,'actual production civic GPU writer required');
const original=script.slice(start,end);
assert.match(script,/if\(civicGpuResidencyEnabled&&stored\)data.length=civicStart/,
 'game must remove civic CPU mesh only after a genuine successful GPU upload');
function exercise(allocate){
 const calls={upload:0,release:0};
 const ctx={data:Array.from({length:300},(_,i)=>i/10),Float32Array,Number,Map,
  civicGpuResidencyEnabled:true,CIVIC_CACHE_MAX_ENTRIES:5,CIVIC_CACHE_FLOAT_BUDGET:8000000,
  civicCacheEvictions:0,civicGpuDisposals:0,civicGpuUploads:0,civicGpuResidencyFailures:0,
  civicBuffer:{id:'stale-road'},civicChunkRanges:[{first:0,count:3}],
  civicCoreBuffer:{id:'genuine-farm-market-core'},activeCivicCoreKey:'spring',
  civicSceneryCache:new Map([['road-A',{
   vertices:new Float32Array(30),buffer:{id:'stale-road'},stats:{}
  }]]),
  copyStaticVertexRange:from=>new Float32Array(ctx.data.slice(from)),
  packLinearResidentScenery:vertices=>({vertices,ranges:[{first:0,count:vertices.length/10}]}),
  packSpatialScenery:()=>{throw Error('original linear source expected')},
  gl:{ARRAY_BUFFER:34962,STATIC_DRAW:35044,
   createBuffer:()=>allocate?{id:'new-road'}:null,
   bufferData:()=>{calls.upload++}},
  bindGeometry:buffer=>assert.ok(buffer,'must never bind missing GPU allocation'),
  releaseGeometryBuffer:()=>{calls.release++},
  civicCacheStats:()=>({cachedFloats:300})};
 vm.runInNewContext(original,ctx,{timeout:2000});
 const stored=vm.runInNewContext('rememberCivicScenery("road-A",0,{finalMaterial:1})',
  ctx,{timeout:2000});
 assert.equal(stored,allocate);
 assert.equal(ctx.data.length,300,'never drop actual road geometry before residency');
 assert.equal(ctx.civicCoreBuffer.id,'genuine-farm-market-core',
  'never evict independently resident original farm/granary/market core');
 assert.equal(calls.release,1,'stale road VBO must be disposed, not drawn');
 assert.equal(calls.upload,allocate?1:0);
 if(!allocate){
  assert.equal(ctx.civicBuffer,null,'no stale road drawing after allocation failure');
  assert.equal(ctx.civicChunkRanges.length,0);
  assert.equal(ctx.civicSceneryCache.has('road-A'),false);
  assert.equal(ctx.civicGpuResidencyFailures,1);
 }else{
  assert.equal(ctx.civicBuffer.id,'new-road');
  assert.equal(ctx.civicSceneryCache.get('road-A').vertices.length,300);
  assert.equal(ctx.civicGpuResidencyFailures,0);
 }
}
exercise(false);exercise(true);
console.log('W318 PASS: true original farm-market core remains, failed civic road VBO keeps all road CPU vertices and never draws stale buffer. GPU performance and visual quality NOT MEASURED.');
