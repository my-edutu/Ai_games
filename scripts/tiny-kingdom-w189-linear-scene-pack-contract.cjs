'use strict';
// Phase 1 W189 source contract. This tests the actual 10-float WebGL
// material stream; it does not assert a hardware FPS improvement.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game&&game.includes('function packLinearResidentScenery('));
new Function(game);
const a=html.indexOf('const SCENIC_LINEAR_LOCAL_MAX_TRIANGLES=');
const b=html.indexOf('function sceneFrustumPlanes(m)',a);
assert(a>=0&&b>a);
const impl=new Function(html.slice(a,b)+
 'return {packLinearResidentScenery,getScenicLinearPackAudit};')();
const TRIANGLES_PER_BLOCK=96,BLOCKS=520,triangleCount=BLOCKS*TRIANGLES_PER_BLOCK;
const original=new Float32Array(triangleCount*30);
for(let i=0;i<triangleCount;i++){
 const block=Math.floor(i/TRIANGLES_PER_BLOCK);
 const x=block%2?90:0;
 for(let j=0;j<3;j++){
  const o=i*30+j*10;
  original[o]=x+(i%8)*.02+j*.005;
  original[o+1]=1+j*.01;
  original[o+2]=4+(i%9)*.02+j*.005;
  original[o+3]=0;original[o+4]=1;original[o+5]=0;
  original[o+6]=.35;original[o+7]=.32;original[o+8]=.29;
  original[o+9]=7;
 }
}
const pack=impl.packLinearResidentScenery(original,'inhabited-scene');
assert(pack,'original fragmented material stream must avoid re-scatter');
assert.equal(pack.vertices,original,'SAME GPU upload array identity');
assert(pack.ranges.length>1&&pack.ranges.length<=512,'bounded draw ranges');
assert.equal(pack.ranges.reduce((n,r)=>n+r.count,0),triangleCount*3);
let expectedFirst=0;
for(const region of pack.ranges){
 assert.equal(region.first,expectedFirst,'no gap, duplicate or reorder');
 assert.equal(region.count%3,0,'complete triangles');
 expectedFirst+=region.count;
 for(let v=region.first;v<expectedFirst;v++){
  const o=v*10;
  assert(original[o]>=region.minX&&original[o]<=region.maxX);
  assert(original[o+1]>=region.minY&&original[o+1]<=region.maxY);
  assert(original[o+2]>=region.minZ&&original[o+2]<=region.maxZ);
 }
}
const audit=impl.getScenicLinearPackAudit();
assert(audit.coalescedPacks>=1&&audit.coalescedRanges>=8);
assert.equal(audit.residentFloatsWithoutScatter,original.length);
assert.equal(audit.neverDropsSourceVertices,true);
const broken=new Float32Array(30);broken[0]=NaN;
assert.throws(()=>impl.packLinearResidentScenery(broken,'invalid'),/nonfinite/);
console.log('W189 source PASS: 49,920 original-format 3D triangles, complete original vertex/material order, conservative AABBs and <=512 draw ranges. Not hardware FPS or visual PASS.');
