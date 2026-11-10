#!/usr/bin/env node
'use strict';
// W192 RED on original head: no joined crowned/granary/household road section.
// GREEN checks original-route presentation contract, without simulating cargo.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=file.indexOf('const GRAINWARD_ROAD_PROFILE=');
const end=file.indexOf('\nfunction marketToRealHomeStreet(){',begin);
assert.ok(begin>0&&end>begin,'W192 RED: no original joined road cross-section');
assert.match(file.slice(end),/renderGradedRoadSection\(a,b,f,g,\.59,key,roadPalette,'household'\)/);
assert.match(file.slice(end),/renderGradedRoadSection\(a,b,t,u,\.70,k,\{/);
const faces=[],slope=(x,z)=>.013*x-.005*z;
const context={
 Math,Number,Error,
 terrain:slope,
 upwardRoadQuad:(a,b,c,d,tone)=>faces.push({vertices:[a,b,c,d],tone})
};
vm.createContext(context);
vm.runInContext(file.slice(begin,end),context,{timeout:2500,filename:'real-graded-road-runtime'});
const {renderGradedRoadSection:draw,getGradedRoadAudit:audit}=context;
const palette={earth:[1,2,3],wheel:[4,5],verge:[6,7]};
const approx=(a,b)=>Math.abs(a-b)<1e-8;
const verify=(a,b,halfWidth,seed,role)=>{
 const before=faces.length;
 const first=draw(a,b,0,.5,halfWidth,seed,palette,role);
 const second=draw(a,b,.5,1,halfWidth,seed+1,palette,role);
 assert.equal(first.bands,6);assert.equal(first.triangles,12);
 assert.equal(second.wheelGrooves,2);assert.equal(faces.length-before,12);
 // Matching physical endpoints make one complete road, not separate decals.
 for(let band=0;band<6;band++){
  const left=faces[before+band].vertices;
  const right=faces[before+6+band].vertices;
  for(let j=0;j<3;j++){
   assert.ok(approx(left[1][j],right[0][j]));
   assert.ok(approx(left[2][j],right[3][j]));
  }
 }
 for(let i=before;i<faces.length;i++)for(const vertex of faces[i].vertices)
  assert.ok(vertex.every(Number.isFinite),'no invalid terrain vertices');
 const cx=a[0],cz=a[1],dx=b[0]-cx,dz=b[1]-cz,
  len=Math.hypot(dx,dz),nz=dx/len,nx=-dz/len;
 const sampled=new Map();
 for(const face of faces.slice(before,before+6))
  for(const v of face.vertices){
   const dist=Math.hypot(v[0]-cx,v[2]-cz);
   if(dist>halfWidth*1.4+1e-6)continue;
   const off=(v[0]-cx)*nx+(v[2]-cz)*nz;
   sampled.set(off.toFixed(5),v[1]-slope(v[0],v[2]));
  }
 assert.ok(approx(sampled.get('0.00000'),.056),'crowned 3D center');
 for(const sign of [-1,1]){
  assert.ok(approx(sampled.get((sign*.58*halfWidth).toFixed(5)),.020),
   'wheel groove must be BELOW crowned center');
 }
};
verify([0,0],[10,0],.70,13,'granary');
verify([-4,3],[8,-7],.59,51,'household');
let rejects=0;
for(const args of [
 [[0,0],[0,0],0,.5,.7,2,palette],
 [[0,0],[10,0],.6,.4,.7,2,palette],
 [[0,0],[10,0],0,.5,-.7,2,palette]]){
 try{draw(...args)}catch(e){rejects++}
}
assert.equal(rejects,3,'bad road geometry must reject');
const state=audit();
assert.equal(state.sections,4);assert.equal(state.triangles,48);
assert.equal(state.sunkenTracks,8);
assert.equal(state.classes.granary,2);assert.equal(state.classes.household,2);
assert.equal(state.changesAuthoritativeState,false);
assert.equal(state.changesNavigation,false);
assert.ok(!/\bMath\.random\b|\bstate\.[a-z]+\s*=|\bpeople\.push\b/.test(file.slice(begin,end)),
 'road must never create authority events or consume simulation RNG');
console.log('W192 source contract GREEN: 4 contiguous original road sections, 48 surface triangles, two physically lower wheel grooves, no missing seams, no authority edit');
