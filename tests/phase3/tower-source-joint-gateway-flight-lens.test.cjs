'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const modulePromise=import('../../public/infinite-tower-climb/visuals/source-joint-gateway-flight-lens.mjs');
const source={floor:9,theme:'void',lifecycle:'running',runToken:'real-guardian',tick:506,
 player:{health:4,x:333296,y:3238000,halfHeight:14000,grounded:true,groundedPlatformId:'f9:ground'},
 platforms:[{id:'f9:ground',x:0,y:3190000,width:600000,height:34000},
   {id:'f9:p2',x:350000,y:3340000,width:85000,height:10000}],
 intent:{targetPlatformId:'f9:p2'},
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
 const {sourceJointGatewayFlightLens:plan}=await modulePromise;
 const original=JSON.stringify({source,held,view});
 const actual=plan(source,held,view);
 assert.ok(actual?.sourceBound);assert.equal(actual.sourceTick,506);
 assert.equal(actual.landingId,'f9:p2');
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
 const after={...view,landingNdc:[.39,1.08,.4],heroNdc:[.24,0,.4,.12],
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
