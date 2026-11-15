'use strict';
// W340: test-first contract of real 390px architecture-safe, same-citizen
// elevated observations. Does not introduce fake people, work or outcomes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const extract=name=>{
 const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+10);
 assert(start>=0&&end>start,'missing production '+name);
 return source.slice(start,end);
};
const original=extract('findPhysicalPortraitAlternative'),
 decision=extract('genuineWorkdayShotDecision');
assert(source.includes('PORTRAIT_ALT_MAX_EYES=24'),'bounded 24 real eyes required');
assert(source.includes('portraitPhysicalRecovery:best.physicalPortraitRecovery===true'),
 'real live actor director must actually admit the repaired lens');
assert(source.includes('physicalPortraitElevatedEye:candidatePitch>.75'),
 'real above-roof 3D observer is part of the running game');
const setup=()=>({
 Math,Number,Array,PORTRAIT_ALT_MAX_EYES:24,portraitAltCandidates:0,
 terrain:()=>0,documentaryWorkHandTargets:()=>[[0,.9,0]],
 physicalFollowEyeClearance:eye=>({clear:eye[1]>5.7}),
 followRayBlockers:eye=>eye[1]>5.7?0:1,
 foregroundSceneProjection:eye=>({
  actorCoreCover:eye[1]>5.7?.03:.8,cover:eye[1]>5.7?.08:.9,
  cargoCover:0,buildingCover:0,largest:.08,volumes:1}),
 foregroundVegetationProjection:()=>({faceBlockers:0,cover:0}),
 projectedWorkerBodyFraction:eye=>eye[1]>5.7?.29:.32,
 cameraShotFraming:(shot)=>({
  blockedBodyRays:shot.eye[1]>5.7?0:5,
  handBlockers:shot.eye[1]>5.7?0:2,
  foregroundCitizenBlockers:0,cameraProximityWarnings:0,
  projectedWorksitePosts:0})
});
const ctx=setup();
const run=vm.runInNewContext(decision+'\n'+original+
 '\n({decision:genuineWorkdayShotDecision,find:findPhysicalPortraitAlternative})',ctx);
const actor={name:'actual-farmer',job:'farmer',x:0,z:0};
const old={yaw:0,pitch:.2,zoom:5.4,target:[0,.85,0],
 blockers:2,workFacing:0,handBlockers:2,blockedBodyRays:5,
 foregroundCitizenBlockers:3,cameraProximityWarnings:1};
const repaired=run.find(actor,old,[{kind:'original-roof'}]);
assert(repaired,'the genuine raised 3D eye should clear a roof that blocks low lenses');
assert.equal(repaired.physicalPortraitElevatedEye,true);
assert(repaired.eye[1]>5.7,'raised real camera above roof');
assert.equal(repaired.handBlockers,0,'must not inherit blocked hand evidence from old eye');
assert.equal(repaired.blockedBodyRays,0,'must not inherit stale obstructed body rays');
assert.equal(repaired.foregroundCitizenBlockers,0,'recompute original near-citizen cover');
assert.equal(run.decision(repaired,true).safe,true,'real documentary policy admits only newly clear eye');
assert.equal(repaired.renderedWorldStillComplete,true);
assert(ctx.portraitAltCandidates<=24,'bounded 24 physical views');
const obstructed=setup();
obstructed.foregroundSceneProjection=()=>({
 actorCoreCover:.9,cover:.9,cargoCover:.8});
const rejected=vm.runInNewContext(decision+'\n'+original+
 '\nfindPhysicalPortraitAlternative',obstructed)(actor,old,[]);
assert.equal(rejected,null,'all obstructed original geometry must reject camera rescue');
assert(!/\b(step|saveWorld|deliveryReceipts\.push|people\.push|city\.push)\s*\(/.test(original),
 'camera may not mutate seeded authority');
console.log('W340 physical portrait vertical high lens PASS source test: 24 capped real eyes, fresh rays and crowd admission, no fabricated citizen or market goods; running WebGL recording still required.');
