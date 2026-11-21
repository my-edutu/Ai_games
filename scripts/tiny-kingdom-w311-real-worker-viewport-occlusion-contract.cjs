'use strict';
// A physical head ray cannot certify a readable real workday frame.
// This test deliberately uses genuine model bounds, never fake worker actors.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=source.indexOf('function foregroundSceneProjection(');
const end=source.indexOf('// G148:',start);
assert(start>=0&&end>start,'original physical foreground projection missing');
const context={
 physicalCameraProjection:()=>({aspect:1.6,tanVertical:.46}),
 terrain:()=>0,
 WORKDAY_OPAQUE_SCENE_KINDS:new Set(['market-stall-screen','market-stall-counter','home']),
 WORKDAY_SOLID_BUILDING_KINDS:new Set(['home'])
};
vm.runInNewContext(source.slice(start,end),context,{timeout:1500});
const project=context.foregroundSceneProjection;
const eye=[0,1.6,0],aim=[0,1,5];
const barrier={kind:'market-stall-screen',x:0,z:2,rx:.75,rz:.12,bottom:.1,visualBottom:.1,top:2.6};
const edge={...barrier,x:8};
const behind={...barrier,z:7};
const blocked=project(eye,aim,[barrier]);
const clear=project(eye,aim,[edge]);
const depthReject=project(eye,aim,[behind]);
assert(Number.isFinite(blocked.cover)&&blocked.cover>=0,'preserve normal frame cover');
assert(Number.isFinite(blocked.actorCoreCover),
 'RED W311: report how much REAL foreground mass covers the worker-centred viewport, not only total frame');
assert(blocked.actorCoreCover>.25,'true wooden screen covers the real worker portrait');
assert.equal(clear.actorCoreCover,0,'off-camera trading screen cannot count as worker obstruction');
assert.equal(depthReject.actorCoreCover,0,'a market stall behind the worker does not obscure them');
assert(source.includes('shot.foregroundActorCoreCover='),
 'rank genuine camera alternatives by original geometry overlapping the actor');
assert(source.includes('actorCoreCover:sceneCover.actorCoreCover'),
 'the post-render live-camera audit must expose the real actor-area risk');
assert(source.includes('shot.foregroundActorCoreCover<'),
 'never label an actor obscured by a stall as a clear, expressive workday portrait');
console.log('W311 physically projected original foreground worker-portrait obstruction PASS; moving WebGL/390px source-specific verification separate');
