'use strict';
/* W363 test-first: unchanged whole-triangle resident static GPU range must
   survive a REAL newer settlement topology. No crop, actor or economy proxy. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'live Tiny Kingdom inline renderer is missing');
new Function(game);
const start=game.indexOf('function planResidentVertexUpload(');
const end=game.indexOf('function uploadGrowingSettlement(',start);
assert(start>=0&&end>start,
 'RED: original growing settlement renderer lacks bounded W363 dirty-range planner');
const section=game.slice(start,end);
const planner=new Function(section+'return planResidentVertexUpload;')();
const triangles=values=>{
 const vertices=new Float32Array(values.length*30);
 for(let i=0;i<values.length;i++)vertices.fill(values[i],i*30,(i+1)*30);
 return vertices;
};
function expect(before,after,capacity,expected){
 const plan=planner(triangles(before),triangles(after),capacity);
 assert.deepEqual(plan,expected);
 if(plan){
  assert.equal(plan.firstFloat%30,0,'never split an original triangle');
  assert.equal(plan.lastFloat%30,0,'never split an original triangle');
  assert(plan.lastFloat<=after.length*30);
  const restored=triangles(before);
  const target=triangles(after);
  const buffer=new Float32Array(capacity);
  buffer.set(restored.subarray(0,Math.min(restored.length,capacity)));
  buffer.set(target.subarray(plan.firstFloat,plan.lastFloat),plan.firstFloat);
  assert.deepEqual(buffer.subarray(0,target.length),target,
    'a true VBO sub-upload must exactly reconstruct every current original vertex');
 }
}
expect([1,2],[1,2,3],120,
 {firstFloat:60,lastFloat:90,dirtyFloats:30,savedFloats:60,unchanged:false});
expect([1,2,3],[1,2,3],120,
 {firstFloat:90,lastFloat:90,dirtyFloats:0,savedFloats:90,unchanged:true});
expect([1,2,3,4],[1,8,9,4],150,
 {firstFloat:30,lastFloat:90,dirtyFloats:60,savedFloats:60,unchanged:false});
expect([1,2,3,4],[1,2,3],150,
 {firstFloat:90,lastFloat:90,dirtyFloats:0,savedFloats:90,unchanged:true});
expect([1,2,3,4],[1,2,9],150,
 {firstFloat:60,lastFloat:90,dirtyFloats:30,savedFloats:60,unchanged:false});
expect([1,2],[1,2,3],60,null);
assert.equal(planner([],triangles([1]),60),null,'untrusted original typed layout falls back');
assert.equal(planner(triangles([1]),[1,2,3],60),null);
assert.equal(planner(triangles([1]),triangles([1]),-1),null);
assert(game.includes('reusable.linearVertices&&linearVertices'),
 'only identical packed GPU draw ordering may use partial uploads');
assert(game.includes('gl.bufferSubData(gl.ARRAY_BUFFER,dirty.firstFloat*Float32Array.BYTES_PER_ELEMENT'),
 'WebGL sub-data offset must be in BYTES, never floats');
assert(game.includes('getResidentDeltaUploadAudit'),
 'runtime must expose measured upload-window counters for true tracing');
assert(game.includes('retainSettlementSeason(staticKey,scenicMeshCache,settlementChunkRanges,settlementBuffer,uploaded.capacityFloats,uploaded.linearVertices)'),
 'residency must persist exact-vertex-order qualification across town growth');
// Exercise the ORIGINAL growing-settlement implementation with an actual
// in-memory WebGL buffer, not just a copied version of its intended planner.
const uploadStart=game.indexOf('function uploadGrowingSettlement(');
const uploadEnd=game.indexOf('function retainSettlementSeason(',uploadStart);
assert(uploadStart>=0&&uploadEnd>uploadStart,'actual GPU upload source is missing');
const uploadSource=game.slice(uploadStart,uploadEnd);
function actualGpuTownGrowth(beforeValues,afterValues,options={}){
 const before=triangles(beforeValues),after=triangles(afterValues);
 const originalCapacity=options.capacity||150;
 const oldBuffer={stored:new Float32Array(originalCapacity)};
 oldBuffer.stored.set(before);
 const glCalls=[];
 const env={
  cache:new Map([['settlement:1',{buffer:oldBuffer,mesh:before,
   capacityFloats:originalCapacity,linearVertices:options.oldLinear!==false}]]),
  scenic:after,swift:Boolean(options.swift),bound:null,
  gl:{
   ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,
   createBuffer(){return {stored:new Float32Array(0)};},
   bufferData(target,bytes){
    assert.equal(target,34962);assert.equal(bytes%4,0);
    env.bound.stored=new Float32Array(bytes/4);
    glCalls.push({kind:'allocate',bytes});
   },
   bufferSubData(target,byteOffset,values){
    assert.equal(target,34962);assert.equal(byteOffset%4,0);
    assert(byteOffset+values.byteLength<=env.bound.stored.byteLength);
    env.bound.stored.set(values,byteOffset/4);
    glCalls.push({kind:'write',byteOffset,bytes:values.byteLength});
   }
  }
 };
 const source=new Function('env',[
  'const gl=env.gl;',
  'const settlementSeasonCache=env.cache;',
  'const scenicMeshCache=env.scenic;',
  'const swiftGpu=env.swift;',
  'const SETTLEMENT_SEASON_FLOAT_BUDGET=1800;',
  'let settlementSeasonFloats=env.cache.get("settlement:1").mesh.length;',
  'let settlementSeasonBufferDisposals=0,settlementSeasonStaleDisposals=0;',
  'let settlementSeasonBufferHandleRecycles=0,settlementSeasonBufferCreations=0;',
  'let settlementSeasonBufferReuses=0,staticGpuUploads=0;',
  'const settlementTopology=key=>key.slice(key.lastIndexOf(":")+1);',
  'const bindGeometry=buffer=>{env.bound=buffer;};',
  'const releaseGeometryBuffer=()=>{throw Error("unexpected original VBO disposal");};',
  'const residentDeltaUploadAudit={candidates:0,fullUploads:0,partialUploads:0,unchangedUploads:0,uploadedBytes:0,avoidedBytes:0,lastWindow:null};',
  section,uploadSource,
  'return {upload:uploadGrowingSettlement,stats:getResidentDeltaUploadAudit};'
 ].join('\n'))(env);
 const pack={vertices:options.spatial?new Float32Array(after):after};
 const resident=source.upload(pack,'settlement:2');
 assert.deepEqual(resident.buffer.stored.subarray(0,after.length),after,
  'the actual hardware upload must yield the COMPLETE original visible world');
 return {glCalls,stats:source.stats(),resident,originalBuffer:oldBuffer};
}
const changedMiddle=actualGpuTownGrowth([1,2,3,4],[1,8,9,4]);
assert.equal(changedMiddle.resident.buffer,changedMiddle.originalBuffer);
assert.deepEqual(changedMiddle.glCalls,[{kind:'write',byteOffset:120,bytes:240}]);
assert.equal(changedMiddle.stats.partialUploads,1);
assert.equal(changedMiddle.stats.fullUploads,0);
const realAppend=actualGpuTownGrowth([1,2],[1,2,3]);
assert.deepEqual(realAppend.glCalls,[{kind:'write',byteOffset:240,bytes:120}]);
const realShrink=actualGpuTownGrowth([1,2,3,4],[1,2,3]);
assert.deepEqual(realShrink.glCalls,[],
 'shorter original draw ranges must not upload or reveal obsolete triangles');
assert.equal(realShrink.stats.unchangedUploads,1);
const softwareFallback=actualGpuTownGrowth([1,2,3],[1,8,3],{swift:true});
assert.deepEqual(softwareFallback.glCalls,[{kind:'write',byteOffset:0,bytes:360}],
 'SwiftShader must not pay for the additional dirty-triangle scan');
const spatialFallback=actualGpuTownGrowth([1,2,3],[1,8,3],{spatial:true});
assert.deepEqual(spatialFallback.glCalls,[{kind:'write',byteOffset:0,bytes:360}],
 'reordered original vertex data must always get a full GPU upload');
const resized=actualGpuTownGrowth([1,2],[1,2,3],{capacity:60});
assert(resized.glCalls.some(row=>row.kind==='allocate'));
assert(resized.glCalls.some(row=>row.kind==='write'&&row.byteOffset===0&&row.bytes===360));
assert.equal(resized.stats.partialUploads,0);

console.log('W363 PASS: original full triangles reconstructed under growth/middle change/shrink; strict bounds, safe spatial fallback, upload audit. Actual FPS/LOOK not proven.');
