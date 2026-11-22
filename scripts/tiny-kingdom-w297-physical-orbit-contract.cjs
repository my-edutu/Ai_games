'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a);new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom.js'});
const start=html.indexOf('let freeCameraSightlineChecks=0;');
const end=html.indexOf('function getFreeCameraCollisionAudit(',start);
assert(start>0&&end>start,'the real camera must inspect actual occlusion');
const scope={
 Math,Number,focusPoint:[0,0],freeCameraLastClear:null,
 cameraNavigationStats:{rejectedViews:0},
 followCameraRoofs:()=>[{kind:'home',x:0,z:0,rx:2,rz:2,top:5}],
 clampPlayerCamera:(n,a,b)=>Math.max(a,Math.min(b,n)),
 freeCameraEye:(a,t,z,f)=>[f[0]+Math.sin(a)*Math.cos(t)*z,.25+Math.sin(t)*z,
    f[1]+Math.cos(a)*Math.cos(t)*z],
 freeCameraEyeClear:eye=>eye.every(Number.isFinite),
 followRayBlockers:()=>0,
 foregroundSceneProjection:eye=>eye[1]<6.4?
  {cover:.995,largest:.98}:{cover:.19,largest:.17}
};
vm.createContext(scope);
vm.runInContext(html.slice(start,end)+
 ';this.orbit=safeFreeOrbit;this.sight=freeCameraSightline;',scope);
const initial={yaw:0,pitch:.3,zoom:10,focus:[0,0]};
assert.equal(scope.sight(initial,scope.followCameraRoofs()).clear,false,
 'the original fully roof-occluded camera MUST fail');
const repaired=scope.orbit(0,.3,10,[0,0]);
assert(repaired&&repaired.pitch>.3,'find a physically clear elevated camera');
assert(scope.sight(repaired,scope.followCameraRoofs()).clear);
assert.equal(scope.freeCameraLastClear.pitch,repaired.pitch);
assert(html.includes('const safe=safeFreeOrbit(wantedYaw,wantedPitch,wantedZoom,wantedFocus);'),
 'inspection API cannot bypass camera roof safety');
assert(html.includes('viewClear:shot.clear'),'expose true optical acceptance audit');
assert(!html.slice(start,end).includes('city.push(')&&
 !html.slice(start,end).includes('people.push('),
 'no fictional world state or body manipulation');
console.log('W297 original physical roof-occlusion gate and conservative spectator recovery SOURCE PASS; moving browser/native GPU separate.');
