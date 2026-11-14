'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(game);new vm.Script(game[1]);
const piece=html.match(/const SCENIC_COHERENCE_MARGIN=[\s\S]*?\nfunction drawVisibleStaticChunks\(/);
assert.ok(piece);
assert.match(piece[0],/SCENIC_COHERENCE_MAX_ANCHORS=4/);
const visible=(b,planes)=>planes.every(([nx,ny,nz,d])=>
 nx*(nx>=0?b.maxX:b.minX)+ny*(ny>=0?b.maxY:b.minY)+
 nz*(nz>=0?b.maxZ:b.minZ)+d>=-.45);
const plan=(ranges,planes)=>{
 const runs=ranges.filter(r=>visible(r,planes)).map(r=>({first:r.first,count:r.count}));
 return {runs,issuedTriangles:runs.reduce((n,r)=>n+r.count/3,0),
  visibleTriangles:runs.reduce((n,r)=>n+r.count/3,0),drawCalls:runs.length};
};
const ctx={gpuAvailable:true,swiftGpu:false,planRetainedStaticDraws:plan,
 planVisibleStaticDraws:plan,sceneChunkInFrustum:visible,
 landscapeChunkRanges:[],settlementChunkRanges:[],civicChunkRanges:[],
 homeClusterActive:[],lastCitizenPickFrame:null};
vm.runInNewContext(piece[0].replace(/\nfunction drawVisibleStaticChunks\($/,'')+
 '\nthis.W203={planCoherentStaticDraws,scenicCoherentSafe,scenicCoherentBounds,'+
 'getScenicCoherentAudit,getScenicCoherentReferenceAudit}',ctx);
const w=ctx.W203,ranges=Array.from({length:120},(_,i)=>({
 first:i*3,count:3,minX:20+i*.4,maxX:20+i*.4+.2,
 minY:0,maxY:3,minZ:-1,maxZ:1
}));
const lens=x=>[[1,0,0,-x+15],[-1,0,0,x+15],
 [0,1,0,12],[0,-1,0,12],[0,0,1,12],[0,0,-1,12]];
const check=(v,p)=>{for(const chunk of plan(ranges,p).runs)
 assert.ok(v.runs.some(run=>run.first<=chunk.first&&
  run.first+run.count>=chunk.first+chunk.count),'disappearing original vertex');};
for(const x of [30,30.1,55,44,34,23]){
 const p=lens(x);check(w.planCoherentStaticDraws(ranges,p,false),p);
}
assert.equal(w.getScenicCoherentAudit().maxAnchorsPerImmutableMesh,4);
assert.ok(w.getScenicCoherentAudit().sectorEvictions>0);
const p=lens(44.1),warm=w.planCoherentStaticDraws(ranges,p,false);
check(warm,p);assert.equal(warm.coherentConservative,true);
assert.ok(w.getScenicCoherentAudit().alternativeSectorReuses>0);
const b=w.scenicCoherentBounds([{first:0,count:3,
 minX:90,maxX:92,minY:-2,maxY:2,minZ:-1,maxZ:1}]);
const a=lens(20),rot=a.map(p=>p.slice());
rot[0][0]+=.1;rot[0][3]-=9.1;
assert.equal(w.scenicCoherentSafe(a,rot,b,1.15),true);
rot[0][3]-=5;assert.equal(w.scenicCoherentSafe(a,rot,b,1.15),false);
assert.equal(w.getScenicCoherentReferenceAudit().unavailable,true);
ctx.swiftGpu=true;
assert.equal(Boolean(w.planCoherentStaticDraws(ranges,a,false).coherentConservative),false);
console.log('W203 local scene-bound four-sector safety: PASS');
