'use strict';
// W171 Phase 1 source-bound behavior contracts; real browser films still required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline,'actual playable game JavaScript');
new Function(inline); // Full renderer source must compile, not merely a copied helper.

function between(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'source markers remain connected: '+start);
 return html.slice(a,b);
}
assert.match(html,/packLinearResidentScenery\(retained,'civic'\)\|\|packSpatialScenery\(retained\)/);
assert.match(html,/packLinearResidentScenery\(scenicMeshCache,'settlement'\)\|\|packSpatialScenery\(scenicMeshCache\)/);
const packSource=between('const SCENIC_LINEAR_LOCAL_MAX_TRIANGLES=','function sceneFrustumPlanes(m){');
const pack=new Function(packSource+'return {packLinearResidentScenery,getScenicLinearPackAudit};')();
const mesh=new Float32Array(2500*30);
for(let i=0;i<2500;i++){
 const x=i<1250?2+(i%20)*.15:50+(i%20)*.15;
 for(let j=0;j<3;j++){
  const at=i*30+j*10;
  mesh[at]=x+j*.1;mesh[at+1]=1+j*.1;
  mesh[at+2]=4+(i%30)*.1+j*.1;
  mesh[at+3]=0;mesh[at+4]=1;mesh[at+5]=0;
  mesh[at+6]=.4;mesh[at+7]=.4;mesh[at+8]=.4;mesh[at+9]=1;
 }
}
const result=pack.packLinearResidentScenery(mesh,'source-bound-civic');
assert.equal(result.vertices,mesh,'no second sorted 10-float geometry allocation');
assert.ok(result.ranges.length>=2,'spatially separated original buildings stay distinct');
assert.equal(result.ranges.reduce((sum,r)=>sum+r.count,0),7500,'all real source vertices drawn');
let next=0;
for(const r of result.ranges){
 assert.equal(r.first,next,'no gaps, reorder or duplicate draw ranges');next+=r.count;
 assert.equal(r.count%3,0,'only complete triangles');
 for(let v=r.first;v<r.first+r.count;v++){
  const o=v*10;
  assert.ok(mesh[o]>=r.minX&&mesh[o]<=r.maxX);
  assert.ok(mesh[o+1]>=r.minY&&mesh[o+1]<=r.maxY);
  assert.ok(mesh[o+2]>=r.minZ&&mesh[o+2]<=r.maxZ);
 }
}
const audit=pack.getScenicLinearPackAudit();
assert.equal(audit.neverDropsSourceVertices,true);
assert.equal(audit.residentFloatsWithoutScatter,mesh.length);
const cameraSource=between('function foregroundSceneProjection(eye,target,roofs){','// G148:');
const camera=new Function(
 "const WORKDAY_OPAQUE_SCENE_KINDS=new Set(['home','hall','market-cart']);"+
 "const WORKDAY_SOLID_BUILDING_KINDS=new Set(['home','hall']);"+
 "const terrain=()=>0;"+
 "const physicalCameraProjection=()=>({aspect:1.5,tanVertical:.6});"+
 cameraSource+"return foregroundSceneProjection;"
)();
const eye=[0,1.6,-4],face=[0,1.2,0];
const solid=(x,z,rx=.5,rz=.5)=>({kind:'home',x,z,rx,rz,bottom:0,top:3});
const front=camera(eye,face,[solid(0,-2,1,.4)]);
const offAxis=camera(eye,face,[solid(4,-4)]);
const behind=camera(eye,face,[solid(0,5,1,.4)]);
assert.ok(front.cover>.3,'real house in front remains an opaque obstruction');
assert.ok(offAxis.cover<.36,
 'off-axis building crossing camera near plane cannot invent full-screen cover');
assert.equal(behind.cover,0,'house behind genuine worker is not foreground');
assert.equal(behind.behindWorkerRejected,1);
assert.equal(offAxis.buildingCover,0);
console.log('W171 PASS: full game parses; exact original static vertex identity, 2500 complete triangles, strict AABB coverage, 2+ local range groups; real camera near/far clipping, forward building preserved, off-axis false cover removed. Source-only; NOT FPS or playable-video proof.');
