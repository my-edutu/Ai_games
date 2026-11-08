'use strict';
// W139: original exact AABB check before architecture perf claims.
// RED on W138 (the original source lacks SCENIC_BVH_LEAF_SIZE).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
new vm.Script(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')));
assert(html.includes('const bvhMask=scenicBvhVisibilityMask(ranges,planes)'));
assert(html.includes('const originalBvhMask=scenicBvhVisibilityMask(ranges,planes)'));
const legacy=html.slice(html.indexOf('function sceneChunkInFrustum('),html.indexOf('// W73:'));
const start=html.indexOf('const SCENIC_BVH_LEAF_SIZE=');
const end=html.indexOf('function getScenicCullHierarchyAudit()',start);
assert(start>0&&end>start);
const bvh=new Function(legacy+html.slice(start,end)+
 'return {scenicBvhVisibilityMask,getScenicBvhAudit};')();
let cases=0,compared=0;
for(let seed=0;seed<16;seed++){
 const ranges=Array.from({length:256},(_,i)=>{
  const x=i%16*3-22+Math.sin(seed*i)*.13,z=Math.floor(i/16)*3-22;
  return {first:i*30,count:30,minX:x,minY:0,minZ:z,
   maxX:x+2,maxY:5,maxZ:z+2};
 });
 for(const radius of [8,12,19,35]){
  const planes=[[1,0,0,radius],[-1,0,0,radius],
   [0,0,1,radius],[0,0,-1,radius],[0,1,0,1],[0,-1,0,10]];
  const mask=bvh.scenicBvhVisibilityMask(ranges,planes);
  assert.equal(mask.length,ranges.length);
  for(let i=0;i<ranges.length;i++){
   const b=ranges[i];
   const actual=planes.every(([nx,ny,nz,d])=>
    nx*(nx>=0?b.maxX:b.minX)+ny*(ny>=0?b.maxY:b.minY)+
    nz*(nz>=0?b.maxZ:b.minZ)+d>=-.45);
   assert.equal(Boolean(mask[i]),actual,
    'original real chunk must never be hidden or drawn falsely '+i);
   compared++;
  }
  cases++;
 }
}
const invalid=Array.from({length:70},(_,i)=>({
 first:i*30,count:30,minX:0,minY:0,minZ:0,maxX:1,maxY:1,maxZ:1}));
invalid[4].maxZ=Infinity;
assert.equal(bvh.scenicBvhVisibilityMask(invalid,[[1,0,0,10],[-1,0,0,10],
 [0,1,0,10],[0,-1,0,10],[0,0,1,10],[0,0,-1,10]]),null);
assert.equal(bvh.scenicBvhVisibilityMask(invalid.slice(0,40),[]),null);
assert.equal(bvh.getScenicBvhAudit().originalMeshesAndVertexOrderUnchanged,true);
console.log('W139 original-source V8 syntax plus '+cases+' real-AABB-shaped viewpoints / '+
 compared+' exact leaf comparisons PASS. Playable WebGL/Day120/hardware FPS NOT PROVEN.');
