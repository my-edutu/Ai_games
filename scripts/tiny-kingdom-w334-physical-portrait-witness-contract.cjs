'use strict';
// W334 physical-worker portrait alternative: actual shipped source, not a demo.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const eligibility=source.match(/function shouldSeekPhysicalPortraitAlternative\([\s\S]*?\n\}/);
const selector=source.match(/function findPhysicalPortraitAlternative\([\s\S]*?\n\}/);
assert(eligibility&&selector,'W334 fail: production physical portrait recovery absent');
const ctx={Math,Number,Array,portraitAltCandidates:0,
 PORTRAIT_ALT_RETRY_MS:1250,PORTRAIT_ALT_MAX_EYES:24,
 terrain:()=>0,documentaryWorkHandTargets:()=>[[0,.9,0]],
 physicalFollowEyeClearance:eye=>({clear:eye[0]<-.1}),
 followRayBlockers:eye=>eye[0]<-.1?0:1,
 foregroundSceneProjection:eye=>({actorCoreCover:eye[0]<-.1?.02:.68,
  cover:eye[0]<-.1?.06:.75,cargoCover:0,buildingCover:0}),
 foregroundVegetationProjection:()=>({faceBlockers:0,cover:0}),
 // The original W334 VM isolates only the real camera functions. W355
 // requires an explicit REAL crop witness even for its non-farmer actor.
 realFarmWorkSightline:()=>({active:false,cropFaceBlockers:0,
  cropWristBlockers:0,cameraInsideField:false,physicalInteriorEyeClear:false}),
 projectedWorkerBodyFraction:()=>.32,
 cameraShotFraming:()=>({handBlockers:0,blockedBodyRays:0,foregroundCitizenBlockers:0,cameraProximityWarnings:0,projectedWorksitePosts:0}),
 genuineWorkdayShotDecision:s=>({safe:s.handBlockers===0&&s.blockedBodyRays<=2,readable:true})};
const funcs=vm.runInNewContext(eligibility[0]+'\n'+selector[0]+
 '\n({shouldSeekPhysicalPortraitAlternative,findPhysicalPortraitAlternative})',ctx);
const {shouldSeekPhysicalPortraitAlternative:eligible,
 findPhysicalPortraitAlternative:find}=funcs;
assert.equal(eligible(390,true,.55,.62,.19,.50,2200,0),true);
assert.equal(eligible(1024,true,.55,.62,.19,.50,2200,0),false);
assert.equal(eligible(390,false,.55,.62,.19,.50,2200,0),false);
assert.equal(eligible(390,true,.04,.06,.19,.50,2200,0),false);
assert.equal(eligible(390,true,.55,.62,.03,.04,2200,0),false);
assert.equal(eligible(390,true,.55,.62,.19,.50,1100,0),false);
assert.equal(eligible(390,true,NaN,.62,.19,.50,2200,0),false);
const actor={name:'authentic-worker',x:0,z:0};
const shot={yaw:0,pitch:.2,zoom:5.4,target:[0,1,0],blockers:2};
const result=find(actor,shot,[{kind:'real-building'}]);
assert(result,'a genuinely clear alternative must be found');
assert.equal(result.blockers,0);assert.equal(result.physicalPortraitAlternative,true);
assert.equal(result.renderedWorldStillComplete,true);
assert(result.eye[0]<-.1,'camera must stand in the truly clear physical half-space');
assert(ctx.portraitAltCandidates>0&&ctx.portraitAltCandidates<=24);
// A genuinely clear architecture eye CANNOT claim a filmed farmer when
// wheat still physically hides the actual wrist (W355 regression).
ctx.realFarmWorkSightline=()=>({active:true,cropFaceBlockers:0,
 cropWristBlockers:1,cameraInsideField:false,physicalInteriorEyeClear:false});
assert.equal(find({...actor,job:'farmer'},shot,[]),null,
 'real crop-covered wrist must not be called a clear portrait');
ctx.realFarmWorkSightline=()=>({active:false,cropFaceBlockers:0,
 cropWristBlockers:0,cameraInsideField:false,physicalInteriorEyeClear:false});
ctx.foregroundSceneProjection=()=>({actorCoreCover:.75,cover:.85,cargoCover:0});
assert.equal(find(actor,shot,[]),null,'no fake view when all real eyes obstructed');
for(const token of [
 'portraitAlternativeSelected=false',
 'portraitCurrentScene=foregroundSceneProjection(priorEye,plan.target,physicalRoofs)',
 'plan=alternate;portraitAlternativeSelected=true',
 'portraitCurrentScene||',
 'immediatePortraitWitness||portraitAlternativeSelected',
 'plan.blockers===0&&plannedEyeClear',
 'portraitPhysicalWitnessNoClearEye:portraitAltNoClearEye'
])assert(source.includes(token),'missing live camera integration: '+token);
assert(!/\b(step|saveWorld|deliveryReceipts\.push|city\.push|people\.push)\s*\(/.test(selector[0]),
 'portrait camera must not mutate world authority');
console.log('W334 PASS: actual portrait observer chooses only real clear eye; bounded 24 surveys, no fake person/geometry or desktop changes; real video pending.');
