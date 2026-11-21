'use strict';
// W373 integrated genuine worksite witness tests, using the original source.
// A clear row is physically surveyed, never manufactured by hiding crops.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('function reserveActualFarmWristSightlines(');
const b=html.indexOf('function genuineGrainLaborCameraActive(',a);
assert(a>=0&&b>a,'Physical original-camera function missing');
const context={
 realFarmWorkSightline:eye=>({active:true,cropFaceBlockers:0,
  cropWristBlockers:eye[0]===1?0:1,
  cameraInsideField:eye[0]===1,
  physicalInteriorEyeClear:eye[0]===1}),
 farmFenceLandmarkOcclusion:()=>({blockedFace:false,blockedHands:false})
};
vm.runInNewContext(html.slice(a,b),context,{timeout:2000});
const opt=(ordinal,x,inside)=>({ordinal,angleIndex:ordinal,alignment:.55,
 cropEyeInsideField:inside,coarse:ordinal,
 shot:{eye:[x,2.5,0],pitch:.42,eyeCollision:{clear:true},blockers:0,
  projectedWorkerHeightFraction:.26}});
const result=vm.runInNewContext('reserveActualFarmWristSightlines(options,worker,hands)',
 {...context,options:[opt(0,0,false),opt(1,1,true),opt(2,2,true)],
  worker:{name:'Bram'},hands:[[0,.6,0],[0,.6,.1]]},{timeout:2000});
assert.deepEqual(Array.from(result.reserved,p=>p.ordinal),[1]);
assert.equal(result.interiorChecked,2);
assert.equal(result.interiorClear,1);
assert(result.checked<=72&&result.reserved.length<=12);
assert(html.includes('actualGrainInteriorClear:actualGrainWitness.interiorClear||0'));
console.log('W373 authentic planted-row physical camera: blocked exterior rejected, legitimate interior admitted, unsafe interior rejected; bounded and auditable PASS. Exact browser imagery still required.');
