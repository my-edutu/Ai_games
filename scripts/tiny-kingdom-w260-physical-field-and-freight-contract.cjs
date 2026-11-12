#!/usr/bin/env node
'use strict';
// W260 Phase 1: actual growing fields remain fully drawn and two-sided at
// close/far range, while original escorted freight is filmed with true rays.
// Presentation-only. Nothing here grants food, routes, workers or a fake crop.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=src.indexOf('function authenticGrainHeadProfile(');
const b=src.indexOf('// W64 read-only CPU witness',a);
assert(a>0&&b>a,'real field source missing');
const marks=[],flats=[],v={
 Math,Number,Error,Array,data:[],farmScene:{stalks:0,seedHeads:0,stalkTriangles:0},
 terrain:(x,z)=>.11*Math.sin(x*.1+z*.4),
 biomeHash:n=>{const t=Math.sin(n*12.9898+78.233)*43758.5453;return t-Math.floor(t)},
 rgb:n=>n,materialScope:(_m,fn)=>fn(),MATERIAL:{FOLIAGE:4},
 farmSoil(){},FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]]}
};
v.tri=(a,b,c)=>{for(const p of [a,b,c])assert(p.every(Number.isFinite));
 marks.push([a,b,c]);v.data.length+=30;};
v.quad=(a,b,c,d)=>{v.tri(a,b,c);v.tri(a,c,d);};
vm.createContext(v);vm.runInContext(src.slice(a,b)+'\nthis.crop=farmStalk;this.plant=ripeningField;',v);
for(const season of [0,1,2,3])for(const compact of [false,true]){
 const old=v.data.length;v.farmScene={stalks:0,seedHeads:0,stalkTriangles:0};
 v.crop(19.1,.2,101,season,compact);
 const triangles=(v.data.length-old)/30;
 const expected=season===3?4:(compact?16:26);
 assert.equal(triangles,expected,'actual grain retains both-sided sunlit leaves and its entire head');
 assert.equal(v.farmScene.stalks,1);
 assert.equal(v.farmScene.seedHeads,season===3?0:1);
}
let roots=[];v.capturedRoots=roots;
vm.runInContext('farmStalk=function(x,z,id){capturedRoots.push({x,z,id});farmScene.stalks++};',v);
v.data=[];v.farmScene={stalks:0,seedHeads:0,stalkTriangles:0};
for(let i=0;i<2;i++)v.plant(v.FARMSTEAD.fields[i],i,1,true);
assert.equal(roots.length,668,'preserve all original planted crowns');
const copy=JSON.stringify(roots);roots=[];v.capturedRoots=roots;
for(let i=0;i<2;i++)v.plant(v.FARMSTEAD.fields[i],i,1,true);
assert.equal(JSON.stringify(roots),copy,'seed-stable planted geometry');
for(const {x,z,id} of roots){
 const field=id>=10000?v.FARMSTEAD.fields[1]:v.FARMSTEAD.fields[0];
 assert(x>=field[0]&&x<=field[1]&&z>=field[2]&&z<=field[3],
  'real rooted crop stays in its original production parcel');
}
const cameraStart=src.indexOf('function planCitizenCamera(');
const cameraEnd=src.indexOf('\nfunction ',cameraStart+10);
const camera=src.slice(cameraStart,cameraEnd);
assert.match(camera,/routeSizePenalty/);
assert.match(camera,/physicallyReadableCourierRouteShot/);
assert.match(camera,/\.21\s*:\s*\.24/,'loaded courier has a large real documented screen-space target');
assert.match(camera,/physicalFollowEyeClearance/);
assert.match(camera,/foregroundVegetationProjection/);
assert.doesNotMatch(src.slice(a,b)+camera,/Math\.random\(|state\.food\s*[+\-=]|people\.push\(|city\.push\(/);
console.log('W260 source PASS: same real 668 grain crowns, near 26/far 16 two-sided triangles, noninvented cargo-camera physical review. Genuine A/B and hardware FPS still NOT PROVEN.');
