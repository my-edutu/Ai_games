const test=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{resolve}=require('node:path');
const mod=()=>import(pathToFileURL(resolve('public/infinite-tower-climb/visuals/first-raised-body-composition.mjs')).href);
function valid() {
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const source={floor:9,theme:'void',lifecycle:'running',runToken:'r-a',tick:517,
  platforms:[{id:'f9:ground',x:0,y:3212000,width:480000,height:12000},
   {id:'f9:p2',x:245000,y:3262000,width:110000,height:12000}],
  player:{health:5,x:295000,y:3260000,halfHeight:14000,
    grounded:false,state:'airborne',groundedPlatformId:null,vy:8000},
  lastGuardianCrossing:{runToken:'r-a',fromFloor:8,toFloor:9,
    cap,guardian:{kind:'guardian',active:false,health:0},
    sourceTick:475,exitX:304896}};
 const held={runToken:'r-a',floor:9,oldCapId:'f8:cap',guardianGateRetained:true,
  verifiedObservedFloorAdvance:true,crossingTick:475,
  thresholdX:304896,oldRoofY:3224000};
 const view={cameraMode:'follow',stale:false,reducedMotion:false,dt:.04,
  aspect:390/844,camera:[10,8,48],hero:[11,8,23],
  heroNdc:[.12,-.2,.98,.072],remaining:7.5};
 return {source,held,view};
}
test('true source first raised flight yields bounded smooth perspective approach',async()=>{
 const {proposeSourceFirstRaisedBodyScale:f}=await mod();
 const {source,held,view}=valid(),p=f(source,held,view);
 assert.ok(p);assert.equal(p.contact,'source-flight');assert.equal(p.landingId,'f9:p2');
 assert.ok(p.metres>0&&p.metres<=1.2);
 assert.equal(f(source,held,{...view,remaining:0}),null);
});
test('physically grounded p2 persists; unknown source support cannot',async()=>{
 const {proposeSourceFirstRaisedBodyScale:f}=await mod();
 const {source,held,view}=valid();
 source.player={...source.player,grounded:true,state:'standing',vy:0,
  groundedPlatformId:'f9:p2',y:3274000+14000};
 assert.equal(f(source,held,view)?.contact,'raised');
 source.player.groundedPlatformId='f9:p7';
 assert.equal(f(source,held,view),null);
});
test('never invent guardian victory, reuse run, exceed source clock, ignore accessibility or crop',async()=>{
 const {proposeSourceFirstRaisedBodyScale:f}=await mod();
 const {source,held,view}=valid();
 for(const s of [
  {...source,runToken:'different'}, {...source,tick:800},
  {...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
   guardian:{kind:'guardian',active:true,health:2}}}])
   assert.equal(f(s,held,view),null);
 assert.equal(f(source,{...held,oldRoofY:42},view),null);
 assert.equal(f(source,held,{...view,cameraMode:'manual'}),null);
 assert.equal(f(source,held,{...view,reducedMotion:true}),null);
 assert.equal(f(source,held,{...view,heroNdc:[.1,-.1,.98,.18]}),null);
 assert.equal(f(source,held,{...view,heroNdc:[1,-.1,.98,.06]}),null);
});
test('real complete actor, p2 and old metal are physical vetoes, not a synthetic 4-subject pass',async()=>{
 const {acceptSourceFirstRaisedBodyScale:f}=await mod();
 const b={hero:[.11,-.2,.98,.07],landing:[.2,.3,.96],
  steel:{sourceBound:true,projectedPanes:3,projectedMetalArea:.03}};
 const a={hero:[.12,-.16,.98,.083],landing:[.2,.32,.96],
  steel:{sourceBound:true,projectedPanes:3,projectedMetalArea:.028}};
 const physical={active:true,bodyBlockedRays:0,heroCore:true,
  landingCore:true,gateCore:true,gatewayBlockedRays:0};
 assert.equal(f(b,a,physical),true);
 assert.equal(f(b,{...a,landing:[.2,1.7,.96]},physical),false);
 assert.equal(f(b,{...a,steel:{sourceBound:true,
  projectedPanes:0,projectedMetalArea:0}},physical),false);
 assert.equal(f(b,a,{...physical,bodyBlockedRays:1}),false);
 assert.equal(f(b,a,{...physical,heroCore:false}),false);
});
