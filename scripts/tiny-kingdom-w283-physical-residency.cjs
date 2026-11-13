'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const section=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'real production function missing: '+start);
 return html.slice(a,b);
};
const gpu=section('const FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT=', 'function isForegroundWalkingSkinCandidate(');
const ctx={Number,Math};
vm.runInNewContext(gpu+';this.gate=physicallySmallWalkingSkinWindow;',ctx);
// W296 admits faithful 13-joint commuter rigs to the original 27% body
// height, then retains them to 32.5%; no false filmed close-hand contact.
assert.equal(ctx.gate(.17,false),true);
assert.equal(ctx.gate(.269,false),true);
assert.equal(ctx.gate(.270,false),false);
assert.equal(ctx.gate(.295,false),false);
assert.equal(ctx.gate(.295,true),true);
assert.equal(ctx.gate(.324,true),true);
assert.equal(ctx.gate(.325,true),false);
assert.equal(ctx.gate(NaN,true),false);
assert.equal(ctx.gate(-1,true),false);
const blockers={clear:false},actor={
 name:'Actual farmer courier',job:'farmer',activity:'Traveling to market',
 x:.58,z:0,delivery:{id:'real-receipt-7',stage:'travel'},
 target:[0,12],path:[[0,12]]
};
const camera={
 mode:'delivery',stage:'travel',deliveryId:'real-receipt-7',
 citizen:actor.name,job:actor.job,activity:actor.activity,
 x:0,z:0,at:1000,citySize:14,cityTopology:'physical-lots-14',
 viewWidth:390,viewHeight:844,requestZoom:null,requestPitch:null,
 shot:{yaw:0,pitch:.24,zoom:5.15,target:[0,.91,0],
  routeHeading:0,courierRouteCamera:true}
};
const production=section('const COURIER_SHOT_TRANSLATE_MAX_METRES=', 'function observedWorkdayCameraPlan(');
const env={Math,Number,city:Array(14),canvas:{clientWidth:390,clientHeight:844},
 actionCameraZoom:null,actionCameraPitch:null,
 cameraArchitectureTopologyKey:()=> 'physical-lots-14',
 terrain:()=>0,followCameraRoofs:()=>[],
 physicalFollowEyeClearance:()=>({clear:!blockers.clear}),
 followRayBlockers:()=>0,
 foregroundSceneProjection:()=>({cover:.03,cargoCover:.02,buildingCover:.01,volumes:2}),
 foregroundVegetationProjection:()=>({cover:.04,faceBlockers:0}),
 projectedWorkerBodyFraction:()=>.29};
vm.runInNewContext(production+';this.check=tryReusePhysicalCourierShot;',env);
const before=JSON.stringify(actor),planned=env.check(camera,actor,0,1400);
assert.ok(planned,'genuine straight courier should get a physical revalidation');
assert.equal(planned.physicallyRevalidatedCourierShot,true);
assert.ok(Math.abs(planned.target[0]-.58)<1e-8);
assert.equal(JSON.stringify(actor),before,'camera must not mutate authority');
assert.equal(env.check({...camera,stage:'unloading'},actor,0,1400),null);
assert.equal(env.check(camera,{...actor,path:[[12,0]]},0,1400),null,
 'real route turns must force a complete orbit replan');
assert.equal(env.check(camera,{...actor,x:3},0,1400),null,
 'large movement cannot reuse the old eye');
blockers.clear=true;
assert.equal(env.check(camera,actor,0,1400),null,
 'blocked physical eye must fall back to original 3D camera search');
console.log('W283 contracts: native near-passenger GPU skin thresholds, explicit true-contact exclusions inherited, straight physically checked courier view, real path/eye invalidation, no authority mutation: PASS');
