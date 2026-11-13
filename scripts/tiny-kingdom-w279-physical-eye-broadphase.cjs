'use strict';
// W279: source-bound regression against every original eye-volume rule.
// This executes the production point broadphase, then blind-compares it to
// the exhaustive, original Day-1/Day-120-style collision on moving camera eyes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const original=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(m=>m[1].includes('function physicalFollowEyeClearance('));
assert(original,'live playable village source exists');
new vm.Script(original[1],{filename:'live-tiny-kingdom.js'});
function extract(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>0&&b>a,'original camera function missing: '+start);
 return html.slice(a,b);
}
const source=extract('const CAMERA_RAY_CELL_METERS=8,','function followRayBlockers(')+
 extract('const cameraEyeCounters=', '// A clear centre ray');
const kinds=new Set(['home','hall','granary','courier-cart','arcade','belfry','receiving-hall-post']);
const ctx=vm.createContext({WeakMap,Map,Set,Array,Number,Math,
 PHYSICAL_FOLLOW_EYE_KINDS:kinds,terrain:()=>0,
 cameraOcclusionStaticRows:new WeakMap()});
vm.runInContext(source,ctx,{timeout:3000});
const examine=vm.runInContext('physicalFollowEyeClearance',ctx);
const proximity=vm.runInContext('cameraShotProximityWarnings',ctx);
const exhaustive=(eye,rows)=>{
 if(!Array.isArray(eye)||eye.length!==3||eye.some(v=>!Number.isFinite(v)))
  return {clear:false,kind:'invalid-eye'};
 for(const r of rows){
  if(!kinds.has(r.kind))continue;
  const bottom=r.bottom??(-.22);
  if(eye[0]>r.x-r.rx-.06&&eye[0]<r.x+r.rx+.06&&
     eye[2]>r.z-r.rz-.06&&eye[2]<r.z+r.rz+.06&&
     eye[1]>bottom-.06&&eye[1]<r.top+.10)return {clear:false,kind:r.kind};
 }
 return {clear:true,kind:null};
};
const referenceProximity=(eye,rows)=>{
 let count=0;
 for(const roof of rows){
  const bottom=roof.bottom??(-.22);
  if(eye[1]>roof.top+.48||eye[1]<bottom-.35)continue;
  const dx=Math.max(0,Math.abs(eye[0]-roof.x)-roof.rx),
   dz=Math.max(0,Math.abs(eye[2]-roof.z)-roof.rz);
  if(Math.hypot(dx,dz)<.95)count++;
 }
 return count;
};
let checked=0,proximityChecks=0;
const sample=roofs=>{
 for(let x=-48;x<=48;x+=1.47)for(let z=-29;z<=33;z+=1.19){
  const y=(((Math.round(x*37+z*21)%11)+11)%11)*.51;
  const eye=[x,y,z],a=exhaustive(eye,roofs),b=examine(eye,roofs);
  assert.deepEqual([b.clear,b.kind],[a.clear,a.kind],
   'original camera kind changed on physical eye '+eye);
  assert.equal(proximity(eye,roofs),referenceProximity(eye,roofs),
   'Day-120 and live courier physical proximity warning parity '+eye);
  checked++;proximityChecks++;
 }
};
const fixed=Array.from({length:28},(_,i)=>({
 x:(i%7)*7-23,z:Math.floor(i/7)*8-12,rx:1.2+(i%3)*.2,
 rz:1.15,top:3.6+(i%4)*.5,kind:'home'}));
for(let i=0;i<12;i++)fixed.push({x:i*3-17,z:10,
 rx:.6,rz:.5,bottom:1.2,top:3.4,
 kind:i%2?'arcade':'receiving-hall-post'});
const cart={x:12,z:2,rx:1.25,rz:.8,bottom:0,top:1.4,kind:'courier-cart'};
const combined=fixed.concat(cart);
ctx.cameraOcclusionStaticRows.set(combined,fixed);
sample(combined);
cart.x=-6.5;cart.z=.1;sample(combined);
sample(fixed);
const beyond=Array.from({length:145},(_,i)=>({
 x:(i%16)*4-33,z:Math.floor(i/16)*4-20,rx:1.2,
 rz:1.2,top:3,kind:'home'}));
sample(beyond);
assert.equal(examine([NaN,0,0],combined).kind,'invalid-eye');
const audit=vm.runInContext('getCameraEyeClearanceAudit',ctx)();
assert(audit.indexed>0&&audit.fallback>0);
assert(audit.exactTests<audit.potentialTests);
assert(audit.liveFreightChecks>0);
const nearAudit=vm.runInContext('getCameraShotProximityAudit',ctx)();
assert.equal(nearAudit.queries,proximityChecks);
assert(nearAudit.exact<nearAudit.possible,
 'genuine camera survey must reduce original roof distance checks');
assert.equal(nearAudit.authorityChanged,false);
assert.equal(audit.authoritativeStateChanged,false);
console.log('W280 source PASS: '+checked+' real camera samples parity including grown-town homes, live moved escrowed courier, 8m boundaries and invalid-index full fallback. CPU slab reduction is structural; actual frame timing, live gameplay, physical hardware 30fps and blinded experience judgement remain UNPROVEN.');
