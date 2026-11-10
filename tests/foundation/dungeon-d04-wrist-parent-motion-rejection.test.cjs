'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/measured-weapon-trail.js')).href);

const matrix=(xx=1,yy=1,zz=1)=>[
 xx,0,0,0,0,yy,0,0,0,0,zz,0,0,0,0,1
];
function witness({x=0,y=1,z=0,localX=0,localY=1,localZ=0,
 bone,body,frame=matrix()}={}){
 return {x,y,z,rootX:0,rootY:0,rootZ:0,yaw:0,
  sourceBone:bone,sourceBodyRoot:body,localX,localY,localZ,
  poseFrameMatrix:frame};
}
test('D04 body lean must not fabricate a sword passage from a motionless local wrist',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={},body={};
 const previous=witness({bone,body});
 const turnedBody=witness({bone,body,x:.16});
 assert.equal(planMeasuredHandTrail(previous,turnedBody,.016),null,
  'world wrist motion from an ancestor transform is not limb articulation');
});
test('D04 actual local wrist movement is measured after body drift is removed',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={},body={};
 const before=witness({bone,body});
 const after=witness({bone,body,x:.26,localX:.10});
 const segment=planMeasuredHandTrail(before,after,.016);
 assert.ok(segment,'the true skinned wrist movement should still be visible');
 assert.ok(Math.abs(segment.length-.10)<1e-9,'only 10cm is articulated, not 26cm');
 assert.ok(Math.abs(segment.center.x-.21)<1e-9,
  'streak follows the latest hand pose without reconstructing an invented arc');
});
test('D04 projection respects actual authored mesh-scale and limb axis',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={},body={};
 const before=witness({bone,body});
 const after=witness({bone,body,x:.30,y:1.12,
  localX:.05,localY:1.04,frame:matrix(2,1.5,.5)});
 const segment=planMeasuredHandTrail(before,after,.016);
 assert.ok(segment);
 assert.ok(Math.abs(segment.length-Math.hypot(.10,.06))<1e-9);
 assert.ok(Math.abs(segment.direction.x-.10/segment.length)<1e-9);
 assert.ok(Math.abs(segment.direction.y-.06/segment.length)<1e-9);
});
test('D04 changing authored asset root suppresses a false cross-model stroke',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={};
 const before=witness({bone,body:{},localX:0});
 const after=witness({bone,body:{},x:.15,localX:.15});
 assert.equal(planMeasuredHandTrail(before,after,.016),null);
});
test('D04 malformed or vanished local-bone matrices fail closed',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={},body={};
 const before=witness({bone,body});
 for(const after of [
  witness({bone,body,x:.15,localX:.15,frame:[1,2]}),
  witness({bone,body,x:.15,localX:.15,frame:matrix(NaN,1,1)}),
  {...witness({bone,body,x:.15}),localX:NaN},
  {...witness({bone,body,x:.15}),localX:undefined},
  {...witness({bone,body,x:.15}),sourceBodyRoot:null}
 ])assert.equal(planMeasuredHandTrail(before,after,.016),null);
});
test('D04 invalid projective matrix coefficients never authorize a false sword stroke',async()=>{
 const {planMeasuredHandTrail}=await load(),bone={},body={};
 const before=witness({bone,body});
 for(const index of [3,7,11]){
  const corrupt=matrix();corrupt[index]=NaN;
  assert.equal(planMeasuredHandTrail(before,
   witness({bone,body,x:.14,localX:.14,frame:corrupt}),.016),null,
   'nonfinite homogeneous coefficients do not describe genuine authored pose');
 }
 const distorted=matrix();distorted[3]=.02;
 assert.equal(planMeasuredHandTrail(before,
  witness({bone,body,x:.14,localX:.14,frame:distorted}),.016),null,
  'an unexpected projective matrix cannot be treated as bone world geometry');
});
test('D04 older numeric adapters retain the proven yaw/root compensation path',async()=>{
 const {planMeasuredHandTrail}=await load();
 const p={x:0,y:1,z:0,rootX:0,rootY:0,rootZ:0};
 const noArticulation={...p,x:.17,rootX:.17};
 assert.equal(planMeasuredHandTrail(p,noArticulation,.016),null);
 assert.ok(planMeasuredHandTrail(p,{...p,x:.12},.016));
});
