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
console.log('W363 PASS: original full triangles reconstructed under growth/middle change/shrink; strict bounds, safe spatial fallback, upload audit. Actual FPS/LOOK not proven.');
