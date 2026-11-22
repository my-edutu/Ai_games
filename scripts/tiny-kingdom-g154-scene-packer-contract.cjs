'use strict';
// G154: compare the spatial-packer rewrite with the genuine legacy algorithm.
// Render-only geometry must retain byte-identical order, chunk bounds and LOD.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function packSpatialScenery(mesh){');
const end=html.indexOf('function sceneFrustumPlanes(',begin);
assert(begin>=0&&end>begin,'Locate the real in-game spatial packer');
const edge=18;
const pack=new Function('SCENIC_CHUNK_EDGE',html.slice(begin,end)+';return packSpatialScenery;')(edge);
// W18 RED-before: growth and seasonal visits must no longer allocate a
// per-triangle JS string or per-triangle typed-array view for 100k+ triangles.
// Structural budget catches regressions deterministically; the runtime timings
// below are diagnostic only, NEVER a performance-gate or hardware FPS claim.
const source=html.slice(begin,end);
assert.match(source,/const triangleChunkIds=new Uint32Array\(triangleCount\)/,
 'Use bounded packed integer chunk IDs rather than 120k JS string entries');
assert.doesNotMatch(source,/triangleKeys=new Array\(triangleCount\)/,
 'No object/string entry per triangle in the settlement rebuild');
assert.doesNotMatch(source,/\.subarray\(o,o\+30\)/,
 'No short typed-array allocation on every geometry triangle');


 // W38 growth-frame architecture: when an actual cottage or a seasonal forest
 // changes, bucket bounds must be computed while reading source triangles.
 // A second all-triangle AABB pass over the scattered destination caused
 // avoidable work during already stalled SwiftShader construction frames.
 // Keep exact original source order, full AABB (not centroid-only) and
 // G154's byte-exact reference validation below. This is NOT a FPS claim.
const scatterStart=source.indexOf('const packed=new Float32Array(mesh.length)');
assert(scatterStart>0,'A bounded typed array stores every original triangle');
const sourcePass=source.slice(0,scatterStart);
const scatterPass=source.slice(scatterStart);
assert.match(sourcePass,/triangleMinX/,
 'Compute full source triangle AABB before the scatter pass');
assert.match(sourcePass,/chunk\.minX/,
 'Accumulate each chunk AABB during the source scan');
assert.doesNotMatch(scatterPass,/range\.minX\s*=\s*Math\.min/,
 'Do not rescan each triangle for chunk bounds after bucketing');

function reference(mesh){
 assert.equal(mesh.length%30,0);
 const buckets=new Map();
 for(let o=0;o<mesh.length;o+=30){
  const x=(mesh[o]+mesh[o+10]+mesh[o+20])/3;
  const z=(mesh[o+2]+mesh[o+12]+mesh[o+22])/3;
  const k=Math.floor(x/edge)+':'+Math.floor(z/edge);
  if(!buckets.has(k))buckets.set(k,[]);
  buckets.get(k).push(o);
 }
 const vertices=new Float32Array(mesh.length),ranges=[];
 let cursor=0;
 for(const k of [...buckets.keys()].sort()){
  const offsets=buckets.get(k),range={first:cursor/10,count:offsets.length*3,
   minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity};
  for(const o of offsets){
   vertices.set(mesh.subarray(o,o+30),cursor);
   for(let v=0;v<3;v++){
    const x=mesh[o+v*10],y=mesh[o+v*10+1],z=mesh[o+v*10+2];
    range.minX=Math.min(range.minX,x);range.maxX=Math.max(range.maxX,x);
    range.minY=Math.min(range.minY,y);range.maxY=Math.max(range.maxY,y);
    range.minZ=Math.min(range.minZ,z);range.maxZ=Math.max(range.maxZ,z);
   }
   cursor+=30;
  }
  ranges.push(range);
 }
 return {vertices,ranges};
}
function sample(count,seed){
 const arr=new Float32Array(count*30);
 let s=seed>>>0;
 const rand=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<count;i++){
  const x=(rand()-.5)*160,z=(rand()-.5)*160,y=rand()*12;
  for(let v=0;v<3;v++){
   const j=i*30+v*10;
   arr[j]=x+v*.5;arr[j+1]=y+v*.2;arr[j+2]=z+v*.18;
   arr[j+3]=0;arr[j+4]=1;arr[j+5]=0;
   arr[j+6]=rand();arr[j+7]=rand();arr[j+8]=rand();arr[j+9]=v%3;
  }
 }
 return arr;
}
for(const count of [0,1,8,257,2048,10000,120000]){
 const src=sample(count,88311+count);
 const started=performance.now();
 const expected=reference(src);const referenceMs=performance.now()-started;
 const packedAt=performance.now(),actual=pack(src);
 const candidateMs=performance.now()-packedAt;
 if(count>=120000)console.log('W18 synthetic pack/legacy ms:',
  candidateMs.toFixed(1),'/',referenceMs.toFixed(1),'(diagnostic, not FPS)');
 assert.deepEqual(actual.ranges,expected.ranges,'Bounds/order differ for '+count);
 assert.deepEqual(actual.vertices,expected.vertices,'Mesh changed for '+count);
 assert.equal(src.length,count*30,'Packer mutated input');
}
for(const length of [1,29,31]){
 assert.throws(()=>pack(new Float32Array(length)),/stride/);
}
const poisoned=sample(3,14);poisoned[0]=NaN;
assert.throws(()=>pack(poisoned),/nonfinite/);
console.log('G154 exact original spatial mesh/normal/material order and bounds: PASS (synthetic fixtures only, not WebGL FPS)');
