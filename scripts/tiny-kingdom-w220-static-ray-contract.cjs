'use strict';
// W220 RED-first: static 3D village broadphase must survive authentic moving
// parcels and unloading. Every real cart is STILL ray-tested conservatively.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=src.indexOf('let cameraOcclusionViewKey=');
const b=src.indexOf('function getCameraArchitectureResidencyAudit()',a);
const c=src.indexOf('const CAMERA_RAY_CELL_METERS=');
const d=src.indexOf('function getCameraRayBroadphaseAudit()',c);
assert.ok(a>=0&&b>a&&c>0&&d>c,'Actual production camera and ray code unavailable');
const cameraSource=src.slice(a,b);
const raySource=src.slice(c,d);
assert.match(cameraSource,/const cameraOcclusionStaticRows=new WeakMap\(\)/,
 'RED: physical camera must map combined views to retained immutable static volumes');
assert.match(raySource,/cameraOcclusionStaticRows\.get\(roofs\)/,
 'RED: ray broadphase must index reusable town volumes, not moving freight arrays');
assert.match(raySource,/for\(let i=staticRows\.length;i<roofs\.length;i\+\+\)/,
 'RED: dynamic authentic freight must ALWAYS be included in exact ray checks');
let liveCarts=[];
const factory=new Function('realCourierCartCameraVolumes','terrain',
 cameraSource+'\n'+raySource+'\nreturn {view:cameraOcclusionView,ray:followRayBlockers,metrics:()=>({...cameraRayCounters})};');
const camera=factory(()=>liveCarts.map(c=>({...c})),()=>0);
const homes=[{x:7,z:0,rx:1,rz:1,bottom:0,top:4,kind:'home'},
 {x:-7,z:-1,rx:1,rz:1,bottom:0,top:4,kind:'home'}];
const eye=[0,1,-3],target=[0,1,3];
let roofs=camera.view('tA',homes);
assert.equal(camera.ray(eye,target,roofs),0);
const initial=camera.metrics();
assert.equal(initial.builds,1,'One original indexed static town');
liveCarts=[{x:0,z:0,rx:.6,rz:.6,bottom:0,top:1.4,
 deliveryId:'grain-001',citizen:'Bram',kind:'courier-cart'}];
roofs=camera.view('tA',homes);
assert.equal(camera.ray(eye,target,roofs),1,'The ACTUAL loaded grain cart still blocks view');
for(const x of [.15,.31,.47,1.2]){
 liveCarts[0]={...liveCarts[0],x};
 roofs=camera.view('tA',homes);
 const hits=camera.ray(eye,target,roofs);
 assert.equal(hits,x<.6?1:0,'Original moving courier slab check at x='+x);
}
assert.equal(camera.metrics().builds,1,
 'Real courier animation cannot rebuild immutable town index every frame');
assert.ok(camera.metrics().hits>=5,'Original spatial index should be reused');
liveCarts=[];
roofs=camera.view('tA',homes);
assert.equal(camera.ray(eye,target,roofs),0,
 'After genuine unload the previous cart may NEVER remain a ghost blocker');
assert.equal(camera.metrics().builds,1);
const larger=[...homes,{x:0,z:0,rx:1,rz:1,bottom:0,top:4,kind:'home'}];
roofs=camera.view('tB',larger);
assert.equal(camera.ray(eye,target,roofs),1,'Genuine new occupied house blocks physical camera');
assert.equal(camera.metrics().builds,2,'City growth invalidates only its real static index');
console.log(JSON.stringify({source:'W220 RED-first actual static scene + moving courier',
 builds:camera.metrics().builds,hits:camera.metrics().hits,
 exactSlabs:camera.metrics().exactSlabTests,
 preservedRealFreight:true,changedAuthority:false}));
