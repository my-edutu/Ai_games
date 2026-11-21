'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const stagePromise=import(pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const originals=[
 {aspect:320/740,bodies:[
 {left:-.2823927024858231,right:.3786725517993966,bottom:-.28426341305048874,top:.0839822226068157},
 {left:-.7644578814297637,right:.2540844805853838,bottom:.11591746164768216,top:.6211985999987379}]},
 {aspect:390/844,bodies:[
 {left:-.25745936965339417,right:.41016716524698776,bottom:-.3142624852070516,top:.08276099920161403},
 {left:-.67337143501245,right:.2925887297007882,bottom:.09274366361620447,top:.6229755298346428}]}];
// These inputs are ACTUAL unaltered native WebGL 2026-11-16 seed13/tick8
// connected body envelopes, not synthetic game playthroughs (artifact 14261040975).
test('Pass431 full actor optical stage gives a 25%+ meaningful larger two-character image without HUD crops',async()=>{
 const {publicGuardianEarnedRecoilPhysicalStage:stage}=await stagePromise;
 for(const {aspect,bodies} of originals){
  const h=12,s=stage(aspect,h,bodies,true,false,0);
  assert.ok(s.scale>=1.25 && s.scale<=1.34);
  assert.ok(s.verticalShift>0);
  for(const b of bodies){
   const x0=(b.left-s.shift/(h*aspect))*s.scale;
   const x1=(b.right-s.shift/(h*aspect))*s.scale;
   const y0=(b.bottom-s.verticalShift/h)*s.scale;
   const y1=(b.top-s.verticalShift/h)*s.scale;
   assert.ok(x0>=-.80-1e-8 && x1<=.80+1e-8,'whole actor within strengthened portrait x margin');
   assert.ok(y0>=-.75-1e-8 && y1<=.68+1e-8,'whole actor clears controls and mission HUD');
   assert.ok(Math.min(x0,y0)>-.95 && Math.max(x1,y1)<.95,'original strict +/- .95 still stronger');
  }
 }
});
test('Pass431 no invented close-up on missing witness, reduced motion, invalid body, landscape, unsafe clip',async()=>{
 const {publicGuardianEarnedRecoilPhysicalStage:stage}=await stagePromise;
 const b=originals[0].bodies,a=originals[0].aspect;
 const none={height:12,shift:0,scale:1};
 assert.deepEqual(stage(a,12,b,false,false),none);
 assert.deepEqual(stage(a,12,b,true,true),none);
 assert.deepEqual(stage(844/390,12,b,true,false),none);
 assert.deepEqual(stage(a,12,[b[0]],true,false),none);
 assert.deepEqual(stage(a,12,[b[0],{...b[1],left:-.97}],true,false),none);
 assert.deepEqual(stage(a,12,[b[0],{...b[1],top:Infinity}],true,false),none);
});
