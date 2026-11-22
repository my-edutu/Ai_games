'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const game=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function originalPacker(){
 const begin=game.indexOf('const scenicLinearPackStats={');
 const end=game.indexOf('function getScenicLinearPackAudit(){',begin);
 assert.ok(begin>=0&&end>begin,'original linear resident packer exists');
 // Share the typed-array constructor so cross-context instanceof matches the renderer.
 const ctx=vm.createContext({Float32Array});
 vm.runInContext([
  'const SCENIC_LINEAR_LOCAL_MAX_TRIANGLES=768;',
  'const SCENIC_LINEAR_LOCAL_MIN_TRIANGLES=96;',
  'const SCENIC_LINEAR_LOCAL_EDGE=34;',
  'const SCENIC_LINEAR_LOCAL_MAX_RANGES=512;',
  game.slice(begin,end),
  'globalThis.pack=packLinearResidentScenery;',
  'globalThis.stats=scenicLinearPackStats;'
 ].join('\n'),ctx);
 return ctx;
}
function triangles(n){
 const out=[];
 for(let i=0;i<n;i++){
  const x=i<110?i*.03:45+(i-110)*.04;
  for(let j=0;j<3;j++)out.push(x+(j===1?.23:0),.02*j,5+(j===2?.31:0),
   0,1,0,.4+i*.001,.33,.24,2);
 }
 return out;
}
test('W416 original JS scene converts and computes conservative GPU draw ranges in one traversal',()=>{
 const ctx=originalPacker();
 const raw=triangles(260),prefix=triangles(2);
 const old=ctx.pack(new Float32Array(raw),'w416-control');
 assert.ok(old&&old.vertices.length===raw.length);
 const combined=prefix.concat(raw);
 const current=ctx.pack(combined,'w416-direct',prefix.length);
 assert.ok(current,'raw original scene must be admitted without an intermediate Float32 pass');
 assert.deepEqual([...current.vertices],[...old.vertices],'all ten original vertex floats preserved');
 assert.deepEqual(JSON.parse(JSON.stringify(current.ranges)),JSON.parse(JSON.stringify(old.ranges)),
  'same conservative original-triangle frustum ranges');
 assert.equal(current.ranges.reduce((sum,r)=>sum+r.count,0),raw.length/10);
 assert.ok(ctx.stats.sourceArrayDirectPacks>=1);
 assert.ok(ctx.stats.sourceArrayFloatsConverted>=raw.length);
});
test('W416 typed resident path remains byte-for-byte unchanged, no silent missing geometry',()=>{
 const ctx=originalPacker(),raw=triangles(258);
 const before=ctx.pack(new Float32Array(raw),'typed-existing');
 const after=ctx.pack(new Float32Array(raw),'typed-after',0);
 assert.deepEqual([...after.vertices],[...before.vertices]);
 assert.deepEqual(JSON.parse(JSON.stringify(after.ranges)),
  JSON.parse(JSON.stringify(before.ranges)));
 assert.equal(ctx.pack([0,1,2],'malformed',0),null);
});
test('W416 cold resident builders use original source arrays directly, never double-scan before upload',()=>{
 assert.match(game,/packLinearResidentScenery\(data,'landscape'\)/);
 assert.match(game,/packLinearResidentScenery\(data,'settlement'\)/);
 assert.match(game,/packLinearResidentScenery\(data,'civic-core',sourceStart\)/);
 assert.match(game,/packUploadMs:/);
});
