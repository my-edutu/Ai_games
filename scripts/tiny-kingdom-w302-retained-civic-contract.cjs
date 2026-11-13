'use strict';
// W302 Phase 1: exercise the real civic resident-mesh function, full source,
// exact original vertex order and both WebGL and fallback ownership paths.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const game=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(match=>match[1].includes('function rememberCivicScenery('));
assert(game,'original game must contain the real resident civic renderer');
new vm.Script(game[1]); // full production script, never substitute mock game
const fragment=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>=0&&b>a,'original source block missing '+start);
 return html.slice(a,b);
};
const typedCopy=fragment('function copyStaticVertexRange(',
 'function restoreCivicStats(');
const civic=fragment('function rememberCivicScenery(',
 '// G140: resident original settlement VBOs');
assert(html.includes('rememberCivicScenery(civicKey,civicStart,{'),
 'real civic district must use an original vertex offset, not a second JS allocation');
assert(!html.includes('rememberCivicScenery(civicKey,data.slice(civicStart),{'));
const stream=Array.from({length:93},(_,i)=>i<3?999:
 i%10===9?6:(i*137%79)*.005); // 3 sentinels, 90 floats (3 real triangles)
const expected=Array.from(new Float32Array(stream.slice(3)));
function check(resident){
 let uploads=0,disposed=0;
 const context={
  data:stream.slice(),gpuAvailable:resident,civicGpuResidencyEnabled:resident,
  cachedTypedRangeCopies:0,cachedTypedRangeFloats:0,
  CIVIC_CACHE_FLOAT_BUDGET:4000,CIVIC_CACHE_MAX_ENTRIES:4,
  civicSceneryCache:new Map(),civicCacheEvictions:0,
  civicGpuUploads:0,civicGpuDisposals:0,
  gl:{ARRAY_BUFFER:1,STATIC_DRAW:2,createBuffer:()=>({id:7}),
   bufferData:(target,typed,usage)=>{
    assert.equal(target,1);assert.equal(usage,2);
    assert(ArrayBuffer.isView(typed),'actual upload needs Float32 geometry');
    assert.deepEqual(Array.from(typed),expected);uploads++;
   }},
  bindGeometry:buffer=>assert.equal(buffer.id,7),
  packLinearResidentScenery:typed=>({vertices:typed,ranges:[{
   first:0,count:typed.length/10,minX:0,minY:0,minZ:0,maxX:1,maxY:1,maxZ:1}]}),
  packSpatialScenery:()=>{throw Error('unexpected spatial scatter')},
  releaseGeometryBuffer:()=>disposed++,
  civicCacheStats:()=>({cachedFloats:90})
 };
 const ctx=vm.createContext(context);
 vm.runInContext(typedCopy+'\n'+civic,ctx,{timeout:2000});
 const run=expr=>vm.runInContext(expr,ctx,{timeout:2000});
 assert.equal(run('rememberCivicScenery("real-farm-market",3,{farm:{real:true}})'),true);
 const live=context.civicSceneryCache.get('real-farm-market');
 assert(live,'complete physical quarter must remain cached');
 assert.deepEqual(Array.from(new Float32Array(live.vertices)),expected,
  'never reorder/remove farm, store, market or worker-adjacent scenery');
 if(!resident)assert.deepEqual(Array.from(live.vertices),stream.slice(3),
  'CPU fallback retains exact original JS source numbers');
 assert.equal(context.data.length,stream.length,'source scene is never truncated before GPU residency succeeds');
 assert.equal(uploads,resident?1:0,'only one resident civic GPU upload');
 assert.equal(context.cachedTypedRangeCopies,resident?1:0,
  'one exact typed copy, not JS slice plus second typed allocation');
 assert.equal(context.cachedTypedRangeFloats,resident?90:0);
 assert.equal(disposed,0);
 assert.equal(context.civicCacheEvictions,0);
 assert.throws(()=>run('rememberCivicScenery("bad",-1,{})'),/W302 invalid original civic source offset/);
}
check(true);check(false);
console.log('W302 original civic slice-free retained geometry contract PASS; source-order parity, complete 3 triangles, single typed resident allocation, CPU fallback and unchanged authoritative data. Hardware FPS and visual transformation NOT PROVEN.');
