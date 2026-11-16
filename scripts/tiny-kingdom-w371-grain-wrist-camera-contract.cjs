'use strict';
// W371: RED-first contract for the original farmer-camera physically checked
// wheat hand-and-face sightline reservation. No staged workers or trades.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start='function reserveActualFarmWristSightlines(options,citizen,hands){';
const end='function genuineGrainLaborCameraActive(citizen){';
const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
assert(a>=0&&b>a,'W371 missing original physical crop witness planner');
const segment=source.slice(a,b);
const crop=(eye)=>({active:true,cropFaceBlockers:0,
 cropWristBlockers:eye[0]<0?2:0,cameraInsideField:false});
const vmContext={
 realFarmWorkSightline:(eye)=>crop(eye),
 farmFenceLandmarkOcclusion:(eye)=>({blockedFace:0,blockedHands:eye[0]>10?1:0})
};
vm.runInNewContext(segment,vmContext,{timeout:2000});
const option=(ordinal,x,pitch=.56,inside=false)=>({
 ordinal,angleIndex:ordinal,alignment:.6,coarse:ordinal,
 cropEyeInsideField:inside,
 shot:{eye:[x,3,1],pitch,eyeCollision:{clear:true},blockers:0,
 projectedWorkerHeightFraction:.28}
});
const sample=[
 option(0,-1), // real standing grain physically blocks both wrists
 option(1,1),  // clear exterior, higher downward eye
 option(2,11), // a real farm fence blocks the hand despite crop clearance
 option(3,2,.49,true), // still inside standing field, not an exterior witness
 option(4,3)
];
const found=vm.runInNewContext(
 'reserveActualFarmWristSightlines(options,citizen,hands)',
 {...vmContext,options:sample,citizen:{name:'Bram'},hands:[[1,1,1],[1,1,2]]},
 {timeout:2000});
assert.deepEqual(Array.from(found.reserved,x=>x.ordinal),[1,4],
 'Only genuinely crop-and-fence-clear exterior eyes are reserved');
assert.equal(found.cropClear,3);
assert.equal(found.fenceRejected,1);
assert.equal(found.checked,4);
assert(found.maximumChecks<=72&&found.maximumReservations<=12);
const many=Array.from({length:300},(_,i)=>option(i,i+20));
const bounded=vm.runInNewContext(
 'reserveActualFarmWristSightlines(options,citizen,hands)',
 {...vmContext,options:many,citizen:{name:'Bram'},hands:[]},
 {timeout:2000});
assert(bounded.checked<=72&&bounded.reserved.length<=12,
 'Farm eye inspection and camera emissions must be strictly bounded');
assert.match(source,/const actualGrainWitness=realFarmWork&&portraitLens\?/,
 'Real portrait farmer must reserve exterior wrist eyes BEFORE scenic pruning');
assert.match(source,/physicalGrainHandsBest\|\|usableFrontBest\|\|best/,
 'Only physically verified hand-clear views can replace obstructed generic lens');
assert.match(source,/contact\.stage==='cutting'&&contact\.contact\[2\]>0/,
 'Standing wheat must never be called parted during preparing or gathering');
assert.match(source,/actualGrainEyesInspected:/);
console.log('W371 real wheat physical outside-eye reservation / clearing / fence / budget / stage / fallback source contract PASS. Live visual optics still require honest browser capture.');
