'use strict';
// G154: compare the spatial-packer rewrite with the genuine legacy algorithm.
// Render-only geometry must retain byte-identical order, chunk bounds and LOD.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function packSpatialScenery(mesh){');
const end=html.indexOf('function sceneFrustumPlanes(',begin);
assert(begin>=0&&end>begin,'Locate the real in-game spatial packer');
const edge=18;
const pack=new Function('SCENIC_CHUNK_EDGE',html.slice(begin,end)+';return packSpatialScenery;')(edge);

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
for(const count of [0,1,8,257,2048,10000]){
 const src=sample(count,88311+count);
 const expected=reference(src),actual=pack(src);
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
