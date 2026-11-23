import * as THREE from 'three';
import fs from 'node:fs';
import {createSerpent as createCandidate} from '../public/snake-stream/serpent.mjs';
// For source-exact paired native evidence only, the untouched official source
// is injected via an environment variable; NOT a browser screenshot or FPS test.
const parentPath=process.env.OFFICIAL_SNAKE_SERPENT;
if(!parentPath)throw new Error('Set OFFICIAL_SNAKE_SERPENT to the exact-source original serpent.mjs');
const {createSerpent:createParent}=await import('file://'+parentPath);
const path=n=>Array.from({length:n},(_,i)=>({x:(i%19===0)?0:0,z:-i}));
const scenarios=[
  {label:'48-detail',paths:[path(48)],opts:{detail:'high',reducedMotion:false,time:3.3,eating:.65}},
  {label:'96-overview',paths:[path(96)],opts:{detail:'low',reducedMotion:true,time:4.4,eating:0}},
  {label:'portal-48-detail',paths:[path(43),path(8).map(p=>({x:23,z:p.z+16}))],opts:{detail:'high',reducedMotion:false,time:7.3,eating:0,fragmentDirections:[{x:0,z:1},{x:0,z:1}]}},
  {label:'650-detail-promoted',paths:[path(650)],opts:{detail:'high',reducedMotion:true,time:6.3,eating:0}},
];
const rows=[];
for(const scenario of scenarios){
 const a=createParent(THREE),b=createCandidate(THREE);
 try{
  const opts={...scenario.opts,runToken:'pair',direction:{x:0,z:1},delta:1/60};
  a.update(scenario.paths,opts);b.update(scenario.paths,opts);
  const pa=a.group.getObjectByName('Continuous sculpted serpent body').geometry,
   pb=b.group.getObjectByName('Continuous sculpted serpent body').geometry;
  const sa=a.stats(),sb=b.stats();
  if(sa.bodyTriangles!==sb.bodyTriangles||sa.bodyRings!==sb.bodyRings)throw Error('Changed body geometry count');
  let maxP=0,maxUV=0,maxN=0,maxIndex=0;
  for(const prop of ['position','uv','normal']){
   const x=pa.getAttribute(prop),y=pb.getAttribute(prop),count=sb.bodyVertices;
   for(let i=0;i<count;i++)for(let j=0;j<x.itemSize;j++){
    const error=Math.abs(x.getComponent(i,j)-y.getComponent(i,j));
    if(prop==='position')maxP=Math.max(maxP,error);
    if(prop==='uv')maxUV=Math.max(maxUV,error);
    if(prop==='normal')maxN=Math.max(maxN,error);
   }
  }
  for(let i=0;i<pa.drawRange.count;i++)maxIndex=Math.max(maxIndex,Math.abs(pa.index.getX(i)-pb.index.getX(i)));
  if(maxP!==0||maxUV!==0||maxIndex!==0||maxN>1.55e-5)throw Error('Physical data mismatch: '+JSON.stringify({scenario:scenario.label,maxP,maxUV,maxIndex,maxN}));
  rows.push({scene:scenario.label,bodyVertices:sb.bodyVertices,bodyTriangles:sb.bodyTriangles,beforeBytes:sa.bufferBytes,afterBytes:sb.bufferBytes,byteSavings:sa.bufferBytes-sb.bufferBytes,savingsPct:Math.round(10000*(sa.bufferBytes-sb.bufferBytes)/sa.bufferBytes)/100,normalError:maxN,positionsExact:true,uvExact:true,indicesExact:true,indexType:pb.index.array.constructor.name});
 }finally{a.dispose();b.dispose()}
}
fs.writeFileSync(process.env.PAIR_OUTPUT||'/mnt/data/snake_run9/live-packed-native.json',JSON.stringify({source:'identical official bbce17 + previous unpromoted cumulative staging vs new candidate',fpsClaim:false,browserEvidence:false,rows},null,2));
console.log(JSON.stringify(rows,null,2));
