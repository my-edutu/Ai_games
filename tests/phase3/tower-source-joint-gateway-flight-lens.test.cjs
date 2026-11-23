'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const modulePromise=import('../../public/infinite-tower-climb/visuals/source-joint-gateway-flight-lens.mjs');
const source={floor:9,theme:'void',lifecycle:'running',runToken:'real-guardian',tick:506,
 player:{health:4,x:333296,y:3238000,halfHeight:14000,grounded:true,groundedPlatformId:'f9:ground'},
 platforms:[{id:'f9:ground',x:0,y:3190000,width:600000,height:34000},
   {id:'f9:p2',x:350000,y:3340000,width:85000,height:10000}],
 intent:{targetPlatformId:'f9:ground'},
 lastGuardianCrossing:{runToken:'real-guardian',sourceTick:475,fromFloor:8,toFloor:9,
   cap:{id:'f8:cap'},guardian:{kind:'guardian',active:false,health:0}}};
const held={runToken:'real-guardian',floor:9,guardianGateRetained:true,
 verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',crossingTick:475,
 oldRoofY:3224000,originalGatewayOpacity:.80,submittedFrames:4};
const view={cameraMode:'follow',aspect:390/844,dt:.04,fov:42,
 focus:[2,0,25],hero:[8,0,25],gateway:[7,0,25],roof:[9,0,25],landing:[9,13,25],
 heroNdc:[.25,0,.4,.13],gatewayNdc:[-.15,.15,.4,.12],roofNdc:[.12,-.1,.5],
 landingNdc:[.38,1.15,.5],steel:{sourceBound:true,projectedPanes:6,projectedMetalArea:.065}};
test('authentic grounded receiving roof and raised landing earn bounded shared original-gateway lens',async()=>{
 const {sourceJointGatewayFlightLens:plan,sourceFirstRaisedGatewayLandmark:landmark}=await modulePromise;
 assert.equal(landmark(source,held),source.platforms[1],
   'first physically existing raised deck is visible before route intent switches off the actual grounded roof');
 const original=JSON.stringify({source,held,view});
 const actual=plan(source,held,view);
 assert.ok(actual?.sourceBound);assert.equal(actual.sourceTick,506);
 assert.equal(actual.landingId,'f9:p2');
 assert.equal(actual.sourceRaisedLandmarkOnly,true);
 assert.equal(source.intent.targetPlatformId,'f9:ground',
   'camera landmark must never invent an AI selection');
 assert.ok(actual.fov>42&&actual.fov<=42+.04*68+.001);
 assert.ok(actual.gazeStep<=14*.04+.001);
 assert.equal(JSON.stringify({source,held,view}),original);
});
test('invalid run, guardian, support, original steel, source state and manual views never earn the lens',async()=>{
 const {sourceJointGatewayFlightLens:plan}=await modulePromise;
 for(const [s,h,o] of [
  [{...source,runToken:'restart'},held,view],
  [{...source,floor:8},held,view],
  [{...source,player:{...source.player,health:0}},held,view],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:5}}},held,view],
  [source,{...held,originalGatewayOpacity:0},view],
  [source,{...held,oldRoofY:0},view],
  [source,held,{...view,cameraMode:'overview'}],
  [source,held,{...view,reducedMotion:true}],
  [source,held,{...view,steel:{sourceBound:false,projectedPanes:6,projectedMetalArea:1}}],
  [source,held,{...view,landingNdc:[0,.3,.4],heroNdc:[.15,.1,.4,.12]}],
  [{...source,platforms:[source.platforms[0]]},held,view],
  [{...source,tick:580,player:{...source.player,groundedPlatformId:'f9:fake'}},held,view]
 ])assert.equal(plan(s,h,o),null);
});
test('physical four-subject acceptance requires an improved raised landing, unbroken real metal, hero and roof',async()=>{
 const {assessSourceJointGatewayLens:assess}=await modulePromise;
 const after={...view,landingNdc:[.39,.69,.4],heroNdc:[.24,0,.4,.12],
   roofNdc:[.1,-.1,.5],steel:{...view.steel,projectedMetalArea:.061}};
 assert.equal(assess(view,after),true);
 assert.equal(assess(view,{...after,steel:{...after.steel,projectedMetalArea:.001}}),false);
 assert.equal(assess(view,{...after,heroNdc:[1.5,0,.4,.12]}),false);
 assert.equal(assess(view,{...after,landingNdc:view.landingNdc}),false);
 assert.equal(assess(view,{...after,roofNdc:[1.8,0,.5]}),false);
});
test('integrated game runs four-subject physical check only AFTER final camera guards and BEFORE single genuine render',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const final=scene.indexOf('const firstF9DepartureBound=sourceFirstFloorNineCameraDeparture(');
 const four=scene.indexOf('sourceJointGatewayFlightLens(snapshot,retainedColdArrival');
 const rendered=scene.indexOf('renderer.render(scene, camera);');
 assert.ok(final>=0&&four>final&&four<rendered);
 assert.match(scene,/assessSourceJointGatewayLens\(before,after\)/);
 assert.match(scene,/sourceJointGatewayLensVetoed/);
 assert.match(scene,/world\.measureSuccessorDeckVisibility\(snapshot/);
});

