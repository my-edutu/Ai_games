'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin='// W187 CAMERA_OCCLUSION_BROADPHASE_BEGIN';
const end='// W187 CAMERA_OCCLUSION_BROADPHASE_END';
const a=html.indexOf(begin),b=html.indexOf(end);
assert(a>=0&&b>a,'RED: production camera-ray broadphase is missing');
const terrain=(x,z)=>Math.sin(x*.16)*.27+Math.cos(z*.23)*.18;
// The original production broadphase now reads the read-only per-shot
// stationary-roof association, declared immediately before the extracted
// contract. Its test world has no moving freight and uses a fresh WeakMap.
const context=vm.createContext({terrain,Map,WeakMap,Set,Math,Number,Array,
 cameraOcclusionStaticRows:new WeakMap()});
vm.runInContext(html.slice(a,b+end.length),context,{timeout:5000});
const ray=vm.runInContext('followRayBlockers',context);
const audit=vm.runInContext('getCameraRayBroadphaseAudit',context);
function reference(eye,target,roofs){
 let hits=0;
 for(const roof of roofs){
  let near=.015,far=.985,miss=false;
  const base=roof.bottom??(terrain(roof.x,roof.z)-.22);
  for(const [axis,low,high] of [[0,roof.x-roof.rx,roof.x+roof.rx],
   [1,base,roof.top+.16],[2,roof.z-roof.rz,roof.z+roof.rz]]){
   const d=target[axis]-eye[axis];
   if(Math.abs(d)<1e-6){
    if(eye[axis]<low||eye[axis]>high){miss=true;break;}
   }else{
    const u=(low-eye[axis])/d,v=(high-eye[axis])/d;
    near=Math.max(near,Math.min(u,v));
    far=Math.min(far,Math.max(u,v));
    if(near>far){miss=true;break;}
   }
  }
  if(!miss&&near<=far)hits++;
 }
 return hits;
}
let rng=0x7492513;
function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
let checks=0;
for(const population of [12,35,70]){
 for(const mobile of [false,true]){
  const roofs=Array.from({length:population},(_,i)=>{
   const x=(random()-.5)*96,z=(random()-.5)*96;
   const bottom=i%3===0?terrain(x,z)+1.6:undefined;
   return {x,z,rx:.2+random()*2.7,rz:.2+random()*2.4,
    bottom,top:terrain(x,z)+2+random()*6,kind:i%5?'home':'market-stall'};
  });
  // Exact same original roof/cargo array during an uninterrupted shot.
  for(let j=0;j<240;j++){
   const w=mobile?390:1024;
   const eye=[(random()-.5)*100,random()*9,(random()-.5)*100];
   const target=[eye[0]+(random()-.5)*w/20,
    random()*5,eye[2]+(random()-.5)*30];
   assert.equal(ray(eye,target,roofs),reference(eye,target,roofs),
    'camera must preserve all original real-world hit counts');
   checks++;
  }
  // A newly built cottage changes the genuine input volume list: no stale plan.
  const updated=roofs.concat([{x:0,z:0,rx:3,rz:3,top:6,kind:'home'}]);
  for(const pair of [[[-12,2,0],[12,2,0]],[[0,7,-12],[0,1,12]],
   [[1000,2,1000],[-1000,2,-1000]],[[0,2,0],[0,2,0]]]){
   const [eye,target]=pair;
   assert.equal(ray(eye,target,updated),reference(eye,target,updated));
   checks++;
  }
 }
}
// A physically huge travel ray must fall back to all original volumes.
const huge=[{x:0,z:0,rx:2,rz:2,top:5}];
assert.equal(ray([-200,2,-200],[200,2,200],huge),
 reference([-200,2,-200],[200,2,200],huge));
const result=audit();
assert.equal(result.source,'exact-physical-camera-ray-cell-broadphase');
assert.equal(result.authorityChanged,false);
assert.equal(result.droppedVolumes,0);
assert(result.queries>=checks);
assert(result.exactSlabTests<result.possibleSlabTests,
 'spatial broadphase should reject physically distant volumes');
assert(result.fallbackQueries>=1,'long camera rays must use safe full scan');
assert(result.maxCellReferences<=4096,'one-shot index must have a finite capacity');
console.log('W187 original real-roof ray broadphase parity PASS',JSON.stringify({
 checks,queries:result.queries,possible:result.possibleSlabTests,
 exactTests:result.exactSlabTests,reductions:result.possibleSlabTests-result.exactSlabTests,
 fallbacks:result.fallbackQueries,noDroppedVolumes:true,
 hardwareFPS:'NOT MEASURED',visualMilestone:'NOT PROVEN'}));
