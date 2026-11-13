'use strict';
// Test-first contract for a 3D camera living in the actual physical town.
// This does not create actors, invent outcomes, change jobs, or film a fake scene.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const at=h.indexOf('<script>'),end=h.indexOf('</script>',at);
assert(at>0&&end>at,'actual inline playable world exists');
new vm.Script(h.slice(at+8,end));
const a=h.indexOf('// W169: real worker cameras cannot occupy');
const b=h.indexOf('// A clear centre ray is not enough:',a);
assert(a>0&&b>a,'real eye collision evaluator exists');
// The real eye test depends on the actual W187 indexed camera candidates.
// Execute that same production broadphase, not a permissive mock or full-scan
// replacement that would mask a lost roof/courier sightline.
const broadA=h.indexOf('// W187 CAMERA_OCCLUSION_BROADPHASE_BEGIN');
const broadB=h.indexOf('// W187 CAMERA_OCCLUSION_BROADPHASE_END',broadA);
assert(broadA>0&&broadB>broadA,'original camera ray cell index exists');
const sandbox={terrain:()=>0};vm.createContext(sandbox);
vm.runInContext('const cameraOcclusionStaticRows=new WeakMap();\n'+
 h.slice(broadA,broadB)+'\n'+h.slice(a,b)+
 '\nthis.check=physicalFollowEyeClearance;'+
 'this.linkStatic=(view,rows)=>cameraOcclusionStaticRows.set(view,rows);',sandbox);
const check=sandbox.check;
const roofs=[
 {x:0,z:0,rx:2,rz:2,bottom:0,top:5,kind:'home'},
 {x:7,z:0,rx:2,rz:2,bottom:2,top:3,kind:'market-stall'},
 {x:12,z:0,rx:1,rz:1,bottom:0,top:2,kind:'courier-cart'},
 {x:17,z:0,rx:1,rz:1,bottom:2.4,top:3,kind:'receiving-hall-roof'}
];
assert.equal(check([0,2,0],roofs).kind,'home','occupied house interior is forbidden camera eye');
assert.equal(check([0,7,0],roofs).clear,true,'air above home remains clear');
assert.equal(check([7,1,0],roofs).clear,true,'open shelter beneath stall remains clear');
assert.equal(check([7,2.5,0],roofs).kind,'market-stall','actual awning solid blocks eye');
assert.equal(check([12,.5,0],roofs).clear,true,'working loaded cart is not hidden or treated as opaque house');
assert.equal(check([17,2.6,0],roofs).kind,'receiving-hall-roof','real receiving hall roof blocks eye');
assert.equal(check([20,1,0],roofs).clear,true);
assert.equal(check([Infinity,1,0],roofs).clear,false,'NaN or infinite camera is never considered safe');
// Original immutable village volumes are indexed, while a physically live
// appended freight volume cannot invalidate/erase the stationary roof tests.
const liveView=roofs.concat({x:21,z:1,rx:1,rz:1,
 bottom:0,top:2,kind:'courier-cart'});
sandbox.linkStatic(liveView,roofs);
assert.equal(check([0,2,0],liveView).kind,'home',
 'real stationary house survives appended physical courier in the index');
assert.equal(check([21,.5,1],liveView).clear,true,
 'genuine loaded cart remains an open non-opaque moving subject');
// More than 128 source volumes forces the original exhaustive fallback.
const overloaded=roofs.concat(Array.from({length:129},(_,i)=>({
 x:120+i*3,z:10,rx:.3,rz:.3,bottom:0,top:1,kind:'courier-cart'})));
assert.equal(check([0,2,0],overloaded).kind,'home',
 'invalid huge index restores strict original camera collision scan');
assert(h.includes('eyeCollision:physicalFollowEyeClearance(eye,roofs)'),'real-shot planner checks eye');
assert(h.includes('(shot.eyeCollision.clear?0:9000)'),'real candidate scoring rejects interior eyes');
assert(h.includes('const repairEye=plannedEyeClear&&'),'real interpolation checks eye');
assert(h.includes('(repairEye||mustRepairPost||repairGeneral)'),'real camera relocates only for valid original shot');
assert(h.includes('plannedEyeClear){'),'real camera does not snap into physical obstacle');
console.log('W169 source-contract PASS: actual physical camera eye model and bounded real delivery repair. Browser motion/hardware FPS NOT PROVEN.');
