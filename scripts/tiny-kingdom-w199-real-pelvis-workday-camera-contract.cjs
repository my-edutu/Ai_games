'use strict';
// W199 original in-game worker IK and physically selected live workday camera.
// Source-bound safety contract; real rendered A/B and hardware FPS stay UNPROVEN.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const open=source.indexOf('<script>'),close=source.indexOf('</script>',open);
assert(open>=0&&close>open,'production game inline script exists');
new Function(source.slice(open+8,close)); // Actual live game JS syntax, not a mock.
const start=source.indexOf('function citizenRigPose(p){');
const end=source.indexOf('// W47 real citizen footwear',start);
assert(start>=0&&end>start,'original two-bone worker exists');
const rig=source.slice(start,end);
const pelvis=rig.match(/const pelvisDrop=([\s\S]*?);/);
assert(pelvis,'W198 pelvis loading remains the only physical load source');
const shoulder=rig.match(/const shoulder=\[side\*\.30,([^,]+),0\];/);
assert(shoulder,'genuine arm socket is solved from the original two-bone rig');
assert.equal(shoulder[1],'1.015-pelvisDrop',
 'real shoulder must descend with the connected two-bone hip, not float above it');
const shoulderHeight=new Function('pelvisDrop','return '+shoulder[1]);
for(const load of [0,.025,.08,.12,.16]){
 const y=shoulderHeight(load);
 assert(Number.isFinite(y)&&Math.abs(y-(1.015-load))<1e-12);
 assert(y>.85&&y<=1.015,'joint remains inside adult anatomy envelope');
}
assert(rig.includes('solveWorkArmIK([side*.30,1.015-pelvisDrop,0],')&&
 rig.includes('motion.targetRight:motion.targetLeft'),
 'real unload shoulder must follow same lower pelvis while arms keep original package targets');
assert(rig.includes('solveWorkArmIK(shoulder,target,side)')&&
 rig.includes('groundedWorkTarget(p,acting.beat)')&&
 rig.includes('supportingWorkTarget(p,acting.beat)'),
 'original work contacts must remain the IK targets, not generated decorative motion');
assert(rig.includes('const upper=.335,lower=.335'),
 'original connected legs and no mesh budget expansion');
const a=source.indexOf('function anchorSelectedWorkdayCamera(row){');
const b=source.indexOf('function watchLiveWorkday(){',a);
const c=source.indexOf('function observedWorkdayCameraPlan(citizen,preferredYaw){');
const d=source.indexOf('function getCourierDocumentaryCameraAudit()',c);
assert(a>0&&b>a&&c>0&&d>c,'production camera functions are intact');
const anchor=source.slice(a,b),planner=source.slice(c,d);
for(const field of [
 "mode:'workday'","deliveryId:null","stage:null","homecomingEntryBand:0",
 'cityTopology:cameraArchitectureTopologyKey()','requestedYaw:shot.yaw',
 'viewWidth:canvas.clientWidth','viewHeight:canvas.clientHeight',
 'requestZoom:actionCameraZoom','requestPitch:actionCameraPitch']){
 assert(anchor.includes(field),'physical selected shot must retain live cache field '+field);
}
for(const field of ['cache.cityTopology===cameraArchitectureTopologyKey()',
 'cache.homecomingEntryBand===homecomingEntryBand','cache.requestedYaw',
 'now-cache.at<1100','cache.citySize===city.length']){
 assert(planner.includes(field),'actual-frame planner must enforce '+field);
}
// W309: the former strict face-only admission discarded genuine physically
// surveyed viewpoints, reverting to a stale market yaw behind freight walls.
// A partly occluded real-worker shot may be retained ONLY when its camera eye
// and roof rays have been checked and body/hand visibility is bounded.
// The world, worksite and actor remain real and cannot be hidden for filming.
assert(anchor.includes('shot.eyeCollision?.clear===true')&&
 anchor.includes('shot.blockers===0')&&
 anchor.includes('shot.handBlockers<=2')&&
 anchor.includes('shot.vegetationFaceBlockers===0')&&
 anchor.includes('shot.foregroundSceneCover<.42')&&
 anchor.includes('shot.projectedWorkerHeightFraction>')&&
 anchor.includes('!isWorkingAtSite(person)')&&
 anchor.includes('documentaryFullyClear:Boolean(row.clear)'),
 'only genuine working citizens with a physically unobstructed exterior eye and inspectable on-screen bodies may own the camera');
console.log('W199 original-source workday IK + exact physical camera cache PASS; no FPS, image, independent critic or replay claim.');
