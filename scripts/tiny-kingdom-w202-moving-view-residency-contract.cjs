'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(game,'original running game inline script');new vm.Script(game[1]);
const match=html.match(/const SCENIC_COHERENCE_MARGIN=[\s\S]*?\nfunction drawVisibleStaticChunks\(/);
assert.ok(match,'W202 conservative moving-camera production spine');
assert.match(html,/const \{runs,\.\.\.audit\}=planCoherentStaticDraws\(ranges,planes,bridge\)/);
assert.match(html,/getScenicCoherentAudit,getScenicCoherentReferenceAudit/);
const sceneVisible=(b,planes)=>planes.every(([nx,ny,nz,d])=>
 nx*(nx>=0?b.maxX:b.minX)+ny*(ny>=0?b.maxY:b.minY)+
 nz*(nz>=0?b.maxZ:b.minZ)+d>=-.45);
const plan=(ranges,planes)=>{
 const runs=[];let chunks=0,triangles=0;
 for(const b of ranges)if(sceneVisible(b,planes)){
  runs.push({first:b.first,count:b.count});chunks++;triangles+=b.count/3;
 }
 return {runs,totalChunks:ranges.length,visibleChunks:chunks,
  visibleTriangles:triangles,culledTriangles:ranges.length-triangles,
  drawCalls:runs.length,strictDrawCalls:runs.length,bridgedTriangles:0,
  bridgedChunks:0,issuedTriangles:triangles,savedDrawCalls:0,
  maxBridgeTriangles:384,invalidRanges:0};
};
const ctx={gpuAvailable:true,swiftGpu:false,planRetainedStaticDraws:plan,
 planVisibleStaticDraws:plan,sceneChunkInFrustum:sceneVisible,
 landscapeChunkRanges:[],settlementChunkRanges:[],civicChunkRanges:[],
 homeClusterActive:[],lastCitizenPickFrame:null};
vm.runInNewContext(match[0].replace(/\nfunction drawVisibleStaticChunks\($/,'')+
 '\nthis.W202={planCoherentStaticDraws,scenicCoherentSafe,scenicCoherentBounds,'+
 'getScenicCoherentAudit,getScenicCoherentReferenceAudit};',ctx);
const {W202:w}=ctx;
const ranges=Array.from({length:120},(_,i)=>{
 const x=(i-60)*.2;return {first:i*3,count:3,
 minX:x,minY:0,minZ:-.15,maxX:x+.12,maxY:.6,maxZ:.15};
});
const f=[ [1,0,0,3],[-1,0,0,3],
 [0,1,0,5],[0,-1,0,5],[0,0,1,5],[0,0,-1,5] ];
const initial=w.planCoherentStaticDraws(ranges,f,false);
assert.equal(Boolean(initial.coherentConservative),false,'initial view remains exact');
const bounds=w.scenicCoherentBounds(ranges);
for(const d of [-.75,-.30,0,.20,.54,.74]){
 const moved=f.map(p=>p.slice());moved[0][3]+=d;moved[1][3]-=d;
 assert.ok(w.scenicCoherentSafe(f,moved,bounds,1.15),'guard covers camera translation');
 const candidate=w.planCoherentStaticDraws(ranges,moved,false);
 assert.equal(candidate.coherentConservative,true,'cached real original geometry reused');
 for(const b of ranges)if(sceneVisible(b,moved))
  assert.ok(candidate.runs.some(run=>run.first<=b.first&&
    run.first+run.count>=b.first+b.count),'never omit a true visible original chunk');
}
const far=f.map(p=>p.slice());far[0][3]+=4;far[1][3]-=4;
assert.equal(w.scenicCoherentSafe(f,far,bounds,1.15),false,
 'large lens motion cannot reuse stale commands');
assert.equal(Boolean(w.planCoherentStaticDraws(ranges,far,false).coherentConservative),
 false,'large move falls back to the exact scene');
assert.equal(w.scenicCoherentSafe(f,[...f.slice(0,5),[NaN,0,0,0]],bounds,1.15),false);
assert.ok(w.getScenicCoherentAudit().reuses>=6);
assert.equal(w.getScenicCoherentReferenceAudit().unavailable,true);
ctx.swiftGpu=true;
assert.equal(Boolean(w.planCoherentStaticDraws(ranges,f,false).coherentConservative),
 false,'software path stays strict and does not increase raster cost');
console.log('W202 actual geometry conservative plane-bound/camera parity: PASS');
