'use strict';
// W414: a documentary camera must not sit INSIDE the real terrain.
// This is a direct contract against original game code, not a fake shot.
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('physical workday camera rejects ground-intersecting eyes, preserves real roof and open-sky admission',()=>{
 const start=html.indexOf('function physicalFollowEyeClearance(');
 const end=html.indexOf('// W280:',start);
 assert.ok(start>=0&&end>start,'actual physical camera source available');
 const body=html.slice(start,end);
 assert.match(body,/terrain\(eye\[0\],eye\[2\]\)/,
  'camera witness must check REAL elevation at observer eye, not actor feet');
 const audit={queries:0,potentialTests:0,exactTests:0,indexed:0,fallback:0};
 const context={terrain:(x,z)=>3+x*.1,
  cameraEyeCounters:audit,cameraEyeCollisionCandidates:()=>null,
  PHYSICAL_FOLLOW_EYE_KINDS:new Set(['home'])};
 vm.createContext(context);vm.runInContext(body,context,{timeout:1000});
 const see=(eye,roofs=[])=>context.physicalFollowEyeClearance(eye,roofs);
 const low=see([2,3.45,0]); // actual ground 3.2m: only 25cm headroom
 assert.equal(low.clear,false,'below 0.5m terrain clearance must be rejected');
 assert.equal(low.kind,'terrain');
 const open=see([2,4.4,0]);
 assert.equal(open.clear,true,'legitimate above-ground camera remains valid');
 const roof=see([2,4.4,0],[{kind:'home',x:2,z:0,rx:1,rz:1,bottom:3.2,top:4.8}]);
 assert.equal(roof.clear,false,'existing building remains a real blocker');
 assert.equal(roof.kind,'home');
 assert.equal(see([NaN,0,0]).clear,false,'invalid camera never admitted');
 assert.equal(audit.queries,2,'underground eye must skip expensive roof iteration');
});