test('native first-F9 renderer regression: final lens never borrows update-only bindings',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const animate=scene.slice(scene.indexOf('function animate(now) {'));
 const joint=animate.slice(animate.indexOf('// P0 complete physical threshold shot'),
   animate.indexOf('const sceneReadyAt = performance.now()'));
 assert.match(joint,/const returnedJointRoof = snapshot/);
 assert.match(joint,/observedSourceWalkableCrossfloorShot\(snapshot,retainedColdArrival\)/);
 assert.match(joint,/retainedColdArrival\.thresholdX,retainedColdArrival\.oldRoofY/);
 assert.match(joint,/new THREE\.Vector3\(\.\.\.returnedJointRoof\.world\)/);
 assert.doesNotMatch(joint,/physicalWalkableShot|coldArchProof|cameraDt/,
   'update() lexical bindings may not be referenced by animate()');
 assert.match(animate,/const retainedColdArrival = world/);
});

test('native tick-506 scene selects existing raised geometry despite truthful grounded-roof intent',async()=>{
 const {sourceFirstRaisedGatewayLandmark:landmark,sourceJointGatewayFlightLens:plan}=await modulePromise;
 const real={...source,tick:506,intent:{targetPlatformId:'f9:ground'}};
 assert.strictEqual(landmark(real,held),source.platforms[1]);
 assert.equal(plan(real,held,view)?.landingId,'f9:p2');
 const firstFlight={...real,tick:511,player:{
   ...source.player,y:3295000,grounded:false,groundedPlatformId:null,state:'airborne'}};
 assert.strictEqual(landmark(firstFlight,held),source.platforms[1]);
 assert.equal(plan(firstFlight,held,view)?.landingId,'f9:p2');
 for(const [s,h] of [
  [{...real,platforms:[source.platforms[0]]},held],
  [{...real,platforms:[source.platforms[0],{...source.platforms[1],x:950000}]},held],
  [{...real,platforms:[source.platforms[0],{...source.platforms[1],y:3210000}]},held],
  [{...real,runToken:'restart'},held],
  [real,{...held,verifiedObservedFloorAdvance:false}],
  [real,{...held,guardianGateRetained:false}],
  [real,{...held,oldRoofY:0}],
  [{...real,lastGuardianCrossing:{...real.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:5}}},held],
  [{...real,player:{...real.player,groundedPlatformId:'fake'}} ,held],
  [{...real,player:{...real.player,health:0}},held],
  [{...real,tick:800},held]
 ]){
   assert.equal(landmark(s,h),null);
   assert.equal(plan(s,h,view),null);
 }
});
test('renderer gets same-run earned crossing certificate even outside temporary priorGrounded mode',()=>{
 const world=fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 const fn=world.slice(world.indexOf('function retainedFilmHandoff(snapshot)'),
  world.indexOf('function deferredShaderSubmission(snapshot)'));
 const stable=fn.indexOf('verifiedObservedFloorAdvance:held.verifiedObservedFloorAdvance===true,');
 const optional=fn.indexOf('...(priorGrounded?{');
 assert.ok(stable>=0&&optional>stable,
   'real HP-open same-run World receipt must not hide its victory certificate behind a short-lived grounded predicate');
 const scene=fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const joint=scene.slice(scene.indexOf('// P0 complete physical threshold shot'),
  scene.indexOf('const sceneReadyAt = performance.now()'));
 assert.match(joint,/sourceFirstRaisedGatewayLandmark\(snapshot,retainedColdArrival\)/);
 assert.doesNotMatch(joint,/jointRaised=intendedLanding\(snapshot\)/);
 assert.match(joint,/assessSourceJointGatewayLens\(before,after\)/);
 assert.match(joint,/world\.measureSuccessorDeckVisibility\(snapshot/);
});

// Native first-F9 film can place the authentic old gate OFFSCREEN while
// its actual Three source owner is still rendered. Recovery may propose,
// but the AFTER view must prove genuine steel and no unsafe body cropping.
test('offscreen original metal permits only physically returned old gate and all-four-subject shot',async()=>{
 const {sourceJointGatewayFlightLens:plan,assessSourceJointGatewayLens:assess}=await modulePromise;
 const before={...view,steel:{sourceBound:true,projectedPanes:0,projectedMetalArea:0}};
 assert.equal(plan(source,held,before)?.sourceBound,true);
 const after={...view,landingNdc:[.39,.69,.4],heroNdc:[.24,0,.4,.12],
   roofNdc:[.1,-.1,.5],steel:{sourceBound:true,projectedPanes:3,projectedMetalArea:.034}};
 assert.equal(assess(before,after),true);
 assert.equal(assess(before,{...after,steel:before.steel}),false);
 assert.equal(assess(before,{...after,steel:{...after.steel,projectedPanes:1}}),false);
 assert.equal(assess(before,{...after,heroNdc:[.94,.0,.4,.12]}),false);
});
test('source-only rig search cannot teleport or exceed total first-gateway camera budget',async()=>{
 const {sourceJointGatewayFlightLens:plan,sourceJointGatewayRecoveryRigs:rigs}=await modulePromise;
 const before={...view,steel:{sourceBound:true,projectedPanes:0,projectedMetalArea:0}};
 const proposal=plan(source,held,before);
 const frame={cameraPosition:[2,4,39],hero:view.hero,gateway:view.gateway,
   roof:view.roof,landing:view.landing,dt:.04,remainingTravelMetres:3};
 const result=rigs(proposal,frame);
 assert.equal(result.length,4);
 assert.equal(result[0].cameraMoveMetres,0);
 assert.ok(result.slice(1).every(x=>x.cameraMoveMetres>0&&x.cameraMoveMetres<.65));
 assert.ok(result.every(x=>x.fov===proposal.fov&&x.focus.every(Number.isFinite)));
 assert.equal(rigs(proposal,{...frame,remainingTravelMetres:0}).length,1);
 assert.deepEqual(rigs(proposal,{...frame,dt:Infinity}),[]);
 assert.deepEqual(rigs(null,frame),[]);
 assert.deepEqual(frame.cameraPosition,[2,4,39]);
});
test('integrated first F9 source camera recovers invisible old steel only after original geometry ray checks',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const joint=scene.slice(scene.indexOf('// P0 complete physical threshold shot'),
   scene.indexOf('const sceneReadyAt = performance.now()'));
 assert.match(joint,/sourceJointGatewayRecoveryRigs\(proposal/);
 assert.match(joint,/sourceJointGatewayLensTravelMetres/);
 assert.match(joint,/camera\.position\.copy\(oldPosition\)/);
 assert.match(joint,/assessSourceJointGatewayLens\(before,after\)/);
 assert.match(joint,/rays\.gatewayBlockedRays===0/);
 assert.match(joint,/towerCoreSightlineClear\(camera\.position,jointLanding/);
 assert.ok(scene.indexOf('sourceJointGatewayRecoveryRigs(proposal')>=0 &&
  scene.indexOf('sourceJointGatewayRecoveryRigs(proposal')<
    scene.indexOf('renderer.render(scene, camera);'));
});

test('real roof and raised landing may already be centered while original HP-open gate vanishes from frame',async()=>{
 const {sourceJointGatewayFlightLens:plan,assessSourceJointGatewayLens:assess}=await modulePromise;
 const lost={...view,landingNdc:[.20,.26,.5],gatewayNdc:[1.18,.15,.4,.12],
   steel:{sourceBound:true,projectedPanes:0,projectedMetalArea:0}};
 const before=JSON.stringify({source,held,lost});
 const proposal=plan(source,held,lost);
 assert.ok(proposal?.sourceBound,'first-raised platform being visible cannot prevent recovery of old gateway');
 assert.equal(proposal.landingId,'f9:p2');
 const recovered={...lost,gatewayNdc:[.4,.12,.4,.12],heroNdc:[.24,0,.4,.12],
   steel:{sourceBound:true,projectedPanes:4,projectedMetalArea:.035}};
 assert.equal(assess(lost,recovered),true,
   'real returned original steel and doorway improve without sacrificing the raised landing');
 assert.equal(JSON.stringify({source,held,lost}),before);
 assert.equal(plan(source,held,{...lost,gatewayNdc:[.1,.1,.4,.12],
   steel:{sourceBound:true,projectedPanes:6,projectedMetalArea:.065}}),null,
   'no extra camera travel when all four authentic subjects are already readable');
});
test('original-gateway rescue cannot purchase its view by cropping climber or raised route',async()=>{
 const {assessSourceJointGatewayLens:assess}=await modulePromise;
 const lost={...view,landingNdc:[.20,.26,.5],gatewayNdc:[1.18,.15,.4,.12],
   steel:{sourceBound:true,projectedPanes:0,projectedMetalArea:0}};
 const after={...lost,gatewayNdc:[.4,.12,.4,.12],heroNdc:[.24,0,.4,.12],
   steel:{sourceBound:true,projectedPanes:4,projectedMetalArea:.035}};
 for(const bad of [
   {...after,landingNdc:[1.44,1.2,.5]},
   {...after,heroNdc:[1.2,0,.4,.12]},
   {...after,roofNdc:[1.5,0,.5]},
   {...after,steel:{sourceBound:true,projectedPanes:1,projectedMetalArea:.035}},
   {...after,gatewayNdc:[1.18,.15,.4,.12]}
 ])assert.equal(assess(lost,bad),false,'four-subject physical safety is non-negotiable');
});


test('P0 original gate recovery admits verified safe incremental progress, never a fabricated all-subject shot',async()=>{
 const {assessSourceJointGatewayRecoveryStep:step,assessSourceJointGatewayLens:complete}=await modulePromise;
 const before={...view,landingNdc:[.20,.26,.5],gatewayNdc:[1.18,.15,.4,.12],
   steel:{sourceBound:true,projectedPanes:0,projectedMetalArea:0}};
 const after={...before,gatewayNdc:[1.04,.15,.4,.12],
   heroNdc:[.24,0,.4,.12]};
 assert.equal(complete(before,after),false,'one incremental shot must not masquerade as four-subject acceptance');
 assert.equal(step(before,after),true,
   'a physically reprojected real gateway can get closer before the source steel is fully on-screen');
 for(const bad of [
   {...after,gatewayNdc:[1.24,.15,.4,.12]},
   {...after,heroNdc:[1.11,0,.4,.12]},
   {...after,landingNdc:[1.2,1.1,.5]},
   {...after,roofNdc:[1.3,0,.5]},
   {...after,steel:{sourceBound:false,projectedPanes:0,projectedMetalArea:0}}
 ])assert.equal(step(before,bad),false);
 assert.equal(step({...before,gatewayNdc:[.1,.1,.4,.12],
   steel:{sourceBound:true,projectedPanes:4,projectedMetalArea:.04}},after),false,
   'a previously readable gateway cannot be traded for a partial recovery');
});
test('partial recovery is checked against original geometry BEFORE the single source-pinned render',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const joint=scene.slice(scene.indexOf('// P0 complete physical threshold shot'),
   scene.indexOf('const sceneReadyAt = performance.now()'));
 assert.match(joint,/assessSourceJointGatewayRecoveryStep\(before,after\)/);
 assert.match(joint,/rays\.bodyBlockedRays===0/);
 assert.match(joint,/rays\.gatewayBlockedRays===0/);
 assert.match(joint,/towerCoreSightlineClear\(camera\.position,jointGate/);
 assert.match(joint,/sourceJointGatewayLensRecoverySteps/);
});


test('source-pinned slow WebGL callback retains a bounded real gateway-flight lens instead of disabling the crossing',async()=>{
 const {sourceJointGatewayFlightLens:plan,sourceJointGatewayRecoveryRigs:rigs}=await modulePromise;
 // Both unedited software-WebGL first-F9 recordings exhibit >120ms callback
 // gaps; source ticks and the authentic raised f9:p2 do not stop being real.
 const slow={...view,dt:.25,landingNdc:[.51,1.58,.97]};
 const proposed=plan(source,held,slow);
 assert.ok(proposed?.sourceBound,
   'a 250ms original WebGL callback cannot silently suppress all physical camera trials');
 assert.equal(proposed.landingId,'f9:p2');
 assert.ok(proposed.gazeStep<=.07*14+.0001,
   'lost frame time cannot purchase a gaze teleport');
 assert.ok(proposed.fov<=42+.07*68+.0001);
 const trial=rigs(proposed,{cameraPosition:[2,4,39],dt:.25,
   hero:slow.hero,gateway:slow.gateway,roof:slow.roof,
   landing:slow.landing,remainingTravelMetres:3});
 assert.equal(trial.length,4);
 assert.ok(trial.slice(1).every(r=>r.cameraMoveMetres>0&&
   r.cameraMoveMetres<=.65+.00001));
 assert.equal(plan(source,held,{...slow,dt:.501}),null);
 assert.deepEqual(rigs(proposed,{cameraPosition:[2,4,39],dt:.501,
   hero:slow.hero,gateway:slow.gateway,roof:slow.roof,
   landing:slow.landing,remainingTravelMetres:3}),[]);
});


test('returned real first-floor-nine lens publishes the specific evidence veto without inventing a physical shot',async()=>{
 const {sourceJointGatewayFlightLens:plan,
   explainSourceJointGatewayLensBlocker:reason}=await modulePromise;
 const authentic={...view,dt:.21,landingNdc:[.38,1.8,.98]};
 assert.equal(reason(source,held,authentic),'source-lens-preconditions-eligible');
 assert.ok(plan(source,held,authentic)?.sourceBound);
 const rows=[
  [{...authentic,steel:null},'source-owned-original-gateway-steel-ineligible'],
  [{...authentic,gatewayNdc:[.2,.1,1.4,.1]},'actual-gateway-depth-projection-ineligible'],
  [{...authentic,heroNdc:[.25,.1,.4,.01]},'skinned-hero-projection-ineligible'],
  [{...authentic,roof:[1000,0,0]},'physical-four-subject-span-exceeds-85-metres'],
  [{...authentic,dt:0},'camera-delta-outside-genuine-raf-bounds'],
  [{...authentic,dt:.501},'camera-delta-outside-genuine-raf-bounds'],
  [{...authentic,fov:90},'camera-fov-ineligible']
 ];
 for(const [v,why] of rows){
   assert.equal(reason(source,held,v),why);
   assert.equal(plan(source,held,v),null,
     'reporter must never loosen the original physically protected lens');
 }
 assert.equal(reason(source,{...held,submittedFrames:29},authentic),
   'original-gateway-returned-frame-lease-ineligible');
});
test('real renderer binds first-camera-lens failure reason to its successful source-owned WebGL frame',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const joint=scene.slice(scene.indexOf('// P0 complete physical threshold shot'),
   scene.indexOf('const sceneReadyAt = performance.now()'));
 assert.match(joint,/explainSourceJointGatewayLensBlocker\(snapshot/);
 assert.match(joint,/cameraJointRecoveryWitness\.lensEligibilityReason=reason/);
 assert.match(scene,/renderer\.render\(scene, camera\);/);
});


test('actual source-returned gateway NDC is the same physical steel key consumed by complete/partial camera checks',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const joint=scene.slice(scene.indexOf('// P0 complete physical threshold shot'),
   scene.indexOf('const sceneReadyAt = performance.now()'));
 const measure=joint.slice(joint.indexOf('const measureJoint=()=>{'),
   joint.indexOf('const before=measureJoint();'));
 assert.match(measure,/return \{heroNdc:h,gatewayNdc:g,/,
   'the old scene gateNdc key was never consumed by sourceJointGatewayFlightLens or either projector assessor');
 assert.match(joint,/submittedGateNdc=before\.gatewayNdc\.slice\(\)/);
 assert.match(joint,/submittedGateNdc=after\.gatewayNdc\.slice\(\)/);
 assert.doesNotMatch(joint,/before\.gateNdc|after\.gateNdc/,
   'source-observed real steel cannot be borrowed from a mismatched name');
});

test('original native first-F9 desktop requires actual raised destination on-screen before declaring four-subject success',async()=>{
  const {assessSourceJointGatewayLens:complete,
    assessSourceJointGatewayRecoveryStep:partial}=await modulePromise;
  // Actual immutable source-pinned desktop film c671c3e first return at tick476:
  // all real source geometry projects but f9:p2 sits well ABOVE native screen.
  const original={...view,heroNdc:[.19,-.09,.975,.229],
    gatewayNdc:[-.009,.034,.976,.338],
    roofNdc:[.413,-.269,.975],landingNdc:[.507,1.738,.970],
    steel:{sourceBound:true,projectedPanes:17,projectedMetalArea:.055}};
  const recovering={...original,heroNdc:[.19,-.09,.975,.229],
    gatewayNdc:[-.009,.034,.976,.338],
    roofNdc:[.415,-.27,.975],landingNdc:[.49,1.58,.97],
    steel:{...original.steel,projectedMetalArea:.055}};
  assert.equal(complete(original,recovering),false,
    'complete 4-subject shot must never be awarded while the raised platform is cropped');
  assert.equal(partial(original,recovering),true,
    'a genuine route-revealing motion with full hero/real steel/roof preserved should remain eligible for PHYSICALLY VETOED intermediate projection');
  assert.equal(partial(original,{...recovering,heroNdc:[.9,-.09,.975,.229]}),false,
    'no partial route improvement may crop the climber');
  assert.equal(partial(original,{...recovering,steel:{...original.steel,projectedPanes:0,projectedMetalArea:0}}),false,
    'no partial route improvement may erase the original source-owned gateway steel');
});
test('complete label requires visible real route, not merely a gate or score improvement',async()=>{
  const {assessSourceJointGatewayLens:complete,
    assessSourceJointGatewayRecoveryStep:partial}=await modulePromise;
  const before={...view,landingNdc:[.51,1.37,.97]};
  const offscreen={...before,landingNdc:[.48,1.04,.97]};
  assert.equal(complete(before,offscreen),false,
    'a raised destination still beyond the top border is not a complete passage');
  assert.equal(partial(before,offscreen),true,
    'keep meaningful source-bound intermediate ascent without lying about visual acceptance');
  const onscreen={...before,landingNdc:[.43,.72,.97]};
  assert.equal(complete(before,onscreen),true);
});
