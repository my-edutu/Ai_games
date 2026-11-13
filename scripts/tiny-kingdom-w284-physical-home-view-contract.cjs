'use strict';
// W284: red-before, green-after source-executed regression of the actual
// original recorded household camera, not an invented meal or synthetic town.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
new vm.Script(html.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1]||'');
const a=html.indexOf('function originalRealHomeEye(');
const b=html.indexOf('function toggleRealGrainHomeWitness(){',a);
assert(a>=0&&b>a,'the running game must have original physical household lens logic');
const code=html.slice(a,b);
assert(code.includes('function inspectRealHomeCamera('));
assert(code.includes('function chooseRealHomeManualOrbit('));
let occluded=false,forest=false,eyeBlocked=false;
const original=[[10,3,2]],snapshot=JSON.stringify(original);
const home={homeIndex:0,x:10,z:3,resident:'Selene',mealId:'real-meal'};
const ctx={Math,Number,city:original,canvas:{clientWidth:390,clientHeight:844},
 terrain:()=>0,realGrainHomeFrontage:()=>({x:10,z:3,homeIndex:0,homeKey:'10,3,2',aim:[10,.96,1.0]}),
 followCameraRoofs:()=>[{real:true}],physicalFollowEyeClearance:()=>({clear:!eyeBlocked}),
 followRayBlockers:()=>occluded?1:0,
 foregroundVegetationProjection:()=>({cover:forest?.7:.01,faceBlockers:forest?1:0}),
 foregroundSceneProjection:()=>({cover:.02,cargoCover:0}),
 clampPlayerCamera:(x,a,b)=>Math.max(a,Math.min(b,x))};
vm.runInNewContext(code+';this.originalRealHomeEye=originalRealHomeEye;this.inspectRealHomeCamera=inspectRealHomeCamera;this.chooseRealHomeManualOrbit=chooseRealHomeManualOrbit;',ctx);
const eye=ctx.originalRealHomeEye(home,Math.PI,.2,5.1);
assert.equal(eye.length,3);
assert(eye[2]<1,'the documented cottage is viewed from its actual exterior');
assert.equal(ctx.inspectRealHomeCamera(home,eye).clear,true,'real home doorstep clear');
const lens=ctx.chooseRealHomeManualOrbit(home,Math.PI+.1,.22,5.25);
assert(lens&&lens.homeIndex===0&&lens.homeKey==='10,3,2',
 'manual orbit cannot discard original home provenance');
assert.equal(lens.aim[2],1);
assert.equal(lens.eye.length,3);
assert.equal(JSON.stringify(original),snapshot,'camera must never move a real home');
eyeBlocked=true;assert.equal(ctx.inspectRealHomeCamera(home,eye).clear,false);
assert.equal(ctx.chooseRealHomeManualOrbit(home,Math.PI,.2,5.1),null,
 'all genuinely blocked eyes must be rejected, not faked');
eyeBlocked=false;occluded=true;
assert.equal(ctx.chooseRealHomeManualOrbit(home,Math.PI,.2,5.1),null,
 'never aim the shot through real roof geometry');
occluded=false;forest=true;
assert.equal(ctx.chooseRealHomeManualOrbit(home,Math.PI,.2,5.1),null,
 'vegetation must not obscure the original doorway');
forest=false;
assert(html.includes('grainJourney.homeLens=chooseRealHomeManualOrbit('),
 'real touch/keyboard orbit must use the same safe physical lens');
assert(html.includes('homeWitnessPhysicalRepairs++'),
 'occluded transitions must reframe the actual cottage, not hide buildings');
assert(html.includes('...grainJourney.homeLens')||html.includes('...lens'),
 'manual camera must retain real external cottage information');
console.log('W284 original recorded household camera: physical entrance, roof/foliage/eye rejection, provenance, real manual control, blocked transition repair: SOURCE PASS; browser motion and hardware quality separately gated.');
